import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import { CustomMaterial } from "@babylonjs/materials";
import { EXRSerializer } from "./exrSerializer";

const numTotalPlanes = 32;
const planeSpacing = 0.003;

export class RTTDebug {
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.TargetCamera;
    private _debugPlaneList: Array<BABYLON.Mesh>;
    private _gui: GUI.AdvancedDynamicTexture;
    private _guiBackgrounds: GUI.Rectangle[];
    private _guiTexts: GUI.TextBlock[];
    private _guiButtons: GUI.Button[];
    private _exrSerializer: EXRSerializer;

    public get camera(): BABYLON.TargetCamera {
        return this._camera;
    }

    public setTexture(index: number, name: string, texture: BABYLON.BaseTexture, multiplier = 1): void {
        (this._debugPlaneList[index].material as BABYLON.StandardMaterial).emissiveTexture = texture;
        if (multiplier !== 1) {
            this._debugPlaneList[index].material?.onBindObservable.add(() => {
                this._debugPlaneList[index].material!.getEffect()?.setFloat("multiplier", multiplier);
            });
        }
        this._debugPlaneList[index].name = name;
        this._debugPlaneList[index].material!.name = name;
        this._guiTexts[index].text = name;
    }

    constructor(scene: BABYLON.Scene, engine: BABYLON.Engine, numPlanes = 5) {
        this._engine = engine;
        this._scene = scene;
        this._debugPlaneList = [];
        this._guiBackgrounds = [];
        this._guiTexts = [];
        this._guiButtons = [];
        this._exrSerializer = new EXRSerializer();

        this._camera = new BABYLON.ArcRotateCamera(
            "debug",
            -Math.PI / 2,
            Math.PI / 2,
            10,
            new BABYLON.Vector3(0, 0, 0),
            this._scene
        );

        this._camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        this._camera.layerMask = 0x10000000;

        this._gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("debugGUI", true, scene);

        this._gui.layer!.layerMask = 0x10000000;

        this._makePlanes(numPlanes);
    }

    private _makePlanes(numPlanes: number): void {
        const grid = new GUI.Grid("grid");

        grid.addRowDefinition(1);

        this._gui.addControl(grid);

        for (let i = 0; i < numPlanes; ++i) {
            const plane = BABYLON.MeshBuilder.CreatePlane("plane" + i, { size: 1 }, this._scene);
            const uvs = plane.getVerticesData("uv")!;

            for (let i = 0; i < uvs.length; i += 2) {
                uvs[i + 1] = 1 - uvs[i + 1];
            }

            plane.setVerticesData("uv", uvs);

            plane.layerMask = 0x10000000;
            plane.position.x += 0.5;
            plane.position.y -= 0.5;
            plane.bakeCurrentTransformIntoVertices();

            this._debugPlaneList.push(plane);

            const mat = new CustomMaterial("planemat" + i, this._scene);
            plane.material = mat;

            mat.AddUniform("multiplier", "float", "1.0");
            mat.Fragment_Before_FragColor(`
                color.rgba *= vec4(multiplier);
            `);

            mat.disableLighting = true;

            grid.addColumnDefinition(1 / numTotalPlanes);

            const bkg = new GUI.Rectangle("text" + i);

            bkg.background = "green";
            bkg.color = "white";
            bkg.thickness = 2;
            bkg.width = 0.95;
            bkg.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            bkg.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

            this._guiBackgrounds.push(bkg);

            const text = new GUI.TextBlock("title" + i, "");

            text.color = "white";
            text.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            text.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
            text.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            text.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

            this._guiTexts.push(text);

            const button = GUI.Button.CreateSimpleButton("button" + i, "Save");
            button.width = 0.7;
            button.color = "white";
            button.cornerRadius = 10;
            button.background = "green";
            button.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            button.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
            button.onPointerUpObservable.add(() => {
                const texture = (this._debugPlaneList[i].material as BABYLON.StandardMaterial).emissiveTexture;
                if (texture) {
                    const textureFormat = texture.getInternalTexture()?.format ?? BABYLON.Constants.TEXTUREFORMAT_RGBA;
                    texture.readPixels()!.then((buffer) => {
                        const channels =
                            textureFormat === BABYLON.Constants.TEXTUREFORMAT_R  ? ["R"] :
                            textureFormat === BABYLON.Constants.TEXTUREFORMAT_RG ? ["R", "G"] : ["R", "G", "B", "A"];
                        this._exrSerializer.serialize(texture.getSize().width, texture.getSize().height, new Float32Array(buffer.buffer), channels);
                        this._exrSerializer.download(this._debugPlaneList[i].name + ".exr");
                    });
                }
            });

            this._guiButtons.push(button);

            grid.addControl(bkg, 0, i);
            grid.addControl(text, 0, i);
            grid.addControl(button, 0, i)
        }

        for (let i = numPlanes; i < numTotalPlanes; ++i) {
            grid.addColumnDefinition(1 / numTotalPlanes);
        }

        this._resize();

        this._engine.onResizeObservable.add(this._resize.bind(this));
    }

    private _resize(): void {
        const screenWidth = this._engine.getRenderWidth();
        const screenHeight = this._engine.getRenderHeight();

        const ratio = screenWidth / screenHeight;

        this._camera.orthoLeft = -5 * ratio;
        this._camera.orthoRight = 5 * ratio;
        this._camera.orthoTop = 5;
        this._camera.orthoBottom = -5;

        this._camera.getProjectionMatrix(true);

        const invTransfMatrix = this._camera.getTransformationMatrix().invert();

        const p = new BABYLON.Vector3(-1, 1, 0 + 0.001);
        const q = new BABYLON.Vector3(-1, 1, 0 + 0.001);

        p.x += planeSpacing / 2;
        q.x += planeSpacing / 2;

        const planeSize = (2 - planeSpacing * numTotalPlanes) / numTotalPlanes;
        const y = Math.floor(screenHeight * planeSize * ratio / 2 + 5);

        this._guiBackgrounds[0].parent!.paddingTop = y + "px";

        for (let i = 0; i < this._debugPlaneList.length; ++i) {
            const plane = this._debugPlaneList[i];

            q.x += planeSize;

            const ip = BABYLON.Vector3.TransformCoordinates(p, invTransfMatrix);
            const iq = BABYLON.Vector3.TransformCoordinates(q, invTransfMatrix);
            const scale = iq.x - ip.x;

            plane.scaling.set(scale, scale, 1);
            plane.position.set(ip.x, ip.y, ip.z);

            q.x += planeSpacing;
            p.x = q.x;

            this._guiBackgrounds[i].height = (20 * screenWidth / 1920) + "px";
            this._guiTexts[i].height = (20 * screenWidth / 1920) + "px";
            this._guiTexts[i].fontSize = (8 * screenWidth / 1920) + "px";
            this._guiButtons[i].top = ((20 * screenWidth / 1920) + 2) + "px";
            this._guiButtons[i].height = (16 * screenWidth / 1920) + "px";
            this._guiButtons[i].fontSize = (8 * screenWidth / 1920) + "px";
        }
    }
}
