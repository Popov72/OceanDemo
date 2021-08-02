import * as BABYLON from "@babylonjs/core";
import { CreateSceneClass } from "../createScene";
import { RTTDebug } from "./RTTDebug";
import { WavesGenerator } from "./wavesGenerator";
import { SkyBox } from "./skyBox";
import { OceanMaterial } from "./oceanMaterial";
import { Buoyancy } from "./buoyancy";

import "@babylonjs/loaders";

import noiseEXR from "../../assets/ocean/00_noise0.exr";
import buoy from "../../assets/ocean/buoy.glb";
import fisher_boat from "../../assets/ocean/fisher_boat.glb";
import fishing_boat from "../../assets/ocean/fishing_boat.glb";

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

        this._camera = new BABYLON.FreeCamera("mainC", new BABYLON.Vector3(0, 3.61, -10), scene);
        this._camera.rotation.y = 160 * Math.PI / 180;
        this._camera.minZ = 1;
        this._camera.maxZ = 1000;

        scene.activeCameras = [this._camera, this._rttDebug.camera];

        this._camera.attachControl(canvas, true);

        this._depthRenderer = this._scene.enableDepthRenderer(this._camera, false);
        this._depthRenderer.getDepthMap().renderList = [];
        
        this._light = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0, -1, -0.25), scene);
        this._light.intensity = 1;
        this._light.diffuse = new BABYLON.Color3(1, 0.95686275, 0.8392157);

        const skybox = new SkyBox(true, scene);

        await BABYLON.SceneLoader.AppendAsync("", buoy, scene, undefined, ".glb");

        const buoyMesh = scene.getMeshByName("pTorus5_lambert1_0")!;

        buoyMesh.scaling.setAll(0.1);
        buoyMesh.position.y = -0.3;
        buoyMesh.position.z = -15;
        this._depthRenderer.getDepthMap().renderList!.push(buoyMesh);
        (window as any).buoyMesh = buoyMesh;

        await BABYLON.SceneLoader.AppendAsync("", fisher_boat, scene, undefined, ".glb");

        const fisherBoat = scene.getTransformNodeByName("Cube.022")!;

        fisherBoat.scaling.setAll(3);
        fisherBoat.position.x = -5;
        fisherBoat.position.y = 1.5;
        fisherBoat.position.z = -10;
        this._depthRenderer.getDepthMap().renderList!.push(...fisherBoat.getChildMeshes(false));
        (window as any).fisherBoat = fisherBoat;

        await BABYLON.SceneLoader.AppendAsync("", fishing_boat, scene, undefined, ".glb");

        const fishingBoat = scene.getTransformNodeByName("node_id81_1")!;

        fishingBoat.scaling.setAll(0.02);
        fishingBoat.position.x = -18;
        fishingBoat.position.y = 2.8;
        fishingBoat.position.z = 0.735;
        this._depthRenderer.getDepthMap().renderList!.push(...fishingBoat.getChildMeshes(false));
        (window as any).fishingBoat = fishingBoat;

        const patch = BABYLON.GroundBuilder.CreateGround(
            "patch",
            { width: 242, height: 242, subdivisions: 240 },
            scene
        );

        patch.position.x = 242/2;
        patch.position.z = 242/2;
        patch.bakeCurrentTransformIntoVertices();
        (window as any).pp=patch;

        patch.position.set(-14.9, 0, -25);
        patch.scaling.set(0.12397, 1, 0.12397);

        const noise = await (await fetch(noiseEXR)).arrayBuffer();

        const size = 256; // must be of power of 2!

        const wavesGenerator = new WavesGenerator(size, scene, this._rttDebug, noise);

        const oceanMaterial = new OceanMaterial(wavesGenerator, this._depthRenderer, scene);

        patch.material = await oceanMaterial.getMaterial(true, true);

        const buoyancy = new Buoyancy(size);

        scene.onBeforeRenderObservable.add(() => {
            skybox.update(this._light);
            wavesGenerator.update();
            buoyancy.setWaterHeightMap(wavesGenerator.waterHeightMap, wavesGenerator.waterHeightMapScale);

            buoyMesh.position.y = buoyancy.getWaterHeight(buoyMesh.position) - 0.3;
            fisherBoat.position.y = buoyancy.getWaterHeight(fisherBoat.position) + 1.5;
            fishingBoat.position.y = buoyancy.getWaterHeight(fishingBoat.position) + 2.8;
        });

        return scene;
    }
}

export default new Ocean();