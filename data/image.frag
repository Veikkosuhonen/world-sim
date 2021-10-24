#version 330

uniform sampler2D u_heightmap;
uniform sampler2D u_bump;
uniform vec2 u_resolution;

out vec4 fragColor;

const vec3 WATER = vec3(0.1, 0.4, 0.6);
const vec3 SAND = vec3(0.9, 0.8, 0.6);
const vec3 GRASS = vec3(0.2, 0.6, 0.4);
const vec3 ROCK = vec3(0.4, 0.45, 0.5);

const float WATER_LEVEL = 0.3;

const vec3 SUN_DIR = normalize(vec3(1.0, 1.0, 1.0));

float isWater(vec2 state) {
    return min(step(state.x, WATER_LEVEL),1.0);// + step(0.6, state.y), 1.0);
}

float isSand(float height) {
    return step(WATER_LEVEL, height) * (1.0 - smoothstep(WATER_LEVEL + 0.01, WATER_LEVEL + 0.02, height));
}

float isGrass(float height) {
    return smoothstep(WATER_LEVEL + 0.01, WATER_LEVEL + 0.02, height);
}

float isRock(float height, float slope) {
    return step(0.6, height + slope);
}

float getDiffuse(vec3 normal) {
    return dot(normal, SUN_DIR);
}

void main() {
    vec2 st = gl_FragCoord.st / u_resolution;

    vec4 bump = texture(u_bump, st);
    vec3 normal = bump.xyz;
    float height = bump.a;
    float slope = 1.0 - normal.z;

    vec2 state = texture(u_heightmap, st).xy;

    vec3 color = vec3(0.0);
    color = mix(color, SAND, isSand(height));
    color = mix(color, GRASS, isGrass(height));
    color = mix(color, ROCK, isRock(height, slope));
    color = mix(color, WATER, isWater(state));

    float ambient = 0.3;
    float intensity = clamp(0.0, 1.0, getDiffuse(normal) * 0.7 + ambient + isWater(state));
    color *= intensity;
    fragColor = vec4(vec3(state.y), 1.0);
}
