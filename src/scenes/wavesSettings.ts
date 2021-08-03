import * as BABYLON from "@babylonjs/core";

export interface DisplaySpectrumSettings {
    //[Range(0, 1)]
    scale: number;
    windSpeed: number;
    windDirection: number;
    fetch: number;
    //[Range(0, 1)]
    spreadBlend: number;
    //[Range(0, 1)]
    swell: number;
    peakEnhancement: number;
    shortWavesFade: number;
}

interface SpectrumSettings {
    scale: number;
    angle: number;
    spreadBlend: number;
    swell: number;
    alpha: number;
    peakOmega: number;
    gamma: number;
    shortWavesFade: number;
}

export class WavesSettings {

    public g = 9.81;
    public depth = 500;

    //[Range(0, 1)]
    public lambda = 1;
    public local: DisplaySpectrumSettings = {
        scale: 1,
        windSpeed: 2.5,
        windDirection: -29.81,
        fetch: 100000,
        spreadBlend: 1,
        swell: 0.198,
        peakEnhancement: 3.3,
        shortWavesFade: 0.01,
    };
    public swell: DisplaySpectrumSettings = {
        scale: 0,
        windSpeed: 1,
        windDirection: 0,
        fetch: 300000,
        spreadBlend: 1,
        swell: 1,
        peakEnhancement: 3.3,
        shortWavesFade: 0.01,
    };

    private spectrums: SpectrumSettings[] = [{
        scale: 0,
        angle: 0,
        spreadBlend: 0,
        swell: 0,
        alpha: 0,
        peakOmega: 0,
        gamma: 0,
        shortWavesFade: 0,
    }, {
        scale: 0,
        angle: 0,
        spreadBlend: 0,
        swell: 0,
        alpha: 0,
        peakOmega: 0,
        gamma: 0,
        shortWavesFade: 0,
    }];

    public setParametersToShader(params: BABYLON.UniformBuffer, spectrumParameters: BABYLON.StorageBuffer): void {
        params.updateFloat("GravityAcceleration", this.g);
        params.updateFloat("Depth", this.depth);

        this._fillSettingsStruct(this.local, this.spectrums[0]);
        this._fillSettingsStruct(this.swell, this.spectrums[1]);

        const buffer: number[] = [];
        this._linearizeSpectrumSetting(this.spectrums[0], buffer);
        this._linearizeSpectrumSetting(this.spectrums[1], buffer);
        
        spectrumParameters.update(buffer);
    }

    private _linearizeSpectrumSetting(spectrum: SpectrumSettings, buffer: number[]): void {
        buffer.push(
            spectrum.scale,
            spectrum.angle,
            spectrum.spreadBlend,
            spectrum.swell,
            spectrum.alpha,
            spectrum.peakOmega,
            spectrum.gamma,
            spectrum.shortWavesFade,
        );
    }

    private _fillSettingsStruct(display: DisplaySpectrumSettings, settings: SpectrumSettings): void {
        settings.scale = display.scale;
        settings.angle = display.windDirection / 180 * Math.PI;
        settings.spreadBlend = display.spreadBlend;
        settings.swell = BABYLON.Scalar.Clamp(display.swell, 0.01, 1);
        settings.alpha = this._JonswapAlpha(this.g, display.fetch, display.windSpeed);
        settings.peakOmega = this._JonswapPeakFrequency(this.g, display.fetch, display.windSpeed);
        settings.gamma = display.peakEnhancement;
        settings.shortWavesFade = display.shortWavesFade;
    }

    private _JonswapAlpha(g: number, fetch: number, windSpeed: number): number {
        return 0.076 * Math.pow(g * fetch / windSpeed / windSpeed, -0.22);
    }

    private _JonswapPeakFrequency(g: number, fetch: number, windSpeed: number): number {
        return 22 * Math.pow(windSpeed * fetch / g / g, -0.33);
    }    
}
