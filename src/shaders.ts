export const vSource = `#version 300 es
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
`

export const fSource = `#version 300 es
precision highp float;
in vec3 aTint;
in vec2 vTextureCoord;
in vec3 vTint;
out vec4 outColor;
uniform sampler2D uSampler;
void main() {
  /*
  vec4 color = texture(uSampler, vTextureCoord);
  color.rgb *= vTint;
  color = vec4(1.0, 0.0, 0.0, 1.0);
  outColor = vec4(color.rgb * color.a, color.a);
  */
  float y = vTextureCoord.y;
  y = smoothstep(1.0, 0.0, y);
  outColor = vec4(0.0, y, 0.0, 1.0);
}

`
