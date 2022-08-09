#version 300 es
in vec3 aTint;
in vec2 aVertexPosition;
in vec2 aTextureCoord;
uniform mat3 projectionMatrix;
out vec2 vTextureCoord;
out vec3 vTint;
void main() {
  gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0, 1);
  vTextureCoord = aTextureCoord;
  vTint = aTint;
}
