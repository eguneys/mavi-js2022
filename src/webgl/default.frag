#version 300 es
precision highp float;
in vec3 aTint;
in vec2 vTextureCoord;
in vec3 vTint;
out vec4 outColor;


float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

vec4 shade(float sd) {
  return vec4(1.0 - step(0.02, abs(sd)));
}

void main() {
  vec2 p = vTextureCoord;
  p -= vec2(0.5, 0.5);
  float sd = sdCircle(p, 0.5-0.07);
  vec4 color = shade(sd);
  color.rgb *= vTint;
  outColor = vec4(color.rgb, color.a);
}

