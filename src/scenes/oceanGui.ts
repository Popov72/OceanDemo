import * as BABYLON from "@babylonjs/core";

declare var dat: any;

export class OceanGUI {

    private _gui: any;
    private _visible: boolean;
    private _scene: BABYLON.Scene;
    private _paramRead: (name: string) => any;
    private _paramChanged: (name: string, value: any) => void;

    public static LoadDAT(): Promise<void> {
        return BABYLON.Tools.LoadScriptAsync("https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.6.2/dat.gui.min.js");
    }

    constructor(hasProceduralSky: boolean, scene: BABYLON.Scene, engine: BABYLON.Engine, paramRead: (name: string) => any, paramChanged: (name: string, value: any) => void) {
        this._scene = scene;
        this._visible = true;
        this._paramRead = paramRead;
        this._paramChanged = paramChanged;

        const oldgui = document.getElementById("datGUI");
        if (oldgui !== null) {
            oldgui.remove();
        }
    
        this._gui = new dat.GUI();
        this._gui.domElement.style.marginTop = "50px";
        this._gui.domElement.id = "datGUI";

        this._setupKeyboard();
        this._initialize(hasProceduralSky);
    }

    private _setupKeyboard(): void {
        this._scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    //console.log("KEY DOWN: ", kbInfo.event.key);
                    break;
                case BABYLON.KeyboardEventTypes.KEYUP:
                    switch (kbInfo.event.key) {
                        case "F8": {
                            this._visible = !this._visible;
                            this._gui.domElement.style.display = this._visible ? "" : "none";
                            break;
                        }
                    }
                    console.log("KEY UP: ", kbInfo.event.key, kbInfo.event.keyCode);
                    break;
            }
        });
    }

    private _initialize(hasProceduralSky: boolean): void {
        this._makeMenuGeneral();

        if (hasProceduralSky) {
            this._makeMenuProceduralSky();
        }

        this._makeMenuWavesGenerator();

        const geometry = this._gui.addFolder("Ocean Geometry");

        const shader = this._gui.addFolder("Ocean Shader");

        this._makeMenuBuoyancy();
    }

    private _addList(menu: any, params: any, name: string, friendlyName: string, list: any[]): void {
        menu.add(params, name, list)
            .name(friendlyName)
            .onChange((value: any) => {
                this._paramChanged(name, value);
            });
    }

    private _addCheckbox(menu: any, params: any, name: string, friendlyName: string): void {
        menu.add(params, name)
            .name(friendlyName)
            .onChange((value: any) => {
                this._paramChanged(name, value);
            });
    }

    private _addSlider(menu: any, params: any, name: string, friendlyName: string, min: number, max: number, step: number): void {
        menu.add(params, name, min, max, step)
            .name(friendlyName)
            .onChange((value: any) => {
                this._paramChanged(name, value);
            });
    }

    private _makeMenuGeneral(): void {
        const params = {
            size: this._paramRead("size"),
            envIntensity: this._paramRead("envIntensity"),
            lightIntensity: this._paramRead("lightIntensity"),
            enableFXAA: this._paramRead("enableFXAA"),
            useZQSD: this._paramRead("useZQSD"),
            showDebugRTT: this._paramRead("showDebugRTT"),
        };
        
        const general = this._gui.addFolder("General");

        this._addList(general, params, "size", "Resolution", [256, 128, 64, 32]);
        this._addSlider(general, params, "envIntensity", "Env intensity", 0, 4, 0.05);
        this._addSlider(general, params, "lightIntensity", "Light intensity", 0, 5, 0.05);
        this._addCheckbox(general, params, "enableFXAA", "Enable FXAA");
        this._addCheckbox(general, params, "useZQSD", "Use ZQSD");
        this._addCheckbox(general, params, "showDebugRTT", "Show debug RTT");

        general.open();
    }

    private _makeMenuProceduralSky(): void {
        const params = {
            procSky_inclination: this._paramRead("procSky_inclination"),
            procSky_azimuth: this._paramRead("procSky_azimuth"),
            procSky_luminance: this._paramRead("procSky_luminance"),
            procSky_turbidity: this._paramRead("procSky_turbidity"),
            procSky_rayleigh: this._paramRead("procSky_rayleigh"),
            procSky_mieCoefficient: this._paramRead("procSky_mieCoefficient"),
            procSky_mieDirectionalG: this._paramRead("procSky_mieDirectionalG"),
        };
        
        const proceduralSky = this._gui.addFolder("Procedural Sky");

        this._addSlider(proceduralSky, params, "procSky_inclination", "Inclination", -0.5, 0.5, 0.001);
        this._addSlider(proceduralSky, params, "procSky_azimuth", "Azimuth", 0.0, 1, 0.001);
        this._addSlider(proceduralSky, params, "procSky_luminance", "Luminance", 0.001, 1, 0.001);
        this._addSlider(proceduralSky, params, "procSky_turbidity", "Turbidity", 0.1, 100, 0.1);
        this._addSlider(proceduralSky, params, "procSky_rayleigh", "Rayleigh", 0.1, 10, 0.1);
        this._addSlider(proceduralSky, params, "procSky_mieCoefficient", "Mie Coefficient", 0.0, 0.1, 0.0001);
        this._addSlider(proceduralSky, params, "procSky_mieDirectionalG", "Mie DirectionalG", 0.0, 1, 0.01);
    }

    private _makeMenuWavesGenerator(): void {
        const params = {
            waves_g: this._paramRead("waves_g"),
            waves_depth: this._paramRead("waves_depth"),
            waves_lambda: this._paramRead("waves_lambda"),

            waves_local_scale: this._paramRead("waves_local_scale"),
            waves_local_windSpeed: this._paramRead("waves_local_windSpeed"),
            waves_local_windDirection: this._paramRead("waves_local_windDirection"),
            waves_local_fetch: this._paramRead("waves_local_fetch"),
            waves_local_spreadBlend: this._paramRead("waves_local_spreadBlend"),
            waves_local_swell: this._paramRead("waves_local_swell"),
            waves_local_peakEnhancement: this._paramRead("waves_local_peakEnhancement"),
            waves_local_shortWavesFade: this._paramRead("waves_local_shortWavesFade"),

            waves_swell_scale: this._paramRead("waves_swell_scale"),
            waves_swell_windSpeed: this._paramRead("waves_swell_windSpeed"),
            waves_swell_windDirection: this._paramRead("waves_swell_windDirection"),
            waves_swell_fetch: this._paramRead("waves_swell_fetch"),
            waves_swell_spreadBlend: this._paramRead("waves_swell_spreadBlend"),
            waves_swell_swell: this._paramRead("waves_swell_swell"),
            waves_swell_peakEnhancement: this._paramRead("waves_swell_peakEnhancement"),
            waves_swell_shortWavesFade: this._paramRead("waves_swell_shortWavesFade"),
        };
        
        const wavesGenerator = this._gui.addFolder("Waves Generator");

        this._addSlider(wavesGenerator, params, "waves_g", "Gravity", 0.01, 30, 0.01);
        this._addSlider(wavesGenerator, params, "waves_depth", "Ocean depth", 0.001, 3, 0.001);
        this._addSlider(wavesGenerator, params, "waves_lambda", "Lambda", 0.0, 1, 0.001);

        const local = wavesGenerator.addFolder("Local");

        this._addSlider(local, params, "waves_local_scale", "Scale", 0.0, 1, 0.001);
        this._addSlider(local, params, "waves_local_windSpeed", "Wind speed", 0.001, 100, 0.001);
        this._addSlider(local, params, "waves_local_windDirection", "Wind direction", -100.0, 100, 0.1);
        this._addSlider(local, params, "waves_local_fetch", "Fetch", 100, 1000000, 100);
        this._addSlider(local, params, "waves_local_spreadBlend", "Spread blend", 0, 1, 0.01);
        this._addSlider(local, params, "waves_local_swell", "Swell", 0, 1, 0.01);
        this._addSlider(local, params, "waves_local_peakEnhancement", "Peak enhanc.", 0.01, 100, 0.01);
        this._addSlider(local, params, "waves_local_shortWavesFade", "Short waves fade", 0.001, 1, 0.001);

        local.open();

        const swell = wavesGenerator.addFolder("Swell");

        this._addSlider(swell, params, "waves_swell_scale", "Scale", 0.0, 1, 0.001);
        this._addSlider(swell, params, "waves_swell_windSpeed", "Wind speed", 0.001, 100, 0.001);
        this._addSlider(swell, params, "waves_swell_windDirection", "Wind direction", -100.0, 100, 0.1);
        this._addSlider(swell, params, "waves_swell_fetch", "Fetch", 100, 1000000, 100);
        this._addSlider(swell, params, "waves_swell_spreadBlend", "Spread blend", 0, 1, 0.01);
        this._addSlider(swell, params, "waves_swell_swell", "Swell", 0, 1, 0.01);
        this._addSlider(swell, params, "waves_swell_peakEnhancement", "Peak enhanc.", 0.01, 100, 0.01);
        this._addSlider(swell, params, "waves_swell_shortWavesFade", "Short waves fade", 0.001, 1, 0.001);

        swell.open();

        wavesGenerator.open();
    }

    private _makeMenuBuoyancy(): void {
        const params = {
            buoy_enabled: this._paramRead("buoy_enabled"),
            buoy_attenuation: this._paramRead("buoy_attenuation"),
            buoy_numSteps: this._paramRead("buoy_numSteps"),
        };
        
        const buoyancy = this._gui.addFolder("Buoyancy");

        this._addCheckbox(buoyancy, params, "buoy_enabled", "Enabled");
        this._addSlider(buoyancy, params, "buoy_attenuation", "Dampen factor", 0, 1, 0.001);
        this._addSlider(buoyancy, params, "buoy_numSteps", "Num steps", 1, 20, 1);
    }
}
