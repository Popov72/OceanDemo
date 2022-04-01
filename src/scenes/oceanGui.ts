import * as BABYLON from "@babylonjs/core";
import { Tools } from "@babylonjs/core/Misc/tools";
import GUI from 'lil-gui'; 

/*
async function LoadDAT(): Promise<void> {
    var _ = await import("@babylonjs/core/Misc/tools")
    return _.Tools.LoadScriptAsync("https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.6.2/dat.gui.min.js");
}
*/

export class OceanGUI {
    private _gui: any;
    private _visible: boolean;
    private _scene: BABYLON.Scene;
    private _paramRead: (name: string) => any;
    private _paramChanged: (name: string, value: any) => void;
    private _onKeyObserver: BABYLON.Nullable<BABYLON.Observer<BABYLON.KeyboardInfo>>;

    public static LoadDAT(): Promise<void> {
        return Tools.LoadScriptAsync("https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.6.2/dat.gui.min.js");
    }

    public set visible(v: boolean) {
        if (v === this._visible) {
            return;
        }
        this._visible = v;
        this._gui.domElement.style.display = v ? "" : "none";
    }

    constructor(hasProceduralSky: boolean, scene: BABYLON.Scene, engine: BABYLON.Engine, paramRead: (name: string) => any, paramChanged: (name: string, value: any) => void) {
        this._scene = scene;
        this._visible = true;
        this._onKeyObserver = null;
        this._paramRead = paramRead;
        this._paramChanged = paramChanged;

        const oldgui = document.getElementById("datGUI");
        if (oldgui !== null) {
            oldgui.remove();
        }
    
        this._gui = new GUI();
        this._gui.domElement.style.marginTop = "60px";
        this._gui.domElement.id = "datGUI";

        this._setupKeyboard();
        this._initialize(hasProceduralSky);
    }

    public dispose() {
        const oldgui = document.getElementById("datGUI");
        if (oldgui !== null) {
            oldgui.remove();
        }
        this._scene.onKeyboardObservable.remove(this._onKeyObserver);
    }

