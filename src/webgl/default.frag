#version 300 es
precision highp float;
in vec3 aTint;
in vec2 vTextureCoord;
in vec3 vTint;
out vec4 outColor;
void main() {
  vec4 color = vec4(1.0, 1.0, 0.0, 1.0);
  color.rgb *= vTint;
  outColor = vec4(color.rgb * color.a, color.a);
}

