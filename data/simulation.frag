#version 330

uniform vec2 u_resolution;
uniform sampler2D u_heightmap;
uniform sampler2D u_bump;
uniform float u_time;

out vec4 fragColor;

uniform float u_rain;
const float EVAPORATION = 0.001;
const float CARRY_AMOUNT = 10.0;

float average(vec2 st) {
    const ivec3 off = ivec3(-1,0,1);

    float s01 = textureOffset(u_heightmap, st, off.xy).x;
    float s21 = textureOffset(u_heightmap, st, off.zy).x;
    float s10 = textureOffset(u_heightmap, st, off.yx).x;
    float s12 = textureOffset(u_heightmap, st, off.yz).x;

    return (s01 + s21 + s10 + s12) / 4.0;
}

vec2 waterDeltaFrom(vec4 data, vec4 state, vec2 st) {
    float waterLevel0 = state.z;
    float waterLevel1 = data.z;
    float height0 = state.x;
    float height1 = data.x;
    float delta = height1 + waterLevel1 - (height0 + waterLevel0);
    float waterFlow = -step(delta, 0.0) * min(waterLevel0, -delta) // water flow to there
                    + step(0.0, delta) * min(waterLevel1, delta); // water flow from there

    float getsParticle = step(0.0, waterFlow) * step(0.1, data.y);

    return vec2(waterFlow * 0.1, getsParticle);
}

vec2 calculateWater(vec2 st, vec4 state) {

    vec2 delta;

    const ivec3 off = ivec3(-1,0,1);
    delta +=
        waterDeltaFrom(textureOffset(u_heightmap, st, off.xx), state, st)
      + waterDeltaFrom(textureOffset(u_heightmap, st, off.xy), state, st)
      + waterDeltaFrom(textureOffset(u_heightmap, st, off.xz), state, st)
      + waterDeltaFrom(textureOffset(u_heightmap, st, off.yx), state, st)
      + waterDeltaFrom(textureOffset(u_heightmap, st, off.yz), state, st)
      + waterDeltaFrom(textureOffset(u_heightmap, st, off.zx), state, st)
      + waterDeltaFrom(textureOffset(u_heightmap, st, off.zy), state, st)
      + waterDeltaFrom(textureOffset(u_heightmap, st, off.zz), state, st);

    //delta = 0.0;
    delta.x /= 8.0;
    return delta;
}

float rand(vec2 co){
    return fract(sin(dot(co + u_time, vec2(12.9898, 78.233))) * 43758.5453);
}

float addParticle(vec2 st, vec4 state) {
    return step(0.99, rand(st)) * step(0.002, state.z);
}

void main() {
    vec2 st = gl_FragCoord.st / u_resolution;

    vec4 state = texture(u_heightmap, st);
    float height = state.x;
    //height = mix(height, average(st), 0.01);
    float water = state.z;

    vec2 waterData = calculateWater(st, state);
    float waterDelta = waterData.x;
    water += waterDelta + u_rain;

    water *= 1.0 - EVAPORATION;

    float aboveSea = step(0.3, height);
    waterDelta *= aboveSea;
    //water *= belowSea;
    height += waterDelta * CARRY_AMOUNT;

    float particle = step(0.2, waterData.y + addParticle(st, state));
    particle += state.y * 0.1;

    fragColor = vec4(height, particle, water, 1.0);
}