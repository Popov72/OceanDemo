import * as BABYLON from "@babylonjs/core";

export class ComputeHelper {

    private static _copyTexture4CS: BABYLON.ComputeShader;
    private static _copyTexture2CS: BABYLON.ComputeShader;
    private static _copyTexture4Params: BABYLON.UniformBuffer;
    private static _copyTexture2Params: BABYLON.UniformBuffer;
    private static _copyBufferTextureCS: BABYLON.ComputeShader;
    private static _copyBufferTextureParams: BABYLON.UniformBuffer;
    private static _copyTextureBufferCS: BABYLON.ComputeShader;
    private static _copyTextureBufferParams: BABYLON.UniformBuffer;
    private static _clearTextureCS: BABYLON.ComputeShader;
    private static _clearTextureParams: BABYLON.UniformBuffer;

    private static _clearTextureComputeShader = `
        @group(0) @binding(0) var tbuf : texture_storage_2d<rgba32float, write>;

        struct Params {
            color : vec4<f32>,
            width : u32,
            height : u32,
        };
        @group(0) @binding(1) var<uniform> params : Params;

        @compute @workgroup_size(8, 8, 1)
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            if (global_id.x >= params.width || global_id.y >= params.height) {
                return;
            }
            textureStore(tbuf, vec2<i32>(global_id.xy), params.color);
        }
    `;

    private static _copyTexture4ComputeShader = `
        @group(0) @binding(0) var dest : texture_storage_2d<rgba32float, write>;
        @group(0) @binding(1) var src : texture_2d<f32>;

        struct Params {
            width : u32,
            height : u32,
        };
        @group(0) @binding(2) var<uniform> params : Params;

        @compute @workgroup_size(8, 8, 1)
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            if (global_id.x >= params.width || global_id.y >= params.height) {
                return;
            }
            let pix : vec4<f32> = textureLoad(src, vec2<i32>(global_id.xy), 0);
            textureStore(dest, vec2<i32>(global_id.xy), pix);
        }
    `;

    private static _copyTexture2ComputeShader = `
        @group(0) @binding(0) var dest : texture_storage_2d<rg32float, write>;
        @group(0) @binding(1) var src : texture_2d<f32>;

        struct Params {
            width : u32,
            height : u32,
        };
        @group(0) @binding(2) var<uniform> params : Params;

        @compute @workgroup_size(8, 8, 1)
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            if (global_id.x >= params.width || global_id.y >= params.height) {
                return;
            }
            let pix : vec4<f32> = textureLoad(src, vec2<i32>(global_id.xy), 0);
            textureStore(dest, vec2<i32>(global_id.xy), pix);
        }
    `;

    private static _copyBufferTextureComputeShader = `
        struct FloatArray {
            elements : array<f32>,
        };

        @group(0) @binding(0) var dest : texture_storage_2d<rgba32float, write>;
        @group(0) @binding(1) var<storage, read> src : FloatArray;

        struct Params {
            width : u32,
            height : u32,
        };
        @group(0) @binding(2) var<uniform> params : Params;

        @compute @workgroup_size(8, 8, 1)
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            if (global_id.x >= params.width || global_id.y >= params.height) {
                return;
            }
            let offset : u32 = global_id.y * params.width * 4u + global_id.x * 4u;
            let pix : vec4<f32> = vec4<f32>(src.elements[offset], src.elements[offset + 1u], src.elements[offset + 2u], src.elements[offset + 3u]);
            textureStore(dest, vec2<i32>(global_id.xy), pix);
        }
    `;

    private static _copyTextureBufferComputeShader = `
        struct FloatArray {
            elements : array<f32>,
        };

        @group(0) @binding(0) var src : texture_2d<f32>;
        @group(0) @binding(1) var<storage, write> dest : FloatArray;

        struct Params {
            width : u32,
            height : u32,
        };
        @group(0) @binding(2) var<uniform> params : Params;

        @compute, workgroup_size(8, 8, 1)
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            if (global_id.x >= params.width || global_id.y >= params.height) {
                return;
            }
            let offset : u32 = global_id.y * params.width * 4u + global_id.x * 4u;
            let pix : vec4<f32> = textureLoad(src, vec2<i32>(global_id.xy), 0);
            dest.elements[offset] = pix.r;
            dest.elements[offset + 1u] = pix.g;
            dest.elements[offset + 2u] = pix.b;
            dest.elements[offset + 3u] = pix.a;
        }
    `;

    static GetThreadGroupSizes(source: string, entryPoint: string): BABYLON.Vector3 {
        const rx = new RegExp(`workgroup_size\\s*\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)\\s*fn\\s+${entryPoint}\\s*\\(`, "g");
        const res = rx.exec(source);
        return res ? new BABYLON.Vector3(parseInt(res[1]), parseInt(res[2]), parseInt(res[3])) : new BABYLON.Vector3(1, 1, 1);
    }

