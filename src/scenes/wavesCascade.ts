import * as BABYLON from "@babylonjs/core";
import timeDependentSpectrumCS from "../assets/ocean/timeDependentSpectrum.wgsl";
import wavesTexturesMergerCS from "../assets/ocean/wavesTexturesMerger.wgsl";
import { FFT } from "./fft";
import { InitialSpectrum } from "./initialSpectrum";
import { ComputeHelper } from "./tools/computeHelper";
import { RTTDebug } from "./tools/RTTDebug";
import { WavesSettings } from "./wavesSettings";


export class WavesCascade {

    private _engine: BABYLON.Engine;
    private _size: number;
    private _fft: FFT;
    private _initialSpectrum: InitialSpectrum;
    private _lambda: number;

    private _timeDependentSpectrum: BABYLON.ComputeShader;
    private _timeDependentSpectrumParams: BABYLON.UniformBuffer;
    private _buffer: BABYLON.BaseTexture;
    private _DxDz: BABYLON.BaseTexture;
    private _DyDxz: BABYLON.BaseTexture;
    private _DyxDyz: BABYLON.BaseTexture;
    private _DxxDzz: BABYLON.BaseTexture;

    private _texturesMerger: BABYLON.ComputeShader;
    private _texturesMergerParams: BABYLON.UniformBuffer;
    private _displacement: BABYLON.BaseTexture;
    private _derivatives: BABYLON.BaseTexture;
    private _turbulence: BABYLON.BaseTexture;
    private _turbulence2: BABYLON.BaseTexture;
    private _pingPongTurbulence: boolean;

    public get displacement() {
        return this._displacement;
    }

    public get derivatives() {
        return this._derivatives;
    }

    public get turbulence() {
        return this._pingPongTurbulence ? this._turbulence2 : this._turbulence;
    }

