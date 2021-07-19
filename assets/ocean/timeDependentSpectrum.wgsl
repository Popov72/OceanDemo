[[group(0), binding(0)]] var H0Sampler : sampler;
[[group(0), binding(1)]] var H0 : texture_2d<f32>;
[[group(0), binding(2)]] var WavesDataSampler : sampler;
[[group(0), binding(3)]] var WavesData : texture_2d<f32>;

[[block]] struct Params {
    Time : f32;
};

[[group(0), binding(4)]] var<uniform> params : Params;

[[group(0), binding(5)]] var DxDz_DyDxz : texture_storage_2d<rgba32float, write>;
[[group(0), binding(6)]] var DyxDyz_DxxDzz : texture_storage_2d<rgba32float, write>;

fn complexMult(a: vec2<f32>, b: vec2<f32>) -> vec2<f32>
{
	return vec2<f32>(a.r * b.r - a.g * b.g, a.r * b.g + a.g * b.r);
}

[[stage(compute), workgroup_size(8,8,1)]]
fn calculateAmplitudes([[builtin(global_invocation_id)]] id : vec3<u32>)
{
    ignore(H0Sampler);
    ignore(WavesDataSampler);

    let iid = vec3<i32>(id);
	let wave = textureLoad(WavesData, iid.xy, 0);
	let phase = wave.w * params.Time;
	let exponent = vec2<f32>(cos(phase), sin(phase));
    let h0 = textureLoad(H0, iid.xy, 0);
	let h = complexMult(h0.xy, exponent) + complexMult(h0.zw, vec2<f32>(exponent.x, -exponent.y));
	let ih = vec2<f32>(-h.y, h.x);
	
	let displacementX = ih * wave.x * wave.y;
	let displacementY = h;
	let displacementZ = ih * wave.z * wave.y;
		 
	let displacementX_dx = -h * wave.x * wave.x * wave.y;
	let displacementY_dx = ih * wave.x;
	let displacementZ_dx = -h * wave.x * wave.z * wave.y;
		 
	let displacementY_dz = ih * wave.z;
	let displacementZ_dz = -h * wave.z * wave.z * wave.y;
	
	textureStore(DxDz_DyDxz, iid.xy,   vec4<f32>(displacementX.x - displacementZ.y, displacementX.y + displacementZ.x, displacementY.x - displacementZ_dx.y, displacementY.y + displacementZ_dx.x));
	textureStore(DyxDyz_DxxDzz, iid.xy, vec4<f32>(displacementY_dx.x - displacementY_dz.y, displacementY_dx.y + displacementY_dz.x, displacementX_dx.x - displacementZ_dz.y, displacementX_dx.y + displacementZ_dz.x));
}
