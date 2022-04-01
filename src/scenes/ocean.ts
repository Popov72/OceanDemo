/**
 * Based on the great Unity project https://github.com/gasgiant/FFT-Ocean by Ivan Pensionerov (https://github.com/gasgiant)
 * buoy and fisher_boat meshes are from Sketchfab (https://sketchfab.com/feed)
 */
import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import "@babylonjs/loaders";
import { PBRCustomMaterial } from "@babylonjs/materials";
import noiseEXR from "../assets/ocean/00_noise0.exr";
import babylon_buoy from "../assets/ocean/babylonBuoy.glb";
import buoy from "../assets/ocean/buoy.glb";
import fisher_boat from "../assets/ocean/fisher_boat.glb";
import { CreateSceneClass } from "../createScene";
import { Buoyancy } from "./buoyancy";
import { OceanGeometry } from "./oceanGeometry";
import { OceanGUI } from "./oceanGui";
import { OceanMaterial } from "./oceanMaterial";
import { SkyBox } from "./skyBox";
import { RTTDebug } from "./tools/RTTDebug";
import { WavesGenerator } from "./wavesGenerator";
import { WavesSettings } from "./wavesSettings";



const showBuoy = false;
const showFisherBoat = false;
const showBabylonBuoy = true;

export class Ocean implements CreateSceneClass {

    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.TargetCamera;
    private _rttDebug: RTTDebug;
    private _light: BABYLON.DirectionalLight;
    private _depthRenderer: BABYLON.DepthRenderer;
    private _buoyancy: Buoyancy;
    private _wavesSettings: WavesSettings;
    private _fxaa: BABYLON.Nullable<BABYLON.FxaaPostProcess>;
    private _size: number;
    private _gui: OceanGUI;
    private _skybox: SkyBox;
    private _oceanMaterial: OceanMaterial;
    private _oceanGeometry: OceanGeometry;
    private _wavesGenerator: BABYLON.Nullable<WavesGenerator>;
    private _useZQSD: boolean;
    private _useProceduralSky: boolean
    private _lightDirection: BABYLON.Vector3;
    private _shadowGenerator: BABYLON.ShadowGenerator;
    private _lightBuoy: BABYLON.PointLight;
    private _shadowGeneratorBuoy: BABYLON.ShadowGenerator;
    private _glowLayer: BABYLON.GlowLayer;
    private _forceUpdateGlowIntensity: boolean;

    constructor() {
        this._engine = null as any;
        this._scene = null as any;
        this._camera = null as any;
        this._rttDebug = null as any;
        this._light = null as any;
        this._depthRenderer = null as any;
        this._buoyancy = null as any;
        this._fxaa = null;
        this._gui = null as any;
        this._skybox = null as any;
        this._oceanMaterial = null as any;
        this._oceanGeometry = null as any;
        this._wavesGenerator = null;
        this._useZQSD = false;
        this._useProceduralSky = true;
        this._lightDirection = new BABYLON.Vector3(0, -1, -0.25);
        this._shadowGenerator = null as any;
        this._lightBuoy = null as any;
        this._shadowGeneratorBuoy = null as any;
        this._glowLayer = null as any;
        this._forceUpdateGlowIntensity = true;

        this._size = 0;
        this._wavesSettings = new WavesSettings();
    }

