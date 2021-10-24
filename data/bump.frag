#version 330

uniform sampler2D u_heightmap;
uniform vec2 u_resolution;

out vec4 fragColor;

// https://stackoverflow.com/a/5284527/13158159
vec4 getBump(vec2 st) {
    const vec2 size = vec2(0.01,0.0);
    const ivec3 off = ivec3(-1,0,1);

    vec2 data;

    data = texture(u_heightmap, st).xz;
    float s11 = data.x + data.y;

    data = textureOffset(u_heightmap, st, off.xy).xz;
    float s01 = data.x + data.y;

    data = textureOffset(u_heightmap, st, off.zy).xz;
    float s21 = data.x + data.y;

    data = textureOffset(u_heightmap, st, off.yx).xz;
    float s10 = data.x + data.y;

    data = textureOffset(u_heightmap, st, off.yz).xz;
    float s12 = data.x + data.y;

    vec3 va = normalize(vec3(size.xy,s21-s01));
    vec3 vb = normalize(vec3(size.yx,s12-s10));
    vec4 bump = vec4( cross(va,vb), s11 );
    return bump;
}

void main() {
    vec2 st = gl_FragCoord.st / u_resolution;
    fragColor = getBump(st);
}
