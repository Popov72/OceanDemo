#extension GL_EXT_samplerless_texture_functions : enable

precision highp float;

attribute vec3 position;

uniform mat4 world;
uniform mat4 viewProjection;

uniform vec3 _WorldSpaceCameraPos;
uniform float _LOD_scale;
uniform float LengthScale0;

uniform sampler2D _Displacement_c0;

varying vec2 vUVCoords_c0;

void main(void) {
    vec4 worldPos = world * vec4(position, 1.0);
    vec4 worldUV = vec4(worldPos.xz, 0, 0);

    vec3 viewVector = _WorldSpaceCameraPos - worldPos.xyz;
    float viewDist = length(viewVector);

    float lod_c0 = min(_LOD_scale * LengthScale0 / viewDist, 1.0);

    vec3 displacement = vec3(0.);
    float largeWavesBias = 0.;

    vUVCoords_c0 = worldUV.xy / LengthScale0;

    displacement += texture2D(_Displacement_c0, vUVCoords_c0).xyz * lod_c0;
    largeWavesBias = displacement.y;

    vec3 p = worldPos.xyz + displacement;

    gl_Position = viewProjection * vec4(p, 1.0);
}
