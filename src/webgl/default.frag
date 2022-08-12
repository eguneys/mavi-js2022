#version 300 es
precision highp float;
in vec2 vTextureCoord;
in vec2 vVertexCoord;
in vec3 vTint;
in vec2 vType;
out vec4 outColor;

float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdSegment( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

vec2 opRep( in vec2 p, in vec2 c) {
    return mod(p+0.5*c,c)-0.5*c;
}


void main() {
  vec2 p = vTextureCoord;
  p -= vec2(0.5);

  float sd;

  if (vType.x == 2.0) {
    sd = sdSegment(p, vec2(-0.5+0.3, 0), vec2(0.5-0.3, 0)) - 0.3;
  } else if (vType.x == 1.0) {
    sd = sdCircle(p, 0.5-0.005);
  } else if (vType.x == 0.0) { 
    sd = sdBox(p, vec2(0.5 - 0.005 - 0.3)) - 0.3;
  }


  float a = 1.0;

  if (vType.y == 0.9999) {
    float ad;
    vec2 q = opRep(p, vec2(0.035));
    ad = sdBox(q, vec2(0.001))-0.008;
    a = step(0.01, abs(ad));
  }


  if (vType.y > 0.0) {
    sd = abs(sd+vType.y) - vType.y;
  }

  vec4 col = (sd > 0.0) ? vec4(0.0) : vec4(1.0, 1.0, 1.0, a);
  col = mix(col, vec4(1.0), 1.0 - step(0.005, abs(sd)));
  col.rgb *= vTint;
  outColor = vec4(col.rgb, col.a);
}

