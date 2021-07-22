[[group(0), binding(0)]] var H0 : texture_storage_2d<rgba32float, write>;

[[block]] struct Params {
    Size : u32;
    LengthScale : f32;
    CutoffHigh : f32;
    CutoffLow : f32;
    GravityAcceleration : f32;
    Depth : f32;
};

[[group(0), binding(5)]] var<uniform> params : Params;

[[group(0), binding(8)]] var H0K : texture_2d<f32>;

[[stage(compute), workgroup_size(8,8,1)]]
fn calculateConjugatedSpectrum([[builtin(global_invocation_id)]] id : vec3<u32>)
{
    let h0K = textureLoad(H0K, vec2<i32>(id.xy), 0).xy;
	let h0MinusK = textureLoad(H0K, vec2<i32>(i32(params.Size - id.x) % i32(params.Size), i32(params.Size - id.y) % i32(params.Size)), 0);

    textureStore(H0, vec2<i32>(id.xy), vec4<f32>(h0K.x, h0K.y, h0MinusK.x, -h0MinusK.y));
}
