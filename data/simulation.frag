#version 330

uniform vec2 u_resolution;
uniform sampler2D u_heightmap;
uniform sampler2D u_bump;

out vec4 fragColor;

const float RAIN_AMOUNT = 0.001;
const float EVAPORATION = 0.01;

float average(vec2 st) {
    const ivec3 off = ivec3(-1,0,1);

    float s01 = textureOffset(u_heightmap, st, off.xy).x;
    float s21 = textureOffset(u_heightmap, st, off.zy).x;
    float s10 = textureOffset(u_heightmap, st, off.yx).x;
    float s12 = textureOffset(u_heightmap, st, off.yz).x;

    return (s01 + s21 + s10 + s12) / 4.0;
}

float waterDeltaFrom(vec2 data, vec2 state, vec2 st) {
    float water0 = state.y;
    float water1 = data.y;
    float height0 = state.x;
    float height1 = data.x;
    float delta = height1 + water1 - (height0 + water0);
    float waterFlow = step(delta, 0.0) * water0 // water flow to there
                    + step(0.0, delta) * water1; // water flow from there
    return waterFlow * delta * 0.1;
}

float calculateWater(vec2 st, vec2 state) {

    float delta;

    const ivec3 off = ivec3(-1,0,1);
        delta +=
        //waterDeltaFrom(textureOffset(u_heightmap, st, off.xx).xy, state, st) / 8.0
      + waterDeltaFrom(textureOffset(u_heightmap, st, off.xy).xy, state, st) / 4.0
      //+ waterDeltaFrom(textureOffset(u_heightmap, st, off.xz).xy, state, st) / 8.0
      + waterDeltaFrom(textureOffset(u_heightmap, st, off.yx).xy, state, st) / 4.0
      + waterDeltaFrom(textureOffset(u_heightmap, st, off.yz).xy, state, st) / 4.0
      //+ waterDeltaFrom(textureOffset(u_heightmap, st, off.zx).xy, state, st) / 8.0
      + waterDeltaFrom(textureOffset(u_heightmap, st, off.zy).xy, state, st) / 4.0;
      //+ waterDeltaFrom(textureOffset(u_heightmap, st, off.zz).xy, state, st) / 8.0;

    return delta + RAIN_AMOUNT;
}

void main() {
    vec2 st = gl_FragCoord.st / u_resolution;
    vec4 data = texture(u_heightmap, st);
    float h = mix(data.x, average(st), 0.1);
    float waterDelta = calculateWater(st, data.xy);
    float water = clamp(0.0, 1.0, data.y + waterDelta);
    water *= (1.0 - EVAPORATION);
    h = clamp(0.0, 1.0, h + waterDelta * 0.01);
    fragColor = vec4(h, water, 0.0, 1.0);
    //fragColor = texture(u_heightmap, st);

}