    public async createScene(
        engine: BABYLON.Engine,
        canvas: HTMLCanvasElement
    ): Promise<BABYLON.Scene> {
        (window as any).convf = function(l: number): number { const a = new Uint8Array([l & 0xff, (l & 0xff00) >> 8, (l & 0xff0000) >> 16, (l & 0xff000000) >> 24]); return new Float32Array(a.buffer)[0]; };
        (window as any).numbg = function(): void { console.log("NumBindGroupsCreatedTotal=", BABYLON.WebGPUCacheBindGroups.NumBindGroupsCreatedTotal, " - NumBindGroupsCreatedLastFrame=", BABYLON.WebGPUCacheBindGroups.NumBindGroupsCreatedLastFrame); };

        const scene = new BABYLON.Scene(engine);

        scene.useRightHandedSystem = true;

        this._engine = engine;
        this._scene = scene;

        this._camera = new BABYLON.FreeCamera("mainCamera", new BABYLON.Vector3(-17.3, 5, -9), scene);
        this._camera.rotation.set(0.21402315044176745, 1.5974857677541419, 0);
        this._camera.minZ = 1;
        this._camera.maxZ = 100000;

        if (!this._checkSupport()) {
            return scene;
        }

        this._setCameraKeys();

        //await OceanGUI.LoadDAT(); 

        this._rttDebug = new RTTDebug(scene, engine, 32);
        this._rttDebug.show(false);

        scene.environmentIntensity = 1;

        scene.activeCameras = [this._camera, this._rttDebug.camera];

        this._camera.attachControl(canvas, true);

        const cameraUpdate = this._camera.update.bind(this._camera);
        this._camera.update = function() {
            cameraUpdate();
            if (this.position.y < 1.5) {
                this.position.y = 1.5;
            }
        };

        this._depthRenderer = this._scene.enableDepthRenderer(this._camera, false);
        this._depthRenderer.getDepthMap().renderList = [];
        
        this._light = new BABYLON.DirectionalLight("light", this._lightDirection, scene);
        this._light.intensity = 1;
        this._light.diffuse = new BABYLON.Color3(1, 1, 1);
        this._light.shadowMinZ = 0;
        this._light.shadowMaxZ = 40;
        this._light.shadowOrthoScale = 0.5;

        this._shadowGenerator = new BABYLON.ShadowGenerator(4096, this._light);
        this._shadowGenerator.usePercentageCloserFiltering = true;
        this._shadowGenerator.bias = 0.005;

        this._skybox = new SkyBox(this._useProceduralSky, scene);
        this._buoyancy = new Buoyancy(this._size, 3, 0.2);
        this._oceanMaterial = new OceanMaterial(this._depthRenderer, this._scene);
        this._oceanGeometry = new OceanGeometry(this._oceanMaterial, this._camera, this._scene);

        this._fxaa = new BABYLON.FxaaPostProcess("fxaa", 1, this._camera);
        this._fxaa.samples = engine.getCaps().maxMSAASamples;

        await this._loadMeshes();

        //scene.stopAllAnimations();

        await this._updateSize(256);
        this._oceanGeometry.initializeMeshes();

        this._gui = new OceanGUI(this._useProceduralSky, scene, engine, this._parameterRead.bind(this), this._parameterChanged.bind(this));

        if (location.href.indexOf("hidegui") !== -1) {
            this._gui.visible = false;
        }

        this._scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    if (kbInfo.event.key === "Shift") {
                        this._camera.speed = 10;
                    }
                    break;
                case BABYLON.KeyboardEventTypes.KEYUP:
                    if (kbInfo.event.key === "Shift") {
                        this._camera.speed = 2;
                    }
                    break;
            }
        });

        scene.onBeforeRenderObservable.add(() => {
            if (this._skybox.update(this._light) || this._forceUpdateGlowIntensity) {
                if (this._glowLayer) {
                    const minIntensity = 0.6;
                    const maxIntensity = 3;
                    const sunPos = this._light.position.clone().normalize();
                    const sunProj = sunPos.clone().normalize();

                    sunProj.y = 0;

                    const dot = BABYLON.Vector3.Dot(sunPos, sunProj);
                    
                    const intensity = BABYLON.Scalar.Lerp(minIntensity, maxIntensity, BABYLON.Scalar.Clamp(dot, 0, 1));

                    this._glowLayer.intensity = sunPos.y < 0 ? maxIntensity : intensity;
                    this._forceUpdateGlowIntensity = false;
                }
                this._light.position = this._light.position.clone().normalize().scaleInPlace(30);
            }
            this._oceanGeometry.update();
            this._wavesGenerator!.update();
            this._buoyancy.setWaterHeightMap(this._wavesGenerator!.waterHeightMap, this._wavesGenerator!.waterHeightMapScale);
            this._buoyancy.update();
        });

        return new Promise((resolve) => {
            scene.executeWhenReady(() => resolve(scene));
        });
    }

    private _setCameraKeys(): void {
        const kbInputs = this._camera.inputs.attached.keyboard as BABYLON.FreeCameraKeyboardMoveInput;
        if (this._useZQSD) {
            kbInputs.keysDown = [40, 83];
            kbInputs.keysLeft = [37, 81];
            kbInputs.keysRight = [39, 68];
            kbInputs.keysUp = [38, 90];
        } else {
            kbInputs.keysDown = [40, 83];
            kbInputs.keysLeft = [37, 65];
            kbInputs.keysRight = [39, 68];
            kbInputs.keysUp = [38, 87];
        }
        kbInputs.keysDownward = [34, 32];
        kbInputs.keysUpward = [33, 69];
    }

    private _checkSupport(): boolean {
        if (this._engine.getCaps().supportComputeShaders) {
            return true;
        }

        const panel = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        const textNOk = "**Use WebGPU to watch this demo which requires compute shaders support. To enable WebGPU please use Chrome Canary or Edge canary. Also select the WebGPU engine from the top right drop down menu.**";
    
        const info = new GUI.TextBlock();
        info.text = textNOk;
        info.width = "100%";
        info.paddingLeft = "5px";
        info.paddingRight = "5px";
        info.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        info.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        info.color = "red";
        info.fontSize = "24px";
        info.fontStyle = "bold";
        info.textWrapping = true;
        panel.addControl(info); 

        return false;
    }

    private async _loadMeshes() {
        // Buoy
        if (showBuoy) {
            await BABYLON.SceneLoader.AppendAsync("", buoy, this._scene, undefined, ".glb");

            const buoyMesh = this._scene.getMeshByName("pTorus5_lambert1_0")!;

            buoyMesh.scaling.setAll(0.1);
            buoyMesh.position.y = -0.3;
            buoyMesh.position.z = -15;
            buoyMesh.receiveShadows = true;

            this._depthRenderer.getDepthMap().renderList!.push(buoyMesh);
            this._buoyancy.addMesh(buoyMesh, { v1: new BABYLON.Vector3(0, 5, -6), v2: new BABYLON.Vector3(0, 5, 6), v3: new BABYLON.Vector3(5, 5, -6) }, -0.3, 1);
            this._shadowGenerator.addShadowCaster(buoyMesh);
        }

        // Fisher boat
        if (showFisherBoat) {
            await BABYLON.SceneLoader.AppendAsync("", fisher_boat, this._scene, undefined, ".glb");

            const fisherBoat = this._scene.getTransformNodeByName("Cube.022")!;

            fisherBoat.scaling.setAll(3);
            fisherBoat.position.x = -5;
            fisherBoat.position.y = 1.5;
            fisherBoat.position.z = -10;

            this._depthRenderer.getDepthMap().renderList!.push(...fisherBoat.getChildMeshes(false));
            this._buoyancy.addMesh(fisherBoat, { v1: new BABYLON.Vector3(0, 2, 0), v2: new BABYLON.Vector3(0, -1.2, 0), v3: new BABYLON.Vector3(0.4, 2, 0) }, 1.5, 0);
            fisherBoat.getChildMeshes(false).forEach((m) => {
                m.receiveShadows = true;
                this._shadowGenerator.addShadowCaster(m);
            });
        }

        // Babylon buoy
        if (showBabylonBuoy) {
            await BABYLON.SceneLoader.AppendAsync("", babylon_buoy, this._scene, undefined, ".glb");

            const babylonBuoyMeshes = [this._scene.getMeshByName("buoyMesh_low") as BABYLON.Mesh];
            const babylonBuoyRoot = babylonBuoyMeshes[0].parent as BABYLON.TransformNode;
            const scale = 14;

            babylonBuoyRoot.position.z = -8;
            babylonBuoyRoot.scaling.setAll(scale);

            babylonBuoyMeshes.forEach((mesh) => {
                mesh.material!.backFaceCulling = false;

                this._shadowGenerator.addShadowCaster(mesh);
                mesh.receiveShadows = true;
                this._depthRenderer.getDepthMap().renderList!.push(mesh);
            });

            babylonBuoyRoot.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, Math.PI / 3, 0);
            this._buoyancy.addMesh(babylonBuoyRoot, { v1: new BABYLON.Vector3(0.7 / scale, 1 / scale, -1.5 / scale), v2: new BABYLON.Vector3(0.7 / scale, 1 / scale, 1.5 / scale), v3: new BABYLON.Vector3(-1.5 / scale, 1 / scale, -1.5 / scale) }, 0.0, 2);

            const slight = BABYLON.MeshBuilder.CreateSphere("slight", { segments: 6, diameter: 0.5 / scale }, this._scene);
            slight.position.set(-0.6 / scale, 6.58 / scale, 0.3 / scale);
            slight.visibility = 0;
            slight.parent = babylonBuoyRoot;

            this._lightBuoy = new BABYLON.PointLight("point", new BABYLON.Vector3(0, 0, 0), this._scene);
            this._lightBuoy.intensity = 30;
            this._lightBuoy.diffuse = new BABYLON.Color3(0.96, 0.70, 0.15).toLinearSpace();
            this._lightBuoy.shadowMinZ = 0.01;
            this._lightBuoy.shadowMaxZ = 15;
            this._lightBuoy.parent = slight;

            this._shadowGeneratorBuoy = new BABYLON.ShadowGenerator(2048, this._lightBuoy);
            this._shadowGeneratorBuoy.usePoissonSampling = true;
            this._shadowGeneratorBuoy.addShadowCaster(babylonBuoyMeshes[0]);
            this._shadowGeneratorBuoy.bias = 0.01;

            /*const sp1 = BABYLON.MeshBuilder.CreateSphere("sp1", { diameter: 1.2 / scale }, this._scene);
            sp1.parent = babylonBuoyRoot;
            sp1.position.x = 0.7 / scale;
            sp1.position.y = 1 / scale;
            sp1.position.z = -1.5 / scale;

            const sp2 = BABYLON.MeshBuilder.CreateSphere("sp2", { diameter: 1.2 / scale }, this._scene);
            sp2.parent = babylonBuoyRoot;
            sp2.position.x = 0.7 / scale;
            sp2.position.y = 1 / scale;
            sp2.position.z = 1.5 / scale;

            const sp3 = BABYLON.MeshBuilder.CreateSphere("sp3", { diameter: 1.2 / scale }, this._scene);
            sp3.parent = babylonBuoyRoot;
            sp3.position.x = -1.5 / scale;
            sp3.position.y = 1 / scale;
            sp3.position.z = -1.5 / scale;*/
        }
    }

    private _createGlowLayer(): void {
        this._glowLayer = new BABYLON.GlowLayer("glow", this._scene);

        this._glowLayer.addIncludedOnlyMesh(this._scene.getMeshByName("glassCovers_low") as BABYLON.Mesh);

        this._glowLayer.customEmissiveColorSelector = (mesh, subMesh, material, result) => {
            result.set(this._lightBuoy.diffuse.r, this._lightBuoy.diffuse.g, this._lightBuoy.diffuse.b, 1);
        };

        this._forceUpdateGlowIntensity = true;
    }

    private async _updateSize(size: number) {
        this._size = size;

        this._buoyancy.size = size;

        const noise = await (await fetch(noiseEXR)).arrayBuffer();

        this._wavesGenerator?.dispose();
        this._wavesGenerator = new WavesGenerator(this._size, this._wavesSettings, this._scene, this._rttDebug, noise);

        this._oceanMaterial.setWavesGenerator(this._wavesGenerator);

        await this._oceanGeometry.initializeMaterials();
    }

    private _readValue(obj: any, name: string): any {
        const parts: string[] = name.split("_");

        for (let i = 0; i < parts.length; ++i) {
            obj = obj[parts[i]];
        }

        return obj;
    }

    private _setValue(obj: any, name: string, value: any): void {
        const parts: string[] = name.split("_");

        for (let i = 0; i < parts.length - 1; ++i) {
            obj = obj[parts[i]];
        }

        obj[parts[parts.length - 1]] = value;
    }

    private _parameterRead(name: string): any {
        switch (name) {
            case "size":
                return this._size;
            case "showDebugRTT":
                return this._rttDebug.isVisible;
            case "envIntensity":
                return this._scene.environmentIntensity;
            case "lightIntensity":
                return this._light.intensity;
            case "proceduralSky":
                return this._useProceduralSky;
            case "enableShadows":
                return this._light.shadowEnabled;
            case "enableFXAA":
                return this._fxaa !== null;
            case "enableGlow":
                return this._glowLayer !== null;
            case "useZQSD":
                return this._useZQSD;
            case "buoy_enabled":
                return this._buoyancy.enabled;
            case "buoy_attenuation":
                return this._buoyancy.attenuation;
            case "buoy_numSteps":
                return this._buoyancy.numSteps;
            case "skybox_lightColor":
                return this._light.diffuse.toHexString();
            case "skybox_directionX":
                return this._lightDirection.x;
            case "skybox_directionY":
                return this._lightDirection.y;
            case "skybox_directionZ":
                return this._lightDirection.z;
        }

        if (name.startsWith("procSky_")) {
            name = name.substring(8);
            return (this._skybox.skyMaterial as any)[name];
        }

        if (name.startsWith("waves_")) {
            name = name.substring(6);
            return this._readValue(this._wavesSettings, name);
        }

        if (name.startsWith("oceangeom_")) {
            name = name.substring(10);
            return this._readValue(this._oceanGeometry, name);
        }

        if (name.startsWith("oceanshader_")) {
            name = name.substring(12);
            return this._oceanMaterial.readMaterialParameter(this._oceanGeometry.getMaterial(0) as PBRCustomMaterial, name);
        }
    }

    private _parameterChanged(name: string, value: any): void {
        //console.log(name, "=", value);
        switch (name) {
            case "size": {
                const newSize = value | 0;
                if (newSize !== this._size) {
                    this._updateSize(newSize);
                }
                break;
            }
            case "showDebugRTT":
                this._rttDebug.show(!!value);
                break;
            case "envIntensity":
                this._scene.environmentIntensity = parseFloat(value);
                break;
            case "lightIntensity":
                this._light.intensity = parseFloat(value);
                break;
            case "enableShadows":
                this._light.shadowEnabled = !!value;
                if (this._lightBuoy) {
                    this._lightBuoy.shadowEnabled = !!value;
                }
                break;
            case "enableFXAA":
                if (value) {
                    if (!this._fxaa) {
                        this._fxaa = new BABYLON.FxaaPostProcess("fxaa", 1, this._camera);
                        this._fxaa.samples = this._engine.getCaps().maxMSAASamples;
                    }
                } else if (this._fxaa) {
                    this._fxaa.dispose();
                    this._fxaa = null;
                }
                break;
            case "enableGlow":
                if (this._glowLayer) {
                    this._glowLayer.dispose();
                    this._glowLayer = null as any;
                } else {
                    this._createGlowLayer();
                }
                break;
            case "proceduralSky":
                value = !!value;
                if (this._useProceduralSky !== value) {
                    this._gui.dispose();
                    this._skybox.dispose();
                    this._useProceduralSky = value;
                    this._skybox = new SkyBox(this._useProceduralSky, this._scene);
                    this._gui = new OceanGUI(this._useProceduralSky, this._scene, this._engine, this._parameterRead.bind(this), this._parameterChanged.bind(this));
                }
                break;
            case "useZQSD":
                this._useZQSD = !!value;
                this._setCameraKeys();
                break;
            case "buoy_enabled":
                this._buoyancy.enabled = !!value;
                break;
            case "buoy_attenuation":
                this._buoyancy.attenuation = parseFloat(value);
                break;
            case "buoy_numSteps":
                this._buoyancy.numSteps = value | 0;
                break;
            case "skybox_lightColor":
                this._light.diffuse.copyFrom(BABYLON.Color3.FromHexString(value));
                break;
            case "skybox_directionX":
                this._lightDirection.x = parseFloat(value);
                this._light.direction = this._lightDirection.normalizeToNew();
                break;
            case "skybox_directionY":
                this._lightDirection.y = parseFloat(value);
                this._light.direction = this._lightDirection.normalizeToNew();
                break;
            case "skybox_directionZ":
                this._lightDirection.z = parseFloat(value);
                this._light.direction = this._lightDirection.normalizeToNew();
                break;
        }

        if (name.startsWith("procSky_")) {
            name = name.substring(8);
            this._setValue(this._skybox.skyMaterial, name, value === false ? false : value === true ? true : parseFloat(value));
            this._skybox.setAsDirty();
        }

        if (name.startsWith("waves_")) {
            name = name.substring(6);
            this._setValue(this._wavesSettings, name, value === false ? false : value === true ? true : parseFloat(value));
            this._wavesGenerator!.initializeCascades();
        }

        if (name.startsWith("oceangeom_")) {
            name = name.substring(10);
            this._setValue(this._oceanGeometry, name, value === false ? false : value === true ? true : parseFloat(value));
            if (name !== "oceangeom_noMaterialLod") {
                this._oceanGeometry.initializeMeshes();
            }
        }

        if (name.startsWith("oceanshader_")) {
            name = name.substring(12);
            this._oceanMaterial.updateMaterialParameter(this._oceanGeometry.getMaterial(0) as PBRCustomMaterial, name, value);
            this._oceanMaterial.updateMaterialParameter(this._oceanGeometry.getMaterial(1) as PBRCustomMaterial, name, value);
            this._oceanMaterial.updateMaterialParameter(this._oceanGeometry.getMaterial(2) as PBRCustomMaterial, name, value);
        }
    }
}

export default new Ocean();