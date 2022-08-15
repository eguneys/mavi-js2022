#version 300 es
precision highp float;
in vec2 vTextureCoord;
out vec4 outColor;
in vec3 vTint;
uniform sampler2D uSampler;

void main() {

  vec4 col = texture(uSampler, vTextureCoord);
  col.rgb *= vTint;
  outColor = vec4(col.rgb, col.a);
}