    static CreateStorageTexture(name: string, sceneOrEngine: BABYLON.Scene | BABYLON.ThinEngine, nwidth: number, nheight: number, textureFormat = BABYLON.Constants.TEXTUREFORMAT_RGBA, textureType = BABYLON.Constants.TEXTURETYPE_FLOAT,
            filterMode = BABYLON.Constants.TEXTURE_NEAREST_SAMPLINGMODE, generateMipMaps = false, wrapMode = BABYLON.Constants.TEXTURE_WRAP_ADDRESSMODE, texture: BABYLON.Nullable<BABYLON.Texture> = null): BABYLON.Texture
    {
        const { width, height } = texture ? texture.getSize() : { width: 0, height: 0 };
        let type = texture ? (texture.getInternalTexture()!.type ?? -1) : -2;
        let format = texture ? (texture.getInternalTexture()!.format ?? -1) : -2;
        if (type === -1) {
            type = BABYLON.Constants.TEXTURETYPE_UNSIGNED_BYTE;
        }
        if (format === -1) {
            format = BABYLON.Constants.TEXTUREFORMAT_RGBA;
        }
        if (!texture || width !== nwidth || height !== nheight || textureType !== type || textureFormat !== format) {
            /*texture = new BABYLON.RenderTargetTexture(name, { width: nwidth, height: nheight }, scene, false, undefined, textureType, false, filterMode, false, false, false,
                textureFormat, false, undefined, BABYLON.Constants.TEXTURE_CREATIONFLAG_STORAGE);*/
            texture = new BABYLON.RawTexture(null, nwidth, nheight, textureFormat, sceneOrEngine, generateMipMaps, false, filterMode, textureType, BABYLON.Constants.TEXTURE_CREATIONFLAG_STORAGE);
            texture.name = name;
        }
        texture.wrapU = wrapMode;
        texture.wrapV = wrapMode;
        texture.updateSamplingMode(filterMode);

        return texture;
    }

    static CopyTexture(source: BABYLON.BaseTexture, dest: BABYLON.BaseTexture, engine_?: BABYLON.Engine): void {
        const numChannels = source.getInternalTexture()!.format === BABYLON.Constants.TEXTUREFORMAT_RG ? 2 : 4;
        if (!ComputeHelper._copyTexture4CS && numChannels === 4 || !ComputeHelper._copyTexture2CS && numChannels === 2) {
            const engine = source.getScene()?.getEngine() ?? engine_!;
            const cs1 = new BABYLON.ComputeShader(`copyTexture${numChannels}Compute`, engine, { computeSource: numChannels === 4 ? ComputeHelper._copyTexture4ComputeShader : ComputeHelper._copyTexture2ComputeShader }, { bindingsMapping:
                {
                    "dest": { group: 0, binding: 0 },
                    "src": { group: 0, binding: 1 },
                    "params": { group: 0, binding: 2 },
                }
            });

            const uBuffer0 = new BABYLON.UniformBuffer(engine);

            uBuffer0.addUniform("width", 1);
            uBuffer0.addUniform("height", 1);
            
            cs1.setUniformBuffer("params", uBuffer0);

            if (numChannels === 4) {
                ComputeHelper._copyTexture4CS = cs1;
                ComputeHelper._copyTexture4Params = uBuffer0;
            } else {
                ComputeHelper._copyTexture2CS = cs1;
                ComputeHelper._copyTexture2Params = uBuffer0;
            }
        }

        const cs = numChannels === 4 ? ComputeHelper._copyTexture4CS : ComputeHelper._copyTexture2CS;
        const params = numChannels === 4 ? ComputeHelper._copyTexture4Params : ComputeHelper._copyTexture2Params;

        cs.setTexture("src", source, false);
        cs.setStorageTexture("dest", dest);

        const { width, height } = source.getSize();

        params.updateInt("width", width);
        params.updateInt("height", height);
        params.update();

        ComputeHelper.Dispatch(cs, width, height, 1);
    }

