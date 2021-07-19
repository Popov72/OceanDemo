[[group(0), binding(0)]] var tbuf : texture_storage_2d<rgba8unorm,write>;

[[block]] struct Params {
    color : vec4<f32>;
};
[[group(0), binding(1)]] var<uniform> params : Params;

[[block]] struct Params2 {
    color : vec4<f32>;
};
[[group(0), binding(2)]] var<uniform> params2 : Params2;

[[stage(compute), workgroup_size(1, 1, 1)]]
fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {
    textureStore(tbuf, vec2<i32>(global_id.xy), params.color);
}

[[stage(compute), workgroup_size(1, 1, 1)]]
fn myMethod([[builtin(global_invocation_id)]] global_id : vec3<u32>) {
    textureStore(tbuf, vec2<i32>(global_id.xy), params2.color);
}
