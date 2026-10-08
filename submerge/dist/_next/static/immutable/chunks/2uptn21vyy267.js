(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,719228,e=>{"use strict";var t=e.i(843476),r=e.i(271645),n=e.i(221663),a=e.i(956850),u=e.i(80075),i=e.i(753604),l=e.i(450922);let o={lines:0,grid:1,dots:2,rings:3},s=e=>{let t=e.replace("#",""),r=3===t.length?t.split("").map(e=>e+e).join(""):t,n=parseInt(r,16);return Number.isNaN(n)||6!==r.length?[1,1,1]:[(n>>16&255)/255,(n>>8&255)/255,(255&n)/255]},c=`#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`,f=`#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uResolution;
uniform float uDpr;
uniform vec3  uPhase;
uniform float uPitch;
uniform float uAngle;
uniform float uDrift;
uniform float uSeparation;
uniform float uThickness;
uniform float uContrast;
uniform vec2  uPointer;
uniform float uPointerInfluence;
uniform float uLattice;
uniform vec3  uInk;
uniform vec3  uBg;

mat2 rot(float a) { float s = sin(a); float c = cos(a); return mat2(c, -s, s, c); }

// Band-limited coverage of one 1D lattice. w is cells per pixel: as it grows the
// smoothstep spans the whole cell and the layer greys out instead of aliasing.
float bandCov(float p, float duty, float w) {
  float d = abs(fract(p) - 0.5);
  float h = 0.5 * duty;
  return 1.0 - smoothstep(h - w, h + w, d);
}

// 1 where the two lattices sit in phase, 0 where they are exactly interleaved.
// This is the beat itself, read off the phase difference rather than inferred
// from the pixels — it varies slowly across the frame, which is why it can carry
// colour without carrying the lattice's own frequency along with it.
float phaseAlign(float d) {
  return 1.0 - 2.0 * abs(fract(d + 0.5) - 0.5);
}

// Derivatives are taken once, before any branch — fwidth inside divergent control
// flow is undefined in GLSL ES 3.0.
float layerCoverage(vec2 p, float duty) {
  vec2 wv = max(fwidth(p), vec2(1e-5));
  if (uLattice < 0.5) {
    return bandCov(p.y, duty, wv.y);
  }
  if (uLattice < 1.5) {
    return max(bandCov(p.x, duty, wv.x), bandCov(p.y, duty, wv.y));
  }
  if (uLattice < 2.5) {
    float d = length(fract(p) - 0.5);
    float w = max(wv.x, wv.y) * 0.75;
    float r = 0.5 * duty;
    return 1.0 - smoothstep(r - w, r + w, d);
  }
  return bandCov(length(p), duty, length(wv) * 0.7);
}

void main() {
  vec2 res = uResolution / uDpr;
  vec2 c = gl_FragCoord.xy / uDpr - res * 0.5;

  // Half the angle onto each layer, so 0\xb0 stacks them exactly and the field goes
  // blank — which is the honest reading of "no rotation between the lattices".
  float wobble = sin(uPhase.x) * 0.8 * uDrift;
  float half_ = radians(uAngle + wobble + uPointer.x * 1.2 * uPointerInfluence) * 0.5;

  vec2 slide = vec2(cos(uPhase.y), sin(uPhase.z)) * uDrift * 5.0
             + uPointer * 16.0 * uPointerInfluence;
  vec2 sep = vec2(uSeparation, 0.0) + slide;

  float pitch = max(uPitch, 0.5);
  vec2 pa = (rot(-half_) * c) / pitch;
  vec2 pb = (rot(half_) * (c + sep)) / pitch;

  float a = layerCoverage(pa, uThickness);
  float b = layerCoverage(pb, uThickness);

  // Two ink layers stacked: what stays clear is what neither one covered.
  float ink = 1.0 - (1.0 - a) * (1.0 - b);

  // Expand around the pattern's own mean, not around 0.5 — otherwise raising
  // contrast just floods the frame with ink instead of opening the fringes.
  float pivot = 1.0 - (1.0 - uThickness) * (1.0 - uThickness);
  ink = clamp((ink - pivot) * uContrast + pivot, 0.0, 1.0);

  float align;
  if (uLattice < 0.5)      align = phaseAlign(pa.y - pb.y);
  else if (uLattice < 2.5) align = min(phaseAlign(pa.x - pb.x), phaseAlign(pa.y - pb.y));
  else                     align = phaseAlign(length(pa) - length(pb));

  // Where the lattices agree their ink lands on the same pixels and the band
  // should read as absence, not as more lines. Dimming the ink toward the field
  // in those zones makes the fringe the subject; leave it out and you get an
  // evenly loud grating with a faint beat somewhere inside it.
  vec3 line = mix(uBg, uInk, 0.2 + 0.8 * (1.0 - align));

  fragColor = vec4(mix(uBg, line, ink), 1.0);
}`,h=(0,r.memo)(({lattice:e="lines",pitch:h=9,angle:d=3.2,drift:p=.35,separation:v=6,thickness:g=.16,contrast:m=1,pointerInfluence:w=1,inkColor:y="#a855f7",backgroundColor:b="#08050e",paused:x=!1,reducedMotion:k=!1,className:C})=>{let P=(0,r.useRef)(null),R=(0,r.useRef)(null),A=(0,r.useRef)(null),M=(0,r.useRef)(null),[T,D]=(0,r.useState)(!1),F=(0,l.useAnimationLoop)({target:P,halted:x||k,dpr:"auto",onResize:e=>A.current?.(e),onFrame:({dt:e})=>!!R.current&&R.current(e),gl:()=>M.current}),I=(0,r.useRef)({lattice:e,pitch:h,angle:d,drift:p,separation:v,thickness:g,contrast:m,pointerInfluence:w,inkColor:y,backgroundColor:b});I.current={lattice:e,pitch:h,angle:d,drift:p,separation:v,thickness:g,contrast:m,pointerInfluence:w,inkColor:y,backgroundColor:b};let L=(0,r.useRef)({x:0,y:0,tx:0,ty:0});(0,r.useEffect)(()=>{(()=>{try{return!!document.createElement("canvas").getContext("webgl2")}catch{return!1}})()||D(!0)},[]),(0,r.useEffect)(()=>{let t=P.current;if(T||!t)return;let r=new n.Renderer({webgl:2,alpha:!1,antialias:!1,powerPreference:"high-performance",dpr:Math.min(window.devicePixelRatio||1,2)}),l=r.gl;M.current=l;let x=l.canvas;x.style.display="block",x.style.position="absolute",x.style.top="0",x.style.left="0",t.appendChild(x);let k=new a.Program(l,{vertex:c,fragment:f,uniforms:{uResolution:{value:new Float32Array([1,1])},uDpr:{value:1},uPhase:{value:new Float32Array([0,0,0])},uPitch:{value:h},uAngle:{value:d},uDrift:{value:p},uSeparation:{value:v},uThickness:{value:g},uContrast:{value:m},uPointer:{value:new Float32Array([0,0])},uPointerInfluence:{value:w},uLattice:{value:o[e]??0},uInk:{value:new Float32Array(s(y))},uBg:{value:new Float32Array(s(b))}}}),C=new u.Mesh(l,{geometry:new i.Triangle(l),program:k}),D=k.uniforms,B=new Float32Array([0,0,0]),E=[.5,.23,.19],j=2*Math.PI,z=()=>{let e=I.current;D.uPhase.value.set(B),D.uPitch.value=e.pitch,D.uAngle.value=e.angle,D.uDrift.value=e.drift,D.uSeparation.value=e.separation,D.uThickness.value=e.thickness,D.uContrast.value=e.contrast,D.uPointerInfluence.value=e.pointerInfluence,D.uLattice.value=o[e.lattice]??0,D.uPointer.value[0]=L.current.x,D.uPointer.value[1]=L.current.y,D.uInk.value.set(s(e.inkColor)),D.uBg.value.set(s(e.backgroundColor))};return R.current=e=>{for(let t=0;t<3;t++)B[t]=(B[t]+e*E[t])%j;let t=L.current,n=Math.min(1,6*e);t.x+=(t.tx-t.x)*n,t.y+=(t.ty-t.y)*n,z(),r.render({scene:C})},A.current=({width:e,height:t,dpr:n})=>{r.dpr=n,r.setSize(Math.max(1,Math.floor(e)),Math.max(1,Math.floor(t)));let a=D.uResolution.value;a[0]=l.drawingBufferWidth,a[1]=l.drawingBufferHeight,D.uDpr.value=n,z(),r.render({scene:C})},F.resize(),F.start(),()=>{R.current=null,A.current=null,t.contains(x)&&t.removeChild(x)}},[T]),(0,r.useEffect)(()=>{F.paint()},[e,h,d,p,v,g,m,w,y,b,F]);let B=()=>{L.current.tx=0,L.current.ty=0,F.start()};if(T){let e=e=>`repeating-linear-gradient(${e}deg, ${y} 0 ${h*g}px, transparent ${h*g}px ${h}px)`;return(0,t.jsx)("div",{className:C??"relative h-full w-full overflow-hidden",style:{backgroundColor:b,backgroundImage:`${e(90-d)}, ${e(90)}`,opacity:.9}})}return(0,t.jsx)("div",{ref:P,className:C??"relative h-full w-full overflow-hidden",onPointerMove:e=>{let t=e.currentTarget.getBoundingClientRect();0!==t.width&&0!==t.height&&(L.current.tx=(e.clientX-t.left)/t.width*2-1,L.current.ty=(e.clientY-t.top)/t.height*2-1,F.start())},onPointerLeave:B,onPointerCancel:B})});h.displayName="Moire",e.s(["default",0,function({values:e,reducedMotion:r,paused:n}){return(0,t.jsxs)("div",{className:"relative h-full w-full",children:[(0,t.jsx)(h,{lattice:e.lattice,pitch:e.pitch,angle:e.angle,drift:e.drift,separation:e.separation,thickness:e.thickness,contrast:e.contrast,pointerInfluence:e.pointerInfluence,inkColor:e.inkColor,backgroundColor:e.backgroundColor,paused:n,reducedMotion:r}),r?null:(0,t.jsx)("p",{className:"pointer-events-none absolute right-3 bottom-2 font-display text-[9px] tracking-[0.28em] text-ink-mute uppercase",children:"move — twist the lattice"})]})}],719228)},551726,function(e){e.n(e.i(719228))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let n=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{n.current=e});let a=(0,t.useRef)(null),u=(0,t.useRef)(null),i=(0,t.useRef)(!1),l=(0,t.useRef)(!1),o=(0,t.useRef)(0),s=(0,t.useRef)(0),c=(0,t.useRef)(0),f=(0,t.useCallback)(()=>{let e=n.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=n.current.dpr??"auto",a=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:a,bufferWidth:Math.max(1,Math.round(t.width*a)),bufferHeight:Math.max(1,Math.round(t.height*a))}},[]),h=(0,t.useCallback)(function e(t){if(l.current)return;0===o.current&&(o.current=t);let u=0===s.current?0:Math.min((t-s.current)/1e3,r);s.current=t;let f={now:t,dt:u,elapsed:(t-o.current)/1e3,frame:c.current++},h=n.current.onFrame?.(f);if(!l.current){if(!1===h||n.current.halted){i.current=!1,a.current=null;return}a.current=requestAnimationFrame(e)}},[]),d=(0,t.useCallback)(()=>{l.current||i.current||(i.current=!0,s.current=0,a.current=requestAnimationFrame(h))},[h]),p=(0,t.useCallback)(()=>{i.current=!1,null!==a.current&&(cancelAnimationFrame(a.current),a.current=null)},[]),v=(0,t.useCallback)(()=>d(),[d]),g=(0,t.useCallback)(()=>{let e=f();e&&(n.current.onResize?.(e),!1!==n.current.paintWhenHalted?v():n.current.halted||d())},[f,v,d]),m=e.deps??[];(0,t.useEffect)(()=>{l.current=!1;let e=n.current.target.current;if(!e)return;let t=()=>{l.current||g()},r=new ResizeObserver(()=>{let e=n.current.resizeDebounceMs??0;e<=0?t():(null!==u.current&&clearTimeout(u.current),u.current=setTimeout(()=>{u.current=null,t()},e))});return r.observe(e),g(),n.current.halted||d(),()=>{l.current=!0,i.current=!1,null!==a.current&&(cancelAnimationFrame(a.current),a.current=null),null!==u.current&&(clearTimeout(u.current),u.current=null),r.disconnect(),n.current.onDispose?.();let e=n.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),o.current=0,s.current=0,c.current=0}},m);let w=e.halted??!1;return(0,t.useEffect)(()=>{w||d()},[w,d]),(0,t.useMemo)(()=>({start:d,stop:p,paint:v,resize:g,get running(){return i.current}}),[d,p,v,g])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);