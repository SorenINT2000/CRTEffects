#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 texCoords;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    texCoords = a_texCoord;
}
