#version 330

uniform sampler2D u_heightmap;
uniform sampler2D u_bump;
uniform vec2 u_resolution;

out vec4 fragColor;

const vec3 WATER = vec3(0.1, 0.4, 0.6);
const vec3 SAND = vec3(0.9, 0.8, 0.6);
const vec3 GRASS = vec3(0.2, 0.6, 0.4);
const vec3 ROCK = vec3(0.4, 0.45, 0.5);
const vec3 PARTICLE = vec3(1.0);

const float WATER_LEVEL = 0.3;

const vec3 SUN_DIR = normalize(vec3(1.0, 1.0, 0.5));

float isWater(vec2 state) {
    return min(step(state.x, WATER_LEVEL) + step(0.00005, state.y), 1.0);
}

float isSand(vec2 state) {
    return step(state.x, WATER_LEVEL + 0.05);
}

float isGrass(vec2 state) {
    return min(smoothstep(WATER_LEVEL + 0.01, WATER_LEVEL + 0.02, state.x) + step(0.0, state.y), 1.0);
}

float isRock(float height, float slope) {
    return smoothstep(0.6, 1.0, height * 0.5 + slope * 2.0);
}

float isSnow(float height) {
    return smoothstep(0.9, 1.1, height);
}

float isParticle(vec4 state) {
    return smoothstep(0.1, 1.0, state.y) * step(0.1, state.z);
}

float getDiffuse(vec3 normal) {
    return dot(normal, SUN_DIR);
}

float getSpecular(vec3 normal) {
    return clamp(0.0, 1.0, pow(dot(normal, SUN_DIR), 500.0)) * 0.5;
}

void main() {
    vec2 st = gl_FragCoord.st / u_resolution;

    vec4 bump = texture(u_bump, st);
    vec3 normal = bump.xyz;
    float height = bump.a;
    float slope = 1.0 - normal.z;

    vec4 state = texture(u_heightmap, st);
    float water = state.z;
    float particle = state.y;
    //state.w = 0.0;

    vec3 color = vec3(0.0);
    float isWater = isWater(state.xz);
    color = mix(color, GRASS, isGrass(state.xz));
    color = mix(color, ROCK, isRock(height, slope));
    color = mix(color, SAND, isSand(state.xz));
    color = mix(color, WATER, isWater);
    color = mix(color, vec3(particle), isParticle(state));
    color = mix(color, vec3(0.9), isSnow(height));
    float ambient = 0.4;
    float intensity = clamp(getDiffuse(normal) * 0.6 + ambient + isWater * 0.4, 0.0, 1.0);
    intensity += (min(isWater + isSnow(height), 1.0) * getSpecular(normal)) * 0.5;
    color *= intensity;
    color = mix(color, vec3(0.8), max(0.6 - height, 0.0));
    fragColor = vec4(vec3(color), 1.0);
}
