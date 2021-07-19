import * as BABYLON from "@babylonjs/core";
import { RTTDebug } from "./RTTDebug";
import { ComputeHelper } from "./computeHelper";

import fftCS from "../../assets/ocean/fft.wgsl";

export class FFT {
    private _engine: BABYLON.Engine;
    private _rttDebug: RTTDebug;
    private _debugFirstIndex: number;
    private _size: number;

    private _precomputedData: BABYLON.BaseTexture;
    private _params: BABYLON.UniformBuffer;

    constructor(engine: BABYLON.Engine, scene: BABYLON.Scene, rttDebug: RTTDebug, debugFirstIndex: number, size: number) {
        this._engine = engine;
        this._rttDebug = rttDebug;
        this._debugFirstIndex = debugFirstIndex;
        this._size = size;

        const cs = new BABYLON.ComputeShader("computeTwiddleFactors", this._engine, { computeSource: fftCS }, {
            bindingsMapping: {
                "PrecomputeBuffer": { group: 0, binding: 0 },
                "params": { group: 0, binding: 1 },
            },
            entryPoint: "precomputeTwiddleFactorsAndInputIndices"
        });

        const logSize = Math.log2(size) | 0;

        this._precomputedData = ComputeHelper.CreateStorageTexture("precomputeTwiddle", this._engine, logSize, this._size, BABYLON.Constants.TEXTUREFORMAT_RGBA);

        this._rttDebug.setTexture(this._debugFirstIndex, "precomputeTwiddle", this._precomputedData);

        this._params = new BABYLON.UniformBuffer(this._engine);

        this._params.addUniform("PingPong", 1);
        this._params.addUniform("Step", 1);
        this._params.addUniform("Size", 1);

        cs.setStorageTexture("PrecomputeBuffer", this._precomputedData);
        cs.setUniformBuffer("params", this._params);

        this._params.updateInt("Size", this._size);
        this._params.update();

        ComputeHelper.Dispatch(cs, logSize, size / 2, 1);
    }

    public dispose(): void {
        this._precomputedData.dispose();
        this._params.dispose();
    }
}