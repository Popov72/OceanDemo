import * as BABYLON from "@babylonjs/core";
import initialSpectrumCS from "../assets/ocean/initialSpectrum.wgsl";
import initialSpectrum2CS from "../assets/ocean/initialSpectrum2.wgsl";
import { ComputeHelper } from "./tools/computeHelper";
import { RTTDebug } from "./tools/RTTDebug";
import { WavesSettings } from "./wavesSettings";


export class InitialSpectrum {

    private _engine: BABYLON.Engine;
    private _rttDebug: RTTDebug;
    private _debugFirstIndex: number;
    private _textureSize: number;

    private _phase1: BABYLON.ComputeShader;
    private _spectrumParameters: BABYLON.StorageBuffer;
    private _params: BABYLON.UniformBuffer;
    private _precomputedData: BABYLON.BaseTexture;
    private _buffer: BABYLON.BaseTexture;

    private _phase2: BABYLON.ComputeShader;
    private _initialSpectrum: BABYLON.BaseTexture;

    public get initialSpectrum() {
        return this._initialSpectrum;
    }

    public get wavesData() {
        return this._precomputedData;
    }

    constructor(engine: BABYLON.Engine, rttDebug: RTTDebug, debugFirstIndex: number, textureSize: number, noise: BABYLON.BaseTexture) {
        this._engine = engine;
        this._rttDebug = rttDebug;
        this._debugFirstIndex = debugFirstIndex;
        this._textureSize = textureSize;

        this._phase1 = new BABYLON.ComputeShader("initialSpectrum", this._engine, { computeSource: initialSpectrumCS }, {
            bindingsMapping: {
                "WavesData": { group: 0, binding: 1 },
                "H0K": { group: 0, binding: 2 },
                "Noise": { group: 0, binding: 4 },
                "params": { group: 0, binding: 5 },
                "spectrumParameters": { group: 0, binding: 6 },
            },
            entryPoint: "calculateInitialSpectrum"
        });

        this._initialSpectrum = ComputeHelper.CreateStorageTexture("h0", engine, textureSize, textureSize, BABYLON.Constants.TEXTUREFORMAT_RGBA);
        this._precomputedData = ComputeHelper.CreateStorageTexture("wavesData", engine, textureSize, textureSize, BABYLON.Constants.TEXTUREFORMAT_RGBA);
        this._buffer = ComputeHelper.CreateStorageTexture("h0k", engine, textureSize, textureSize, BABYLON.Constants.TEXTUREFORMAT_RG);

        this._spectrumParameters = new BABYLON.StorageBuffer(this._engine, 8 * 2 * 4, BABYLON.Constants.BUFFER_CREATIONFLAG_READWRITE);

        this._params = new BABYLON.UniformBuffer(this._engine);

        this._params.addUniform("Size", 1);
        this._params.addUniform("LengthScale", 1);
        this._params.addUniform("CutoffHigh", 1);
        this._params.addUniform("CutoffLow", 1);
        this._params.addUniform("GravityAcceleration", 1);
        this._params.addUniform("Depth", 1);

        this._phase1.setStorageTexture("WavesData", this._precomputedData);
        this._phase1.setStorageTexture("H0K", this._buffer);
        this._phase1.setTexture("Noise", noise, false);
        this._phase1.setStorageBuffer("spectrumParameters", this._spectrumParameters);
        this._phase1.setUniformBuffer("params", this._params);

        this._phase2 = new BABYLON.ComputeShader("initialSpectrum2", this._engine, { computeSource: initialSpectrum2CS }, {
            bindingsMapping: {
                "H0": { group: 0, binding: 0 },
                "params": { group: 0, binding: 5 },
                "H0K": { group: 0, binding: 8 },
            },
            entryPoint: "calculateConjugatedSpectrum"
        });

        this._phase2.setStorageTexture("H0", this._initialSpectrum);
        this._phase2.setUniformBuffer("params", this._params);
        this._phase2.setTexture("H0K", this._buffer, false);

        this._rttDebug.setTexture(this._debugFirstIndex + 0, "waves precompute", this._precomputedData);
        this._rttDebug.setTexture(this._debugFirstIndex + 1, "H0K", this._buffer, 1000);
        this._rttDebug.setTexture(this._debugFirstIndex + 2, "H0", this._initialSpectrum, 1000);
    }

    public generate(wavesSettings: WavesSettings, lengthScale: number, cutoffLow: number, cutoffHigh: number): void {
        this._params.updateInt("Size", this._textureSize);
        this._params.updateFloat("LengthScale", lengthScale);
        this._params.updateFloat("CutoffHigh", cutoffHigh);
        this._params.updateFloat("CutoffLow", cutoffLow);

        wavesSettings.setParametersToShader(this._params, this._spectrumParameters);

        this._params.update();

        ComputeHelper.Dispatch(this._phase1, this._textureSize, this._textureSize, 1);
        ComputeHelper.Dispatch(this._phase2, this._textureSize, this._textureSize, 1);
    }

    public dispose(): void {
        this._spectrumParameters.dispose();
        this._params.dispose();
        this._precomputedData.dispose();
        this._buffer.dispose();
        this._initialSpectrum.dispose();
        this._phase1 = null as any;
        this._phase2 = null as any;
    }
}