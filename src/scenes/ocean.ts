import * as BABYLON from "@babylonjs/core";
import { CreateSceneClass } from "../createScene";
import { RTTDebug } from "./RTTDebug";
import { WavesGenerator } from "./wavesGenerator";

import noiseEXR from "../../assets/ocean/00_noise0.exr";
import oceanShaderVertex from "../../assets/ocean/oceanShaderVertex.glsl";
import oceanShaderFragment from "../../assets/ocean/oceanShaderFragment.glsl";
import { SkyBox } from "./skyBox";

export class Ocean implements CreateSceneClass {

    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.TargetCamera;
    private _rttDebug: RTTDebug;

    constructor() {
        this._engine = null as any;
        this._scene = null as any;
        this._camera = null as any;
        this._rttDebug = null as any;
    }

    public async createScene(
        engine: BABYLON.Engine,
        canvas: HTMLCanvasElement
    ): Promise<BABYLON.Scene> {
        (window as any).convf = function(l: number): number { const a = new Uint8Array([l & 0xff, (l & 0xff00) >> 8, (l & 0xff0000) >> 16, (l & 0xff000000) >> 24]); return new Float32Array(a.buffer)[0]; }

        const scene = new BABYLON.Scene(engine);

        this._engine = engine;
        this._scene = scene;

        this._rttDebug = new RTTDebug(scene, engine, 12);

        const skybox = new SkyBox(true, scene);

        scene.environmentIntensity = 1;

        this._camera = new BABYLON.FreeCamera("mainC", new BABYLON.Vector3(0, 3.61, -10), scene);
        this._camera.rotation.y = 160 * Math.PI / 180;

        scene.activeCameras = [this._camera, this._rttDebug.camera];

        this._camera.attachControl(canvas, true);

        //const light = new BABYLON.PointLight("light", new BABYLON.Vector3(175, 275, -380), scene);
        //light.direction = new BABYLON.Vector3(0.3505343201912589, -0.5504902114667733, 0.7576847744592199)
        
        const light = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0, -1, -2), scene);
        light.intensity = 1;
        light.diffuse = new BABYLON.Color3(1, 0.95686275, 0.8392157);

        const patch = BABYLON.GroundBuilder.CreateGround(
            "patch",
            { width: 242, height: 242, subdivisions: 240 },
            scene
        );

        patch.position.x = 242/2;
        patch.position.z = 242/2;
        patch.bakeCurrentTransformIntoVertices();
        (window as any).pp=patch;

        patch.position.set(-14.9, 0, -25);
        patch.scaling.set(0.12397, 1, 0.12397);

        const noise = await (await fetch(noiseEXR)).arrayBuffer();

        const size = 256;

        const wavesGenerator = new WavesGenerator(size, scene, this._rttDebug, noise);

        patch.material = await this._makeOceanShader(false, wavesGenerator);

        scene.onBeforeRenderObservable.add(() => {
            skybox.update(light);
            wavesGenerator.update();
        });

        return scene;
    }

    private async _makeOceanShader(useNodeMaterial: boolean, wavesGenerator: WavesGenerator): Promise<BABYLON.Material> {
        let mat: BABYLON.ShaderMaterial | BABYLON.NodeMaterial;

        if (!useNodeMaterial) {
            mat = new BABYLON.ShaderMaterial("shader", this._scene, {
                vertexSource: oceanShaderVertex,
                fragmentSource: oceanShaderFragment,
                },
                {
                    attributes: ["position"],
                    uniforms: ["world", "worldView", "viewProjection", "view", "projection", "_LOD_scale", "LengthScale0"],
                    samplers: ["_Displacement_c0", "_Derivatives_c0"],
                }
            );
        
            //mat.wireframe = true;

            mat.setFloat("_LOD_scale", 7.13);
            mat.setTexture("_Displacement_c0", wavesGenerator.getCascade(0).displacement);
            mat.setTexture("_Derivatives_c0", wavesGenerator.getCascade(0).derivatives);
            mat.setFloat("LengthScale0", wavesGenerator.lengthScale[0]);

            mat.onBindObservable.add(() => {
                mat.getEffect()?.setVector3("_WorldSpaceCameraPos", this._camera.position);
            });
        } else {
            mat = await BABYLON.NodeMaterial.ParseFromSnippetAsync("R4152I#21", this._scene);

            mat.getInputBlockByPredicate((b) => b.name === "LOD_scale")!.value = 7.13;
            mat.getInputBlockByPredicate((b) => b.name === "LengthScale0")!.value = wavesGenerator.lengthScale[0];
            mat.getInputBlockByPredicate((b) => b.name === "Roughness")!.value = 0.311;
            mat.getInputBlockByPredicate((b) => b.name === "metallic")!.value = 0;
            (mat.getBlockByName("Displacement_c0") as BABYLON.TextureBlock).texture = wavesGenerator.getCascade(0).displacement as BABYLON.Texture;
            (mat.getBlockByName("Derivatives_c0") as BABYLON.TextureBlock).texture = wavesGenerator.getCascade(0).derivatives as BABYLON.Texture;

            //(mat.getBlockByName("PBRMetallicRoughness") as BABYLON.PBRMetallicRoughnessBlock).realTimeFiltering = true;

            mat.build();
        }

        return mat;
    }
}

export default new Ocean();