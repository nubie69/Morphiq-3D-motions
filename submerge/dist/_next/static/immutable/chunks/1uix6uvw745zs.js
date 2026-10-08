(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,617922,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(221663),n=e.i(956850),l=e.i(80075),u=e.i(753604),i=e.i(450922);let o={bayer2:0,bayer4:1,bayer8:2,halftone:3,noise:4},s={plasma:0,ridges:1,tunnel:2,drift:3},c=e=>{let t=e.replace("#",""),r=3===t.length?t.split("").map(e=>e+e).join(""):t,a=parseInt(r,16);return Number.isNaN(a)||6!==r.length?[1,1,1]:[(a>>16&255)/255,(a>>8&255)/255,(255&a)/255]},f=`#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`,p=`#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uResolution;
uniform float uDpr;
uniform vec3  uPhase;
uniform float uPattern;
uniform float uLevels;
uniform float uPixelSize;
uniform float uField;
uniform float uFieldScale;
uniform float uContrast;
uniform vec3  uInk;
uniform vec3  uPaper;

// Bayer by recursion. The 2x2 case is a closed form, and each larger matrix is
// the next coarser one scaled into the gaps of this one - which is the actual
// definition of an ordered dither matrix, not an approximation of it.
float bayer2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(a * 0.5) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(a * 0.5) * 0.25 + bayer2(a); }

// Interleaved gradient noise. Not true blue noise - that needs a baked texture -
// but it is the standard cheap stand-in and it carries the property that matters
// here: no lattice, so no fixed pattern for the eye to lock onto.
float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

// Clustered dot on a grid rotated 45 degrees, which is where a press puts the
// black screen: at 45 the rosette stops competing with the horizontal and
// vertical edges that dominate most images.
float halftone(vec2 p) {
  vec2 r = vec2(p.x - p.y, p.x + p.y) * 0.70710678;
  vec2 cell = fract(r) - 0.5;
  return clamp(length(cell) * 1.41421356, 0.0, 1.0);
}

float thresholdAt(vec2 cell) {
  if (uPattern < 0.5) return bayer2(cell);
  if (uPattern < 1.5) return bayer4(cell);
  if (uPattern < 2.5) return bayer8(cell);
  if (uPattern < 3.5) return halftone(cell * 0.25);
  return ign(cell);
}

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

float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p *= 2.02; a *= 0.5; }
  return s;
}

float fieldAt(vec2 p) {
  vec3 ph = uPhase;
  if (uField < 0.5) {
    float v = sin(p.x * 1.7 + ph.x) * cos(p.y * 1.3 + ph.y);
    v += sin(length(p) * 2.2 - ph.z) * 0.8;
    return v * 0.35 + 0.5;
  }
  if (uField < 1.5) {
    vec2 q = p + vec2(cos(ph.x), sin(ph.y)) * 0.8;
    float r = 1.0 - abs(fbm(q) * 2.0 - 1.0);
    return r * r;
  }
  if (uField < 2.5) {
    float r = max(length(p), 0.08);
    float a = atan(p.y, p.x);
    // The phase multiplier is an integer so the 2*PI wrap stays invisible: sin
    // steps by a whole number of turns and lands exactly where it left.
    return 0.5 + 0.5 * sin(2.4 / r - ph.x * 3.0 + a * 2.0);
  }
  vec2 w = vec2(fbm(p + ph.xy), fbm(p + ph.yz + 5.2));
  return fbm(p + w * 0.9);
}

void main() {
  float cellPx = max(uPixelSize, 1.0) * uDpr;
  vec2 cell = floor(gl_FragCoord.xy / cellPx);

  vec2 res = uResolution / uDpr;
  // Centre of this cell, in CSS pixels. Every pixel in the cell resolves to the
  // same sample, so the cell is one tone rather than a smear the grid then cuts.
  vec2 sp = (cell * cellPx + cellPx * 0.5) / uDpr;
  vec2 p = (sp - res * 0.5) / max(res.y, 1.0) * max(uFieldScale, 0.05);

  float v = clamp(fieldAt(p), 0.0, 1.0);
  v = clamp((v - 0.5) * uContrast + 0.5, 0.0, 1.0);

  float n = max(uLevels - 1.0, 1.0);
  // The threshold is offset to zero-mean and spread across exactly one
  // quantisation step. Any wider and the dither reads as noise laid over the
  // image; any narrower and it stops breaking up the bands it exists to break.
  float t = thresholdAt(cell) - 0.5;
  float q = clamp(floor(v * n + t + 0.5) / n, 0.0, 1.0);

  fragColor = vec4(mix(uPaper, uInk, q), 1.0);
}`,d=[.31,.19,.11],h=2*Math.PI,v=(0,r.memo)(({pattern:e="bayer8",levels:v=2,pixelSize:m=3,field:x="plasma",fieldSpeed:g=.3,fieldScale:y=2.4,frameHold:b=0,contrast:w=1,inkColor:P="#e8e4d8",paperColor:C="#0b0b0d",paused:R=!1,reducedMotion:k=!1,className:F})=>{let S=(0,r.useRef)(null),z=(0,r.useRef)(null),A=(0,r.useRef)(null),M=(0,r.useRef)(null),[T,E]=(0,r.useState)(!1),D=(0,i.useAnimationLoop)({target:S,halted:R||k,dpr:"auto",onResize:e=>A.current?.(e),onFrame:({dt:e})=>!!z.current&&z.current(e),gl:()=>M.current}),I=(0,r.useRef)({pattern:e,levels:v,pixelSize:m,field:x,fieldSpeed:g,fieldScale:y,frameHold:b,contrast:w,inkColor:P,paperColor:C});if(I.current={pattern:e,levels:v,pixelSize:m,field:x,fieldSpeed:g,fieldScale:y,frameHold:b,contrast:w,inkColor:P,paperColor:C},(0,r.useEffect)(()=>{(()=>{try{return!!document.createElement("canvas").getContext("webgl2")}catch{return!1}})()||E(!0)},[]),(0,r.useEffect)(()=>{let t=S.current;if(T||!t)return;let r=new a.Renderer({webgl:2,alpha:!1,antialias:!1,powerPreference:"high-performance",dpr:Math.min(window.devicePixelRatio||1,2)}),i=r.gl;M.current=i;let g=i.canvas;g.style.display="block",g.style.position="absolute",g.style.top="0",g.style.left="0",t.appendChild(g);let b=new n.Program(i,{vertex:f,fragment:p,uniforms:{uResolution:{value:new Float32Array([1,1])},uDpr:{value:1},uPhase:{value:new Float32Array([0,0,0])},uPattern:{value:o[e]??2},uLevels:{value:v},uPixelSize:{value:m},uField:{value:s[x]??0},uFieldScale:{value:y},uContrast:{value:w},uInk:{value:new Float32Array(c(P))},uPaper:{value:new Float32Array(c(C))}}}),R=new l.Mesh(i,{geometry:new u.Triangle(i),program:b}),k=b.uniforms,F=new Float32Array([0,1.7,4.1]),E=()=>{let e=I.current;k.uPhase.value.set(F),k.uPattern.value=o[e.pattern]??2,k.uLevels.value=e.levels,k.uPixelSize.value=e.pixelSize,k.uField.value=s[e.field]??0,k.uFieldScale.value=e.fieldScale,k.uContrast.value=e.contrast,k.uInk.value.set(c(e.inkColor)),k.uPaper.value.set(c(e.paperColor))},N=0,j=0;return z.current=e=>{let t=I.current;if(N+=e,j<=0){for(let e=0;e<3;e++)F[e]=(F[e]+N*d[e]*t.fieldSpeed)%h;N=0,j=Math.max(0,Math.round(t.frameHold))}else j-=1;E(),r.render({scene:R})},A.current=({width:e,height:t,dpr:a})=>{r.dpr=a,r.setSize(Math.max(1,Math.floor(e)),Math.max(1,Math.floor(t)));let n=k.uResolution.value;n[0]=i.drawingBufferWidth,n[1]=i.drawingBufferHeight,k.uDpr.value=a,E(),r.render({scene:R})},D.resize(),D.start(),()=>{z.current=null,A.current=null,t.contains(g)&&t.removeChild(g)}},[T]),(0,r.useEffect)(()=>{D.paint()},[e,v,m,x,g,y,b,w,P,C,D]),T){let e=2*Math.max(m,1);return(0,t.jsx)("div",{className:F??"relative h-full w-full overflow-hidden",style:{backgroundColor:C,backgroundImage:`repeating-conic-gradient(${P} 0% 25%, ${C} 0% 50%)`,backgroundSize:`${e}px ${e}px`,opacity:.9}})}return(0,t.jsx)("div",{ref:S,className:F??"relative h-full w-full overflow-hidden"})});v.displayName="Dither",e.s(["default",0,function({values:e,reducedMotion:r,paused:a}){return(0,t.jsxs)("div",{className:"relative h-full min-h-80 w-full",children:[(0,t.jsx)(v,{pattern:e.pattern,levels:e.levels,pixelSize:e.pixelSize,field:e.field,fieldSpeed:e.fieldSpeed,fieldScale:e.fieldScale,frameHold:e.frameHold,contrast:e.contrast,inkColor:e.inkColor,paperColor:e.paperColor,paused:a,reducedMotion:r}),(0,t.jsx)("p",{className:"pointer-events-none absolute right-3 bottom-2 font-display text-[9px] tracking-[0.28em] text-ink-mute uppercase",children:2===e.levels?"one bit":`${e.levels} tones`})]})}],617922)},918661,function(e){e.n(e.i(617922))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let a=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{a.current=e});let n=(0,t.useRef)(null),l=(0,t.useRef)(null),u=(0,t.useRef)(!1),i=(0,t.useRef)(!1),o=(0,t.useRef)(0),s=(0,t.useRef)(0),c=(0,t.useRef)(0),f=(0,t.useCallback)(()=>{let e=a.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=a.current.dpr??"auto",n=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:n,bufferWidth:Math.max(1,Math.round(t.width*n)),bufferHeight:Math.max(1,Math.round(t.height*n))}},[]),p=(0,t.useCallback)(function e(t){if(i.current)return;0===o.current&&(o.current=t);let l=0===s.current?0:Math.min((t-s.current)/1e3,r);s.current=t;let f={now:t,dt:l,elapsed:(t-o.current)/1e3,frame:c.current++},p=a.current.onFrame?.(f);if(!i.current){if(!1===p||a.current.halted){u.current=!1,n.current=null;return}n.current=requestAnimationFrame(e)}},[]),d=(0,t.useCallback)(()=>{i.current||u.current||(u.current=!0,s.current=0,n.current=requestAnimationFrame(p))},[p]),h=(0,t.useCallback)(()=>{u.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null)},[]),v=(0,t.useCallback)(()=>d(),[d]),m=(0,t.useCallback)(()=>{let e=f();e&&(a.current.onResize?.(e),!1!==a.current.paintWhenHalted?v():a.current.halted||d())},[f,v,d]),x=e.deps??[];(0,t.useEffect)(()=>{i.current=!1;let e=a.current.target.current;if(!e)return;let t=()=>{i.current||m()},r=new ResizeObserver(()=>{let e=a.current.resizeDebounceMs??0;e<=0?t():(null!==l.current&&clearTimeout(l.current),l.current=setTimeout(()=>{l.current=null,t()},e))});return r.observe(e),m(),a.current.halted||d(),()=>{i.current=!0,u.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null),null!==l.current&&(clearTimeout(l.current),l.current=null),r.disconnect(),a.current.onDispose?.();let e=a.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),o.current=0,s.current=0,c.current=0}},x);let g=e.halted??!1;return(0,t.useEffect)(()=>{g||d()},[g,d]),(0,t.useMemo)(()=>({start:d,stop:h,paint:v,resize:m,get running(){return u.current}}),[d,h,v,m])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);