(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,734846,e=>{"use strict";var t=e.i(843476),a=e.i(271645),o=e.i(532181),r=e.i(221663),n=e.i(956850),i=e.i(80075),l=e.i(994964),s=e.i(237821),u=e.i(753604),c=e.i(450922);let d={monolith:0,halo:1,helix:2},h={16:16,32:32,48:48,96:96,192:192},f=200*Math.PI,v=e=>{let t=e.replace("#",""),a=3===t.length?t.split("").map(e=>e+e).join(""):t,o=parseInt(a,16);return Number.isNaN(o)||6!==a.length?[1,1,1]:[(o>>16&255)/255,(o>>8&255)/255,(255&o)/255]},m=e=>Math.round(100*e)/100,p=`
uniform float uYaw;
uniform float uPitch;
uniform float uAspect;
uniform float uDist;
uniform float uZoom;
uniform vec2 uShift;
const float FOCAL = 2.2;
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
vec3 orbitize(vec3 p, float yaw, float pitch) {
  p.xz *= rot(yaw);
  p.yz *= rot(pitch);
  return p;
}
vec4 project(vec3 view) {
  float w = uDist * uZoom - view.z;
  return vec4(view.xy * FOCAL / vec2(uAspect, 1.0) + uShift * w, -view.z * 0.25 * w, w);
}
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}`,g=`#version 300 es
in vec3 position;
in vec3 normal;
in vec4 aSeed;
in vec4 aRate;
uniform float uPhase;
uniform float uRing;
uniform float uTumble;
uniform float uSpread;
uniform float uRadius;
uniform float uMode;
uniform float uCount;
uniform vec3 uLight;
out vec3 vN;
out vec3 vV;
out vec3 vLc;
out float vDc;
out float vDepth;
out float vTip;
out float vCoreMix;
out vec3 vP;
out vec3 vAxis;

${p}

// Every formation is a pure function of the seeds and the two phases, so
// switching one is a uniform write, not a rebuild. Rates stay on the 0.01
// grid (or an integer number of laps per 200π) so the wrap is invisible.
void main() {
  float stretch = mix(0.75, 1.6, fract(aSeed.x * 5.17));
  float scale = mix(0.05, 0.2, pow(fract(aSeed.w * 7.31), 2.2));
  float t1 = uTumble * aRate.x + aSeed.y * 7.0;
  float t2 = uTumble * aRate.y + aSeed.w * 6.28;
  vec3 center;
  // Basis the stone is expressed in: identity for free tumblers, a
  // radial/tangent/up frame for the halo.
  mat3 basis = mat3(1.0);

  if (uMode < 0.5) {
    // Monolith: one giant stone on its own axis, seated a little below
    // centre; the rest leave the frustum.
    if (gl_InstanceID != 0) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
    center = vec3(0.0, -0.3, 0.0);
    stretch = 1.7;
    scale = 0.42 * uRadius / 1.15;
    t1 = uTumble * 0.3;
    t2 = 0.0;
  } else if (uMode < 1.5 && gl_InstanceID == 0) {
    // Halo keeps the monolith at its centre, seated a little below the
    // ring so the ring crosses its shoulders rather than its base.
    center = vec3(0.0, -0.32, 0.0);
    stretch = 1.7;
    scale = 0.42 * uRadius / 1.15;
    t1 = uTumble * 0.3;
    t2 = 0.0;
  } else if (uMode < 1.5) {
    // Halo: a rigid ring, every stone laid along the tangent, rolling in
    // lock-step, with a slow ripple through the ring. Spacing comes from
    // the instance id, not the jittered seed, in three concentric lanes so
    // neighbours never share a radius — and a stone can be no longer than
    // most of the gap to the next stone in its lane, so a higher count
    // means smaller stones, never stones passing through each other.
    // Lane count follows the shard count: a small ring files onto one
    // track like ducks in a row, a crowded one spreads across three.
    float k = float(gl_InstanceID) - 1.0;
    float m = max(uCount - 1.0, 1.0);
    float lanes = clamp(floor(uCount / 40.0), 0.0, 2.0) + 1.0;
    float lane = mod(k, lanes) - (lanes - 1.0) * 0.5;
    float angle = k / m * 6.28318 + uRing;
    float ringR = uRadius * (1.0 + lane * 0.14);
    vec3 rad = vec3(cos(angle), 0.0, sin(angle));
    vec3 tng = vec3(-sin(angle), 0.0, cos(angle));
    basis = mat3(rad, tng, vec3(0.0, 1.0, 0.0));
    float lift = lane * 0.06 + (aSeed.x - 0.5) * 0.04;
    center = rad * ringR + vec3(0.0, lift + sin(angle * 3.0 + uRing * 0.5) * uSpread * 0.3, 0.0);
    stretch = 1.4;
    float gap = 6.28318 * ringR / m * lanes;
    scale = min(mix(0.06, 0.095, aSeed.w), 0.8 * gap / (2.9 * stretch));
    t1 = uTumble * 0.3 + aSeed.w * 6.28;
    t2 = 0.0;
  } else {
    // Helix: two strands rising around the core. Height wraps 400 times per
    // 200π, so the wrap is exact; the ends fade out so no stone pops.
    float h = fract(aSeed.x + uPhase * 0.63662);
    float strand = step(0.5, aSeed.w) * 3.14159;
    float angle = h * 15.7 + strand + uPhase * 0.8 + (aSeed.y - 3.14) * 0.12;
    center = vec3(cos(angle) * uRadius * 0.55, (h - 0.5) * 2.8, sin(angle) * uRadius * 0.55);
    scale *= smoothstep(0.0, 0.12, h) * smoothstep(1.0, 0.88, h);
    t1 *= 0.5; t2 *= 0.5;
  }

  // Per-stone cut: a taller or squatter tip. A non-uniform scale bends the
  // normal the opposite way, so it is divided, not multiplied.
  vec3 p = position * vec3(1.0, stretch, 1.0);
  vec3 n = normalize(normal / vec3(1.0, stretch, 1.0));
  // Tumble: two stacked rotations whose axes come from the seed. Cheap, and
  // varied enough that no two shards visibly share a rhythm.
  p.xz *= rot(t1); n.xz *= rot(t1);
  p.yz *= rot(t2); n.yz *= rot(t2);
  p = basis * p; n = basis * n;
  vec3 world = center + p * scale;

  vec3 view = orbitize(world, uYaw, uPitch);
  vN = orbitize(n, uYaw, uPitch);
  vV = normalize(vec3(0.0, 0.0, uDist * uZoom) - view);
  // The point light: the core for every formation but the monolith, which
  // is lit from beside it instead of from inside it.
  vCoreMix = 1.0;
  vec3 toL = uLight - world;
  vDc = length(toL);
  vLc = orbitize(toL / max(vDc, 1e-3), uYaw, uPitch);
  // The giant takes its own lighting model in the fragment shader (see
  // there); this flag is what selects it.
  if (uMode < 1.5 && gl_InstanceID == 0) vCoreMix = 0.0;
  vTip = abs(position.y) / 1.45;
  // For the giant's finish: the fragment's offset from the stone's centre and
  // the stone's long axis, both in view space.
  vP = view - orbitize(center, uYaw, uPitch);
  vAxis = orbitize(basis * vec3(0.0, 1.0, 0.0), uYaw, uPitch);
  vec4 clip = project(view);
  vDepth = clip.w;
  gl_Position = clip;
}`,w=`#version 300 es
precision highp float;
in vec3 vN;
in vec3 vV;
in vec3 vLc;
in float vDc;
in float vDepth;
in float vTip;
in float vCoreMix;
in vec3 vP;
in vec3 vAxis;
out vec4 fragColor;
uniform vec3 uShard;
uniform vec3 uCore;
uniform vec3 uBg;
uniform float uGlow;
uniform float uCam;

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  // Key light pinned in VIEW space: whichever way the scene is orbited, some
  // face is always lit, so the silhouette never collapses into black.
  vec3 kl = normalize(vec3(0.45, 0.8, 0.5));
  // Wrapped diffuse (half-Lambert, squared) so a face turned away is dim,
  // not black, plus a cool fill from the far side: flat facets need a
  // gradient of tones, not two.
  float kd = pow(dot(n, kl) * 0.5 + 0.5, 2.0);
  float fd = max(dot(n, normalize(vec3(-0.6, -0.35, 0.45))), 0.0);
  float ks = pow(max(dot(reflect(-kl, n), v), 0.0), 40.0);
  // Studio in the reflections: bright above, dark below, a long ramp, and
  // the whole room stained by the core so every face shares its hue —
  // without it the faces split into grey ones and painted ones.
  vec3 envc = mix(uBg * 2.0 + 0.06, vec3(0.5, 0.5, 0.58), smoothstep(-0.8, 0.9, n.y));
  envc = mix(envc, uCore * 0.9, 0.3);
  float fres = pow(1.0 - abs(dot(n, v)), 3.0);
  // Crystal thins toward its tips, so light gets through there: a
  // brightening along each face from base to point, the one gradient a
  // flat-shaded facet can carry.
  float tip = smoothstep(0.15, 1.0, vTip) * 0.3;
  // The core as a point light: lit faces, a facet flash, and a little
  // transmission through faces turned away — crystal, not painted stone.
  vec3 lc = normalize(vLc);
  float att = uGlow / (0.35 + vDc * vDc * 0.8);
  float cd = pow(dot(n, lc) * 0.5 + 0.5, 2.0);
  float cs = pow(max(dot(reflect(-lc, n), v), 0.0), 24.0);
  float cback = max(dot(n, -lc), 0.0) * 0.35;
  vec3 small = uShard * (envc * 0.5 + kd * 0.45 + fd * 0.18 + tip)
    + vec3(1.0) * ks * 0.5
    + uCore * att * (cd * 0.8 + cback + cs * 1.2)
    + mix(uShard, uCore, 0.5) * fres * 0.5;
  // The giant is lit by direction only. Every view-dependent term above —
  // fresnel, specular, tip glow — lands on one of its flat facets as a
  // coat rather than a glint, so none of them apply: a wrapped key from
  // the upper right, a soft fill from the lower left, a sky/ground ramp,
  // one hue, tones ordered by orientation.
  float gk = dot(n, kl) * 0.5 + 0.5;
  float gsky = smoothstep(-1.0, 1.0, n.y);
  vec3 giant = uShard * (0.2 + 0.12 * gsky + 0.48 * gk * gk + 0.14 * fd);
  // The finish. Three things make a flat facet read as oiled silk instead
  // of matte card, and all three vary WITHIN a face:
  // 1. a gentle dome — the normal bent toward the fragment's offset from
  //    the centre, so a broad specular slides across the facet as a
  //    gradient rather than sitting on it as one value;
  // 2. an anisotropic streak (Kajiya-Kay) along the stone's axis — the
  //    grain of silk — lit by the key and by the core's colour from the
  //    fill side;
  // 3. a thin-film fresnel at grazing angles that shifts between the
  //    stone's hue and the core's — the oil.
  vec3 np = normalize(n + normalize(vP) * 0.28);
  vec3 ax = normalize(vAxis);
  vec3 hk = normalize(kl + v);
  float dome = pow(max(dot(np, hk), 0.0), 10.0);
  float tk = dot(ax, hk);
  // Each streak is gated by the domed normal facing its half-vector, or the
  // grain fires evenly across the whole stone and reads as a coat again.
  float silkK = pow(sqrt(max(1.0 - tk * tk, 0.0)), 28.0) * pow(max(dot(np, hk), 0.0), 3.0);
  vec3 fl = normalize(vec3(-0.6, -0.35, 0.45));
  vec3 hf = normalize(fl + v);
  float tf = dot(ax, hf);
  float silkF = pow(sqrt(max(1.0 - tf * tf, 0.0)), 20.0) * pow(max(dot(np, hf), 0.0), 3.0);
  float nv = max(dot(np, v), 0.0);
  float film = pow(1.0 - nv, 4.0);
  vec3 oil = mix(uShard, uCore, 0.5 + 0.5 * sin(nv * 7.0 + 1.2));
  giant += vec3(1.0) * dome * 0.3
    + mix(vec3(1.0), uShard, 0.5) * silkK * 0.5
    + mix(uShard, uCore, 0.6) * silkF * 0.35
    + oil * film * 0.4;
  vec3 col = mix(giant, small, vCoreMix);
  // Depth fog toward the backdrop so the far side of the ring sits behind.
  float fog = clamp((vDepth - uCam) * 0.35 + 0.12, 0.0, 0.7);
  col = mix(aces(col), uBg * 1.2, fog);
  fragColor = vec4(col, 1.0);
}`,x=`#version 300 es
in vec4 aSeed;
uniform float uPhase;
uniform float uSpread;
uniform float uRadius;
uniform float uDpr;
out float vSeed;
out float vFade;

${p}

void main() {
  float radiusJit = mix(0.7, 1.35, aSeed.x);
  float angle = aSeed.y + uPhase * aSeed.z;
  float weave = sin(uPhase * (0.5 + aSeed.w) + aSeed.x * 6.28) * uSpread * 1.3;
  vec3 world = vec3(cos(angle) * radiusJit * uRadius, weave, sin(angle) * radiusJit * uRadius);
  vec3 view = orbitize(world, uYaw, uPitch);
  vec4 clip = project(view);
  gl_Position = clip;
  gl_PointSize = mix(1.5, 3.5, fract(aSeed.w * 3.7)) * uDpr * (uDist * uZoom) / clip.w;
  vSeed = aSeed.w;
  vFade = clamp(1.0 - (clip.w - uDist * uZoom) * 0.3, 0.3, 1.0);
}`,b=`#version 300 es
precision highp float;
in float vSeed;
in float vFade;
out vec4 fragColor;
uniform vec3 uShard;
uniform vec3 uCore;
uniform float uGlow;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.15, d) * vFade * (0.35 + 0.35 * uGlow);
  fragColor = vec4(mix(uShard, uCore, vSeed) * a, 1.0);
}`,y=`#version 300 es
in vec3 position;
in vec3 normal;
uniform float uCoreScale;
uniform float uSpin;
out vec3 vN;
out vec3 vV;

${p}

void main() {
  vec3 p = position * uCoreScale;
  vec3 n = normal;
  p.xz *= rot(uSpin); n.xz *= rot(uSpin);
  vec3 view = orbitize(p, uYaw, uPitch);
  vN = orbitize(n, uYaw, uPitch);
  vV = normalize(vec3(0.0, 0.0, uDist * uZoom) - view);
  gl_Position = project(view);
}`,S=`#version 300 es
precision highp float;
in vec3 vN;
in vec3 vV;
out vec4 fragColor;
uniform vec3 uCore;
uniform float uGlow;

void main() {
  // Inverted fresnel: hot centre falling off toward the rim, the opposite of
  // the shards' edge light, so core and shards never compete for the same
  // part of the eye.
  float inner = pow(abs(dot(normalize(vN), normalize(vV))), 1.4);
  vec3 col = mix(uCore, vec3(1.0), inner * 0.6) * inner * uGlow * 1.3;
  fragColor = vec4(col, 1.0);
}`,C=`#version 300 es
in vec3 position;
uniform float uGlowSize;
uniform float uGlowZ;
out vec2 vUv;

${p}

void main() {
  // A billboard built in view space, so it always faces the camera however
  // the scene is orbited. uGlowZ is its depth: zero (the core) when the
  // glow blooms over everything with the depth test off, but pushed BEHIND
  // the giant stone when the test is on — a billboard through the middle
  // of an opaque body paints its additive colour onto every facet pixel
  // that falls behind the plane, which reads as a second colour on
  // whichever faces happen to cross it at that angle. The size is
  // corrected for the extra distance so the bloom stays the same on screen.
  float w0 = uDist * uZoom;
  float w = w0 - uGlowZ;
  vUv = position.xy;
  gl_Position = vec4(position.xy * uGlowSize * FOCAL / vec2(uAspect, 1.0) * (w / w0) + uShift * w, -uGlowZ * 0.25 * w, w);
}`,k=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec3 uCore;
uniform float uGlow;

void main() {
  float r = length(vUv);
  vec3 col = uCore * (exp(-r * r * 14.0) * 1.1 + exp(-r * r * 3.0) * 0.5 + exp(-r * 2.5) * 0.1)
    + vec3(1.0) * exp(-r * r * 40.0) * 0.7;
  // The wide term is still a few levels above zero at the quad's edge, and
  // additive over a near-black void that reads as a square. Mask it out.
  col *= smoothstep(1.0, 0.55, r);
  fragColor = vec4(col * uGlow, 1.0);
}`,z=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.999, 1.0); }`,P=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec3 uBg;
uniform vec3 uCore;
uniform float uAspect;
uniform vec2 uShift;
uniform float uGlow;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 q = (vUv * 2.0 - 1.0 - uShift) * vec2(uAspect, 1.0);
  float r = length(q);
  // The void: brighter behind the core, falling to the edges, with a
  // breath of the core colour and a hair of dither against banding.
  vec3 col = uBg * mix(1.5, 0.5, smoothstep(0.0, 1.7, r));
  col += uCore * exp(-r * r * 1.8) * 0.14 * uGlow;
  col += (hash(gl_FragCoord.xy) - 0.5) * (1.0 / 128.0);
  fragColor = vec4(col, 1.0);
}`,M=(0,a.memo)(({title:e="Held in orbit",subtitle:o="Every shard on its own path. None of them lost.",ctaLabel:p="Enter the orbit",onCtaClick:M,count:R="48",formation:_="monolith",shardColor:A="#e9d5ff",coreColor:F="#a855f7",backgroundColor:N="#04040a",orbitRadius:T=1.15,spread:q=.35,beltSpeed:G=.18,ringSpeed:I=1,tumbleSpeed:j=1,corePulse:D=1,glow:E=1,zoom:Y=1,autoSpin:L=!0,paused:B=!1,reducedMotion:O=!1,className:Z})=>{let $=(0,a.useRef)(null),H=(0,a.useRef)(null),U=(0,a.useRef)(null),W=(0,a.useRef)(null),V=(0,a.useRef)({yaw:0,pitch:.32,vYaw:0,vPitch:0,dragging:!1,pointerId:-1,lastX:0,lastY:0,lastT:0}),[K,X]=(0,a.useState)(!1),[J,Q]=(0,a.useState)(!1),ee=(0,a.useRef)(B);ee.current=B,(0,a.useEffect)(()=>Q(!0),[]);let et=(0,c.useAnimationLoop)({target:$,halted:B,dpr:"auto",onResize:e=>U.current?.(e),onFrame:({dt:e})=>!!H.current&&H.current(e),gl:()=>W.current}),ea=(0,a.useRef)({formation:_,shardColor:A,coreColor:F,backgroundColor:N,orbitRadius:T,spread:q,beltSpeed:G,ringSpeed:I,tumbleSpeed:j,corePulse:D,glow:E,zoom:Y,autoSpin:L,reducedMotion:O});ea.current={formation:_,shardColor:A,coreColor:F,backgroundColor:N,orbitRadius:T,spread:q,beltSpeed:G,ringSpeed:I,tumbleSpeed:j,corePulse:D,glow:E,zoom:Y,autoSpin:L,reducedMotion:O},(0,a.useEffect)(()=>{let e,t=$.current;if(K||!t)return;try{e=new r.Renderer({antialias:!0,alpha:!1,dpr:Math.min(window.devicePixelRatio||1,2)})}catch{X(!0);return}let a=e.gl;W.current=a;let o=a.canvas;o.style.display="block",o.style.position="absolute",o.style.top="0",o.style.left="0",t.appendChild(o);let c=h[R]??48,{position:p,normal:M}=function(){let e=[0,1.45,0],t=[0,-1.45,0],a=[[1,0,0],[0,0,1],[-1,0,0],[0,0,-1]],o=[];for(let r=0;r<4;r++){let n=a[r],i=a[(r+1)%4];o.push([e,n,i]),o.push([t,i,n])}let r=new Float32Array(9*o.length),n=new Float32Array(9*o.length);return o.forEach((e,t)=>{let[a,o,i]=e,l=o[0]-a[0],s=o[1]-a[1],u=o[2]-a[2],c=i[0]-a[0],d=i[1]-a[1],h=i[2]-a[2],f=s*h-u*d,v=u*c-l*h,m=l*d-s*c,p=Math.hypot(f,v,m)||1;f/=p,v/=p,m/=p;for(let a=0;a<3;a++){let o=e[a],i=(3*t+a)*3;r[i]=o[0],r[i+1]=o[1],r[i+2]=o[2],n[i]=f,n[i+1]=v,n[i+2]=m}}),{position:r,normal:n}}(),G=()=>({uYaw:{value:0},uPitch:{value:.32},uAspect:{value:1},uDist:{value:3.4},uZoom:{value:Y},uShift:{value:new Float32Array([0,0])}}),I=new Float32Array(4*c),j=new Float32Array(4*c);for(let e=0;e<c;e++)I[4*e]=Math.random(),I[4*e+1]=e/c*Math.PI*2+.5*Math.random(),I[4*e+2]=m(.7+.6*Math.random()),I[4*e+3]=Math.random(),j[4*e]=m(.6+.8*Math.random()),j[4*e+1]=m(.4+.7*Math.random()),j[4*e+2]=m(.5+ +Math.random()),j[4*e+3]=Math.random()*Math.PI*2;let D=new l.Geometry(a,{position:{size:3,data:p},normal:{size:3,data:M},aSeed:{size:4,data:I,instanced:1},aRate:{size:4,data:j,instanced:1}}),E=new n.Program(a,{vertex:g,fragment:w,cullFace:!1,uniforms:{...G(),uShard:{value:new Float32Array(v(A))},uCore:{value:new Float32Array(v(F))},uBg:{value:new Float32Array(v(N))},uPhase:{value:0},uRing:{value:0},uTumble:{value:0},uSpread:{value:q*T},uRadius:{value:T},uGlow:{value:1},uCam:{value:3.4},uMode:{value:d[_]??0},uCount:{value:c},uLight:{value:new Float32Array([0,0,0])}}}),L=new i.Mesh(a,{geometry:D,program:E}),B=Math.min(8*c,1536),O=new Float32Array(4*B);for(let e=0;e<B;e++)O[4*e]=Math.random(),O[4*e+1]=Math.random()*Math.PI*2,O[4*e+2]=m(.6+.8*Math.random()),O[4*e+3]=Math.random();let Z=new l.Geometry(a,{aSeed:{size:4,data:O}}),J=new n.Program(a,{vertex:x,fragment:b,transparent:!0,depthWrite:!1,uniforms:{...G(),uShard:{value:new Float32Array(v(A))},uCore:{value:new Float32Array(v(F))},uPhase:{value:0},uSpread:{value:q*T},uRadius:{value:T},uDpr:{value:1},uGlow:{value:1}}});J.setBlendFunc(a.ONE,a.ONE);let Q=new i.Mesh(a,{geometry:Z,program:J,mode:a.POINTS}),eo=new l.Geometry(a,{position:{size:3,data:p},normal:{size:3,data:M}}),er=new n.Program(a,{vertex:y,fragment:S,transparent:!0,cullFace:!1,depthWrite:!1,uniforms:{...G(),uCore:{value:new Float32Array(v(F))},uCoreScale:{value:.16},uSpin:{value:0},uGlow:{value:1}}});er.setBlendFunc(a.ONE,a.ONE);let en=new i.Mesh(a,{geometry:eo,program:er}),ei=new l.Geometry(a,{position:{size:3,data:new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,-1,0,1,1,0,-1,1,0])}}),el=new n.Program(a,{vertex:C,fragment:k,transparent:!0,cullFace:!1,depthTest:!1,depthWrite:!1,uniforms:{...G(),uCore:{value:new Float32Array(v(F))},uGlowSize:{value:.9},uGlowZ:{value:0},uGlow:{value:1}}});el.setBlendFunc(a.ONE,a.ONE);let es=new i.Mesh(a,{geometry:ei,program:el}),eu=new n.Program(a,{vertex:z,fragment:P,cullFace:!1,depthWrite:!1,uniforms:{uBg:{value:new Float32Array(v(N))},uCore:{value:new Float32Array(v(F))},uAspect:{value:1},uShift:{value:new Float32Array([0,0])},uGlow:{value:1}}}),ec=new i.Mesh(a,{geometry:new u.Triangle(a),program:eu,renderOrder:-1}),ed=new s.Transform;ec.setParent(ed),L.setParent(ed),Q.setParent(ed),en.setParent(ed),es.setParent(ed);let eh=[E,J,er,el].map(e=>e.uniforms),ef=E.uniforms,ev=J.uniforms,em=er.uniforms,ep=el.uniforms,eg=eu.uniforms,ew=(e,t,a)=>e[t].value.set(a),ex=0,eb=0,ey=0,eS=0,eC=1,ek=3.4,ez=[0,0];return H.current=t=>{let o=ea.current,r=V.current,n=Math.min(t,1/30);if(!(ee.current||o.reducedMotion)){if(ex=(ex+n*o.beltSpeed)%f,eb=(eb+n*o.beltSpeed*o.ringSpeed)%f,ey=(ey+n*o.tumbleSpeed)%f,eS=(eS+n)%f,!r.dragging&&o.autoSpin){r.yaw+=.1*n,r.pitch=Math.max(-.9,Math.min(1.1,r.pitch+r.vPitch*n));let e=Math.pow(.92,60*n);r.vYaw*=e,r.vPitch*=e}r.yaw%=2*Math.PI}let i=1+.14*Math.sin(1.9*eS)*(o.reducedMotion?0:o.corePulse),l=d[o.formation]??0,s=0===l||1===l,u=v(o.shardColor),c=v(o.coreColor),h=v(o.backgroundColor);for(let e of eh)e.uYaw.value=r.yaw,e.uPitch.value=r.pitch,e.uAspect.value=eC,e.uDist.value=ek,e.uZoom.value=o.zoom,e.uShift.value.set(ez),e.uGlow.value=i,ew(e,"uCore",c);ew(ef,"uShard",u),ew(ef,"uBg",h),ef.uPhase.value=ex,ef.uRing.value=eb,ef.uTumble.value=ey,ef.uSpread.value=o.spread*o.orbitRadius,ef.uRadius.value=o.orbitRadius,ef.uCam.value=ek*o.zoom,ef.uMode.value=l,ew(ef,"uLight",s?[.9,.6,.9]:[0,0,0]),em.uCoreScale.value=s?0:.16*i,em.uGlow.value=i*o.glow,el.depthTest=s,ep.uGlow.value=i*o.glow*(s?.35:1),ew(ev,"uShard",u),ev.uPhase.value=ex,ev.uSpread.value=o.spread*o.orbitRadius,ev.uRadius.value=o.orbitRadius,em.uSpin.value=.35*ey,ep.uGlowSize.value=1.15*i,ep.uGlowZ.value=s?-1.3:0,ew(eg,"uBg",h),ew(eg,"uCore",c),eg.uAspect.value=eC,eg.uShift.value.set(ez),eg.uGlow.value=i*o.glow,a.clearColor(h[0],h[1],h[2],1),e.render({scene:ed})},U.current=({width:t,height:a,dpr:o})=>{e.dpr=o,e.setSize(Math.max(1,Math.floor(t)),Math.max(1,Math.floor(a))),eC=Math.max(t,1)/Math.max(a,1),ev.uDpr.value=o,ez[0]=.44*(eC>1),ez[1]=eC>1?.05:.3,ek=3.4*Math.min(2,Math.max(1,.85/eC)),H.current?.(.016)},et.resize(),et.start(),()=>{H.current=null,U.current=null,t.contains(o)&&t.removeChild(o)}},[K,R]),(0,a.useEffect)(()=>{et.paint()},[_,A,F,N,T,q,G,I,j,D,E,Y,L,et]);let eo=e=>{let t=V.current;-1!==t.pointerId&&e.currentTarget.hasPointerCapture(t.pointerId)&&e.currentTarget.releasePointerCapture(t.pointerId),t.dragging=!1,t.pointerId=-1,et.start()},er=e=>O?{}:{opacity:+!!J,transform:J?"none":"translateY(14px)",transition:`opacity 700ms cubic-bezier(0.22,1,0.36,1) ${110*e}ms, transform 700ms cubic-bezier(0.22,1,0.36,1) ${110*e}ms`},en=(0,t.jsxs)("div",{className:"pointer-events-none absolute inset-0 z-10 flex flex-col items-start justify-end bg-[linear-gradient(0deg,rgba(0,0,0,0.45),rgba(0,0,0,0)_55%)] px-[max(20px,5.5cqi)] pb-[max(20px,6cqi)] text-left [@container(orientation:landscape)]:justify-center [@container(orientation:landscape)]:bg-[linear-gradient(90deg,rgba(0,0,0,0.3),rgba(0,0,0,0)_55%)] [@container(orientation:landscape)]:pb-0",children:[e?(0,t.jsx)("h1",{className:"max-w-[max(260px,44cqi)] text-[max(28px,5.4cqi)] leading-[1.02] font-semibold tracking-tight text-white",style:er(0),children:e}):null,o?(0,t.jsx)("p",{className:"mt-[max(10px,1.4cqi)] max-w-[max(220px,38cqi)] text-[max(12px,1.7cqi)] leading-snug text-white/70",style:er(1),children:o}):null,p&&!O?(0,t.jsx)("style",{children:`@keyframes __sg_so_glow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.9; } }
.__sg_so_cta:hover .__sg_so_glow, .__sg_so_cta:focus-visible .__sg_so_glow { animation: __sg_so_glow 1.4s ease-in-out infinite; }`}):null,p?(0,t.jsxs)("button",{type:"button",onClick:M,className:"__sg_so_cta pointer-events-auto relative mt-[max(18px,2.6cqi)] cursor-pointer px-[max(26px,3.4cqi)] py-[max(11px,1.4cqi)] text-[max(11px,1.3cqi)] font-bold tracking-[0.2em] text-white uppercase transition-[transform,filter] duration-150 hover:brightness-115 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70 active:scale-95",style:er(2),children:[(0,t.jsxs)("span",{"aria-hidden":!0,className:"pointer-events-none absolute inset-0 overflow-hidden",style:{clipPath:"polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)",backgroundImage:`linear-gradient(135deg, color-mix(in srgb, ${F} 55%, white) 0%, ${F} 45%, color-mix(in srgb, ${F} 55%, black) 100%)`},children:[(0,t.jsx)("span",{className:"absolute inset-0",style:{backgroundImage:"linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.28) 30.5%, rgba(255,255,255,0.28) 44%, rgba(255,255,255,0) 44.5%), linear-gradient(115deg, rgba(255,255,255,0) 62%, rgba(255,255,255,0.14) 62.5%, rgba(255,255,255,0.14) 78%, rgba(255,255,255,0) 78.5%)"}}),(0,t.jsx)("span",{className:"__sg_so_glow absolute inset-0",style:{opacity:0,backgroundImage:"radial-gradient(60% 130% at 50% 50%, rgba(255,255,255,0.6), rgba(255,255,255,0) 70%)"}})]}),(0,t.jsx)("span",{className:"relative",children:p})]}):null]});return K?(0,t.jsx)("div",{className:Z??"relative h-full w-full overflow-hidden @container-size",style:{backgroundColor:N,backgroundImage:`radial-gradient(circle at 72% 50%, ${F}55 0%, ${A}22 30%, transparent 60%)`},children:en}):(0,t.jsx)("div",{ref:$,className:Z??"relative h-full w-full cursor-default overflow-hidden select-none @container-size [&_canvas]:touch-none",onPointerDown:e=>{if(e.target.closest("button, a"))return;let t=V.current;t.dragging=!0,t.pointerId=e.pointerId,t.lastX=e.clientX,t.lastY=e.clientY,t.lastT=e.timeStamp,t.vYaw=0,t.vPitch=0,e.currentTarget.setPointerCapture(e.pointerId),et.start()},onPointerMove:e=>{let t=V.current;if(!t.dragging||e.pointerId!==t.pointerId)return;let a=e.clientX-t.lastX,o=e.clientY-t.lastY,r=(e.timeStamp-t.lastT)/1e3,n=-(.008*a),i=.006*o;t.yaw+=n,t.pitch=Math.max(-.9,Math.min(1.1,t.pitch+i)),r>.001&&(t.vYaw=n/r,t.vPitch=i/r),t.lastX=e.clientX,t.lastY=e.clientY,t.lastT=e.timeStamp,et.start()},onPointerUp:eo,onPointerCancel:eo,children:en})});M.displayName="ShardOrbit";let R=["survey","orbit","archive","contact"];e.s(["default",0,function({values:e,reducedMotion:r,paused:n}){let i=e.coreColor,l=e.formation,[s,u]=(0,a.useState)("survey");return(0,t.jsxs)("div",{className:"relative h-full min-h-80 w-full @container-size",children:[(0,t.jsx)(M,{title:"Held in orbit",subtitle:"Every shard on its own path. None of them lost.",ctaLabel:"Enter the orbit",count:e.count,formation:l,shardColor:e.shardColor,coreColor:i,backgroundColor:e.backgroundColor,orbitRadius:e.orbitRadius,spread:e.spread,beltSpeed:e.beltSpeed,ringSpeed:e.ringSpeed,tumbleSpeed:e.tumbleSpeed,corePulse:e.corePulse,glow:e.glow,zoom:e.zoom,autoSpin:e.autoSpin,paused:n,reducedMotion:r}),(0,t.jsx)("nav",{"aria-label":"Hero",className:"pointer-events-auto absolute left-1/2 top-[max(10px,3cqi)] z-10 flex -translate-x-1/2 gap-[max(14px,3.2cqi)]",children:R.map(e=>(0,t.jsxs)("button",{type:"button","aria-current":s===e?"page":void 0,onClick:()=>u(e),className:`relative cursor-pointer pb-[max(4px,0.5cqi)] font-display text-[max(9px,1.35cqi)] tracking-[0.25em] uppercase transition-colors duration-150 hover:text-[#f2eff8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 ${s===e?"text-[#f2eff8]":"text-[#b6aecb]"}`,children:[e,s===e?(0,t.jsx)(o.motion.span,{layoutId:"__sg_so_underline","aria-hidden":!0,className:"absolute inset-x-0 bottom-0 h-0.5 rounded-full",style:{backgroundColor:i},transition:r?{duration:0}:{type:"spring",stiffness:420,damping:30,mass:.8}}):null]},e))}),(0,t.jsxs)("div",{className:"pointer-events-none absolute left-[max(16px,4cqi)] top-[max(10px,3cqi)] z-10 hidden items-center gap-[max(8px,1cqi)] @xl:flex",children:[(0,t.jsx)("span",{className:"block size-[max(6px,0.7cqi)] rounded-full",style:{backgroundColor:i,boxShadow:`0 0 max(8px,1cqi) ${i}`}}),(0,t.jsxs)("span",{className:"font-display text-[max(8px,1.05cqi)] tracking-[0.24em] text-[#b6aecb] uppercase",children:[l," · ","monolith"===l?"one stone":`${e.count} shards`]})]}),(0,t.jsxs)("div",{className:"pointer-events-none absolute bottom-[max(8px,2cqi)] left-[max(16px,4cqi)] z-10 hidden flex-col [@container(orientation:landscape)]:@xl:flex",children:[(0,t.jsx)("span",{className:"font-display text-[max(7px,0.9cqi)] tracking-[0.26em] text-[#7d7691] uppercase",children:"orbit"}),(0,t.jsxs)("span",{className:"font-display text-[max(10px,1.3cqi)] tracking-widest text-[#f2eff8]",children:[e.orbitRadius.toFixed(2)," au"]})]})]})}],734846)},74188,function(e){e.n(e.i(734846))},450922,e=>{"use strict";var t=e.i(271645);let a=1/15;e.s(["useAnimationLoop",0,function(e){let o=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{o.current=e});let r=(0,t.useRef)(null),n=(0,t.useRef)(null),i=(0,t.useRef)(!1),l=(0,t.useRef)(!1),s=(0,t.useRef)(0),u=(0,t.useRef)(0),c=(0,t.useRef)(0),d=(0,t.useCallback)(()=>{let e=o.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),a=o.current.dpr??"auto",r=Math.min(window.devicePixelRatio||1,"auto"===a?2:a);return{width:t.width,height:t.height,dpr:r,bufferWidth:Math.max(1,Math.round(t.width*r)),bufferHeight:Math.max(1,Math.round(t.height*r))}},[]),h=(0,t.useCallback)(function e(t){if(l.current)return;0===s.current&&(s.current=t);let n=0===u.current?0:Math.min((t-u.current)/1e3,a);u.current=t;let d={now:t,dt:n,elapsed:(t-s.current)/1e3,frame:c.current++},h=o.current.onFrame?.(d);if(!l.current){if(!1===h||o.current.halted){i.current=!1,r.current=null;return}r.current=requestAnimationFrame(e)}},[]),f=(0,t.useCallback)(()=>{l.current||i.current||(i.current=!0,u.current=0,r.current=requestAnimationFrame(h))},[h]),v=(0,t.useCallback)(()=>{i.current=!1,null!==r.current&&(cancelAnimationFrame(r.current),r.current=null)},[]),m=(0,t.useCallback)(()=>f(),[f]),p=(0,t.useCallback)(()=>{let e=d();e&&(o.current.onResize?.(e),!1!==o.current.paintWhenHalted?m():o.current.halted||f())},[d,m,f]),g=e.deps??[];(0,t.useEffect)(()=>{l.current=!1;let e=o.current.target.current;if(!e)return;let t=()=>{l.current||p()},a=new ResizeObserver(()=>{let e=o.current.resizeDebounceMs??0;e<=0?t():(null!==n.current&&clearTimeout(n.current),n.current=setTimeout(()=>{n.current=null,t()},e))});return a.observe(e),p(),o.current.halted||f(),()=>{l.current=!0,i.current=!1,null!==r.current&&(cancelAnimationFrame(r.current),r.current=null),null!==n.current&&(clearTimeout(n.current),n.current=null),a.disconnect(),o.current.onDispose?.();let e=o.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),s.current=0,u.current=0,c.current=0}},g);let w=e.halted??!1;return(0,t.useEffect)(()=>{w||f()},[w,f]),(0,t.useMemo)(()=>({start:f,stop:v,paint:m,resize:p,get running(){return i.current}}),[f,v,m,p])}])},753604,e=>{"use strict";var t=e.i(994964);class a extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,a])}]);