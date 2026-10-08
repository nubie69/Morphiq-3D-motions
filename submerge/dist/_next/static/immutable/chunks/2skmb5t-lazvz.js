(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,855137,e=>{"use strict";var t=e.i(843476),r=e.i(271645),n=e.i(221663),u=e.i(956850),l=e.i(80075),a=e.i(753604),i=e.i(450922);let o=e=>{let t=e.replace("#",""),r=3===t.length?t.split("").map(e=>e+e).join(""):t,n=parseInt(r,16);return Number.isNaN(n)||6!==r.length?[1,1,1]:[(n>>16&255)/255,(n>>8&255)/255,(255&n)/255]},c=`#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`,s=`#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uResolution;
uniform float uDpr;
uniform vec2  uDriftA;
uniform vec2  uDriftB;
uniform float uScale;
uniform float uDepth;
uniform float uRipple;
uniform float uRefraction;
uniform float uBrightness;
uniform vec2  uPointer;
uniform float uPointerInfluence;
uniform vec3  uInk;
uniform vec3  uGlow;
uniform vec3  uBg;

#define PERIOD 32.0
#define MAX_DEPTH 5

// Lattice hash, wrapped to PERIOD so the whole field tiles on that boundary.
// The sin-based hash is the universally portable one; its exact values differ a
// little between GPUs, which is invisible here because nothing depends on a
// specific cell being a specific brightness.
float hash(vec2 cell) {
  cell = mod(cell, PERIOD);
  return fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // Smoothstep interpolant — a linear one leaves the lattice visible as a grid
  // of creases, which reads as fabric rather than as water.
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// One sheet of light: warp, then fold. Order matters — folding first and warping
// the result smears the filaments instead of bending them.
float sheet(vec2 p, vec2 drift, float warp) {
  vec2 q = p + drift;
  vec2 w = vec2(noise(q + vec2(1.7, 9.2)), noise(q + vec2(8.3, 2.8)));
  float n = noise(q + (w - 0.5) * warp);
  return 1.0 - abs(2.0 * n - 1.0);
}

void main() {
  vec2 res = uResolution / uDpr;
  vec2 uv = (gl_FragCoord.xy / uDpr) / res;
  // Aspect-corrected about the centre, so the cells stay square and the pattern
  // does not stretch when the container does.
  vec2 p = (uv - 0.5) * vec2(res.x / max(res.y, 1.0), 1.0) * uScale;
  p += uPointer * uPointerInfluence * 0.6;

  int depth = int(uDepth);
  float sum = 0.0;
  float total = 0.0;
  for (int i = 0; i < MAX_DEPTH; i++) {
    if (i >= depth) break;
    float step_ = float(i + 1);
    // Frequency climbs geometrically, contribution falls at the same rate, so
    // adding an octave adds detail without adding overall brightness.
    float freq = pow(1.73, float(i));
    float weight = 1.0 / freq;
    // Alternating between two drift vectors decorrelates the octaves. Both are
    // integer multiples of a wrapped offset, so both still tile.
    vec2 drift = (i - (i / 2) * 2 == 0) ? uDriftA * step_ : uDriftB * step_;
    sum += sheet(p * freq, drift, uRefraction) * weight;
    total += weight;
  }

  float light = pow(clamp(sum / max(total, 1e-4), 0.0, 1.0), uRipple) * uBrightness;

  // Two-stop ramp rather than one: the body of a filament and its core are
  // different colours in the real thing, and a single mix toward one bright
  // colour flattens the network into a wire diagram.
  vec3 color = mix(uBg, uInk, clamp(light, 0.0, 1.0));
  color = mix(color, uGlow, clamp(light - 1.0, 0.0, 1.0));

  fragColor = vec4(color, 1.0);
}`,f=(0,r.memo)(({scale:e=4,speed:f=.35,depth:h=3,ripple:d=3.2,refraction:p=.85,brightness:v=1.35,pointerInfluence:m=1,inkColor:g="#a855f7",glowColor:w="#e9d5ff",backgroundColor:b="#08050e",paused:y=!1,reducedMotion:x=!1,className:R})=>{let C=(0,r.useRef)(null),A=(0,r.useRef)(null),P=(0,r.useRef)(null),D=(0,r.useRef)(null),[k,B]=(0,r.useState)(!1),F=(0,i.useAnimationLoop)({target:C,halted:y||x,dpr:"auto",onResize:e=>P.current?.(e),onFrame:({dt:e})=>!!A.current&&A.current(e),gl:()=>D.current}),M=(0,r.useRef)({scale:e,speed:f,depth:h,ripple:d,refraction:p,brightness:v,pointerInfluence:m,inkColor:g,glowColor:w,backgroundColor:b});M.current={scale:e,speed:f,depth:h,ripple:d,refraction:p,brightness:v,pointerInfluence:m,inkColor:g,glowColor:w,backgroundColor:b};let I=(0,r.useRef)({x:0,y:0,tx:0,ty:0});(0,r.useEffect)(()=>{(()=>{try{return!!document.createElement("canvas").getContext("webgl2")}catch{return!1}})()||B(!0)},[]),(0,r.useEffect)(()=>{let t=C.current;if(k||!t)return;let r=new n.Renderer({webgl:2,alpha:!1,antialias:!1,powerPreference:"high-performance",dpr:Math.min(window.devicePixelRatio||1,2)}),i=r.gl;D.current=i;let f=i.canvas;f.style.display="block",f.style.position="absolute",f.style.top="0",f.style.left="0",t.appendChild(f);let y=new u.Program(i,{vertex:c,fragment:s,uniforms:{uResolution:{value:new Float32Array([1,1])},uDpr:{value:1},uDriftA:{value:new Float32Array([0,0])},uDriftB:{value:new Float32Array([0,0])},uScale:{value:e},uDepth:{value:h},uRipple:{value:d},uRefraction:{value:p},uBrightness:{value:v},uPointer:{value:new Float32Array([0,0])},uPointerInfluence:{value:m},uInk:{value:new Float32Array(o(g))},uGlow:{value:new Float32Array(o(w))},uBg:{value:new Float32Array(o(b))}}}),x=new l.Mesh(i,{geometry:new a.Triangle(i),program:y}),R=y.uniforms,B=new Float32Array([0,0]),E=new Float32Array([0,0]),T=()=>{let e=M.current;R.uDriftA.value.set(B),R.uDriftB.value.set(E),R.uScale.value=e.scale,R.uDepth.value=e.depth,R.uRipple.value=e.ripple,R.uRefraction.value=e.refraction,R.uBrightness.value=e.brightness,R.uPointerInfluence.value=e.pointerInfluence,R.uPointer.value[0]=I.current.x,R.uPointer.value[1]=I.current.y,R.uInk.value.set(o(e.inkColor)),R.uGlow.value.set(o(e.glowColor)),R.uBg.value.set(o(e.backgroundColor))};return A.current=e=>{let t=M.current.speed*e;B[0]=(B[0]+.62*t)%32,B[1]=(B[1]+.21*t)%32,E[0]=(E[0]+-.29*t)%32,E[1]=(E[1]+.47*t)%32;let n=I.current,u=Math.min(1,6*e);n.x+=(n.tx-n.x)*u,n.y+=(n.ty-n.y)*u,T(),r.render({scene:x})},P.current=({width:e,height:t,dpr:n})=>{r.dpr=n,r.setSize(Math.max(1,Math.floor(e)),Math.max(1,Math.floor(t)));let u=R.uResolution.value;u[0]=i.drawingBufferWidth,u[1]=i.drawingBufferHeight,R.uDpr.value=n,T(),r.render({scene:x})},F.resize(),F.start(),()=>{A.current=null,P.current=null,t.contains(f)&&t.removeChild(f)}},[k]),(0,r.useEffect)(()=>{F.paint()},[e,f,h,d,p,v,m,g,w,b,F]);let E=()=>{I.current.tx=0,I.current.ty=0,F.start()};if(k){let e=(e,t,r,n)=>`radial-gradient(${n}% ${n}% at ${e}% ${t}%, ${r} 0%, transparent 62%)`;return(0,t.jsx)("div",{className:R??"relative h-full w-full overflow-hidden",style:{backgroundColor:b,backgroundImage:[e(28,32,w,60),e(72,58,g,80),e(48,88,g,70)].join(", "),opacity:.9}})}return(0,t.jsx)("div",{ref:C,className:R??"relative h-full w-full overflow-hidden",onPointerMove:e=>{let t=e.currentTarget.getBoundingClientRect();0!==t.width&&0!==t.height&&(I.current.tx=(e.clientX-t.left)/t.width*2-1,I.current.ty=(e.clientY-t.top)/t.height*2-1,F.start())},onPointerLeave:E,onPointerCancel:E})});f.displayName="Caustics",e.s(["default",0,function({values:e,reducedMotion:r,paused:n}){return(0,t.jsxs)("div",{className:"relative h-full w-full",children:[(0,t.jsx)(f,{scale:e.scale,speed:e.speed,depth:e.depth,ripple:e.ripple,refraction:e.refraction,brightness:e.brightness,pointerInfluence:e.pointerInfluence,inkColor:e.inkColor,glowColor:e.glowColor,backgroundColor:e.backgroundColor,paused:n,reducedMotion:r}),r?null:(0,t.jsx)("p",{className:"pointer-events-none absolute right-3 bottom-2 font-display text-[9px] tracking-[0.28em] text-ink-mute uppercase",children:"move — push the water"})]})}],855137)},750324,function(e){e.n(e.i(855137))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let n=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{n.current=e});let u=(0,t.useRef)(null),l=(0,t.useRef)(null),a=(0,t.useRef)(!1),i=(0,t.useRef)(!1),o=(0,t.useRef)(0),c=(0,t.useRef)(0),s=(0,t.useRef)(0),f=(0,t.useCallback)(()=>{let e=n.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=n.current.dpr??"auto",u=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:u,bufferWidth:Math.max(1,Math.round(t.width*u)),bufferHeight:Math.max(1,Math.round(t.height*u))}},[]),h=(0,t.useCallback)(function e(t){if(i.current)return;0===o.current&&(o.current=t);let l=0===c.current?0:Math.min((t-c.current)/1e3,r);c.current=t;let f={now:t,dt:l,elapsed:(t-o.current)/1e3,frame:s.current++},h=n.current.onFrame?.(f);if(!i.current){if(!1===h||n.current.halted){a.current=!1,u.current=null;return}u.current=requestAnimationFrame(e)}},[]),d=(0,t.useCallback)(()=>{i.current||a.current||(a.current=!0,c.current=0,u.current=requestAnimationFrame(h))},[h]),p=(0,t.useCallback)(()=>{a.current=!1,null!==u.current&&(cancelAnimationFrame(u.current),u.current=null)},[]),v=(0,t.useCallback)(()=>d(),[d]),m=(0,t.useCallback)(()=>{let e=f();e&&(n.current.onResize?.(e),!1!==n.current.paintWhenHalted?v():n.current.halted||d())},[f,v,d]),g=e.deps??[];(0,t.useEffect)(()=>{i.current=!1;let e=n.current.target.current;if(!e)return;let t=()=>{i.current||m()},r=new ResizeObserver(()=>{let e=n.current.resizeDebounceMs??0;e<=0?t():(null!==l.current&&clearTimeout(l.current),l.current=setTimeout(()=>{l.current=null,t()},e))});return r.observe(e),m(),n.current.halted||d(),()=>{i.current=!0,a.current=!1,null!==u.current&&(cancelAnimationFrame(u.current),u.current=null),null!==l.current&&(clearTimeout(l.current),l.current=null),r.disconnect(),n.current.onDispose?.();let e=n.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),o.current=0,c.current=0,s.current=0}},g);let w=e.halted??!1;return(0,t.useEffect)(()=>{w||d()},[w,d]),(0,t.useMemo)(()=>({start:d,stop:p,paint:v,resize:m,get running(){return a.current}}),[d,p,v,m])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);