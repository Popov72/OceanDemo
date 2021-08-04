import * as BABYLON from "@babylonjs/core";
import { WavesGenerator } from "./wavesGenerator";
import { PBRCustomMaterial } from "@babylonjs/materials";

import foamPicture from "../../assets/ocean/foam1.jpg";

export class OceanMaterial {

    private _wavesGenerator: WavesGenerator;
    private _depthRenderer: BABYLON.DepthRenderer;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.Camera;
    private _foamTexture: BABYLON.Texture;
    private _startTime: number;

    constructor(wavesGenerator: WavesGenerator, depthRenderer: BABYLON.DepthRenderer, scene: BABYLON.Scene) {
        this._wavesGenerator = wavesGenerator;
        this._depthRenderer = depthRenderer;
        this._scene = scene;
        this._camera = scene.activeCameras?.[0] ?? scene.activeCamera!;
        this._foamTexture = new BABYLON.Texture(foamPicture, this._scene);
        this._startTime = new Date().getTime() / 1000;
    }

    public async getMaterial(useMid: boolean, useClose: boolean, useNodeMaterial = false): Promise<BABYLON.Material> {
        let mat: BABYLON.NodeMaterial | PBRCustomMaterial;

        if (!useNodeMaterial) {

            mat = new PBRCustomMaterial("oceanMat" + (useMid ? "1" : "0") + (useClose ? "1" : "0"), this._scene);

            mat.metallic = 0;
            mat.roughness = 0.311;
            mat.forceIrradianceInFragment = true;
            //mat.realTimeFiltering = true;
            //mat.realTimeFilteringQuality = BABYLON.Constants.TEXTURE_FILTERING_QUALITY_HIGH;
            //mat.wireframe = true;

            const color = new BABYLON.Vector3(0.03457636, 0.12297464, 0.1981132);
            /*if (useMid && useClose) {
                color.y = color.z = 0;
            } else if (useMid && !useClose) {
                color.x = color.z = 0;
            } else {
                color.x = color.y = 0;
            }*/

            mat.AddUniform("_LOD_scale", "float", 7.13);
            mat.AddUniform("_FoamColor", "vec3", new BABYLON.Vector3(1, 1, 1));
            mat.AddUniform("_SSSStrength", "float", 0.133);
            mat.AddUniform("_Color", "vec3", color);
            mat.AddUniform("_SSSColor", "vec3", new BABYLON.Vector3(0.1541919, 0.8857628, 0.990566));
            mat.AddUniform("_SSSBase", "float", -0.1);
            mat.AddUniform("_SSSScale", "float", 4.8);
            mat.AddUniform("_MaxGloss", "float", 0.91);
            mat.AddUniform("_RoughnessScale", "float", 0.0044);
            mat.AddUniform("_FoamBiasLOD0", "float", 0.84);
            mat.AddUniform("_FoamBiasLOD1", "float", 1.83);
            mat.AddUniform("_FoamBiasLOD2", "float", 2.72);
            mat.AddUniform("_FoamScale", "float", 2.4);
            mat.AddUniform("_ContactFoam", "float", 1);

            mat.AddUniform("_WorldSpaceCameraPos", "vec3", "");
            mat.AddUniform("LengthScale0", "float", this._wavesGenerator.lengthScale[0]);
            mat.AddUniform("LengthScale1", "float", this._wavesGenerator.lengthScale[1]);
            mat.AddUniform("LengthScale2", "float", this._wavesGenerator.lengthScale[2]);
            mat.AddUniform("_Displacement_c0", "sampler2D", this._wavesGenerator.getCascade(0).displacement);
            mat.AddUniform("_Derivatives_c0", "sampler2D", this._wavesGenerator.getCascade(0).derivatives);
            mat.AddUniform("_Turbulence_c0", "sampler2D", this._wavesGenerator.getCascade(0).turbulence);
            mat.AddUniform("_Displacement_c1", "sampler2D", this._wavesGenerator.getCascade(1).displacement);
            mat.AddUniform("_Derivatives_c1", "sampler2D", this._wavesGenerator.getCascade(1).derivatives);
            mat.AddUniform("_Turbulence_c1", "sampler2D", this._wavesGenerator.getCascade(1).turbulence);
            mat.AddUniform("_Displacement_c2", "sampler2D", this._wavesGenerator.getCascade(2).displacement);
            mat.AddUniform("_Derivatives_c2", "sampler2D", this._wavesGenerator.getCascade(2).derivatives);
            mat.AddUniform("_Turbulence_c2", "sampler2D", this._wavesGenerator.getCascade(2).turbulence);
            mat.AddUniform("_Time", "float", 0);
            mat.AddUniform("_CameraDepthTexture", "sampler2D", this._depthRenderer.getDepthMap());
            mat.AddUniform("_CameraData", "vec4", new BABYLON.Vector4(this._camera.minZ, this._camera.maxZ, this._camera.maxZ - this._camera.minZ, 0));
            mat.AddUniform("_FoamTexture", "sampler2D", this._foamTexture);

            const cascades = [];
            if (useMid) {
                cascades.push("#define MID");
            }
            if (useClose) {
                cascades.push("#define CLOSE");
            }

            mat.Vertex_Definitions(`
                ${cascades.join("\n")}

                varying vec2 vWorldUV;
                varying vec2 vUVCoords_c0;
                varying vec2 vUVCoords_c1;
                varying vec2 vUVCoords_c2;
                varying vec3 vViewVector;
                varying vec4 vLodScales;
                varying vec4 vClipCoords;
                varying float vMetric;
            `);

            mat.Fragment_Definitions(`
                ${cascades.join("\n")}

                varying vec2 vWorldUV;
                varying vec2 vUVCoords_c0;
                varying vec2 vUVCoords_c1;
                varying vec2 vUVCoords_c2;
                varying vec3 vViewVector;
                varying vec4 vLodScales;
                varying vec4 vClipCoords;
                varying float vMetric;
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
                vUVCoords_c1 = vWorldUV / LengthScale1;
                vUVCoords_c2 = vWorldUV / LengthScale2;
            
                displacement += texture2D(_Displacement_c0, vUVCoords_c0).xyz * lod_c0;
                largeWavesBias = displacement.y;
            
                #if defined(MID) || defined(CLOSE)
                    displacement += texture2D(_Displacement_c1, vUVCoords_c1).xyz * lod_c1;
                #endif
                #if defined(CLOSE)
                    displacement += texture2D(_Displacement_c2, vUVCoords_c2).xyz * lod_c2;
                #endif
    
                worldPos.xyz += displacement;

                vLodScales = vec4(lod_c0, lod_c1, lod_c2, max(displacement.y - largeWavesBias * 0.8 - _SSSBase, 0) / _SSSScale);
            `);

            mat.Vertex_MainEnd(`
                vClipCoords = gl_Position;
                vMetric = gl_Position.z;
            `);

            mat.Fragment_Before_Lights(`
                vec4 derivatives = texture2D(_Derivatives_c0, vUVCoords_c0);
                #if defined(MID) || defined(CLOSE)
                    derivatives += texture2D(_Derivatives_c1, vUVCoords_c1) * vLodScales.y;
                #endif
                #if defined(CLOSE)
                    derivatives += texture2D(_Derivatives_c2, vUVCoords_c2) * vLodScales.z;
                #endif

                vec2 slope = vec2(derivatives.x / (1.0 + derivatives.z), derivatives.y / (1.0 + derivatives.w));
                normalW = normalize(vec3(-slope.x, 1.0, -slope.y));

                #if defined(CLOSE)
                    float jacobian = texture2D(_Turbulence_c0, vUVCoords_c0).x + texture2D(_Turbulence_c1, vUVCoords_c1).x + texture2D(_Turbulence_c2, vUVCoords_c2).x;
                    jacobian = min(1.0, max(0.0, (-jacobian + _FoamBiasLOD2) * _FoamScale));
                #elif defined(MID)
                    float jacobian = texture2D(_Turbulence_c0, vUVCoords_c0).x + texture2D(_Turbulence_c1, vUVCoords_c1).x;
                    jacobian = min(1.0, max(0.0, (-jacobian + _FoamBiasLOD1) * _FoamScale));
                #else
                    float jacobian = texture2D(_Turbulence_c0, vUVCoords_c0).x;
                    jacobian = min(1.0, max(0.0, (-jacobian + _FoamBiasLOD0) * _FoamScale));
                #endif

                vec2 screenUV = vClipCoords.xy / vClipCoords.w;
                screenUV = screenUV * 0.5 + 0.5;
                float backgroundDepth = texture2D(_CameraDepthTexture, screenUV).r * _CameraData.y;
                float surfaceDepth = vMetric;
                float depthDifference = max(0.0, (backgroundDepth - surfaceDepth) - 0.1);
                float foam = texture2D(_FoamTexture, vWorldUV * 0.5 + _Time).r;
                jacobian += _ContactFoam * saturate(max(0.0, foam - depthDifference) * 5.0) * 0.9;
    
                surfaceAlbedo = mix(vec3(0.0), _FoamColor, jacobian);

                vec3 viewDir = normalize(vViewVector);
                vec3 H = normalize(-normalW + light0.vLightData.xyz);
                float ViewDotH = pow5(saturate(dot(viewDir, -H))) * 30.0 * _SSSStrength;
                vec3 color = mix(_Color, saturate(_Color + _SSSColor.rgb * ViewDotH * vLodScales.w), vLodScales.z);
    
                float fresnel = dot(normalW, viewDir);
                fresnel = saturate(1.0 - fresnel);
                fresnel = pow5(fresnel);
            `);

            mat.Fragment_Custom_MetallicRoughness(`
                float distanceGloss = mix(1.0 - metallicRoughness.g, _MaxGloss, 1.0 / (1.0 + length(vViewVector) * _RoughnessScale));
                metallicRoughness.g = 1.0 - mix(distanceGloss, 0.0, jacobian);
            `);

            mat.Fragment_Before_FinalColorComposition(`
                finalEmissive = mix(color * (1.0 - fresnel), vec3(0.0), jacobian);
            `);

            mat.Fragment_Before_FragColor(`
                //finalColor = vec4(toGammaSpace((normalW + vec3(1.)) / vec3(2.)), 1.);
                //finalColor = vec4(vec3(surfaceDepth), 1.);
            `);

            mat.onBindObservable.add(() => {
                const time = ((new Date().getTime() / 1000) - this._startTime) / 10;

                mat.getEffect()?.setVector3("_WorldSpaceCameraPos", this._camera.position);
                mat.getEffect()?.setTexture("_Turbulence_c0", this._wavesGenerator.getCascade(0).turbulence);
                mat.getEffect()?.setTexture("_Turbulence_c1", this._wavesGenerator.getCascade(1).turbulence);
                mat.getEffect()?.setTexture("_Turbulence_c2", this._wavesGenerator.getCascade(2).turbulence);
                mat.getEffect()?.setFloat("_Time", time);
                //mat.getEffect()?.setVector3("_FoamColor", new BABYLON.Vector3(this._light.diffuse.r, this._light.diffuse.g, this._light.diffuse.b));
            });

            return new Promise((resolve) => {
                if (this._foamTexture.isReady()) {
                    resolve(mat);
                } else {
                    this._foamTexture.onLoadObservable.addOnce(() => {
                        resolve(mat);
                    });
                }
            });
        } else {
            mat = await BABYLON.NodeMaterial.ParseFromSnippetAsync("R4152I#24", this._scene);

            mat.getInputBlockByPredicate((b) => b.name === "LOD_scale")!.value = 7.13;
            mat.getInputBlockByPredicate((b) => b.name === "LengthScale0")!.value = this._wavesGenerator.lengthScale[0];
            mat.getInputBlockByPredicate((b) => b.name === "Roughness")!.value = 0.311;
            mat.getInputBlockByPredicate((b) => b.name === "metallic")!.value = 0;
            (mat.getBlockByName("Displacement_c0") as BABYLON.TextureBlock).texture = this._wavesGenerator.getCascade(0).displacement as BABYLON.Texture;
            (mat.getBlockByName("Derivatives_c0") as BABYLON.TextureBlock).texture = this._wavesGenerator.getCascade(0).derivatives as BABYLON.Texture;

            //(mat.getBlockByName("PBRMetallicRoughness") as BABYLON.PBRMetallicRoughnessBlock).realTimeFiltering = true;

            mat.build();
        }

        return mat;
    }
}
