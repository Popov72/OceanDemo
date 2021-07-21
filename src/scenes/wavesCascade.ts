import * as BABYLON from "@babylonjs/core";
import { InitialSpectrum } from "./initialSpectrum";
import { RTTDebug } from "./RTTDebug";
import { ComputeHelper } from "./computeHelper";
import { WavesSettings } from "./wavesSettings";
import { FFT } from "./fft";

import timeDependentSpectrumCS from "../../assets/ocean/timeDependentSpectrum.wgsl";

export class WavesCascade {

    private _engine: BABYLON.Engine;
    private _size: number;
    private _fft: FFT;
    private _initialSpectrum: InitialSpectrum;
    private _timeDependentSpectrum: BABYLON.ComputeShader;
    private _params: BABYLON.UniformBuffer;
    private _buffer: BABYLON.BaseTexture;
    private _DxDz: BABYLON.BaseTexture;
    private _DyDxz: BABYLON.BaseTexture;
    private _DyxDyz: BABYLON.BaseTexture;
    private _DxxDzz: BABYLON.BaseTexture;

    constructor(size: number, gaussianNoise: BABYLON.BaseTexture, fft: FFT, rttDebug: RTTDebug, debugFirstIndex: number, engine: BABYLON.Engine) {
        this._engine = engine;
        this._size = size;
        this._fft = fft;

        this._initialSpectrum = new InitialSpectrum(engine, rttDebug, debugFirstIndex, size, gaussianNoise);

        this._timeDependentSpectrum = new BABYLON.ComputeShader("timeDependentSpectrumCS", this._engine, { computeSource: timeDependentSpectrumCS }, {
            bindingsMapping: {
                "H0": { group: 0, binding: 1 },
                "WavesData": { group: 0, binding: 3 },
                "params": { group: 0, binding: 4 },
                "DxDz": { group: 0, binding: 5 },
                "DyDxz": { group: 0, binding: 6 },
                "DyxDyz": { group: 0, binding: 7 },
                "DxxDzz": { group: 0, binding: 8 },
            },
            entryPoint: "calculateAmplitudes"
        });

        this._buffer = ComputeHelper.CreateStorageTexture("buffer", this._engine, this._size, this._size, BABYLON.Constants.TEXTUREFORMAT_RG);

        this._DxDz = ComputeHelper.CreateStorageTexture("DxDz_DyDxz", this._engine, this._size, this._size, BABYLON.Constants.TEXTUREFORMAT_RG);
        this._DyDxz = ComputeHelper.CreateStorageTexture("DxDz_DyDxz", this._engine, this._size, this._size, BABYLON.Constants.TEXTUREFORMAT_RG);
        this._DyxDyz = ComputeHelper.CreateStorageTexture("DyxDyz_DxxDzz", this._engine, this._size, this._size, BABYLON.Constants.TEXTUREFORMAT_RG);
        this._DxxDzz = ComputeHelper.CreateStorageTexture("DyxDyz_DxxDzz", this._engine, this._size, this._size, BABYLON.Constants.TEXTUREFORMAT_RG);

        this._params = new BABYLON.UniformBuffer(this._engine);

        this._params.addUniform("Time", 1);

        this._timeDependentSpectrum.setTexture("H0", this._initialSpectrum.initialSpectrum);
        this._timeDependentSpectrum.setTexture("WavesData", this._initialSpectrum.wavesData);
        this._timeDependentSpectrum.setUniformBuffer("params", this._params);
        this._timeDependentSpectrum.setStorageTexture("DxDz", this._DxDz);
        this._timeDependentSpectrum.setStorageTexture("DyDxz", this._DyDxz);
        this._timeDependentSpectrum.setStorageTexture("DyxDyz", this._DyxDyz);
        this._timeDependentSpectrum.setStorageTexture("DxxDzz", this._DxxDzz);

        rttDebug.setTexture(debugFirstIndex + 3, "DxDz", this._DxDz, 1000);
        rttDebug.setTexture(debugFirstIndex + 4, "DyDxz", this._DyDxz, 1000);
        rttDebug.setTexture(debugFirstIndex + 5, "DyxDyz", this._DyxDyz, 3000);
        rttDebug.setTexture(debugFirstIndex + 6, "DxxDzz", this._DxxDzz, 3000);
    }

    public calculateInitials(wavesSettings: WavesSettings, lengthScale: number, cutoffLow: number, cutoffHigh: number): void {
        this._initialSpectrum.generate(wavesSettings, lengthScale, cutoffLow, cutoffHigh);
    }

    public calculateWavesAtTime(time: number): void {
        // Calculating complex amplitudes
        this._params.updateFloat("Time", time);
        this._params.update();

        ComputeHelper.Dispatch(this._timeDependentSpectrum, this._size, this._size, 1);

        // Calculating IFFTs of complex amplitudes
        //this._fft.IFFT2D(this._DxDz_DyDxz, this._buffer, true, false, true);
        //this._fft.IFFT2D(this._DyxDyz_DxxDzz, this._buffer, true, false, true);
    }

    public dispose(): void {
        this._initialSpectrum.dispose();
        this._buffer.dispose();
        this._DxDz.dispose();
        this._DyDxz.dispose();
        this._DyxDyz.dispose();
        this._DxxDzz.dispose();
    }
}