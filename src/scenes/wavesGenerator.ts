import * as BABYLON from "@babylonjs/core";
import { FFT } from "./fft";
import { RTTDebug } from "./RTTDebug";
import { WavesCascade } from "./wavesCascade";
import { WavesSettings } from "./wavesSettings";

export class WavesGenerator {
    public wavesSettings: WavesSettings;
    public lengthScale: number[];

    private _engine: BABYLON.Engine;
    private _startTime: number;
    private _size: number;
    private _rttDebug: RTTDebug;
    private _fft: FFT;
    private _noise: BABYLON.Texture;
    private _cascades: WavesCascade[];

    constructor(size: number, scene: BABYLON.Scene, rttDebug: RTTDebug) {
        this._engine = scene.getEngine();
        this._size = size;
        this._rttDebug = rttDebug;
        this._startTime = new Date().getTime() / 1000;

        this._fft = new FFT(scene.getEngine(), scene, this._rttDebug, 1, size);
        this._noise = this._generateNoiseTexture(size);

        this._rttDebug.setTexture(0, "noise", this._noise);

        //this.lengthScale = [250, 17, 5];
        this.lengthScale = [250];
        this.wavesSettings = new WavesSettings();

        this._cascades = [
            new WavesCascade(size, this._noise, this._rttDebug, 2, this._engine),
        ];

        this.initializeCascades();
    }

    public initializeCascades(): void {
        let boundary1 = 0.0001;
        for (let i = 0; i < this.lengthScale.length; ++i) {
            let boundary2 = i < this.lengthScale.length - 1 ?  2 * Math.PI / this.lengthScale[i + 1] * 6 : 9999;
            this._cascades[i].calculateInitials(this.wavesSettings, this.lengthScale[i], boundary1, boundary2);
            boundary1 = boundary2;
        }
    }

    public update(): void {
        const time = (new Date().getTime() / 1000) - this._startTime;
        for (let i = 0; i < this._cascades.length; ++i) {
            this._cascades[i].calculateWavesAtTime(time);
        }
    }

    public dispose(): void {
        for (let i = 0; i < this._cascades.length; ++i) {
            this._cascades[i].dispose();
        }
        this._noise.dispose();
        this._fft.dispose();
    }

    private _normalRandom(): number {
        return Math.cos(2 * Math.PI * Math.random()) * Math.sqrt(-2 * Math.log(Math.random()));
    }

    private _generateNoiseTexture(size: number): BABYLON.Texture {
        const data = new Float32Array(size * size * 4);
        for (let i = 0; i < size; ++i) {
            for (let j = 0; j < size; ++j) {
                data[j * size * 2 + i * 2 + 0] = this._normalRandom();
                data[j * size * 2 + i * 2 + 1] = this._normalRandom();
            }
        }

        const noise = new BABYLON.RawTexture(data, size, size, BABYLON.Constants.TEXTUREFORMAT_RG, this._engine, false, false, BABYLON.Constants.TEXTURE_NEAREST_SAMPLINGMODE, BABYLON.Constants.TEXTURETYPE_FLOAT);
        noise.name = "noise";

        return noise;
    }
}