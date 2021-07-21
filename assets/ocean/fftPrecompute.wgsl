let PI: f32 = 3.1415926;

[[group(0), binding(0)]] var PrecomputeBuffer : texture_storage_2d<rgba32float, write>;

[[block]] struct Params {
    Step : i32;
    Size : i32;
};

[[group(0), binding(1)]] var<uniform> params : Params;

fn complexMult(a: vec2<f32>, b: vec2<f32>) -> vec2<f32>
{
	return vec2<f32>(a.r * b.r - a.g * b.g, a.r * b.g + a.g * b.r);
}

fn complexExp(a: vec2<f32>) -> vec2<f32>
{
	return vec2<f32>(cos(a.y), sin(a.y)) * exp(a.x);
}

[[stage(compute), workgroup_size(1,8,1)]]
fn precomputeTwiddleFactorsAndInputIndices([[builtin(global_invocation_id)]] id : vec3<u32>)
{
    let iid = vec3<i32>(id);
	let b = params.Size >> (id.x + 1u);
	let mult = 2.0 * PI * vec2<f32>(0.0, -1.0) / f32(params.Size);
	let i = (2 * b * (iid.y / b) + (iid.y % b)) % params.Size;
	let twiddle = complexExp(mult * vec2<f32>(f32((iid.y / b) * b)));
	
    textureStore(PrecomputeBuffer, iid.xy, vec4<f32>(twiddle.x, twiddle.y, f32(i), f32(i + b)));
	textureStore(PrecomputeBuffer, vec2<i32>(iid.x, iid.y + params.Size / 2), vec4<f32>(-twiddle.x, -twiddle.y, f32(i), f32(i + b)));
}
