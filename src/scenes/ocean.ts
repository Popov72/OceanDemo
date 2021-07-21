import * as BABYLON from "@babylonjs/core";
import { CreateSceneClass } from "../createScene";
import { RTTDebug } from "./RTTDebug";
import { WavesGenerator } from "./wavesGenerator";

import noiseEXR from "../../assets/ocean/00_noise0.exr";

export class Ocean implements CreateSceneClass {

    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.TargetCamera;
    private _rttDebug: RTTDebug;

    constructor() {
        this._engine = null as any;
        this._scene = null as any;
        this._camera = null as any;
        this._rttDebug = null as any;
    }

    public async createScene(
        engine: BABYLON.Engine,
        canvas: HTMLCanvasElement
    ): Promise<BABYLON.Scene> {
        (window as any).convf = function(l: number): number { const a = new Uint8Array([l & 0xff, (l & 0xff00) >> 8, (l & 0xff0000) >> 16, (l & 0xff000000) >> 24]); return new Float32Array(a.buffer)[0]; }

        const scene = new BABYLON.Scene(engine);

        this._engine = engine;
        this._scene = scene;

        this._rttDebug = new RTTDebug(scene, engine, 10);

        this._camera = new BABYLON.ArcRotateCamera(
            "main",
            -Math.PI / 2,
            Math.PI / 3,
            10,
            new BABYLON.Vector3(0, 0, 0),
            scene
        );

        this._camera.setTarget(BABYLON.Vector3.Zero());
        this._camera.attachControl(canvas, true);

        scene.activeCameras = [this._camera, this._rttDebug.camera];

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        // Our built-in 'ground' shape.
        BABYLON.GroundBuilder.CreateGround(
            "ground",
            { width: 6, height: 6 },
            scene
        );

        const noise = await (await fetch(noiseEXR)).arrayBuffer();

        const size = 256;

        const wavesGenerator = new WavesGenerator(size, scene, this._rttDebug, noise);

        scene.onBeforeRenderObservable.add(() => {
            wavesGenerator.update();
        });

        return scene;
    }

}

export default new Ocean();