    static CopyBufferToTexture(source: BABYLON.StorageBuffer, dest: BABYLON.BaseTexture): void {
        if (!ComputeHelper._copyBufferTextureCS) {
            const engine = dest.getScene()!.getEngine();
            const cs1 = new BABYLON.ComputeShader("copyBufferTextureCompute", engine, { computeSource: ComputeHelper._copyBufferTextureComputeShader }, { bindingsMapping:
                {
                    "dest": { group: 0, binding: 0 },
                    "src": { group: 0, binding: 1 },
                    "params": { group: 0, binding: 2 },
                }
            });

            const uBuffer0 = new BABYLON.UniformBuffer(engine);

            uBuffer0.addUniform("width", 1);
            uBuffer0.addUniform("height", 1);
            
            cs1.setUniformBuffer("params", uBuffer0);

            ComputeHelper._copyBufferTextureCS = cs1;
            ComputeHelper._copyBufferTextureParams = uBuffer0;
        }

        ComputeHelper._copyBufferTextureCS.setStorageBuffer("src", source);
        ComputeHelper._copyBufferTextureCS.setStorageTexture("dest", dest);

        const { width, height } = dest.getSize();

        ComputeHelper._copyBufferTextureParams.updateInt("width", width);
        ComputeHelper._copyBufferTextureParams.updateInt("height", height);
        ComputeHelper._copyBufferTextureParams.update();

        ComputeHelper.Dispatch(ComputeHelper._copyBufferTextureCS, width, height, 1);
    }

    static CopyTextureToBuffer(source: BABYLON.BaseTexture, dest: BABYLON.StorageBuffer): void {
        if (!ComputeHelper._copyTextureBufferCS) {
            const engine = source.getScene()!.getEngine();
            const cs1 = new BABYLON.ComputeShader("copyTextureBufferCompute", engine, { computeSource: ComputeHelper._copyTextureBufferComputeShader }, { bindingsMapping:
                {
                    "src": { group: 0, binding: 0 },
                    "dest": { group: 0, binding: 1 },
                    "params": { group: 0, binding: 2 },
                }
            });

            const uBuffer0 = new BABYLON.UniformBuffer(engine);

            uBuffer0.addUniform("width", 1);
            uBuffer0.addUniform("height", 1);
            
            cs1.setUniformBuffer("params", uBuffer0);

            ComputeHelper._copyTextureBufferCS = cs1;
            ComputeHelper._copyTextureBufferParams = uBuffer0;
        }

        ComputeHelper._copyTextureBufferCS.setTexture("src", source, false);
        ComputeHelper._copyTextureBufferCS.setStorageBuffer("dest", dest);

        const { width, height } = source.getSize();

        ComputeHelper._copyTextureBufferParams.updateInt("width", width);
        ComputeHelper._copyTextureBufferParams.updateInt("height", height);
        ComputeHelper._copyTextureBufferParams.update();

        ComputeHelper.Dispatch(ComputeHelper._copyTextureBufferCS, width, height, 1);
    }

    static ClearTexture(source: BABYLON.BaseTexture, color: BABYLON.Color4): void {
        if (!ComputeHelper._clearTextureCS) {
            const engine = source.getScene()!.getEngine();
            const cs1 = new BABYLON.ComputeShader("clearTextureCompute", engine, { computeSource: ComputeHelper._clearTextureComputeShader }, { bindingsMapping:
                {
                    "tbuf": { group: 0, binding: 0 },
                    "params": { group: 0, binding: 1 },
                }
            });

            const uBuffer0 = new BABYLON.UniformBuffer(engine);

            uBuffer0.addUniform("color", 4);
            uBuffer0.addUniform("width", 1);
            uBuffer0.addUniform("height", 1);
            
            cs1.setUniformBuffer("params", uBuffer0);

            ComputeHelper._clearTextureCS = cs1;
            ComputeHelper._clearTextureParams = uBuffer0;
        }

        ComputeHelper._clearTextureCS.setStorageTexture("tbuf", source);

        const { width, height } = source.getSize();

        ComputeHelper._clearTextureParams.updateDirectColor4("color", color);
        ComputeHelper._clearTextureParams.updateInt("width", width);
        ComputeHelper._clearTextureParams.updateInt("height", height);
        ComputeHelper._clearTextureParams.update();

        ComputeHelper.Dispatch(ComputeHelper._clearTextureCS, width, height, 1);
    }

    static Dispatch(cs: BABYLON.ComputeShader, numIterationsX: number, numIterationsY = 1, numIterationsZ = 1): void {
        if (!(cs as any).threadGroupSizes) {
            (cs as any).threadGroupSizes = ComputeHelper.GetThreadGroupSizes(cs.shaderPath.computeSource, cs.options.entryPoint ?? "main");
        }

        const threadGroupSizes: BABYLON.Vector3 = (cs as any).threadGroupSizes;
        const numGroupsX = Math.ceil(numIterationsX / threadGroupSizes.x);
        const numGroupsY = Math.ceil(numIterationsY / threadGroupSizes.y);
        const numGroupsZ = Math.ceil(numIterationsZ / threadGroupSizes.z);
        
        cs.dispatch(numGroupsX, numGroupsY, numGroupsZ);
    }    
}
