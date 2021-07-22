[[group(0), binding(5)]] var InputBuffer : texture_2d<f32>;
[[group(0), binding(6)]] var OutputBuffer : texture_storage_2d<rg32float, write>;

[[stage(compute), workgroup_size(8,8,1)]]
fn permute([[builtin(global_invocation_id)]] id : vec3<u32>)
{
    let iid = vec3<i32>(id);
    let input = textureLoad(InputBuffer, iid.xy, 0);

    textureStore(OutputBuffer, iid.xy, input * (1.0 - 2.0 * f32((iid.x + iid.y) % 2)));
}
