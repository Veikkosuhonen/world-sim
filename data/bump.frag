#version 330

uniform sampler2D u_heightmap;
uniform vec2 u_resolution;

out vec4 fragColor;

// https://stackoverflow.com/a/5284527/13158159
vec4 getBump(vec2 st) {
    const vec2 size = vec2(0.01,0.0);
    const ivec3 off = ivec3(-1,0,1);

    float s11 = texture(u_heightmap, st).x;
    float s01 = textureOffset(u_heightmap, st, off.xy).x;
    float s21 = textureOffset(u_heightmap, st, off.zy).x;
    float s10 = textureOffset(u_heightmap, st, off.yx).x;
    float s12 = textureOffset(u_heightmap, st, off.yz).x;
    vec3 va = normalize(vec3(size.xy,s21-s01));
    vec3 vb = normalize(vec3(size.yx,s12-s10));
    vec4 bump = vec4( cross(va,vb), s11 );
    return bump;
}

void main() {
    vec2 st = gl_FragCoord.st / u_resolution;
    fragColor = getBump(st);
}
