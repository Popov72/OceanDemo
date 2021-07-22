[[block]] struct Params {
    Step : i32;
    Size : i32;
};

[[group(0), binding(1)]] var<uniform> params : Params;

[[group(0), binding(3)]] var PrecomputedData : texture_2d<f32>;

[[group(0), binding(5)]] var InputBuffer : texture_2d<f32>;
[[group(0), binding(6)]] var OutputBuffer : texture_storage_2d<rg32float, write>;

fn complexMult(a: vec2<f32>, b: vec2<f32>) -> vec2<f32>
{
	return vec2<f32>(a.r * b.r - a.g * b.g, a.r * b.g + a.g * b.r);
}

[[stage(compute), workgroup_size(8,8,1)]]
fn verticalStepInverseFFT([[builtin(global_invocation_id)]] id : vec3<u32>)
{
    let iid = vec3<i32>(id);
    let data = textureLoad(PrecomputedData, vec2<i32>(params.Step, iid.y), 0);
	let inputsIndices = vec2<i32>(data.ba);

    let input0 = textureLoad(InputBuffer, vec2<i32>(iid.x, inputsIndices.x), 0);
    let input1 = textureLoad(InputBuffer, vec2<i32>(iid.x, inputsIndices.y), 0);

    textureStore(OutputBuffer, iid.xy, vec4<f32>(
        input0.xy + complexMult(vec2<f32>(data.r, -data.g), input1.xy), 0., 0.
    ));
}
