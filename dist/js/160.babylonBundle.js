(self.webpackChunkbabylonjs_typescript_webpack_simple_scene=self.webpackChunkbabylonjs_typescript_webpack_simple_scene||[]).push([[160,14],{7160:(e,t,r)=>{"use strict";r.r(t),r.d(t,{FFT:()=>a});var i=r(1465),n=r(7014),a=function(){function e(e,t,r,a,u){this._engine=e,this._rttDebug=r,this._debugFirstIndex=a,this._size=u,this._horizontalStepIFFT=[],this._verticalStepIFFT=[],this._permute=null;var o=new i.UJu("computeTwiddleFactors",this._engine,{computeSource:"let PI: f32 = 3.1415926;\r\n\r\n[[group(0), binding(0)]] var PrecomputeBuffer : texture_storage_2d<rgba32float, write>;\r\n\r\n[[block]] struct Params {\r\n    Step : i32;\r\n    Size : i32;\r\n};\r\n\r\n[[group(0), binding(1)]] var<uniform> params : Params;\r\n\r\nfn complexMult(a: vec2<f32>, b: vec2<f32>) -> vec2<f32>\r\n{\r\n\treturn vec2<f32>(a.r * b.r - a.g * b.g, a.r * b.g + a.g * b.r);\r\n}\r\n\r\nfn complexExp(a: vec2<f32>) -> vec2<f32>\r\n{\r\n\treturn vec2<f32>(cos(a.y), sin(a.y)) * exp(a.x);\r\n}\r\n\r\n[[stage(compute), workgroup_size(1,8,1)]]\r\nfn precomputeTwiddleFactorsAndInputIndices([[builtin(global_invocation_id)]] id : vec3<u32>)\r\n{\r\n    let iid = vec3<i32>(id);\r\n\tlet b = params.Size >> (id.x + 1u);\r\n\tlet mult = 2.0 * PI * vec2<f32>(0.0, -1.0) / f32(params.Size);\r\n\tlet i = (2 * b * (iid.y / b) + (iid.y % b)) % params.Size;\r\n\tlet twiddle = complexExp(mult * vec2<f32>(f32((iid.y / b) * b)));\r\n\t\r\n    textureStore(PrecomputeBuffer, iid.xy, vec4<f32>(twiddle.x, twiddle.y, f32(i), f32(i + b)));\r\n\ttextureStore(PrecomputeBuffer, vec2<i32>(iid.x, iid.y + params.Size / 2), vec4<f32>(-twiddle.x, -twiddle.y, f32(i), f32(i + b)));\r\n}\r\n"},{bindingsMapping:{PrecomputeBuffer:{group:0,binding:0},params:{group:0,binding:1}},entryPoint:"precomputeTwiddleFactorsAndInputIndices"}),p=0|Math.log2(u);this._precomputedData=n.ComputeHelper.CreateStorageTexture("precomputeTwiddle",this._engine,p,this._size,i.gTE.TEXTUREFORMAT_RGBA),this._rttDebug.setTexture(this._debugFirstIndex,"precomputeTwiddle",this._precomputedData),this._params=new i.Ms4(this._engine),this._params.addUniform("Step",1),this._params.addUniform("Size",1),o.setStorageTexture("PrecomputeBuffer",this._precomputedData),o.setUniformBuffer("params",this._params),this._params.updateInt("Size",this._size),this._params.update(),n.ComputeHelper.Dispatch(o,p,u/2,1),this._createComputeShaders()}return e.prototype.IFFT2D=function(e,t){for(var r=0|Math.log2(this._size),i=!1,a=0;a<r;++a)i=!i,this._params.updateInt("Step",a),this._params.update(),this._horizontalStepIFFT[0].setTexture("InputBuffer",i?e:t,!1),this._horizontalStepIFFT[0].setStorageTexture("OutputBuffer",i?t:e),n.ComputeHelper.Dispatch(this._horizontalStepIFFT[0],this._size,this._size,1);for(a=0;a<r;++a)i=!i,this._params.updateInt("Step",a),this._params.update(),this._verticalStepIFFT[0].setTexture("InputBuffer",i?e:t,!1),this._verticalStepIFFT[0].setStorageTexture("OutputBuffer",i?t:e),n.ComputeHelper.Dispatch(this._verticalStepIFFT[0],this._size,this._size,1);i&&n.ComputeHelper.CopyTexture(t,e,this._engine),this._permute.setTexture("InputBuffer",e,!1),this._permute.setStorageTexture("OutputBuffer",t),n.ComputeHelper.Dispatch(this._permute,this._size,this._size,1),n.ComputeHelper.CopyTexture(t,e,this._engine)},e.prototype.dispose=function(){this._precomputedData.dispose(),this._params.dispose()},e.prototype._createComputeShaders=function(){for(var e=0;e<2;++e)this._horizontalStepIFFT[e]=new i.UJu("horizontalStepIFFT",this._engine,{computeSource:"[[block]] struct Params {\r\n    Step : i32;\r\n    Size : i32;\r\n};\r\n\r\n[[group(0), binding(1)]] var<uniform> params : Params;\r\n\r\n[[group(0), binding(3)]] var PrecomputedData : texture_2d<f32>;\r\n\r\n[[group(0), binding(5)]] var InputBuffer : texture_2d<f32>;\r\n[[group(0), binding(6)]] var OutputBuffer : texture_storage_2d<rg32float, write>;\r\n\r\nfn complexMult(a: vec2<f32>, b: vec2<f32>) -> vec2<f32>\r\n{\r\n\treturn vec2<f32>(a.r * b.r - a.g * b.g, a.r * b.g + a.g * b.r);\r\n}\r\n\r\n[[stage(compute), workgroup_size(8,8,1)]]\r\nfn horizontalStepInverseFFT([[builtin(global_invocation_id)]] id : vec3<u32>)\r\n{\r\n    let iid = vec3<i32>(id);\r\n    let data = textureLoad(PrecomputedData, vec2<i32>(params.Step, iid.x), 0);\r\n\tlet inputsIndices = vec2<i32>(data.ba);\r\n\r\n    let input0 = textureLoad(InputBuffer, vec2<i32>(inputsIndices.x, iid.y), 0);\r\n    let input1 = textureLoad(InputBuffer, vec2<i32>(inputsIndices.y, iid.y), 0);\r\n\r\n    textureStore(OutputBuffer, iid.xy, vec4<f32>(\r\n        input0.xy + complexMult(vec2<f32>(data.r, -data.g), input1.xy), 0., 0.\r\n    ));\r\n}\r\n"},{bindingsMapping:{params:{group:0,binding:1},PrecomputedData:{group:0,binding:3},InputBuffer:{group:0,binding:5},OutputBuffer:{group:0,binding:6}},entryPoint:"horizontalStepInverseFFT"}),this._horizontalStepIFFT[e].setUniformBuffer("params",this._params),this._horizontalStepIFFT[e].setTexture("PrecomputedData",this._precomputedData,!1),this._verticalStepIFFT[e]=new i.UJu("verticalStepIFFT",this._engine,{computeSource:"[[block]] struct Params {\r\n    Step : i32;\r\n    Size : i32;\r\n};\r\n\r\n[[group(0), binding(1)]] var<uniform> params : Params;\r\n\r\n[[group(0), binding(3)]] var PrecomputedData : texture_2d<f32>;\r\n\r\n[[group(0), binding(5)]] var InputBuffer : texture_2d<f32>;\r\n[[group(0), binding(6)]] var OutputBuffer : texture_storage_2d<rg32float, write>;\r\n\r\nfn complexMult(a: vec2<f32>, b: vec2<f32>) -> vec2<f32>\r\n{\r\n\treturn vec2<f32>(a.r * b.r - a.g * b.g, a.r * b.g + a.g * b.r);\r\n}\r\n\r\n[[stage(compute), workgroup_size(8,8,1)]]\r\nfn verticalStepInverseFFT([[builtin(global_invocation_id)]] id : vec3<u32>)\r\n{\r\n    let iid = vec3<i32>(id);\r\n    let data = textureLoad(PrecomputedData, vec2<i32>(params.Step, iid.y), 0);\r\n\tlet inputsIndices = vec2<i32>(data.ba);\r\n\r\n    let input0 = textureLoad(InputBuffer, vec2<i32>(iid.x, inputsIndices.x), 0);\r\n    let input1 = textureLoad(InputBuffer, vec2<i32>(iid.x, inputsIndices.y), 0);\r\n\r\n    textureStore(OutputBuffer, iid.xy, vec4<f32>(\r\n        input0.xy + complexMult(vec2<f32>(data.r, -data.g), input1.xy), 0., 0.\r\n    ));\r\n}\r\n"},{bindingsMapping:{params:{group:0,binding:1},PrecomputedData:{group:0,binding:3},InputBuffer:{group:0,binding:5},OutputBuffer:{group:0,binding:6}},entryPoint:"verticalStepInverseFFT"}),this._verticalStepIFFT[e].setUniformBuffer("params",this._params),this._verticalStepIFFT[e].setTexture("PrecomputedData",this._precomputedData,!1);this._permute=new i.UJu("permute",this._engine,{computeSource:"[[group(0), binding(5)]] var InputBuffer : texture_2d<f32>;\r\n[[group(0), binding(6)]] var OutputBuffer : texture_storage_2d<rg32float, write>;\r\n\r\n[[stage(compute), workgroup_size(8,8,1)]]\r\nfn permute([[builtin(global_invocation_id)]] id : vec3<u32>)\r\n{\r\n    let iid = vec3<i32>(id);\r\n    let input = textureLoad(InputBuffer, iid.xy, 0);\r\n\r\n    textureStore(OutputBuffer, iid.xy, input * (1.0 - 2.0 * f32((iid.x + iid.y) % 2)));\r\n}\r\n"},{bindingsMapping:{InputBuffer:{group:0,binding:5},OutputBuffer:{group:0,binding:6}},entryPoint:"permute"})},e}()},7014:(e,t,r)=>{"use strict";r.r(t),r.d(t,{ComputeHelper:()=>n});var i=r(1465),n=function(){function e(){}return e.GetThreadGroupSizes=function(e,t){var r=new RegExp("workgroup_size\\s*\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)]]\\s*fn\\s+"+t+"\\s*\\(","g").exec(e);return r?new i.Pa4(parseInt(r[1]),parseInt(r[2]),parseInt(r[3])):new i.Pa4(1,1,1)},e.CreateStorageTexture=function(e,t,r,n,a,u,o,p,s,d){var c,g;void 0===a&&(a=i.gTE.TEXTUREFORMAT_RGBA),void 0===u&&(u=i.gTE.TEXTURETYPE_FLOAT),void 0===o&&(o=i.gTE.TEXTURE_NEAREST_SAMPLINGMODE),void 0===p&&(p=!1),void 0===s&&(s=i.gTE.TEXTURE_WRAP_ADDRESSMODE),void 0===d&&(d=null);var f=d?d.getSize():{width:0,height:0},l=f.width,m=f.height,_=d?null!==(c=d.getInternalTexture().type)&&void 0!==c?c:-1:-2,h=d?null!==(g=d.getInternalTexture().format)&&void 0!==g?g:-1:-2;return-1===_&&(_=i.gTE.TEXTURETYPE_UNSIGNED_BYTE),-1===h&&(h=i.gTE.TEXTUREFORMAT_RGBA),d&&l===r&&m===n&&u===_&&a===h||((d=new i.lMF(null,r,n,a,t,p,!1,o,u,i.gTE.TEXTURE_CREATIONFLAG_STORAGE)).name=e),d.wrapU=s,d.wrapV=s,d.updateSamplingMode(o),d},e.CopyTexture=function(t,r,n){var a,u,o=t.getInternalTexture().format===i.gTE.TEXTUREFORMAT_RG?2:4;if(!e._copyTexture4CS&&4===o||!e._copyTexture2CS&&2===o){var p=null!==(u=null===(a=t.getScene())||void 0===a?void 0:a.getEngine())&&void 0!==u?u:n,s=new i.UJu("copyTexture"+o+"Compute",p,{computeSource:4===o?e._copyTexture4ComputeShader:e._copyTexture2ComputeShader},{bindingsMapping:{dest:{group:0,binding:0},src:{group:0,binding:1},params:{group:0,binding:2}}}),d=new i.Ms4(p);d.addUniform("width",1),d.addUniform("height",1),s.setUniformBuffer("params",d),4===o?(e._copyTexture4CS=s,e._copyTexture4Params=d):(e._copyTexture2CS=s,e._copyTexture2Params=d)}var c=4===o?e._copyTexture4CS:e._copyTexture2CS,g=4===o?e._copyTexture4Params:e._copyTexture2Params;c.setTexture("src",t,!1),c.setStorageTexture("dest",r);var f=t.getSize(),l=f.width,m=f.height;g.updateInt("width",l),g.updateInt("height",m),g.update(),e.Dispatch(c,l,m,1)},e.CopyBufferToTexture=function(t,r){if(!e._copyBufferTextureCS){var n=r.getScene().getEngine(),a=new i.UJu("copyBufferTextureCompute",n,{computeSource:e._copyBufferTextureComputeShader},{bindingsMapping:{dest:{group:0,binding:0},src:{group:0,binding:1},params:{group:0,binding:2}}}),u=new i.Ms4(n);u.addUniform("width",1),u.addUniform("height",1),a.setUniformBuffer("params",u),e._copyBufferTextureCS=a,e._copyBufferTextureParams=u}e._copyBufferTextureCS.setStorageBuffer("src",t),e._copyBufferTextureCS.setStorageTexture("dest",r);var o=r.getSize(),p=o.width,s=o.height;e._copyBufferTextureParams.updateInt("width",p),e._copyBufferTextureParams.updateInt("height",s),e._copyBufferTextureParams.update(),e.Dispatch(e._copyBufferTextureCS,p,s,1)},e.CopyTextureToBuffer=function(t,r){if(!e._copyTextureBufferCS){var n=t.getScene().getEngine(),a=new i.UJu("copyTextureBufferCompute",n,{computeSource:e._copyTextureBufferComputeShader},{bindingsMapping:{src:{group:0,binding:0},dest:{group:0,binding:1},params:{group:0,binding:2}}}),u=new i.Ms4(n);u.addUniform("width",1),u.addUniform("height",1),a.setUniformBuffer("params",u),e._copyTextureBufferCS=a,e._copyTextureBufferParams=u}e._copyTextureBufferCS.setTexture("src",t,!1),e._copyTextureBufferCS.setStorageBuffer("dest",r);var o=t.getSize(),p=o.width,s=o.height;e._copyTextureBufferParams.updateInt("width",p),e._copyTextureBufferParams.updateInt("height",s),e._copyTextureBufferParams.update(),e.Dispatch(e._copyTextureBufferCS,p,s,1)},e.ClearTexture=function(t,r){if(!e._clearTextureCS){var n=t.getScene().getEngine(),a=new i.UJu("clearTextureCompute",n,{computeSource:e._clearTextureComputeShader},{bindingsMapping:{tbuf:{group:0,binding:0},params:{group:0,binding:1}}}),u=new i.Ms4(n);u.addUniform("color",4),u.addUniform("width",1),u.addUniform("height",1),a.setUniformBuffer("params",u),e._clearTextureCS=a,e._clearTextureParams=u}e._clearTextureCS.setStorageTexture("tbuf",t);var o=t.getSize(),p=o.width,s=o.height;e._clearTextureParams.updateDirectColor4("color",r),e._clearTextureParams.updateInt("width",p),e._clearTextureParams.updateInt("height",s),e._clearTextureParams.update(),e.Dispatch(e._clearTextureCS,p,s,1)},e.Dispatch=function(t,r,i,n){var a;void 0===i&&(i=1),void 0===n&&(n=1),t.threadGroupSizes||(t.threadGroupSizes=e.GetThreadGroupSizes(t.shaderPath.computeSource,null!==(a=t.options.entryPoint)&&void 0!==a?a:"main"));var u=t.threadGroupSizes,o=Math.ceil(r/u.x),p=Math.ceil(i/u.y),s=Math.ceil(n/u.z);t.dispatch(o,p,s)},e._clearTextureComputeShader="\n        [[group(0), binding(0)]] var tbuf : texture_storage_2d<rgba32float, write>;\n\n        [[block]] struct Params {\n            color : vec4<f32>;\n            width : u32;\n            height : u32;\n        };\n        [[group(0), binding(1)]] var<uniform> params : Params;\n\n        [[stage(compute), workgroup_size(8, 8, 1)]]\n        fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {\n            if (global_id.x >= params.width || global_id.y >= params.height) {\n                return;\n            }\n            textureStore(tbuf, vec2<i32>(global_id.xy), params.color);\n        }\n    ",e._copyTexture4ComputeShader="\n        [[group(0), binding(0)]] var dest : texture_storage_2d<rgba32float, write>;\n        [[group(0), binding(1)]] var src : texture_2d<f32>;\n\n        [[block]] struct Params {\n            width : u32;\n            height : u32;\n        };\n        [[group(0), binding(2)]] var<uniform> params : Params;\n\n        [[stage(compute), workgroup_size(8, 8, 1)]]\n        fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {\n            if (global_id.x >= params.width || global_id.y >= params.height) {\n                return;\n            }\n            let pix : vec4<f32> = textureLoad(src, vec2<i32>(global_id.xy), 0);\n            textureStore(dest, vec2<i32>(global_id.xy), pix);\n        }\n    ",e._copyTexture2ComputeShader="\n        [[group(0), binding(0)]] var dest : texture_storage_2d<rg32float, write>;\n        [[group(0), binding(1)]] var src : texture_2d<f32>;\n\n        [[block]] struct Params {\n            width : u32;\n            height : u32;\n        };\n        [[group(0), binding(2)]] var<uniform> params : Params;\n\n        [[stage(compute), workgroup_size(8, 8, 1)]]\n        fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {\n            if (global_id.x >= params.width || global_id.y >= params.height) {\n                return;\n            }\n            let pix : vec4<f32> = textureLoad(src, vec2<i32>(global_id.xy), 0);\n            textureStore(dest, vec2<i32>(global_id.xy), pix);\n        }\n    ",e._copyBufferTextureComputeShader="\n        [[block]] struct FloatArray {\n            elements : array<f32>;\n        };\n\n        [[group(0), binding(0)]] var dest : texture_storage_2d<rgba32float, write>;\n        [[group(0), binding(1)]] var<storage, read> src : FloatArray;\n\n        [[block]] struct Params {\n            width : u32;\n            height : u32;\n        };\n        [[group(0), binding(2)]] var<uniform> params : Params;\n\n        [[stage(compute), workgroup_size(8, 8, 1)]]\n        fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {\n            if (global_id.x >= params.width || global_id.y >= params.height) {\n                return;\n            }\n            let offset : u32 = global_id.y * params.width * 4u + global_id.x * 4u;\n            let pix : vec4<f32> = vec4<f32>(src.elements[offset], src.elements[offset + 1u], src.elements[offset + 2u], src.elements[offset + 3u]);\n            textureStore(dest, vec2<i32>(global_id.xy), pix);\n        }\n    ",e._copyTextureBufferComputeShader="\n        [[block]] struct FloatArray {\n            elements : array<f32>;\n        };\n\n        [[group(0), binding(0)]] var src : texture_2d<f32>;\n        [[group(0), binding(1)]] var<storage, write> dest : FloatArray;\n\n        [[block]] struct Params {\n            width : u32;\n            height : u32;\n        };\n        [[group(0), binding(2)]] var<uniform> params : Params;\n\n        [[stage(compute), workgroup_size(8, 8, 1)]]\n        fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {\n            if (global_id.x >= params.width || global_id.y >= params.height) {\n                return;\n            }\n            let offset : u32 = global_id.y * params.width * 4u + global_id.x * 4u;\n            let pix : vec4<f32> = textureLoad(src, vec2<i32>(global_id.xy), 0);\n            dest.elements[offset] = pix.r;\n            dest.elements[offset + 1u] = pix.g;\n            dest.elements[offset + 2u] = pix.b;\n            dest.elements[offset + 3u] = pix.a;\n        }\n    ",e}()}}]);
//# sourceMappingURL=160.babylonBundle.js.map