import * as BABYLON from "@babylonjs/core";
import { OceanMaterial } from "./oceanMaterial";

enum Seams {
    None = 0,
    Left = 1,
    Right = 2,
    Top = 4,
    Bottom = 8,
    All = Left | Right | Top | Bottom
}

export class OceanGeometry {

    public lengthScale = 15; // float
    public vertexDensity = 30; // 1-40 int
    public clipLevels = 8; // 0-8 int
    public skirtSize = 10; // 0-100 float
    public noMaterialLod = true;
    public useSkirt = true;

    private _scene: BABYLON.Scene;
    private _camera: BABYLON.Camera;
    private _root: BABYLON.TransformNode;
    private _oceanMaterial: OceanMaterial;
    private _materials: BABYLON.Material[];
    private _trimRotations: BABYLON.Quaternion[];
    private _center: BABYLON.Mesh;
    private _skirt: BABYLON.Mesh;
    private _rings: BABYLON.Mesh[];
    private _trims: BABYLON.Mesh[];

    constructor(oceanMaterial: OceanMaterial, camera: BABYLON.Camera, scene: BABYLON.Scene) {
        this._oceanMaterial = oceanMaterial;
        this._camera = camera;
        this._scene = scene;
        this._materials = [];
        this._root = new BABYLON.TransformNode("Ocean", scene);
        this._center = null as any;
        this._skirt = null as any;
        this._rings = [];
        this._trims = [];

        this._trimRotations = [
            BABYLON.Quaternion.RotationAxis(BABYLON.Vector3.UpReadOnly, BABYLON.Angle.FromDegrees(180).radians()),
            BABYLON.Quaternion.RotationAxis(BABYLON.Vector3.UpReadOnly, BABYLON.Angle.FromDegrees(90).radians()),
            BABYLON.Quaternion.RotationAxis(BABYLON.Vector3.UpReadOnly, BABYLON.Angle.FromDegrees(270).radians()),
            BABYLON.Quaternion.Identity(),
        ];
    }

    public get wireframe() {
        return this._center.material!.wireframe;
    }

    public set wireframe(w: boolean) {
        this._center.material!.wireframe = w;
        if (this._skirt) {
            this._skirt.material!.wireframe = w;
        }
        this._rings.forEach((m) => m.material!.wireframe = w);
        this._trims.forEach((m) => m.material!.wireframe = w);
    }

    public async initializeMaterials(): Promise<void> {
        this._materials[0]?.dispose();
        this._materials[1]?.dispose();
        this._materials[2]?.dispose();

        this._materials = [
            await this._oceanMaterial.getMaterial(true, true),
            await this._oceanMaterial.getMaterial(true, false),
            await this._oceanMaterial.getMaterial(false, false),
        ];
    }

    public initializeMeshes(): void {
        this._center?.dispose();
        this._skirt?.dispose();
        this._rings?.forEach((m) => m.dispose());
        this._trims?.forEach((m) => m.dispose());

        this._skirt = null as any;

        this._rings = [];
        this._trims = [];

        this._instantiateMeshes();
    }

    public update(): void {
        this._updatePositions();
        this._updateMaterials();
    }

    public getMaterial(index: number): BABYLON.Material {
        return this._materials[index];
    }

    private _updateMaterials(): void {
        const activeLevels = this._activeLodLevels;

        this._center.material = this._getMaterial(this.noMaterialLod ? 0 : this.clipLevels - activeLevels - 1);

        for (let i = 0; i < this._rings.length; i++) {
            this._rings[i].material = this._getMaterial(this.noMaterialLod ? 0 : this.clipLevels - activeLevels - i);
            this._trims[i].material = this._getMaterial(this.noMaterialLod ? 0 : this.clipLevels - activeLevels - i);
        }

        if (this.useSkirt) {
            this._skirt.material = this.noMaterialLod ? this._materials[0] : this._materials[2];
        }
    }

