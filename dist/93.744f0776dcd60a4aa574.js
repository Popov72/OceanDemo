"use strict";(self.webpackChunkbabylonjs_ocean_demo=self.webpackChunkbabylonjs_ocean_demo||[]).push([[93,14],{6093:(e,t,r)=>{r.r(t),r.d(t,{InitialSpectrum:()=>i});var a=r(153),n=r(7014);class i{constructor(e,t,r,i,s){this._engine=e,this._rttDebug=t,this._debugFirstIndex=r,this._textureSize=i,this._phase1=new a.ComputeShader("initialSpectrum",this._engine,{computeSource:"let PI : f32 = 3.1415926;\r\n\r\n@group(0) @binding(1) var WavesData : texture_storage_2d<rgba32float, write>;\r\n@group(0) @binding(2) var H0K : texture_storage_2d<rg32float, write>;\r\n@group(0) @binding(4) var Noise : texture_2d<f32>;\r\n\r\nstruct Params {\r\n    Size : u32,\r\n    LengthScale : f32,\r\n    CutoffHigh : f32,\r\n    CutoffLow : f32,\r\n    GravityAcceleration : f32,\r\n    Depth : f32,\r\n};\r\n\r\n@group(0) @binding(5) var<uniform> params : Params;\r\n\r\nstruct SpectrumParameter {\r\n\tscale : f32,\r\n\tangle : f32,\r\n\tspreadBlend : f32,\r\n\tswell : f32,\r\n\talpha : f32,\r\n\tpeakOmega : f32,\r\n\tgamma : f32,\r\n\tshortWavesFade : f32,\r\n};\r\n\r\nstruct SpectrumParameters {\r\n    elements : array<SpectrumParameter>,\r\n};\r\n\r\n@group(0) @binding(6) var<storage, read> spectrums : SpectrumParameters;\r\n\r\nfn frequency(k: f32, g: f32, depth: f32) -> f32\r\n{\r\n\treturn sqrt(g * k * tanh(min(k * depth, 20.0)));\r\n}\r\n\r\nfn frequencyDerivative(k: f32, g: f32, depth: f32) -> f32\r\n{\r\n\tlet th = tanh(min(k * depth, 20.0));\r\n\tlet ch = cosh(k * depth);\r\n\treturn g * (depth * k / ch / ch + th) / frequency(k, g, depth) / 2.0;\r\n}\r\n\r\nfn normalisationFactor(s: f32) -> f32\r\n{\r\n\tlet s2 = s * s;\r\n\tlet s3 = s2 * s;\r\n\tlet s4 = s3 * s;\r\n\tif (s < 5.0) {\r\n\t\treturn -0.000564 * s4 + 0.00776 * s3 - 0.044 * s2 + 0.192 * s + 0.163;\r\n    }\r\n\treturn -4.80e-08 * s4 + 1.07e-05 * s3 - 9.53e-04 * s2 + 5.90e-02 * s + 3.93e-01;\r\n}\r\n\r\nfn cosine2s(theta: f32, s: f32) -> f32\r\n{\r\n\treturn normalisationFactor(s) * pow(abs(cos(0.5 * theta)), 2.0 * s);\r\n}\r\n\r\nfn spreadPower(omega: f32, peakOmega: f32) -> f32\r\n{\r\n\tif (omega > peakOmega) {\r\n\t\treturn 9.77 * pow(abs(omega / peakOmega), -2.5);\r\n\t}\r\n\treturn 6.97 * pow(abs(omega / peakOmega), 5.0);\r\n}\r\n\r\nfn directionSpectrum(theta: f32, omega: f32, pars: SpectrumParameter) -> f32\r\n{\r\n\tlet s = spreadPower(omega, pars.peakOmega) + 16.0 * tanh(min(omega / pars.peakOmega, 20.0)) * pars.swell * pars.swell;\r\n\treturn mix(2.0 / PI * cos(theta) * cos(theta), cosine2s(theta - pars.angle, s), pars.spreadBlend);\r\n}\r\n\r\nfn TMACorrection(omega: f32, g: f32, depth: f32) -> f32\r\n{\r\n\tlet omegaH = omega * sqrt(depth / g);\r\n\tif (omegaH <= 1.0) {\r\n\t\treturn 0.5 * omegaH * omegaH;\r\n    }\r\n\tif (omegaH < 2.0) {\r\n\t\treturn 1.0 - 0.5 * (2.0 - omegaH) * (2.0 - omegaH);\r\n    }\r\n\treturn 1.0;\r\n}\r\n\r\nfn JONSWAP(omega: f32, g: f32, depth: f32, pars: SpectrumParameter) -> f32\r\n{\r\n\tvar sigma: f32;\r\n\tif (omega <= pars.peakOmega) {\r\n\t\tsigma = 0.07;\r\n    } else {\r\n\t\tsigma = 0.09;\r\n    }\r\n\tlet r = exp(-(omega - pars.peakOmega) * (omega - pars.peakOmega) / 2.0 / sigma / sigma / pars.peakOmega / pars.peakOmega);\r\n\t\r\n\tlet oneOverOmega = 1.0 / omega;\r\n\tlet peakOmegaOverOmega = pars.peakOmega / omega;\r\n\r\n\treturn pars.scale * TMACorrection(omega, g, depth) * pars.alpha * g * g\r\n\t\t* oneOverOmega * oneOverOmega * oneOverOmega * oneOverOmega * oneOverOmega\r\n\t\t* exp(-1.25 * peakOmegaOverOmega * peakOmegaOverOmega * peakOmegaOverOmega * peakOmegaOverOmega)\r\n\t\t* pow(abs(pars.gamma), r);\r\n}\r\n\r\nfn shortWavesFade(kLength: f32, pars: SpectrumParameter) -> f32\r\n{\r\n\treturn exp(-pars.shortWavesFade * pars.shortWavesFade * kLength * kLength);\r\n}\r\n\r\n@stage(compute) @workgroup_size(8,8,1)\r\nfn calculateInitialSpectrum(@builtin(global_invocation_id) id : vec3<u32>)\r\n{\r\n\tlet deltaK = 2.0 * PI / params.LengthScale;\r\n\tlet nx = f32(id.x) - f32(params.Size) / 2.0;\r\n\tlet nz = f32(id.y) - f32(params.Size) / 2.0;\r\n\tlet k = vec2<f32>(nx, nz) * deltaK;\r\n\tlet kLength = length(k);\r\n\r\n\tif (kLength <= params.CutoffHigh && kLength >= params.CutoffLow) {\r\n\t\tlet omega = frequency(kLength, params.GravityAcceleration, params.Depth);\r\n\t\ttextureStore(WavesData, vec2<i32>(id.xy), vec4<f32>(k.x, 1.0 / kLength, k.y, omega));\r\n\r\n\t\tlet kAngle = atan2(k.y, k.x);\r\n\t\tlet dOmegadk = frequencyDerivative(kLength, params.GravityAcceleration, params.Depth);\r\n\t\tvar spectrum = JONSWAP(omega, params.GravityAcceleration, params.Depth, spectrums.elements[0]) * directionSpectrum(kAngle, omega, spectrums.elements[0]) * shortWavesFade(kLength, spectrums.elements[0]);\r\n\t\tif (spectrums.elements[1].scale > 0.0) {\r\n\t\t\tspectrum = spectrum + JONSWAP(omega, params.GravityAcceleration, params.Depth, spectrums.elements[1]) * directionSpectrum(kAngle, omega, spectrums.elements[1]) * shortWavesFade(kLength, spectrums.elements[1]);\r\n        }\r\n        let noise = textureLoad(Noise, vec2<i32>(id.xy), 0).xy;\r\n        textureStore(H0K, vec2<i32>(id.xy), vec4<f32>(noise * sqrt(2.0 * spectrum * abs(dOmegadk) / kLength * deltaK * deltaK), 0., 0.));\r\n\t} else {\r\n\t\ttextureStore(H0K, vec2<i32>(id.xy), vec4<f32>(0.0));\r\n\t\ttextureStore(WavesData, vec2<i32>(id.xy), vec4<f32>(k.x, 1.0, k.y, 0.0));\r\n\t}    \r\n}\r\n"},{bindingsMapping:{WavesData:{group:0,binding:1},H0K:{group:0,binding:2},Noise:{group:0,binding:4},params:{group:0,binding:5},spectrumParameters:{group:0,binding:6}},entryPoint:"calculateInitialSpectrum"}),this._initialSpectrum=n.ComputeHelper.CreateStorageTexture("h0",e,i,i,a.Constants.TEXTUREFORMAT_RGBA),this._precomputedData=n.ComputeHelper.CreateStorageTexture("wavesData",e,i,i,a.Constants.TEXTUREFORMAT_RGBA),this._buffer=n.ComputeHelper.CreateStorageTexture("h0k",e,i,i,a.Constants.TEXTUREFORMAT_RG),this._spectrumParameters=new a.StorageBuffer(this._engine,64,a.Constants.BUFFER_CREATIONFLAG_READWRITE),this._params=new a.UniformBuffer(this._engine),this._params.addUniform("Size",1),this._params.addUniform("LengthScale",1),this._params.addUniform("CutoffHigh",1),this._params.addUniform("CutoffLow",1),this._params.addUniform("GravityAcceleration",1),this._params.addUniform("Depth",1),this._phase1.setStorageTexture("WavesData",this._precomputedData),this._phase1.setStorageTexture("H0K",this._buffer),this._phase1.setTexture("Noise",s,!1),this._phase1.setStorageBuffer("spectrumParameters",this._spectrumParameters),this._phase1.setUniformBuffer("params",this._params),this._phase2=new a.ComputeShader("initialSpectrum2",this._engine,{computeSource:"@group(0) @binding(0) var H0 : texture_storage_2d<rgba32float, write>;\r\n\r\nstruct Params {\r\n    Size : u32,\r\n    LengthScale : f32,\r\n    CutoffHigh : f32,\r\n    CutoffLow : f32,\r\n    GravityAcceleration : f32,\r\n    Depth : f32,\r\n};\r\n\r\n@group(0) @binding(5) var<uniform> params : Params;\r\n\r\n@group(0) @binding(8) var H0K : texture_2d<f32>;\r\n\r\n@stage(compute) @workgroup_size(8,8,1)\r\nfn calculateConjugatedSpectrum(@builtin(global_invocation_id) id : vec3<u32>)\r\n{\r\n    let h0K = textureLoad(H0K, vec2<i32>(id.xy), 0).xy;\r\n\tlet h0MinusK = textureLoad(H0K, vec2<i32>(i32(params.Size - id.x) % i32(params.Size), i32(params.Size - id.y) % i32(params.Size)), 0);\r\n\r\n    textureStore(H0, vec2<i32>(id.xy), vec4<f32>(h0K.x, h0K.y, h0MinusK.x, -h0MinusK.y));\r\n}\r\n"},{bindingsMapping:{H0:{group:0,binding:0},params:{group:0,binding:5},H0K:{group:0,binding:8}},entryPoint:"calculateConjugatedSpectrum"}),this._phase2.setStorageTexture("H0",this._initialSpectrum),this._phase2.setUniformBuffer("params",this._params),this._phase2.setTexture("H0K",this._buffer,!1),this._rttDebug.setTexture(this._debugFirstIndex+0,"waves precompute",this._precomputedData),this._rttDebug.setTexture(this._debugFirstIndex+1,"H0K",this._buffer,1e3),this._rttDebug.setTexture(this._debugFirstIndex+2,"H0",this._initialSpectrum,1e3)}get initialSpectrum(){return this._initialSpectrum}get wavesData(){return this._precomputedData}generate(e,t,r,a){this._params.updateInt("Size",this._textureSize),this._params.updateFloat("LengthScale",t),this._params.updateFloat("CutoffHigh",a),this._params.updateFloat("CutoffLow",r),e.setParametersToShader(this._params,this._spectrumParameters),this._params.update(),n.ComputeHelper.Dispatch(this._phase1,this._textureSize,this._textureSize,1),n.ComputeHelper.Dispatch(this._phase2,this._textureSize,this._textureSize,1)}dispose(){this._spectrumParameters.dispose(),this._params.dispose(),this._precomputedData.dispose(),this._buffer.dispose(),this._initialSpectrum.dispose(),this._phase1=null,this._phase2=null}}},7014:(e,t,r)=>{r.r(t),r.d(t,{ComputeHelper:()=>n});var a=r(153);class n{static GetThreadGroupSizes(e,t){const r=new RegExp(`workgroup_size\\s*\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)\\s*fn\\s+${t}\\s*\\(`,"g").exec(e);return r?new a.Vector3(parseInt(r[1]),parseInt(r[2]),parseInt(r[3])):new a.Vector3(1,1,1)}static CreateStorageTexture(e,t,r,n,i=a.Constants.TEXTUREFORMAT_RGBA,s=a.Constants.TEXTURETYPE_FLOAT,o=a.Constants.TEXTURE_NEAREST_SAMPLINGMODE,u=!1,p=a.Constants.TEXTURE_WRAP_ADDRESSMODE,g=null){var m,d;const{width:c,height:f}=g?g.getSize():{width:0,height:0};let h=g?null!==(m=g.getInternalTexture().type)&&void 0!==m?m:-1:-2,l=g?null!==(d=g.getInternalTexture().format)&&void 0!==d?d:-1:-2;return-1===h&&(h=a.Constants.TEXTURETYPE_UNSIGNED_BYTE),-1===l&&(l=a.Constants.TEXTUREFORMAT_RGBA),g&&c===r&&f===n&&s===h&&i===l||((g=new a.RawTexture(null,r,n,i,t,u,!1,o,s,a.Constants.TEXTURE_CREATIONFLAG_STORAGE)).name=e),g.wrapU=p,g.wrapV=p,g.updateSamplingMode(o),g}static CopyTexture(e,t,r){var i,s;const o=e.getInternalTexture().format===a.Constants.TEXTUREFORMAT_RG?2:4;if(!n._copyTexture4CS&&4===o||!n._copyTexture2CS&&2===o){const t=null!==(s=null===(i=e.getScene())||void 0===i?void 0:i.getEngine())&&void 0!==s?s:r,u=new a.ComputeShader(`copyTexture${o}Compute`,t,{computeSource:4===o?n._copyTexture4ComputeShader:n._copyTexture2ComputeShader},{bindingsMapping:{dest:{group:0,binding:0},src:{group:0,binding:1},params:{group:0,binding:2}}}),p=new a.UniformBuffer(t);p.addUniform("width",1),p.addUniform("height",1),u.setUniformBuffer("params",p),4===o?(n._copyTexture4CS=u,n._copyTexture4Params=p):(n._copyTexture2CS=u,n._copyTexture2Params=p)}const u=4===o?n._copyTexture4CS:n._copyTexture2CS,p=4===o?n._copyTexture4Params:n._copyTexture2Params;u.setTexture("src",e,!1),u.setStorageTexture("dest",t);const{width:g,height:m}=e.getSize();p.updateInt("width",g),p.updateInt("height",m),p.update(),n.Dispatch(u,g,m,1)}static CopyBufferToTexture(e,t){if(!n._copyBufferTextureCS){const e=t.getScene().getEngine(),r=new a.ComputeShader("copyBufferTextureCompute",e,{computeSource:n._copyBufferTextureComputeShader},{bindingsMapping:{dest:{group:0,binding:0},src:{group:0,binding:1},params:{group:0,binding:2}}}),i=new a.UniformBuffer(e);i.addUniform("width",1),i.addUniform("height",1),r.setUniformBuffer("params",i),n._copyBufferTextureCS=r,n._copyBufferTextureParams=i}n._copyBufferTextureCS.setStorageBuffer("src",e),n._copyBufferTextureCS.setStorageTexture("dest",t);const{width:r,height:i}=t.getSize();n._copyBufferTextureParams.updateInt("width",r),n._copyBufferTextureParams.updateInt("height",i),n._copyBufferTextureParams.update(),n.Dispatch(n._copyBufferTextureCS,r,i,1)}static CopyTextureToBuffer(e,t){if(!n._copyTextureBufferCS){const t=e.getScene().getEngine(),r=new a.ComputeShader("copyTextureBufferCompute",t,{computeSource:n._copyTextureBufferComputeShader},{bindingsMapping:{src:{group:0,binding:0},dest:{group:0,binding:1},params:{group:0,binding:2}}}),i=new a.UniformBuffer(t);i.addUniform("width",1),i.addUniform("height",1),r.setUniformBuffer("params",i),n._copyTextureBufferCS=r,n._copyTextureBufferParams=i}n._copyTextureBufferCS.setTexture("src",e,!1),n._copyTextureBufferCS.setStorageBuffer("dest",t);const{width:r,height:i}=e.getSize();n._copyTextureBufferParams.updateInt("width",r),n._copyTextureBufferParams.updateInt("height",i),n._copyTextureBufferParams.update(),n.Dispatch(n._copyTextureBufferCS,r,i,1)}static ClearTexture(e,t){if(!n._clearTextureCS){const t=e.getScene().getEngine(),r=new a.ComputeShader("clearTextureCompute",t,{computeSource:n._clearTextureComputeShader},{bindingsMapping:{tbuf:{group:0,binding:0},params:{group:0,binding:1}}}),i=new a.UniformBuffer(t);i.addUniform("color",4),i.addUniform("width",1),i.addUniform("height",1),r.setUniformBuffer("params",i),n._clearTextureCS=r,n._clearTextureParams=i}n._clearTextureCS.setStorageTexture("tbuf",e);const{width:r,height:i}=e.getSize();n._clearTextureParams.updateDirectColor4("color",t),n._clearTextureParams.updateInt("width",r),n._clearTextureParams.updateInt("height",i),n._clearTextureParams.update(),n.Dispatch(n._clearTextureCS,r,i,1)}static Dispatch(e,t,r=1,a=1){var i;e.threadGroupSizes||(e.threadGroupSizes=n.GetThreadGroupSizes(e.shaderPath.computeSource,null!==(i=e.options.entryPoint)&&void 0!==i?i:"main"));const s=e.threadGroupSizes,o=Math.ceil(t/s.x),u=Math.ceil(r/s.y),p=Math.ceil(a/s.z);e.dispatch(o,u,p)}}n._clearTextureComputeShader="\n        @group(0) @binding(0) var tbuf : texture_storage_2d<rgba32float, write>;\n\n        struct Params {\n            color : vec4<f32>,\n            width : u32,\n            height : u32,\n        };\n        @group(0) @binding(1) var<uniform> params : Params;\n\n        @stage(compute) @workgroup_size(8, 8, 1)\n        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {\n            if (global_id.x >= params.width || global_id.y >= params.height) {\n                return;\n            }\n            textureStore(tbuf, vec2<i32>(global_id.xy), params.color);\n        }\n    ",n._copyTexture4ComputeShader="\n        @group(0) @binding(0) var dest : texture_storage_2d<rgba32float, write>;\n        @group(0) @binding(1) var src : texture_2d<f32>;\n\n        struct Params {\n            width : u32,\n            height : u32,\n        };\n        @group(0) @binding(2) var<uniform> params : Params;\n\n        @stage(compute) @workgroup_size(8, 8, 1)\n        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {\n            if (global_id.x >= params.width || global_id.y >= params.height) {\n                return;\n            }\n            let pix : vec4<f32> = textureLoad(src, vec2<i32>(global_id.xy), 0);\n            textureStore(dest, vec2<i32>(global_id.xy), pix);\n        }\n    ",n._copyTexture2ComputeShader="\n        @group(0) @binding(0) var dest : texture_storage_2d<rg32float, write>;\n        @group(0) @binding(1) var src : texture_2d<f32>;\n\n        struct Params {\n            width : u32,\n            height : u32,\n        };\n        @group(0) @binding(2) var<uniform> params : Params;\n\n        @stage(compute) @workgroup_size(8, 8, 1)\n        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {\n            if (global_id.x >= params.width || global_id.y >= params.height) {\n                return;\n            }\n            let pix : vec4<f32> = textureLoad(src, vec2<i32>(global_id.xy), 0);\n            textureStore(dest, vec2<i32>(global_id.xy), pix);\n        }\n    ",n._copyBufferTextureComputeShader="\n        struct FloatArray {\n            elements : array<f32>,\n        };\n\n        @group(0) @binding(0) var dest : texture_storage_2d<rgba32float, write>;\n        @group(0) @binding(1) var<storage, read> src : FloatArray;\n\n        struct Params {\n            width : u32,\n            height : u32,\n        };\n        @group(0) @binding(2) var<uniform> params : Params;\n\n        @stage(compute) @workgroup_size(8, 8, 1)\n        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {\n            if (global_id.x >= params.width || global_id.y >= params.height) {\n                return;\n            }\n            let offset : u32 = global_id.y * params.width * 4u + global_id.x * 4u;\n            let pix : vec4<f32> = vec4<f32>(src.elements[offset], src.elements[offset + 1u], src.elements[offset + 2u], src.elements[offset + 3u]);\n            textureStore(dest, vec2<i32>(global_id.xy), pix);\n        }\n    ",n._copyTextureBufferComputeShader="\n        struct FloatArray {\n            elements : array<f32>,\n        };\n\n        @group(0) @binding(0) var src : texture_2d<f32>;\n        @group(0) @binding(1) var<storage, write> dest : FloatArray;\n\n        struct Params {\n            width : u32,\n            height : u32,\n        };\n        @group(0) @binding(2) var<uniform> params : Params;\n\n        @stage(compute), workgroup_size(8, 8, 1)\n        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {\n            if (global_id.x >= params.width || global_id.y >= params.height) {\n                return;\n            }\n            let offset : u32 = global_id.y * params.width * 4u + global_id.x * 4u;\n            let pix : vec4<f32> = textureLoad(src, vec2<i32>(global_id.xy), 0);\n            dest.elements[offset] = pix.r;\n            dest.elements[offset + 1u] = pix.g;\n            dest.elements[offset + 2u] = pix.b;\n            dest.elements[offset + 3u] = pix.a;\n        }\n    "}}]);
//# sourceMappingURL=93.744f0776dcd60a4aa574.js.map