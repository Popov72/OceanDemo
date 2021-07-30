precision highp float;

uniform sampler2D _Derivatives_c0;

varying vec2 vUVCoords_c0;

void main(void) {
    vec4 derivatives = texture2D(_Derivatives_c0, vUVCoords_c0);
    vec2 slope = vec2(derivatives.x / (1.0 + derivatives.z), derivatives.y / (1.0 + derivatives.w));
    vec3 worldNormal = normalize(vec3(-slope.x, 1.0, -slope.y));

    gl_FragColor = vec4((worldNormal + vec3(1.)) / vec3(2.), 1.);
}
