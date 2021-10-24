#version 330
in vec3 a_position;  // -- driver adds a_ prefix (a for attribute)
void main() {
    gl_Position = vec4(a_position, 1.0);
}