    private _updatePositions(): void {
        const k = this._gridSize;
        const activeLevels = this._activeLodLevels;

        const previousSnappedPosition = BABYLON.TmpVectors.Vector3[0];
        const centerOffset = BABYLON.TmpVectors.Vector3[1];
        const snappedPosition = BABYLON.TmpVectors.Vector3[2];
        const trimPosition = BABYLON.TmpVectors.Vector3[3];

        let scale = this._clipLevelScale(-1, activeLevels);

        previousSnappedPosition.copyFrom(this._camera.position);

        this._snap(previousSnappedPosition, scale * 2);
        this._offsetFromCenter(-1, activeLevels, centerOffset);

        this._center.position.copyFrom(previousSnappedPosition).addInPlace(centerOffset);
        this._center.scaling.set(scale, 1, scale);

        for (let i = 0; i < this.clipLevels; i++) {
            this._rings[i].setEnabled(i < activeLevels);
            this._trims[i].setEnabled(i < activeLevels);
            if (i >= activeLevels) {
                continue;
            }

            scale = this._clipLevelScale(i, activeLevels);

            snappedPosition.copyFrom(this._camera.position);

            this._snap(snappedPosition, scale * 2);
            this._offsetFromCenter(i, activeLevels, centerOffset);
    
            trimPosition.copyFrom(snappedPosition).addInPlace(centerOffset).addInPlaceFromFloats(scale * (k - 1) / 2, 0, scale * (k - 1) / 2);

            const shiftX = (previousSnappedPosition.x - snappedPosition.x) <= 0 ? 1 : 0;
            const shiftZ = (previousSnappedPosition.z - snappedPosition.z) <= 0 ? 1 : 0;
            
            trimPosition.x += shiftX * (k + 1) * scale;
            trimPosition.z += shiftZ * (k + 1) * scale;

            this._trims[i].position.copyFrom(trimPosition);
            this._trims[i].rotationQuaternion!.copyFrom(this._trimRotations[shiftX + 2 * shiftZ]);
            this._trims[i].scaling.set(scale, 1, scale);

            this._rings[i].position.copyFrom(snappedPosition).addInPlace(centerOffset);
            this._rings[i].scaling.set(scale, 1, scale);

            previousSnappedPosition.copyFrom(snappedPosition);
        }

        if (this.useSkirt) {
            scale = this.lengthScale * 2 * Math.pow(2, this.clipLevels);
            this._skirt.position.copyFrom(previousSnappedPosition).addInPlaceFromFloats(-scale * (this.skirtSize + 0.5 - 0.5 / k), 0, -scale * (this.skirtSize + 0.5 - 0.5 / k));
            this._skirt.scaling.set(scale, 1, scale);
        }
    }

    private get _activeLodLevels(): number {
        return this.clipLevels - BABYLON.Scalar.Clamp(Math.floor(Math.log2((1.7 * Math.abs(this._camera.position.y) + 1) / this.lengthScale)), 0, this.clipLevels);
    }

    private _clipLevelScale(level: number, activeLevels: number): number {
        return this.lengthScale / this._gridSize * Math.pow(2, this.clipLevels - activeLevels + level + 1);
    }

    private _offsetFromCenter(level: number, activeLevels: number, result: BABYLON.Vector3): void {
        const k = this._gridSize;
        const v = ((1 << this.clipLevels) + OceanGeometry._GeometricProgressionSum(2, 2, this.clipLevels - activeLevels + level + 1, this.clipLevels - 1)) * this.lengthScale / k * (k - 1) / 2;

        result.copyFromFloats(-v, 0, -v);
    }

    private static _GeometricProgressionSum(b0: number, q: number, n1: number, n2: number): number {
        return b0 / (1 - q) * (Math.pow(q, n2) - Math.pow(q, n1));
    }

