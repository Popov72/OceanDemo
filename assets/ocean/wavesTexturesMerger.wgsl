[[block]] struct Params {
    Lambda : f32;
    DeltaTime : f32;
};

[[group(0), binding(0)]] var<uniform> params : Params;

[[group(0), binding(1)]] var Displacement : texture_storage_2d<rgba32float, write>;
[[group(0), binding(2)]] var Derivatives : texture_storage_2d<rgba32float, write>;
[[group(0), binding(3)]] var Turbulence : texture_storage_2d<rgba32float, write>;

[[group(0), binding(4)]] var Dx_DzSampler : sampler;
[[group(0), binding(5)]] var Dx_Dz : texture_2d<f32>;
[[group(0), binding(6)]] var Dy_DxzSampler : sampler;
[[group(0), binding(7)]] var Dy_Dxz : texture_2d<f32>;
[[group(0), binding(8)]] var Dyx_DyzSampler : sampler;
[[group(0), binding(9)]] var Dyx_Dyz : texture_2d<f32>;
[[group(0), binding(10)]] var Dxx_DzzSampler : sampler;
[[group(0), binding(11)]] var Dxx_Dzz : texture_2d<f32>;

[[stage(compute), workgroup_size(8,8,1)]]
fn fillResultTextures([[builtin(global_invocation_id)]] id : vec3<u32>)
{
    ignore(Dx_DzSampler);
    ignore(Dy_DxzSampler);
    ignore(Dyx_DyzSampler);
    ignore(Dxx_DzzSampler);

    let iid = vec3<i32>(id);

	let DxDz = textureLoad(Dx_Dz, iid.xy, 0);
	let DyDxz = textureLoad(Dy_Dxz, iid.xy, 0);
	let DyxDyz = textureLoad(Dyx_Dyz, iid.xy, 0);
	let DxxDzz = textureLoad(Dxx_Dzz, iid.xy, 0);
	
	textureStore(Displacement, iid.xy, vec4<f32>(params.Lambda * DxDz.x, DyDxz.x, params.Lambda * DxDz.y, 0.));
	textureStore(Derivatives, iid.xy, vec4<f32>(DyxDyz.x, DyxDyz.y, DxxDzz.x * params.Lambda, DxxDzz.y * params.Lambda));

	let jacobian = (1.0 + params.Lambda * DxxDzz.x) * (1.0 + params.Lambda * DxxDzz.y) - params.Lambda * params.Lambda * DyDxz.y * DyDxz.y;

    var turbulence = params.DeltaTime * 0.5 / max(jacobian, 0.5);
    turbulence = min(jacobian, turbulence);

    textureStore(Turbulence, iid.xy, vec4<f32>(turbulence, turbulence, turbulence, 1.));
}
