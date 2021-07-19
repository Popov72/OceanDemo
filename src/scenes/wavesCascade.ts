import * as BABYLON from "@babylonjs/core";
import { InitialSpectrum } from "./initialSpectrum";
import { RTTDebug } from "./RTTDebug";
import { ComputeHelper } from "./computeHelper";
import { WavesSettings } from "./wavesSettings";

import timeDependentSpectrumCS from "../../assets/ocean/timeDependentSpectrum.wgsl";

export class WavesCascade {

    private _engine: BABYLON.Engine;
    private _size: number;
    private _initialSpectrum: InitialSpectrum;
    private _timeDependentSpectrum: BABYLON.ComputeShader;
    private _params: BABYLON.UniformBuffer;
    private _DxDz_DyDxz: BABYLON.BaseTexture;
    private _DyxDyz_DxxDzz: BABYLON.BaseTexture;

    constructor(size: number, gaussianNoise: BABYLON.BaseTexture, rttDebug: RTTDebug, debugFirstIndex: number, engine: BABYLON.Engine) {
        this._engine = engine;
        this._size = size;
        this._initialSpectrum = new InitialSpectrum(engine, rttDebug, debugFirstIndex, size, gaussianNoise);

        this._timeDependentSpectrum = new BABYLON.ComputeShader("timeDependentSpectrumCS", this._engine, { computeSource: timeDependentSpectrumCS }, {
            bindingsMapping: {
                "H0": { group: 0, binding: 1 },
                "WavesData": { group: 0, binding: 3 },
                "params": { group: 0, binding: 4 },
                "DxDz_DyDxz": { group: 0, binding: 5 },
                "DyxDyz_DxxDzz": { group: 0, binding: 6 },
            },
            entryPoint: "calculateAmplitudes"
        });

        this._DxDz_DyDxz = ComputeHelper.CreateStorageTexture("DxDz_DyDxz", this._engine, this._size, this._size, BABYLON.Constants.TEXTUREFORMAT_RGBA);
        this._DyxDyz_DxxDzz = ComputeHelper.CreateStorageTexture("DyxDyz_DxxDzz", this._engine, this._size, this._size, BABYLON.Constants.TEXTUREFORMAT_RGBA);

        this._params = new BABYLON.UniformBuffer(this._engine);

        this._params.addUniform("Time", 1);

        this._timeDependentSpectrum.setTexture("H0", this._initialSpectrum.initialSpectrum);
        this._timeDependentSpectrum.setTexture("WavesData", this._initialSpectrum.wavesData);
        this._timeDependentSpectrum.setUniformBuffer("params", this._params);
        this._timeDependentSpectrum.setStorageTexture("DxDz_DyDxz", this._DxDz_DyDxz);
        this._timeDependentSpectrum.setStorageTexture("DyxDyz_DxxDzz", this._DyxDyz_DxxDzz);

        rttDebug.setTexture(debugFirstIndex + 3, "DxDz / DyDxz", this._DxDz_DyDxz, 1000);
        rttDebug.setTexture(debugFirstIndex + 4, "DyxDyz / DxxDzz", this._DyxDyz_DxxDzz, 1000);
    }

    public calculateInitials(wavesSettings: WavesSettings, lengthScale: number, cutoffLow: number, cutoffHigh: number): void {
        this._initialSpectrum.generate(wavesSettings, lengthScale, cutoffLow, cutoffHigh);
    }

    public calculateWavesAtTime(time: number): void {
        this._params.updateFloat("Time", time);

        this._params.update();

        ComputeHelper.Dispatch(this._timeDependentSpectrum, this._size, this._size, 1);
    }

    public dispose(): void {
        this._initialSpectrum.dispose();
        this._DxDz_DyDxz.dispose();
        this._DyxDyz_DxxDzz.dispose();
    }
}