    private _snap(coords: BABYLON.Vector3, scale: number): void {
        if (coords.x >= 0) {
            coords.x = Math.floor(coords.x / scale) * scale;
        } else {
            coords.x = Math.ceil((coords.x - scale + 1) / scale) * scale;
        }

        if (coords.z < 0) {
            coords.z = Math.floor(coords.z / scale) * scale;
        } else {
            coords.z = Math.ceil((coords.z - scale + 1) / scale) * scale;
        }

        coords.y = 0;
    }

    private _getMaterial(lodLevel: number): BABYLON.Material {
        if (lodLevel - 2 <= 0) {
            return this._materials[0];
        }

        if (lodLevel - 2 <= 2) {
            return this._materials[1];
        }

        return this._materials[2];
    }

    private get _gridSize() {
        return 4 * this.vertexDensity + 1;
    }

    private _instantiateMeshes(): void {
        const k = this._gridSize;

        this._center = this._instantiateElement("Center", this._createPlaneMesh(2 * k, 2 * k, 1, Seams.All), this._materials[this._materials.length - 1]);

        const ring = this._createRingMesh(k, 1);
        const trim = this._createTrimMesh(k, 1);

        for (let i = 0; i < this.clipLevels; ++i) {
            this._rings.push(this._instantiateElement("Ring " + i, ring, this._materials[this._materials.length - 1], i > 0));
            this._trims.push(this._instantiateElement("Trim " + i, trim, this._materials[this._materials.length - 1], i > 0));
        }

        if (this.useSkirt) {
            this._skirt = this._instantiateElement("Skirt", this._createSkirtMesh(k, this.skirtSize), this._materials[this._materials.length - 1]);
        }
    }

    private _instantiateElement(name: string, mesh: BABYLON.Mesh, mat: BABYLON.Material, clone = false): BABYLON.Mesh {
        if (clone) {
            mesh = mesh.clone("");
        }

        mesh.name = name;
        mesh.material = mat;
        mesh.parent = this._root;
        mesh.receiveShadows = true;

        return mesh;
    }

    private _createSkirtMesh(k: number, outerBorderScale: number): BABYLON.Mesh {
        const quad = this._createPlaneMesh(1, 1, 1);
        const hStrip = this._createPlaneMesh(k, 1, 1);
        const vStrip = this._createPlaneMesh(1, k, 1);


        const cornerQuadScale = new BABYLON.Vector3(outerBorderScale, 1, outerBorderScale);
        const midQuadScaleVert = new BABYLON.Vector3(1 / k, 1, outerBorderScale);
        const midQuadScaleHor = new BABYLON.Vector3(outerBorderScale, 1, 1 / k);

        const m1 = quad.clone();
        m1.scaling.copyFrom(cornerQuadScale);

        const m2 = hStrip.clone();
        m2.scaling.copyFrom(midQuadScaleVert);
        m2.position.x = outerBorderScale;

        const m3 = quad.clone();
        m3.scaling.copyFrom(cornerQuadScale);
        m3.position.x = outerBorderScale + 1;

        const m4 = vStrip.clone();
        m4.scaling.copyFrom(midQuadScaleHor);
        m4.position.z = outerBorderScale;

        const m5 = vStrip.clone();
        m5.scaling.copyFrom(midQuadScaleHor);
        m5.position.x = outerBorderScale + 1;
        m5.position.z = outerBorderScale;

        const m6 = quad.clone();
        m6.scaling.copyFrom(cornerQuadScale);
        m6.position.z = outerBorderScale + 1;

        const m7 = hStrip.clone();
        m7.scaling.copyFrom(midQuadScaleVert);
        m7.position.x = outerBorderScale;
        m7.position.z = outerBorderScale + 1;

        const m8 = quad.clone();
        m8.scaling.copyFrom(cornerQuadScale);
        m8.position.x = outerBorderScale + 1;
        m8.position.z = outerBorderScale + 1;

        quad.dispose(true, false);
        hStrip.dispose(true, false);
        vStrip.dispose(true, false);

        return BABYLON.Mesh.MergeMeshes([m1, m2, m3, m4, m5, m6, m7, m8], true, true)!;
    }

