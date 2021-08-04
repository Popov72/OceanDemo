import * as BABYLON from "@babylonjs/core";
import { CreateSceneClass } from "../createScene";
import { RTTDebug } from "./tools/RTTDebug";
import { WavesGenerator } from "./wavesGenerator";
import { SkyBox } from "./skyBox";
import { OceanMaterial } from "./oceanMaterial";
import { Buoyancy } from "./buoyancy";
import { OceanGeometry } from "./oceanGeometry";

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

    constructor() {
        this._engine = null as any;
        this._scene = null as any;
        this._camera = null as any;
        this._rttDebug = null as any;
        this._light = null as any;
        this._depthRenderer = null as any;
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

        this._rttDebug = new RTTDebug(scene, engine, 32);
        this._rttDebug.show(false);

        scene.environmentIntensity = 1;

        //this._camera = new BABYLON.FreeCamera("mainCamera", new BABYLON.Vector3(0, 3.61, -10), scene);
        this._camera = new BABYLON.FreeCamera("mainCamera", new BABYLON.Vector3(-17.3, 5, -9), scene);
        //this._camera.rotation.y = 160 * Math.PI / 180;
        this._camera.rotation.set(0.21402315044176745, 1.5974857677541419, 0);
        this._camera.minZ = 1;
        this._camera.maxZ = 1000000;

        scene.activeCameras = [this._camera, this._rttDebug.camera];

        this._camera.attachControl(canvas, true);

        this._depthRenderer = this._scene.enableDepthRenderer(this._camera, false);
        this._depthRenderer.getDepthMap().renderList = [];
        
        this._light = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0, -1, -0.25), scene);
        this._light.intensity = 1;
        this._light.diffuse = new BABYLON.Color3(1, 0.95686275, 0.8392157);

        const size = 256; // must be of power of 2!
        const buoyancy = new Buoyancy(size, 4, 0.2);
        const skybox = new SkyBox(true, scene);

        // Buoy
        await BABYLON.SceneLoader.AppendAsync("", buoy, scene, undefined, ".glb");

        const buoyMesh = scene.getMeshByName("pTorus5_lambert1_0")!;

        buoyMesh.scaling.setAll(0.1);
        buoyMesh.position.y = -0.3;
        buoyMesh.position.z = -15;
        this._depthRenderer.getDepthMap().renderList!.push(buoyMesh);
        buoyancy.addMesh(buoyMesh, { v1: new BABYLON.Vector3(0, 5, -6), v2: new BABYLON.Vector3(0, 5, 6), v3: new BABYLON.Vector3(5, 5, -6) }, -0.3, 1);

        // Fisher boat
        await BABYLON.SceneLoader.AppendAsync("", fisher_boat, scene, undefined, ".glb");

        const fisherBoat = scene.getTransformNodeByName("Cube.022")!;

        fisherBoat.scaling.setAll(3);
        fisherBoat.position.x = -5;
        fisherBoat.position.y = 1.5;
        fisherBoat.position.z = -10;
        this._depthRenderer.getDepthMap().renderList!.push(...fisherBoat.getChildMeshes(false));
        buoyancy.addMesh(fisherBoat, { v1: new BABYLON.Vector3(0, 2, 0), v2: new BABYLON.Vector3(0, -1.2, 0), v3: new BABYLON.Vector3(0.4, 2, 0) }, 1.5, 0);

        // Dart tsunami buoy
        await BABYLON.SceneLoader.AppendAsync("", dart_tsunami_buoy, scene, undefined, ".glb");

        const dartTsunamiBuoy = scene.getMeshByName("tsunami_buoy_tsunami_buoy_0")! as BABYLON.Mesh;

        dartTsunamiBuoy.scaling.setAll(0.07/4);
        dartTsunamiBuoy.bakeCurrentTransformIntoVertices();
        dartTsunamiBuoy.parent = null;
        dartTsunamiBuoy.alwaysSelectAsActiveMesh = true;

        this._depthRenderer.getDepthMap().renderList!.push(dartTsunamiBuoy);
        buoyancy.addMesh(dartTsunamiBuoy, { v1: new BABYLON.Vector3(0.7, 1, -1.5), v2: new BABYLON.Vector3(0.7, 1, 1.5), v3: new BABYLON.Vector3(-1.5, 1, -1.5) }, -0.5, 2);

        const sp1 = BABYLON.MeshBuilder.CreateSphere("sp1", { diameter: 1.2 }, scene);
        sp1.parent = dartTsunamiBuoy;
        sp1.position.x = 0.7;
        sp1.position.y = 1;
        sp1.position.z = -1.5;

        const sp2 = BABYLON.MeshBuilder.CreateSphere("sp2", { diameter: 1.2 }, scene);
        sp2.parent = dartTsunamiBuoy;
        sp2.position.x = 0.7;
        sp2.position.y = 1;
        sp2.position.z = 1.5;

        const sp3 = BABYLON.MeshBuilder.CreateSphere("sp3", { diameter: 1.2 }, scene);
        sp3.parent = dartTsunamiBuoy;
        sp3.position.x = -1.5;
        sp3.position.y = 1;
        sp3.position.z = -1.5;

        scene.stopAllAnimations();

        const noise = await (await fetch(noiseEXR)).arrayBuffer();

        const wavesGenerator = new WavesGenerator(size, scene, this._rttDebug, noise);

        const oceanMaterial = new OceanMaterial(wavesGenerator, this._depthRenderer, scene);

        const oceanGeometry = new OceanGeometry(oceanMaterial, this._camera, scene);

        await oceanGeometry.initialize();

        scene.onBeforeRenderObservable.add(() => {
            skybox.update(this._light);
            oceanGeometry.update();
            wavesGenerator.update();
            buoyancy.setWaterHeightMap(wavesGenerator.waterHeightMap, wavesGenerator.waterHeightMapScale);
            buoyancy.update();
        });

        return scene;
    }
}

export default new Ocean();