    constructor(size: number, gaussianNoise: BABYLON.BaseTexture, fft: FFT, rttDebug: RTTDebug, debugFirstIndex: number, engine: BABYLON.Engine) {
        this._engine = engine;
        this._size = size;
        this._fft = fft;
        this._lambda = 0;
        this._pingPongTurbulence = false;

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

        this._DxDz = ComputeHelper.CreateStorageTexture("DxDz", this._engine, this._size, this._size, BABYLON.Constants.TEXTUREFORMAT_RG);
        this._DyDxz = ComputeHelper.CreateStorageTexture("DyDxz", this._engine, this._size, this._size, BABYLON.Constants.TEXTUREFORMAT_RG);
        this._DyxDyz = ComputeHelper.CreateStorageTexture("DyxDyz", this._engine, this._size, this._size, BABYLON.Constants.TEXTUREFORMAT_RG);
        this._DxxDzz = ComputeHelper.CreateStorageTexture("DxxDzz", this._engine, this._size, this._size, BABYLON.Constants.TEXTUREFORMAT_RG);

        this._timeDependentSpectrumParams = new BABYLON.UniformBuffer(this._engine);

        this._timeDependentSpectrumParams.addUniform("Time", 1);

        this._timeDependentSpectrum.setTexture("H0", this._initialSpectrum.initialSpectrum, false);
        this._timeDependentSpectrum.setTexture("WavesData", this._initialSpectrum.wavesData, false);
        this._timeDependentSpectrum.setUniformBuffer("params", this._timeDependentSpectrumParams);
        this._timeDependentSpectrum.setStorageTexture("DxDz", this._DxDz);
        this._timeDependentSpectrum.setStorageTexture("DyDxz", this._DyDxz);
        this._timeDependentSpectrum.setStorageTexture("DyxDyz", this._DyxDyz);
        this._timeDependentSpectrum.setStorageTexture("DxxDzz", this._DxxDzz);

        rttDebug.setTexture(debugFirstIndex + 3, "DxDz", this._DxDz, 2);
        rttDebug.setTexture(debugFirstIndex + 4, "DyDxz", this._DyDxz, 2);
        rttDebug.setTexture(debugFirstIndex + 5, "DyxDyz", this._DyxDyz, 2);
        rttDebug.setTexture(debugFirstIndex + 6, "DxxDzz", this._DxxDzz, 2);
        //rttDebug.setTexture(debugFirstIndex + 7, "buffer", this._buffer, 2);

        this._texturesMerger = new BABYLON.ComputeShader("texturesMerger", this._engine, { computeSource: wavesTexturesMergerCS }, {
            bindingsMapping: {
                "params": { group: 0, binding: 0 },
                "Displacement": { group: 0, binding: 1 },
                "Derivatives": { group: 0, binding: 2 },
                "TurbulenceRead": { group: 0, binding: 3 },
                "TurbulenceWrite": { group: 0, binding: 4 },
                "DxDz": { group: 0, binding: 5 },
                "DyDxz": { group: 0, binding: 6 },
                "DyxDyz": { group: 0, binding: 7 },
                "DxxDzz": { group: 0, binding: 8 },
            },
            entryPoint: "fillResultTextures"
        });

        this._displacement = ComputeHelper.CreateStorageTexture("displacement", this._engine, this._size, this._size, BABYLON.Constants.TEXTUREFORMAT_RGBA, BABYLON.Constants.TEXTURETYPE_HALF_FLOAT, BABYLON.Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
        this._derivatives = ComputeHelper.CreateStorageTexture("derivatives", this._engine, this._size, this._size, BABYLON.Constants.TEXTUREFORMAT_RGBA, BABYLON.Constants.TEXTURETYPE_HALF_FLOAT, BABYLON.Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, true);
        this._turbulence = ComputeHelper.CreateStorageTexture("turbulence", this._engine, this._size, this._size, BABYLON.Constants.TEXTUREFORMAT_RGBA, BABYLON.Constants.TEXTURETYPE_HALF_FLOAT, BABYLON.Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, true);
        this._turbulence2 = ComputeHelper.CreateStorageTexture("turbulence", this._engine, this._size, this._size, BABYLON.Constants.TEXTUREFORMAT_RGBA, BABYLON.Constants.TEXTURETYPE_HALF_FLOAT, BABYLON.Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, true);

        this._texturesMergerParams = new BABYLON.UniformBuffer(this._engine);

        this._texturesMergerParams.addUniform("Lambda", 1);
        this._texturesMergerParams.addUniform("DeltaTime", 1);

        this._texturesMerger.setUniformBuffer("params", this._texturesMergerParams);
        this._texturesMerger.setStorageTexture("Displacement", this._displacement);
        this._texturesMerger.setStorageTexture("Derivatives", this._derivatives);
        this._texturesMerger.setTexture("DxDz", this._DxDz, false);
        this._texturesMerger.setTexture("DyDxz", this._DyDxz, false);
        this._texturesMerger.setTexture("DyxDyz", this._DyxDyz, false);
        this._texturesMerger.setTexture("DxxDzz", this._DxxDzz, false);

        rttDebug.setTexture(debugFirstIndex + 7, "displacement", this._displacement, 2);
        rttDebug.setTexture(debugFirstIndex + 8, "derivatives", this._derivatives, 2);
        rttDebug.setTexture(debugFirstIndex + 9, "turbulence", this._turbulence, 1);
    }

    public calculateInitials(wavesSettings: WavesSettings, lengthScale: number, cutoffLow: number, cutoffHigh: number): void {
        this._lambda = wavesSettings.lambda;
        this._initialSpectrum.generate(wavesSettings, lengthScale, cutoffLow, cutoffHigh);
    }

    public calculateWavesAtTime(time: number): void {
        // Calculating complex amplitudes
        this._timeDependentSpectrumParams.updateFloat("Time", time);
        this._timeDependentSpectrumParams.update();

        ComputeHelper.Dispatch(this._timeDependentSpectrum, this._size, this._size, 1);

        // Calculating IFFTs of complex amplitudes
        this._fft.IFFT2D(this._DxDz, this._buffer);
        this._fft.IFFT2D(this._DyDxz, this._buffer);
        this._fft.IFFT2D(this._DyxDyz, this._buffer);
        this._fft.IFFT2D(this._DxxDzz, this._buffer);

        // Filling displacement and normals textures
        let deltaTime = this._engine.getDeltaTime() / 1000;
        if (deltaTime > 0.5) {
            // avoid too big delta time
            deltaTime = 0.5;
        }
        this._texturesMergerParams.updateFloat("Lambda", this._lambda);
        this._texturesMergerParams.updateFloat("DeltaTime", deltaTime);
        this._texturesMergerParams.update();

        this._pingPongTurbulence = !this._pingPongTurbulence;

        this._texturesMerger.setTexture("TurbulenceRead", this._pingPongTurbulence ?  this._turbulence : this._turbulence2, false);
        this._texturesMerger.setStorageTexture("TurbulenceWrite", this._pingPongTurbulence ?  this._turbulence2 : this._turbulence);

        ComputeHelper.Dispatch(this._texturesMerger, this._size, this._size, 1);

        this._engine.generateMipmaps(this._derivatives.getInternalTexture()!);
        this._engine.generateMipmaps(this._pingPongTurbulence ?  this._turbulence2.getInternalTexture()! : this._turbulence.getInternalTexture()!);
    }

    public dispose(): void {
        this._initialSpectrum.dispose();
        this._timeDependentSpectrumParams.dispose();
        this._buffer.dispose();
        this._DxDz.dispose();
        this._DyDxz.dispose();
        this._DyxDyz.dispose();
        this._DxxDzz.dispose();
        this._texturesMergerParams.dispose();
    }
}