    private _createTrimMesh(k: number, lengthScale: number): BABYLON.Mesh {
        const m1 = this._createPlaneMesh(k + 1, 1, lengthScale, Seams.None, 1);
        m1.position.set((-k - 1) * lengthScale, 0, -1 * lengthScale);

        const m2 = this._createPlaneMesh(1, k, lengthScale, Seams.None, 1);
        m2.position.set(-1 * lengthScale, 0, (-k - 1) * lengthScale);

        const mesh = BABYLON.Mesh.MergeMeshes([m1, m2], true, true)!;
        mesh.rotationQuaternion = new BABYLON.Quaternion();

        return mesh;
    }

    private _createRingMesh(k: number, lengthScale: number): BABYLON.Mesh {
        const m1 = this._createPlaneMesh(2 * k, (k - 1) >> 1, lengthScale, Seams.Bottom | Seams.Right | Seams.Left);

        const m2 = this._createPlaneMesh(2 * k, (k - 1) >> 1, lengthScale, Seams.Top | Seams.Right | Seams.Left);
        m2.position.set(0, 0, (k + 1 + ((k - 1) >> 1)) * lengthScale);

        const m3 = this._createPlaneMesh((k - 1) >> 1, k + 1, lengthScale, Seams.Left);
        m3.position.set(0, 0, ((k - 1) >> 1) * lengthScale);

        const m4 = this._createPlaneMesh((k - 1) >> 1, k + 1, lengthScale, Seams.Right);
        m4.position.set((k + 1 + ((k - 1) >> 1)) * lengthScale, 0, ((k - 1) >> 1) * lengthScale);

        return BABYLON.Mesh.MergeMeshes([m1, m2, m3, m4], true, true)!;
    }

    private _createPlaneMesh(width: number, height: number, lengthScale: number, seams: Seams = Seams.None, trianglesShift = 0): BABYLON.Mesh {
        const vertices: number[] = [];
        const triangles: number[] = [];
        const normals: number[] = [];
        
        const vdata = new BABYLON.VertexData();

        vdata.positions = vertices;
        vdata.indices = triangles;
        vdata.normals = normals;

        for (let i = 0; i < height + 1; ++i) {
            for (let j = 0; j < width + 1; ++j) {
                let x = j, z = i;
                
                if (i === 0 && (seams & Seams.Bottom) || i === height && (seams & Seams.Top)) {
                    x = x & ~1;
                }
                if (j === 0 && (seams & Seams.Left) || j === width && (seams & Seams.Right)) {
                    z = z & ~1;
                }

                vertices[0 + j * 3 + i * (width + 1) * 3] = x * lengthScale;
                vertices[1 + j * 3 + i * (width + 1) * 3] = 0 * lengthScale;
                vertices[2 + j * 3 + i * (width + 1) * 3] = z * lengthScale;

                normals[0 + j * 3 + i * (width + 1) * 3] = 0;
                normals[1 + j * 3 + i * (width + 1) * 3] = 1;
                normals[2 + j * 3 + i * (width + 1) * 3] = 0;
            }
        }

        let tris = 0;
        for (let i = 0; i < height; ++i) {
            for (let j = 0; j < width; ++j) {
                const k = j + i * (width + 1);
                if ((i + j + trianglesShift) % 2 === 0) {
                    triangles[tris++] = k;
                    triangles[tris++] = k + width + 2;
                    triangles[tris++] = k + width + 1;

                    triangles[tris++] = k;
                    triangles[tris++] = k + 1;
                    triangles[tris++] = k + width + 2;
                } else {
                    triangles[tris++] = k;
                    triangles[tris++] = k + 1;
                    triangles[tris++] = k + width + 1;

                    triangles[tris++] = k + 1;
                    triangles[tris++] = k + width + 2;
                    triangles[tris++] = k + width + 1;
                }                
            }
        }

        const mesh = new BABYLON.Mesh("Clipmap plane", this._scene);

        vdata.applyToMesh(mesh, true);

        return mesh;
    }
}
