import * as BABYLON from "@babylonjs/core";
import fftInverseFFTCS from "../assets/ocean/fftInverseFFT.wgsl";
import fftInverseFFT2CS from "../assets/ocean/fftInverseFFT2.wgsl";
import fftInverseFFT3CS from "../assets/ocean/fftInverseFFT3.wgsl";
import fftPrecomputeCS from "../assets/ocean/fftPrecompute.wgsl";
import { ComputeHelper } from "./tools/computeHelper";
import { RTTDebug } from "./tools/RTTDebug";


export class FFT {
    private _engine: BABYLON.Engine;
    private _rttDebug: RTTDebug;
    private _debugFirstIndex: number;
    private _size: number;

    private _precomputedData: BABYLON.BaseTexture;
    private _params: BABYLON.UniformBuffer;
    private _horizontalStepIFFT: BABYLON.ComputeShader[];
    private _verticalStepIFFT: BABYLON.ComputeShader[];
    private _permute: BABYLON.ComputeShader;

    constructor(engine: BABYLON.Engine, scene: BABYLON.Scene, rttDebug: RTTDebug, debugFirstIndex: number, size: number) {
        this._engine = engine;
        this._rttDebug = rttDebug;
        this._debugFirstIndex = debugFirstIndex;
        this._size = size;
        this._horizontalStepIFFT = [];
        this._verticalStepIFFT = [];
        this._permute = null as any;

        const cs = new BABYLON.ComputeShader("computeTwiddleFactors", this._engine, { computeSource: fftPrecomputeCS }, {
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

        this._params.addUniform("Step", 1);
        this._params.addUniform("Size", 1);

        cs.setStorageTexture("PrecomputeBuffer", this._precomputedData);
        cs.setUniformBuffer("params", this._params);

        this._params.updateInt("Size", this._size);
        this._params.update();

        ComputeHelper.Dispatch(cs, logSize, size / 2, 1);

        this._createComputeShaders();
    }

    public IFFT2D(input: BABYLON.BaseTexture, buffer: BABYLON.BaseTexture): void {
        const logSize = Math.log2(this._size) | 0;

        // TODO: optimize recreation of binding groups by not ping/ponging the textures
        /*this._horizontalStepIFFT[0].setTexture("InputBuffer", input, false);
        this._horizontalStepIFFT[0].setStorageTexture("OutputBuffer", buffer);
        this._horizontalStepIFFT[1].setTexture("InputBuffer", buffer, false);
        this._horizontalStepIFFT[1].setStorageTexture("OutputBuffer", input);*/

        let pingPong = false;
        for (let i = 0; i < logSize; ++i) {
            pingPong = !pingPong;

            this._params.updateInt("Step", i);
            this._params.update();

            this._horizontalStepIFFT[0].setTexture("InputBuffer", pingPong ? input : buffer, false);
            this._horizontalStepIFFT[0].setStorageTexture("OutputBuffer", pingPong ? buffer : input);

            ComputeHelper.Dispatch(this._horizontalStepIFFT[0], this._size, this._size, 1);

            //ComputeHelper.Dispatch(pingPong ? this._horizontalStepIFFT[0] : this._horizontalStepIFFT[1], this._size, this._size, 1);
        }

        /*this._verticalStepIFFT[0].setTexture("InputBuffer", pingPong ? buffer : input, false);
        this._verticalStepIFFT[0].setStorageTexture("OutputBuffer", pingPong ? input : buffer);
        this._verticalStepIFFT[1].setTexture("InputBuffer", pingPong ? input : buffer, false);
        this._verticalStepIFFT[1].setStorageTexture("OutputBuffer", pingPong ? buffer : input);*/

        for (let i = 0; i < logSize; ++i) {
            pingPong = !pingPong;

            this._params.updateInt("Step", i);
            this._params.update();

            this._verticalStepIFFT[0].setTexture("InputBuffer", pingPong ? input : buffer, false);
            this._verticalStepIFFT[0].setStorageTexture("OutputBuffer", pingPong ? buffer : input);

            ComputeHelper.Dispatch(this._verticalStepIFFT[0], this._size, this._size, 1);

            //ComputeHelper.Dispatch(pingPong ? this._verticalStepIFFT[0] : this._verticalStepIFFT[1], this._size, this._size, 1);
        }

        if (pingPong) {
            ComputeHelper.CopyTexture(buffer, input, this._engine);
        }

        this._permute.setTexture("InputBuffer", input, false);
        this._permute.setStorageTexture("OutputBuffer", buffer);

        ComputeHelper.Dispatch(this._permute, this._size, this._size, 1);

        ComputeHelper.CopyTexture(buffer, input, this._engine);
    }

    public dispose(): void {
        this._precomputedData.dispose();
        this._params.dispose();
    }

    private _createComputeShaders(): void {
        for (let i = 0; i < 2; ++i) {
            this._horizontalStepIFFT[i] = new BABYLON.ComputeShader("horizontalStepIFFT", this._engine, { computeSource: fftInverseFFTCS }, {
                bindingsMapping: {
                    "params": { group: 0, binding: 1 },
                    "PrecomputedData": { group: 0, binding: 3 },
                    "InputBuffer": { group: 0, binding: 5 },
                    "OutputBuffer": { group: 0, binding: 6 },
                },
                entryPoint: "horizontalStepInverseFFT"
            });

            this._horizontalStepIFFT[i].setUniformBuffer("params", this._params);
            this._horizontalStepIFFT[i].setTexture("PrecomputedData", this._precomputedData, false);

            this._verticalStepIFFT[i] = new BABYLON.ComputeShader("verticalStepIFFT", this._engine, { computeSource: fftInverseFFT2CS }, {
                bindingsMapping: {
                    "params": { group: 0, binding: 1 },
                    "PrecomputedData": { group: 0, binding: 3 },
                    "InputBuffer": { group: 0, binding: 5 },
                    "OutputBuffer": { group: 0, binding: 6 },
                },
                entryPoint: "verticalStepInverseFFT"
            });

            this._verticalStepIFFT[i].setUniformBuffer("params", this._params);
            this._verticalStepIFFT[i].setTexture("PrecomputedData", this._precomputedData, false);
        }

        this._permute = new BABYLON.ComputeShader("permute", this._engine, { computeSource: fftInverseFFT3CS }, {
            bindingsMapping: {
                "InputBuffer": { group: 0, binding: 5 },
                "OutputBuffer": { group: 0, binding: 6 },
            },
            entryPoint: "permute"
        });
    }
}
