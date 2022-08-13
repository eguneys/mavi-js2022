#version 300 es
precision highp float;
in vec2 vTextureCoord;
out vec4 outColor;

void main() {

  vec4 col = vec4(1.0, 1.0, 0.0, 1.0);
  
  outColor = vec4(col.rgb, col.a);
}


