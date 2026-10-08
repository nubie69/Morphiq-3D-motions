(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,189410,e=>{"use strict";var t=e.i(843476),r=e.i(271645),n=e.i(221663),o=e.i(956850),a=e.i(80075),i=e.i(753604),l=e.i(450922);let u=e=>{let t=e.replace("#",""),r=3===t.length?t.split("").map(e=>e+e).join(""):t,n=parseInt(r,16);return Number.isNaN(n)||6!==r.length?[1,1,1]:[(n>>16&255)/255,(n>>8&255)/255,(255&n)/255]},s=`#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`,c=`#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uResolution;
uniform float uDpr;
uniform vec2  uPhase;
uniform float uWarp;
uniform float uStir;
uniform float uViscosity;
uniform float uFresnel;
uniform float uIridescence;
uniform float uRoughness;
uniform vec3  uTint;
uniform vec3  uSheen;
uniform vec3  uBg;
uniform vec2  uStirPos[8];
uniform vec4  uStirVec[8];

float hash21(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Two octaves for the warp, four for the height. Warping at four costs three
// extra noise samples per height evaluation - and there are three evaluations
// per pixel - for detail the normal's difference throws away again.
float fbm2(vec2 p) {
  return vnoise(p) * 0.62 + vnoise(p * 2.03) * 0.31;
}
float fbm4(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s;
}

const float DOMAIN = 2.2;

// Sum of the live impulses, as a DISPLACEMENT OF THE HEIGHT rather than of the
// sampling coordinate. Translating the domain instead is the obvious move and it
// is invisible: the noise is statistically homogeneous, so sliding it sideways
// yields a field that looks the same, and taking the normal's differences after
// the shift means the normal never sees the shift at all. Deforming the height
// puts the stir inside the finite differences, so the metal genuinely bulges.
//
// The term is dot(direction, offset): signed along the stroke, so metal piles up
// ahead of the drag and hollows out behind it. That is what a finger pulled
// through something viscous actually leaves, and it is why the wake reads as
// displacement rather than as a brightness smear.
float stirHeight(vec2 p) {
  vec2 q = p / DOMAIN;
  float acc = 0.0;
  for (int i = 0; i < 8; i++) {
    if (uStirVec[i].w < 0.5) continue;
    vec2 d = q - uStirPos[i];
    float decay = exp(-uStirVec[i].z / max(uViscosity * 2.2, 0.05));
    float fall = exp(-dot(d, d) * 14.0);
    acc += dot(uStirVec[i].xy, d) * decay * fall;
  }
  return acc * uStir * 30.0;
}

float height(vec2 p, vec2 flow) {
  vec2 q = p + uWarp * vec2(fbm2(p + flow), fbm2(p.yx + flow.yx + 3.7));
  return fbm4(q * 1.25 + flow * 0.4) + stirHeight(p);
}

// The studio. Roughness widens the two softbox edges rather than blurring a
// texture - a rough metal does not reflect a blurrier room, it reflects the same
// room over a wider cone, and the visible consequence is exactly this.
vec3 studio(vec3 r, float rough) {
  float y = clamp(r.y, -1.0, 1.0);
  float soft = mix(0.015, 0.34, clamp(rough, 0.0, 1.0));

  vec3 sky = mix(vec3(0.30, 0.33, 0.40), vec3(0.78, 0.82, 0.92), smoothstep(-0.1, 0.95, y));
  vec3 floorCol = mix(uBg, vec3(0.16, 0.17, 0.21), smoothstep(-1.0, 0.05, y));
  vec3 col = mix(floorCol, sky, smoothstep(-0.06, 0.10, y));

  float box = smoothstep(0.34 - soft, 0.34 + soft, y) * (1.0 - smoothstep(0.70 - soft, 0.70 + soft, y));
  col += vec3(1.0) * box * 0.85;

  float lip = smoothstep(-0.34 - soft, -0.34 + soft, y) * (1.0 - smoothstep(-0.14 - soft, -0.14 + soft, y));
  col += vec3(0.62, 0.66, 0.78) * lip * 0.30;

  // A slow azimuthal ripple so a perfectly flat patch is never perfectly flat.
  col *= 0.92 + 0.08 * cos(atan(r.z, r.x) * 3.0);
  return col;
}

// Thin film. The hue comes from optical thickness over the cosine, so it tracks
// the surface angle instead of being painted on - which is the entire difference
// between iridescence and a rainbow gradient.
vec3 thinFilm(float cosT) {
  float d = 3.4 / max(cosT, 0.09);
  return 0.5 + 0.5 * cos(d * vec3(1.0, 0.86, 0.72) + vec3(0.0, 2.1, 4.2));
}

void main() {
  vec2 res = uResolution / uDpr;
  vec2 uv = (gl_FragCoord.xy / uDpr - res * 0.5) / max(res.y, 1.0);

  vec2 flow = vec2(cos(uPhase.x), sin(uPhase.y)) * 1.4;
  vec2 p = uv * DOMAIN;

  // Central difference for the normal. Every derivative is taken before any
  // branch below, so no fragment can reach fwidth in non-uniform control flow.
  float e = 0.006;
  float h  = height(p, flow);
  float hx = height(p + vec2(e, 0.0), flow);
  float hy = height(p + vec2(0.0, e), flow);
  vec3 n = normalize(vec3((h - hx) / e, (h - hy) / e, 1.6));

  vec3 v = vec3(0.0, 0.0, 1.0);
  vec3 r = reflect(-v, n);
  float cosT = clamp(dot(n, v), 0.0, 1.0);

  vec3 env = studio(r, uRoughness);

  // Metals tint what they reflect, and the tint washes out toward white at
  // grazing angles. That is the whole of a conductor's Fresnel response.
  float fres = pow(1.0 - cosT, max(uFresnel, 0.1));
  vec3 col = env * mix(uTint, vec3(1.0), fres);

  col = mix(col, col * (0.55 + 0.85 * thinFilm(cosT)), uIridescence * (0.35 + 0.65 * fres));
  col += uSheen * fres * 0.45;

  // Vignette toward the environment floor rather than to black, so the panel
  // edge reads as the room falling away instead of as a mask.
  float vig = 1.0 - 0.35 * dot(uv, uv);
  col = mix(uBg, col, clamp(vig, 0.0, 1.0));

  fragColor = vec4(col, 1.0);
}`,f=[.23,.17],h=2*Math.PI,v=(0,r.memo)(({flowSpeed:e=.35,warp:v=.55,stir:d=1,viscosity:m=.6,fresnel:p=2.2,iridescence:g=.45,roughness:w=.18,tint:y="#c8d2e0",sheenColor:x="#a855f7",backgroundColor:b="#05060a",paused:R=!1,reducedMotion:T=!1,className:C})=>{let k=(0,r.useRef)(null),M=(0,r.useRef)(null),S=(0,r.useRef)(null),A=(0,r.useRef)(null),F=(0,r.useRef)(null),P=(0,r.useRef)(null),[E,z]=(0,r.useState)(!1),B=(0,l.useAnimationLoop)({target:k,halted:R||T,dpr:"auto",onResize:e=>S.current?.(e),onFrame:({dt:e})=>!!M.current&&M.current(e),gl:()=>A.current}),D=(0,r.useRef)({flowSpeed:e,warp:v,stir:d,viscosity:m,fresnel:p,iridescence:g,roughness:w,tint:y,sheenColor:x,backgroundColor:b});D.current={flowSpeed:e,warp:v,stir:d,viscosity:m,fresnel:p,iridescence:g,roughness:w,tint:y,sheenColor:x,backgroundColor:b},(0,r.useEffect)(()=>{(()=>{try{return!!document.createElement("canvas").getContext("webgl2")}catch{return!1}})()||z(!0)},[]),(0,r.useEffect)(()=>{let e=k.current;if(E||!e)return;let t=new n.Renderer({webgl:2,alpha:!1,antialias:!1,powerPreference:"high-performance",dpr:Math.min(window.devicePixelRatio||1,2)}),r=t.gl;A.current=r;let l=r.canvas;l.style.display="block",l.style.position="absolute",l.style.top="0",l.style.left="0",e.appendChild(l);let R=Array(16).fill(0),T=Array(32).fill(0),C=new o.Program(r,{vertex:s,fragment:c,uniforms:{uResolution:{value:new Float32Array([1,1])},uDpr:{value:1},uPhase:{value:new Float32Array([0,1.3])},uWarp:{value:v},uStir:{value:d},uViscosity:{value:m},uFresnel:{value:p},uIridescence:{value:g},uRoughness:{value:w},uTint:{value:new Float32Array(u(y))},uSheen:{value:new Float32Array(u(x))},uBg:{value:new Float32Array(u(b))},uStirPos:{value:R},uStirVec:{value:T}}}),P=new a.Mesh(r,{geometry:new i.Triangle(r),program:C}),z=C.uniforms,I=new Float32Array([0,1.3]),N=0;F.current=(e,t,r,n)=>{R[2*N+0]=e,R[2*N+1]=t;let o=4*N;T[o+0]=r,T[o+1]=n,T[o+2]=0,T[o+3]=1,N=(N+1)%8};let V=()=>{let e=D.current;z.uPhase.value.set(I),z.uWarp.value=e.warp,z.uStir.value=e.stir,z.uViscosity.value=e.viscosity,z.uFresnel.value=e.fresnel,z.uIridescence.value=e.iridescence,z.uRoughness.value=e.roughness,z.uTint.value.set(u(e.tint)),z.uSheen.value.set(u(e.sheenColor)),z.uBg.value.set(u(e.backgroundColor))};return M.current=e=>{let r=D.current;for(let t=0;t<2;t++)I[t]=(I[t]+e*f[t]*r.flowSpeed)%h;for(let t=0;t<8;t++){let r=4*t;!(T[r+3]<.5)&&(T[r+2]+=e,T[r+2]>2.6&&(T[r+3]=0))}V(),t.render({scene:P})},S.current=({width:e,height:n,dpr:o})=>{t.dpr=o,t.setSize(Math.max(1,Math.floor(e)),Math.max(1,Math.floor(n)));let a=z.uResolution.value;a[0]=r.drawingBufferWidth,a[1]=r.drawingBufferHeight,z.uDpr.value=o,V(),t.render({scene:P})},B.resize(),B.start(),()=>{M.current=null,S.current=null,F.current=null,e.contains(l)&&e.removeChild(l)}},[E]),(0,r.useEffect)(()=>{B.paint()},[e,v,d,m,p,g,w,y,x,b,B]);let I=()=>{P.current=null};return E?(0,t.jsx)("div",{className:C??"relative h-full w-full overflow-hidden",style:{backgroundColor:b,backgroundImage:`linear-gradient(150deg, ${b} 0%, ${y} 38%, #ffffff 46%, ${y} 54%, ${x} 72%, ${b} 100%)`}}):(0,t.jsx)("div",{ref:k,className:C??"relative h-full w-full overflow-hidden",onPointerMove:e=>{if(T)return;let t=e.currentTarget.getBoundingClientRect();if(0===t.width||0===t.height)return;let r=(e.clientX-t.left-.5*t.width)/t.height,n=(t.top+.5*t.height-e.clientY)/t.height,o=P.current;if(!o){P.current={x:r,y:n};return}let a=r-o.x,i=n-o.y,l=Math.hypot(a,i);if(l<.04)return;P.current={x:r,y:n};let u=.06*Math.min(l/.04,2.5)/l;F.current?.(r,n,a*u,i*u),B.start()},onPointerLeave:I,onPointerCancel:I})});v.displayName="Quicksilver",e.s(["default",0,function({values:e,reducedMotion:r,paused:n}){return(0,t.jsxs)("div",{className:"relative h-full min-h-80 w-full",children:[(0,t.jsx)(v,{flowSpeed:e.flowSpeed,warp:e.warp,stir:e.stir,viscosity:e.viscosity,fresnel:e.fresnel,iridescence:e.iridescence,roughness:e.roughness,tint:e.tint,sheenColor:e.sheenColor,backgroundColor:e.backgroundColor,paused:n,reducedMotion:r}),r?null:(0,t.jsx)("p",{className:"pointer-events-none absolute right-3 bottom-2 font-display text-[9px] tracking-[0.28em] text-ink-mute uppercase",children:"drag — stir the metal"})]})}],189410)},203374,function(e){e.n(e.i(189410))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let n=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{n.current=e});let o=(0,t.useRef)(null),a=(0,t.useRef)(null),i=(0,t.useRef)(!1),l=(0,t.useRef)(!1),u=(0,t.useRef)(0),s=(0,t.useRef)(0),c=(0,t.useRef)(0),f=(0,t.useCallback)(()=>{let e=n.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=n.current.dpr??"auto",o=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:o,bufferWidth:Math.max(1,Math.round(t.width*o)),bufferHeight:Math.max(1,Math.round(t.height*o))}},[]),h=(0,t.useCallback)(function e(t){if(l.current)return;0===u.current&&(u.current=t);let a=0===s.current?0:Math.min((t-s.current)/1e3,r);s.current=t;let f={now:t,dt:a,elapsed:(t-u.current)/1e3,frame:c.current++},h=n.current.onFrame?.(f);if(!l.current){if(!1===h||n.current.halted){i.current=!1,o.current=null;return}o.current=requestAnimationFrame(e)}},[]),v=(0,t.useCallback)(()=>{l.current||i.current||(i.current=!0,s.current=0,o.current=requestAnimationFrame(h))},[h]),d=(0,t.useCallback)(()=>{i.current=!1,null!==o.current&&(cancelAnimationFrame(o.current),o.current=null)},[]),m=(0,t.useCallback)(()=>v(),[v]),p=(0,t.useCallback)(()=>{let e=f();e&&(n.current.onResize?.(e),!1!==n.current.paintWhenHalted?m():n.current.halted||v())},[f,m,v]),g=e.deps??[];(0,t.useEffect)(()=>{l.current=!1;let e=n.current.target.current;if(!e)return;let t=()=>{l.current||p()},r=new ResizeObserver(()=>{let e=n.current.resizeDebounceMs??0;e<=0?t():(null!==a.current&&clearTimeout(a.current),a.current=setTimeout(()=>{a.current=null,t()},e))});return r.observe(e),p(),n.current.halted||v(),()=>{l.current=!0,i.current=!1,null!==o.current&&(cancelAnimationFrame(o.current),o.current=null),null!==a.current&&(clearTimeout(a.current),a.current=null),r.disconnect(),n.current.onDispose?.();let e=n.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),u.current=0,s.current=0,c.current=0}},g);let w=e.halted??!1;return(0,t.useEffect)(()=>{w||v()},[w,v]),(0,t.useMemo)(()=>({start:v,stop:d,paint:m,resize:p,get running(){return i.current}}),[v,d,m,p])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);