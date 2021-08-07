import * as BABYLON from "@babylonjs/core";
import { SkyMaterial } from "@babylonjs/materials";

import "./tools/skyMaterialExt";

import qwantani_1k from "../../assets/environment/qwantani_1k.hdr";

export class SkyBox {

    private _procedural: boolean;
    private _scene: BABYLON.Scene;
    private _skybox: BABYLON.Mesh;
    private _skyMaterial: SkyMaterial;
    private _probe: BABYLON.ReflectionProbe;
    private _oldSunPosition: BABYLON.Vector3;
    private _dirty: boolean;

    public get probe(): BABYLON.Nullable<BABYLON.ReflectionProbe> {
        return this._probe;
    }

    public get skyMaterial() {
        return this._skyMaterial;
    }

    public setAsDirty(): void {
        this._dirty = true;
    }

    constructor(useProcedural: boolean, scene: BABYLON.Scene) {
        this._procedural = useProcedural;
        this._scene = scene;
        this._oldSunPosition = new BABYLON.Vector3();
        this._skyMaterial = null as any;
        this._probe = null as any;
        this._dirty = false;

        this._skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size: 1000.0, sideOrientation: BABYLON.Mesh.BACKSIDE}, this._scene);

        scene.onBeforeRenderObservable.add(() => {
            this._skybox.position = scene.activeCameras?.[0].position ?? scene.activeCamera!.position;
        });

        if (useProcedural) {
            this._initProceduralSkybox();
        } else {
            this._initSkybox();
        }
    }

    public update(light: BABYLON.ShadowLight): void {
        if (!this._procedural) {
            return;
        }
        if (!this._oldSunPosition.equals(this._skyMaterial.sunPosition) || this._dirty) {
            this._dirty = false;
            this._probe.cubeTexture.refreshRate = 0;
            this._oldSunPosition.copyFrom(this._skyMaterial.sunPosition);
        }
        light.position = this._skyMaterial.sunPosition;
        light.direction = this._skyMaterial.sunPosition.negate().normalize();
        light.diffuse = (this._skyMaterial as any).getSunColor();
    }

    private _initProceduralSkybox(): void {
        this._skyMaterial = new SkyMaterial('sky', this._scene);
        this._skybox.material = this._skyMaterial;
        this._skybox.material.disableDepthWrite = true;

        this._skyMaterial.azimuth = 0.307;
        this._skyMaterial.inclination = 0.0;
    
        (window as any).ss = this._skyMaterial;

        // Reflection probe
        this._probe = new BABYLON.ReflectionProbe('skyProbe', 128, this._scene, true, true, true);
        this._probe.renderList!.push(this._skybox);

        this._probe.cubeTexture.refreshRate = 0;

        const forcePolynomialsRecompute = (texture: BABYLON.InternalTexture) => {
            texture._sphericalPolynomial = null;
            texture._sphericalPolynomialPromise = null;
            texture._sphericalPolynomialComputed = false;
        };

        this._probe.cubeTexture.onAfterUnbindObservable.add(() => {
            forcePolynomialsRecompute(this._probe.cubeTexture.getInternalTexture()!);
        });

        this._scene.environmentTexture = this._probe.cubeTexture;
        this._scene.customRenderTargets.push(this._probe.cubeTexture);
    }

    private _initSkybox(): void {
        //const reflectionTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("https://assets.babylonjs.com/environments/environmentSpecular.env", scene);
        const reflectionTexture = new BABYLON.HDRCubeTexture(qwantani_1k, this._scene, 512, false, true, false, true);

        const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this._scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = reflectionTexture.clone();
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        this._skybox.material = skyboxMaterial;

        this._scene.environmentTexture = reflectionTexture;
    }
}