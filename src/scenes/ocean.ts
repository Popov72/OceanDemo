/**
 * Based on the great Unity project https://github.com/gasgiant/FFT-Ocean by Ivan Pensionerov (https://github.com/gasgiant)
 * buoy, fisher_boat and dart_tsunami_buoy meshes are from Sketchfab (https://sketchfab.com/feed)
 */
import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import { CreateSceneClass } from "../createScene";
import { RTTDebug } from "./tools/RTTDebug";
import { WavesGenerator } from "./wavesGenerator";
import { SkyBox } from "./skyBox";
import { OceanMaterial } from "./oceanMaterial";
import { Buoyancy } from "./buoyancy";
import { OceanGeometry } from "./oceanGeometry";
import { OceanGUI } from "./oceanGui";
import { WavesSettings } from "./wavesSettings";
import { PBRCustomMaterial } from "@babylonjs/materials";

import "@babylonjs/loaders";

import noiseEXR from "../../assets/ocean/00_noise0.exr";
import buoy from "../../assets/ocean/buoy.glb";
import fisher_boat from "../../assets/ocean/fisher_boat.glb";
import dart_tsunami_buoy from "../../assets/ocean/dart_tsunami_buoy.glb";

export class Ocean implements CreateSceneClass {

    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.TargetCamera;
    private _rttDebug: RTTDebug;
    private _light: BABYLON.ShadowLight;
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

        await OceanGUI.LoadDAT();

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

        this._skybox = new SkyBox(this._useProceduralSky, scene);
        this._buoyancy = new Buoyancy(this._size, 3, 0.2);
        this._oceanMaterial = new OceanMaterial(this._depthRenderer, this._scene);
        this._oceanGeometry = new OceanGeometry(this._oceanMaterial, this._camera, this._scene);

        this._fxaa = new BABYLON.FxaaPostProcess("fxaa", 1, this._camera);
        this._fxaa.samples = engine.getCaps().maxMSAASamples;

        await this._loadMeshes();

        scene.stopAllAnimations();

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
            this._skybox.update(this._light);
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

        const textNOk = "**Use WebGPU to watch this demo which requires compute shaders support. To enable WebGPU please use Edge Canary or Chrome canary. Also select the WebGPU engine from the top right drop down menu.**";
    
        var info = new GUI.TextBlock();
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
        await BABYLON.SceneLoader.AppendAsync("", buoy, this._scene, undefined, ".glb");

        const buoyMesh = this._scene.getMeshByName("pTorus5_lambert1_0")!;

        buoyMesh.scaling.setAll(0.1);
        buoyMesh.position.y = -0.3;
        buoyMesh.position.z = -15;
        this._depthRenderer.getDepthMap().renderList!.push(buoyMesh);
        this._buoyancy.addMesh(buoyMesh, { v1: new BABYLON.Vector3(0, 5, -6), v2: new BABYLON.Vector3(0, 5, 6), v3: new BABYLON.Vector3(5, 5, -6) }, -0.3, 1);

        // Fisher boat
        await BABYLON.SceneLoader.AppendAsync("", fisher_boat, this._scene, undefined, ".glb");

        const fisherBoat = this._scene.getTransformNodeByName("Cube.022")!;

        fisherBoat.scaling.setAll(3);
        fisherBoat.position.x = -5;
        fisherBoat.position.y = 1.5;
        fisherBoat.position.z = -10;
        this._depthRenderer.getDepthMap().renderList!.push(...fisherBoat.getChildMeshes(false));
        this._buoyancy.addMesh(fisherBoat, { v1: new BABYLON.Vector3(0, 2, 0), v2: new BABYLON.Vector3(0, -1.2, 0), v3: new BABYLON.Vector3(0.4, 2, 0) }, 1.5, 0);

        // Dart tsunami buoy
        await BABYLON.SceneLoader.AppendAsync("", dart_tsunami_buoy, this._scene, undefined, ".glb");

        const dartTsunamiBuoy = this._scene.getMeshByName("tsunami_buoy_tsunami_buoy_0")! as BABYLON.Mesh;

        dartTsunamiBuoy.scaling.setAll(0.07/4);
        dartTsunamiBuoy.bakeCurrentTransformIntoVertices();
        dartTsunamiBuoy.parent = null;
        dartTsunamiBuoy.alwaysSelectAsActiveMesh = true;

        this._depthRenderer.getDepthMap().renderList!.push(dartTsunamiBuoy);
        this._buoyancy.addMesh(dartTsunamiBuoy, { v1: new BABYLON.Vector3(0.7, 1, -1.5), v2: new BABYLON.Vector3(0.7, 1, 1.5), v3: new BABYLON.Vector3(-1.5, 1, -1.5) }, -0.5, 2);

        /*const sp1 = BABYLON.MeshBuilder.CreateSphere("sp1", { diameter: 1.2 }, this._scene);
        sp1.parent = dartTsunamiBuoy;
        sp1.position.x = 0.7;
        sp1.position.y = 1;
        sp1.position.z = -1.5;

        const sp2 = BABYLON.MeshBuilder.CreateSphere("sp2", { diameter: 1.2 }, this._scene);
        sp2.parent = dartTsunamiBuoy;
        sp2.position.x = 0.7;
        sp2.position.y = 1;
        sp2.position.z = 1.5;

        const sp3 = BABYLON.MeshBuilder.CreateSphere("sp3", { diameter: 1.2 }, this._scene);
        sp3.parent = dartTsunamiBuoy;
        sp3.position.x = -1.5;
        sp3.position.y = 1;
        sp3.position.z = -1.5;*/
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
            case "enableFXAA":
                return this._fxaa !== null;
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
            case "size":
                const newSize = value | 0;
                if (newSize !== this._size) {
                    this._updateSize(newSize);
                }
                break;
            case "showDebugRTT":
                this._rttDebug.show(!!value);
                break;
            case "envIntensity":
                this._scene.environmentIntensity = parseFloat(value);
                break;
            case "lightIntensity":
                this._light.intensity = parseFloat(value);
                break;
            case "enableFXAA":
                if (!!value) {
                    if (!this._fxaa) {
                        this._fxaa = new BABYLON.FxaaPostProcess("fxaa", 1, this._camera);
                        this._fxaa.samples = this._engine.getCaps().maxMSAASamples;
                    }
                } else if (this._fxaa) {
                    this._fxaa.dispose();
                    this._fxaa = null;
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