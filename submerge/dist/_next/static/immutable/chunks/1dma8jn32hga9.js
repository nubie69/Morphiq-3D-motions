(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,93622,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(221663),n=e.i(956850),o=e.i(80075),l=e.i(753604),u=e.i(450922);let i=e=>{let t=e.replace("#",""),r=3===t.length?t.split("").map(e=>e+e).join(""):t,a=parseInt(r,16);return Number.isNaN(a)||6!==r.length?[1,1,1]:[(a>>16&255)/255,(a>>8&255)/255,(255&a)/255]},s=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`,c=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform float uIntensity;
uniform float uDropScale;
uniform float uSpeed;
uniform float uWander;
uniform float uRefraction;
uniform float uFog;
uniform float uLayers;
uniform float uBlur;
uniform vec3  uTintTop;
uniform vec3  uTintBottom;
uniform vec3  uGlow;

float hash21(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

// The city, built out of focus rather than blurred into it. Six discs is enough
// to read as depth and few enough to unroll.
vec3 backdrop(vec2 uv) {
  float a = uRes.x / max(uRes.y, 1.0);
  vec3 col = mix(uTintBottom, uTintTop, smoothstep(-0.15, 1.05, uv.y));

  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 seed = vec2(fi * 3.71 + 1.3, fi * 7.13 + 4.9);
    vec2 c = vec2(hash21(seed), hash21(seed + 19.7));
    c.x = c.x * 1.15 - 0.075;
    c.y = c.y * 0.85 + 0.1;

    float r = (0.10 + hash21(seed + 4.4) * 0.20) * (0.55 + uBlur * 1.25);
    float d = length((uv - c) * vec2(a, 1.0));
    float g = smoothstep(r, 0.0, d);
    // Squared so the falloff is a lens bokeh rather than a linear ramp.
    col += uGlow * g * g * (0.09 + 0.26 * hash21(seed + 31.2));
  }

  // A little vertical smear, the way a long exposure through glass behaves.
  col *= 0.86 + 0.14 * smoothstep(0.0, 0.6, uv.y);
  return col;
}

// One depth plane of rain.
//   xy = refraction offset   z = wet mask (drops)   w = cleared mask (trails)
vec4 rainLayer(vec2 uv, float scale, float seed) {
  float a = uRes.x / max(uRes.y, 1.0);
  vec2 grid = vec2(7.0 * a, 9.0) / max(scale, 0.05);
  vec2 st = uv * grid;
  vec2 id = floor(st);
  st = fract(st) - 0.5;

  float n = hash21(id + seed);
  // Cells are gated, not dimmed. A half-present drop looks like a smudge; a cell
  // either has water in it or it does not.
  float alive = step(1.0 - uIntensity, n);

  float t = uTime * uSpeed * 0.32 + n * 17.0;

  // Horizontal seat in the cell, plus the wander it picks up on the way down.
  float x = (n - 0.5) * 0.62;

  // Stick-slip: three holds per traverse, each released by a smoothstep so the
  // slip is quick and the hold is genuinely still.
  float prog = fract(t);
  float steps = 3.0;
  float stair = (floor(prog * steps) + smoothstep(0.58, 1.0, fract(prog * steps))) / steps;
  float y = 0.62 - stair * 1.28;

  x += sin(stair * 9.0 + n * 6.28) * 0.09 * uWander;

  // The drop itself, aspect-corrected so it is round on any canvas, and slightly
  // taller than wide because a hanging drop is.
  vec2 dp = (st - vec2(x, y)) * vec2(a * grid.y / grid.x, 1.0);
  dp.y *= 0.82;
  float rad = 0.085 + n * 0.055;
  float drop = smoothstep(rad, rad * 0.35, length(dp)) * alive;

  // What it left behind. Quantising y inside the trail band turns one expression
  // into a column of shrinking droplets without a loop.
  float above = smoothstep(-0.02, 0.06, st.y - y);
  vec2 tp = st - vec2(x, 0.0);
  tp.y = (fract(tp.y * 11.0) - 0.5) / 11.0;
  tp *= vec2(a * grid.y / grid.x, 1.0);
  float fade = smoothstep(0.85, 0.05, st.y - y);
  float trail = smoothstep(0.030, 0.008, length(tp)) * above * fade * alive;

  // The swept band. Wider than the droplets so the fog opens ahead of them.
  float cleared = alive * above * fade * smoothstep(0.11, 0.02, abs(st.x - x));

  // Condensation that never ran: fixed, unmoving, and denser than the runners.
  vec2 mp = uv * grid * 3.4;
  vec2 mid = floor(mp);
  vec2 mf = fract(mp) - 0.5;
  float mn = hash21(mid + seed + 61.7);
  float micro = smoothstep(0.30, 0.10, length(mf * vec2(a * grid.y / grid.x, 1.0) * 3.4))
              * step(1.0 - uIntensity * 0.55, mn);

  float wet = clamp(drop + trail * 0.85 + micro * 0.5, 0.0, 1.0);

  // The lens. Offset points out of each droplet's centre, which is what makes it
  // magnify rather than merely smear.
  vec2 off = dp * drop * 0.85 + tp * trail * 1.4 + mf * micro * 0.20;

  return vec4(off, wet, clamp(cleared + drop, 0.0, 1.0));
}

void main() {
  vec2 uv = vUv;

  vec2 off = vec2(0.0);
  float wet = 0.0;
  float cleared = 0.0;

  // Bounded at three and broken early. A loop the compiler can unroll keeps this
  // inside the budget of a software rasteriser, which is what the verifier runs.
  for (int i = 0; i < 3; i++) {
    if (float(i) >= uLayers) break;
    float fi = float(i);
    vec4 l = rainLayer(uv, uDropScale * (1.0 - fi * 0.28), fi * 23.4);
    // Nearer planes refract harder and read wetter; far ones are just texture.
    float w = 1.0 - fi * 0.3;
    off += l.xy * w;
    wet = max(wet, l.z * w);
    cleared = max(cleared, l.w);
  }

  vec3 col = backdrop(uv + off * uRefraction * 0.55);

  // Fog is *removed* by what the water touched, rather than drawn between the
  // drops — so a trail is a clean stripe through the film instead of a shape
  // sitting on top of it.
  float film = uFog * (1.0 - cleared);
  vec3 hazy = mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114))), 0.55);
  hazy = mix(hazy, hazy + vec3(0.035, 0.030, 0.055), 0.6);
  col = mix(col, hazy, film);

  // Grain, only in the fog. Clean glass should be clean.
  col += (hash21(uv * uRes + uTime) - 0.5) * 0.028 * film;

  // A wet edge catches the light behind it. Cheap, and it is what sells glass.
  col += uGlow * pow(wet, 3.0) * 0.22;

  fragColor = vec4(col, 1.0);
}`,f=(0,r.memo)(({intensity:e=.55,dropScale:f=1,speed:d=1,wander:h=.5,refraction:p=.6,fog:v=.5,layers:m=2,blur:g=.65,tintTop:y="#241436",tintBottom:w="#0b0b12",glow:b="#a855f7",paused:x=!1,reducedMotion:R=!1,className:T})=>{let k=(0,r.useRef)(null),M=(0,r.useRef)(null),C=(0,r.useRef)(null),A=(0,r.useRef)(null),[F,S]=(0,r.useState)(!1),z=(0,u.useAnimationLoop)({target:k,halted:x||R,dpr:"auto",onResize:e=>C.current?.(e),onFrame:({dt:e})=>!!M.current&&M.current(e),gl:()=>A.current}),B=(0,r.useRef)({intensity:e,dropScale:f,speed:d,wander:h,refraction:p,fog:v,layers:m,blur:g,tintTop:y,tintBottom:w,glow:b,reducedMotion:R});return B.current={intensity:e,dropScale:f,speed:d,wander:h,refraction:p,fog:v,layers:m,blur:g,tintTop:y,tintBottom:w,glow:b,reducedMotion:R},(0,r.useEffect)(()=>{let t,r=k.current;if(F||!r)return;try{if(!((t=new a.Renderer({webgl:2,alpha:!1,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)})).gl instanceof WebGL2RenderingContext))throw Error("Rainglass requires WebGL2")}catch{S(!0);return}let u=t.gl;A.current=u;let x=u.canvas;x.style.display="block",x.style.position="absolute",x.style.inset="0",x.style.width="100%",x.style.height="100%",r.appendChild(x);let R=new n.Program(u,{vertex:s,fragment:c,depthTest:!1,depthWrite:!1,uniforms:{uRes:{value:new Float32Array([1,1])},uTime:{value:0},uIntensity:{value:e},uDropScale:{value:f},uSpeed:{value:d},uWander:{value:h},uRefraction:{value:p},uFog:{value:v},uLayers:{value:m},uBlur:{value:g},uTintTop:{value:new Float32Array(i(y))},uTintBottom:{value:new Float32Array(i(w))},uGlow:{value:new Float32Array(i(b))}}}),T=new o.Mesh(u,{geometry:new l.Triangle(u),program:R}),L=R.uniforms,W=40;return M.current=e=>{let r=B.current;W=(W+(r.reducedMotion?0:e))%3600,L.uTime.value=W,L.uIntensity.value=r.intensity,L.uDropScale.value=r.dropScale,L.uSpeed.value=r.speed,L.uWander.value=r.wander,L.uRefraction.value=r.refraction,L.uFog.value=r.fog,L.uLayers.value=Math.round(r.layers),L.uBlur.value=r.blur,L.uTintTop.value.set(i(r.tintTop)),L.uTintBottom.value.set(i(r.tintBottom)),L.uGlow.value.set(i(r.glow)),t.render({scene:T})},C.current=({width:e,height:r,dpr:a})=>{t.dpr=a,t.setSize(Math.max(1,Math.floor(e)),Math.max(1,Math.floor(r))),L.uRes.value.set([Math.max(1,Math.floor(e)),Math.max(1,Math.floor(r))])},z.resize(),z.start(),()=>{M.current=null,C.current=null,r.contains(x)&&r.removeChild(x)}},[F]),(0,t.jsx)("div",{ref:k,className:`relative h-full w-full overflow-hidden ${T??""}`,style:F?{background:`linear-gradient(to bottom, ${y}, ${w})`}:void 0})});f.displayName="Rainglass",e.s(["default",0,function({values:e,reducedMotion:r,paused:a}){return(0,t.jsx)(f,{intensity:e.intensity,dropScale:e.dropScale,speed:e.speed,wander:e.wander,refraction:e.refraction,fog:e.fog,layers:e.layers,blur:e.blur,tintTop:e.tintTop,tintBottom:e.tintBottom,glow:e.glow,paused:a,reducedMotion:r})}],93622)},478420,function(e){e.n(e.i(93622))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let a=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{a.current=e});let n=(0,t.useRef)(null),o=(0,t.useRef)(null),l=(0,t.useRef)(!1),u=(0,t.useRef)(!1),i=(0,t.useRef)(0),s=(0,t.useRef)(0),c=(0,t.useRef)(0),f=(0,t.useCallback)(()=>{let e=a.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=a.current.dpr??"auto",n=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:n,bufferWidth:Math.max(1,Math.round(t.width*n)),bufferHeight:Math.max(1,Math.round(t.height*n))}},[]),d=(0,t.useCallback)(function e(t){if(u.current)return;0===i.current&&(i.current=t);let o=0===s.current?0:Math.min((t-s.current)/1e3,r);s.current=t;let f={now:t,dt:o,elapsed:(t-i.current)/1e3,frame:c.current++},d=a.current.onFrame?.(f);if(!u.current){if(!1===d||a.current.halted){l.current=!1,n.current=null;return}n.current=requestAnimationFrame(e)}},[]),h=(0,t.useCallback)(()=>{u.current||l.current||(l.current=!0,s.current=0,n.current=requestAnimationFrame(d))},[d]),p=(0,t.useCallback)(()=>{l.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null)},[]),v=(0,t.useCallback)(()=>h(),[h]),m=(0,t.useCallback)(()=>{let e=f();e&&(a.current.onResize?.(e),!1!==a.current.paintWhenHalted?v():a.current.halted||h())},[f,v,h]),g=e.deps??[];(0,t.useEffect)(()=>{u.current=!1;let e=a.current.target.current;if(!e)return;let t=()=>{u.current||m()},r=new ResizeObserver(()=>{let e=a.current.resizeDebounceMs??0;e<=0?t():(null!==o.current&&clearTimeout(o.current),o.current=setTimeout(()=>{o.current=null,t()},e))});return r.observe(e),m(),a.current.halted||h(),()=>{u.current=!0,l.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null),null!==o.current&&(clearTimeout(o.current),o.current=null),r.disconnect(),a.current.onDispose?.();let e=a.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),i.current=0,s.current=0,c.current=0}},g);let y=e.halted??!1;return(0,t.useEffect)(()=>{y||h()},[y,h]),(0,t.useMemo)(()=>({start:h,stop:p,paint:v,resize:m,get running(){return l.current}}),[h,p,v,m])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);