    private _setupKeyboard(): void {
        this._onKeyObserver = this._scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    //console.log("KEY DOWN: ", kbInfo.event.key);
                    break;
                case BABYLON.KeyboardEventTypes.KEYUP:
                    switch (kbInfo.event.key) {
                        case "F8": {
                            this.visible = !this._visible;
                            break;
                        }
                    }
                    //console.log("KEY UP: ", kbInfo.event.key, kbInfo.event.keyCode);
                    break;
            }
        });
    }

    private _initialize(hasProceduralSky: boolean): void {
        this._makeMenuGeneral();

        if (hasProceduralSky) {
            this._makeMenuProceduralSky();
        } else {
            this._makeMenuSkybox();
        }
 
        this._makeMenuWavesGenerator();
        this._makeMenuOceanGeometry()
        this._makeMenuOceanShader();

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

    private _addColor(menu: any, params: any, name: string, friendlyName: string): void {
        menu.addColor(params, name)
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
            //proceduralSky: this._paramRead("proceduralSky"),
            enableShadows: this._paramRead("enableShadows"),
            //enableFXAA: this._paramRead("enableFXAA"),
            enableGlow: this._paramRead("enableGlow"),
            useZQSD: this._paramRead("useZQSD"),
            showDebugRTT: this._paramRead("showDebugRTT"),
        };
        
        const general = this._gui.addFolder("General");

        this._addList(general, params, "size", "Resolution", [256, 128, 64, 32]);
        this._addSlider(general, params, "envIntensity", "Env intensity", 0, 4, 0.05);
        this._addSlider(general, params, "lightIntensity", "Light intensity", 0, 5, 0.05);
        //this._addCheckbox(general, params, "proceduralSky", "Procedural sky");
        this._addCheckbox(general, params, "enableShadows", "Enable shadows");
        //this._addCheckbox(general, params, "enableFXAA", "Enable FXAA");
        this._addCheckbox(general, params, "enableGlow", "Enable Glow layer");
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
        
        const proceduralSky = this._gui.addFolder("Sky");

        this._addSlider(proceduralSky, params, "procSky_inclination", "Inclination", -0.5, 0.5, 0.001);
        this._addSlider(proceduralSky, params, "procSky_azimuth", "Azimuth", 0.0, 1, 0.001);
        this._addSlider(proceduralSky, params, "procSky_luminance", "Luminance", 0.001, 1, 0.001);
        this._addSlider(proceduralSky, params, "procSky_turbidity", "Turbidity", 0.1, 100, 0.1);
        this._addSlider(proceduralSky, params, "procSky_rayleigh", "Rayleigh", 0.1, 10, 0.1);
        this._addSlider(proceduralSky, params, "procSky_mieCoefficient", "Mie Coefficient", 0.0, 0.1, 0.0001);
        this._addSlider(proceduralSky, params, "procSky_mieDirectionalG", "Mie DirectionalG", 0.0, 1, 0.01);

        proceduralSky.open();
    }

    private _makeMenuSkybox(): void {
        const params = {
            skybox_lightColor: this._paramRead("skybox_lightColor"),
            skybox_directionX: this._paramRead("skybox_directionX"),
            skybox_directionY: this._paramRead("skybox_directionY"),
            skybox_directionZ: this._paramRead("skybox_directionZ"),
        };
        
        const skybox = this._gui.addFolder("Sky");

        this._addColor(skybox, params, "skybox_lightColor", "Light color");
        this._addSlider(skybox, params, "skybox_directionX", "Light dir X", -10, 10, 0.001);
        this._addSlider(skybox, params, "skybox_directionY", "Light dir Y", -10, -0.01, 0.001);
        this._addSlider(skybox, params, "skybox_directionZ", "Light dir Z", -10, 10, 0.001);
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

    private _makeMenuOceanGeometry(): void {
        const params = {
            oceangeom_lengthScale: this._paramRead("oceangeom_lengthScale"),
            oceangeom_vertexDensity: this._paramRead("oceangeom_vertexDensity"),
            oceangeom_clipLevels: this._paramRead("oceangeom_clipLevels"),
            oceangeom_skirtSize: this._paramRead("oceangeom_skirtSize"),
            oceangeom_wireframe: this._paramRead("oceangeom_wireframe"),
            oceangeom_noMaterialLod: this._paramRead("oceangeom_noMaterialLod"),
        };
        
        const oceanGeometry = this._gui.addFolder("Ocean Geometry");

        this._addSlider(oceanGeometry, params, "oceangeom_lengthScale", "Length scale", 1, 100, 0.1);
        this._addSlider(oceanGeometry, params, "oceangeom_vertexDensity", "Vertex density", 1, 40, 1);
        this._addSlider(oceanGeometry, params, "oceangeom_clipLevels", "Clip levels", 1, 8, 1);
        this._addSlider(oceanGeometry, params, "oceangeom_skirtSize", "Skirt size", 0, 100, 0.1);
        this._addCheckbox(oceanGeometry, params, "oceangeom_wireframe", "Wireframe");
        this._addCheckbox(oceanGeometry, params, "oceangeom_noMaterialLod", "No material LOD");
    }

    private _makeMenuOceanShader(): void {
        const params = {
            oceanshader__Color: this._paramRead("oceanshader__Color"),
            oceanshader__MaxGloss: this._paramRead("oceanshader__MaxGloss"),
            oceanshader__RoughnessScale: this._paramRead("oceanshader__RoughnessScale"),
            oceanshader__LOD_scale: this._paramRead("oceanshader__LOD_scale"),
            oceanshader__FoamColor: this._paramRead("oceanshader__FoamColor"),
            oceanshader__FoamScale: this._paramRead("oceanshader__FoamScale"),
            oceanshader__ContactFoam: this._paramRead("oceanshader__ContactFoam"),
            oceanshader__FoamBiasLOD2: this._paramRead("oceanshader__FoamBiasLOD2"),
            oceanshader__SSSColor: this._paramRead("oceanshader__SSSColor"),
            oceanshader__SSSStrength: this._paramRead("oceanshader__SSSStrength"),
            oceanshader__SSSBase: this._paramRead("oceanshader__SSSBase"),
            oceanshader__SSSScale: this._paramRead("oceanshader__SSSScale"),
        };
        
        const oceanShader = this._gui.addFolder("Ocean Shader");

        this._addColor(oceanShader, params, "oceanshader__Color", "Color");
        this._addSlider(oceanShader, params, "oceanshader__MaxGloss", "Max gloss", 0.0, 1, 0.01);
        this._addSlider(oceanShader, params, "oceanshader__RoughnessScale", "Roughness scale", 0.0, 1, 0.0001);
        this._addSlider(oceanShader, params, "oceanshader__LOD_scale", "LOD scale", 0.01, 20, 0.01);
        this._addColor(oceanShader, params, "oceanshader__FoamColor", "Foam color");
        this._addSlider(oceanShader, params, "oceanshader__FoamScale", "Foam scale", 0.001, 8, 0.001);
        this._addSlider(oceanShader, params, "oceanshader__ContactFoam", "Foam contact", 0.001, 3, 0.001);
        this._addSlider(oceanShader, params, "oceanshader__FoamBiasLOD2", "Foam bias", 0.001, 4, 0.001);
        this._addColor(oceanShader, params, "oceanshader__SSSColor", "SSS color");
        this._addSlider(oceanShader, params, "oceanshader__SSSStrength", "SSS strength", 0.001, 2, 0.001);
        this._addSlider(oceanShader, params, "oceanshader__SSSBase", "SSS base", -2, 1, 0.001);
        this._addSlider(oceanShader, params, "oceanshader__SSSScale", "SSS scale", 0.001, 10, 0.001);
    }

    private _makeMenuBuoyancy(): void {
        const params = {
            buoy_enabled: this._paramRead("buoy_enabled"),
            buoy_attenuation: this._paramRead("buoy_attenuation"),
            buoy_numSteps: this._paramRead("buoy_numSteps"),
        };
        
        const buoyancy = this._gui.addFolder("Buoyancy");

        this._addCheckbox(buoyancy, params, "buoy_enabled", "Enabled");
        this._addSlider(buoyancy, params, "buoy_attenuation", "Damping factor", 0, 1, 0.001);
        this._addSlider(buoyancy, params, "buoy_numSteps", "Num steps", 1, 20, 1);
    }
}
