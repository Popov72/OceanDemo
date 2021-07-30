import * as BABYLON from "@babylonjs/core";
import { CreateSceneClass } from "../createScene";
import { RTTDebug } from "./RTTDebug";
import { WavesGenerator } from "./wavesGenerator";
import { PBRCustomMaterial } from "@babylonjs/materials";

import noiseEXR from "../../assets/ocean/00_noise0.exr";
import oceanShaderVertex from "../../assets/ocean/oceanShaderVertex.glsl";
import oceanShaderFragment from "../../assets/ocean/oceanShaderFragment.glsl";
import { SkyBox } from "./skyBox";

export class Ocean implements CreateSceneClass {

    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.TargetCamera;
    private _rttDebug: RTTDebug;
    private _startTime: number;

    constructor() {
        this._engine = null as any;
        this._scene = null as any;
        this._camera = null as any;
        this._rttDebug = null as any;
        this._startTime = new Date().getTime() / 1000;
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
        let mat: BABYLON.ShaderMaterial | BABYLON.NodeMaterial | PBRCustomMaterial;

        if (!useNodeMaterial) {
            const useCustomPBRMat = true;

            if (!useCustomPBRMat) {
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
            } else {
                mat = new PBRCustomMaterial("mat", this._scene);

                mat.metallic = 0;
                mat.roughness = 0.311;
                mat.forceIrradianceInFragment = true;

                mat.AddUniform("_WorldSpaceCameraPos", "vec3", "");
                mat.AddUniform("_LOD_scale", "float", 7.13);
                mat.AddUniform("LengthScale0", "float", wavesGenerator.lengthScale[0]);
                mat.AddUniform("LengthScale1", "float", 17/*wavesGenerator.lengthScale[1]*/);
                mat.AddUniform("LengthScale2", "float", 5/*wavesGenerator.lengthScale[2]*/);
                mat.AddUniform("_Displacement_c0", "sampler2D", wavesGenerator.getCascade(0).displacement);
                mat.AddUniform("_Derivatives_c0", "sampler2D", wavesGenerator.getCascade(0).derivatives);
                mat.AddUniform("_Turbulence_c0", "sampler2D", wavesGenerator.getCascade(0).turbulence);
                //mat.AddUniform("_FoamColor", "vec3", new BABYLON.Color3(1, 1, 1).toLinearSpace());
                mat.AddUniform("_FoamColor", "vec3", new BABYLON.Vector3(1, 1, 1));
                mat.AddUniform("_SSSStrength", "float", 0.133);
                const _Color = new BABYLON.Color3(0.03457636, 0.12297464, 0.1981132);//.toLinearSpace();
                mat.AddUniform("_Color", "vec3", new BABYLON.Vector3(_Color.r, _Color.g, _Color.b));
                const _SSSColor = new BABYLON.Color3(0.1541919, 0.8857628, 0.990566);//.toLinearSpace();
                mat.AddUniform("_SSSColor", "vec3", new BABYLON.Vector3(_SSSColor.r, _SSSColor.g, _SSSColor.b));
                mat.AddUniform("_SSSBase", "float", -0.1);
                mat.AddUniform("_SSSScale", "float", 4.8);
                mat.AddUniform("_MaxGloss", "float", 0.91);
                mat.AddUniform("_RoughnessScale", "float", 0.0044);
                mat.AddUniform("_FoamBiasLOD0", "float", 0.84);
                mat.AddUniform("_FoamBiasLOD1", "float", 1.83);
                mat.AddUniform("_FoamBiasLOD2", "float", 2.72);
                mat.AddUniform("_FoamScale", "float", 2.4);
                mat.AddUniform("_ContactFoam", "float", 1);
                mat.AddUniform("_Time", "float", 0);

                mat.Vertex_Definitions(`
                    varying vec2 vWorldUV;
                    varying vec2 vUVCoords_c0;
                    varying vec3 vViewVector;
                    varying vec4 vLodScales;
                `);

                mat.Fragment_Definitions(`
                    varying vec2 vWorldUV;
                    varying vec2 vUVCoords_c0;
                    varying vec3 vViewVector;
                    varying vec4 vLodScales;
                `);

                mat.Vertex_After_WorldPosComputed(`
                    vWorldUV = worldPos.xz;
                
                    vViewVector = _WorldSpaceCameraPos - worldPos.xyz;
                    float viewDist = length(vViewVector);
                
                    float lod_c0 = min(_LOD_scale * LengthScale0 / viewDist, 1.0);
                    float lod_c1 = min(_LOD_scale * LengthScale1 / viewDist, 1.0);
                    float lod_c2 = min(_LOD_scale * LengthScale2 / viewDist, 1.0);
                        
                    vec3 displacement = vec3(0.);
                    float largeWavesBias = 0.;
                
                    vUVCoords_c0 = vWorldUV / LengthScale0;
                
                    displacement += texture2D(_Displacement_c0, vUVCoords_c0).xyz * lod_c0;
                    largeWavesBias = displacement.y;
                
                    worldPos.xyz += displacement;

                    vLodScales = vec4(lod_c0, lod_c1, lod_c2, max(displacement.y - largeWavesBias * 0.8 - _SSSBase, 0) / _SSSScale);
                `);

                mat.Fragment_Custom_Albedo(`
                `);

                mat.Fragment_Custom_MetallicRoughness(`
                    float jacobian = texture2D(_Turbulence_c0, vUVCoords_c0).x;
                    jacobian = min(1.0, max(0.0, (-jacobian + _FoamBiasLOD0) * _FoamScale));

                    float distanceGloss = mix(1.0 - metallicRoughness.g, _MaxGloss, 1.0 / (1.0 + length(vViewVector) * _RoughnessScale));
                    metallicRoughness.g = 1.0 - mix(distanceGloss, 0.0, jacobian);
                `);

                mat.Fragment_Before_Lights(`
                    vec4 derivatives = texture2D(_Derivatives_c0, vUVCoords_c0);
                    vec2 slope = vec2(derivatives.x / (1.0 + derivatives.z), derivatives.y / (1.0 + derivatives.w));
                    normalW = normalize(vec3(-slope.x, 1.0, -slope.y));

                    float jacobian = texture2D(_Turbulence_c0, vUVCoords_c0).x;
                    jacobian = min(1.0, max(0.0, (-jacobian + _FoamBiasLOD0) * _FoamScale));

                    //vec2 screenUV = gl_FragCoords.xy / gl_FragCoords.w;
                    //float backgroundDepth = LinearEyeDepth(SAMPLE_DEPTH_TEXTURE(_CameraDepthTexture, screenUV));
                    //float surfaceDepth = UNITY_Z_0_FAR_FROM_CLIPSPACE(IN.screenPos.z);
                    //float depthDifference = 0.0;//max(0, backgroundDepth - surfaceDepth - 0.1);
                    //float foam = texture2D(_FoamTexture, vWorldUV * 0.5 + _Time).r;
                    //jacobian += _ContactFoam * saturate(max(0.0, foam - depthDifference) * 5.0) * 0.9;
        
                    surfaceAlbedo = mix(vec3(0.0), _FoamColor, jacobian);

                    vec3 viewDir = normalize(vViewVector);
                    vec3 H = normalize(-normalW + light0.vLightData.xyz);
                    float ViewDotH = pow5(saturate(dot(viewDir, -H))) * 30.0 * _SSSStrength;
                    vec3 color = mix(_Color, saturate(_Color + _SSSColor.rgb * ViewDotH * vLodScales.w), vLodScales.z);
        
                    float fresnel = dot(normalW, viewDir);
                    fresnel = saturate(1.0 - fresnel);
                    fresnel = pow5(fresnel);
                `);

                mat.Fragment_Before_FinalColorComposition(`
                    finalEmissive = mix(color * (1.0 - fresnel), vec3(0.0), jacobian);
                `);

                mat.Fragment_Before_FragColor(`
                    //finalColor = vec4(toGammaSpace((normalW + vec3(1.)) / vec3(2.)), 1.);
                    //finalColor = vec4(vec3(jacobian), 1.);
                `);
            }

            mat.onBindObservable.add(() => {
                mat.getEffect()?.setVector3("_WorldSpaceCameraPos", this._camera.position);
                mat.getEffect()?.setTexture("_Turbulence_c0", wavesGenerator.getCascade(0).turbulence);
                const time = ((new Date().getTime() / 1000) - this._startTime) / 20;
                mat.getEffect()?.setFloat("_Time", time);
            });
        } else {
            mat = await BABYLON.NodeMaterial.ParseFromSnippetAsync("R4152I#24", this._scene);

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