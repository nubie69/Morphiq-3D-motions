(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,120456,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(221663),n=e.i(956850),u=e.i(80075),l=e.i(753604),o=e.i(450922);let i=e=>{let t=e.replace("#",""),r=3===t.length?t.split("").map(e=>e+e).join(""):t,a=parseInt(r,16);return Number.isNaN(a)||6!==r.length?[1,1,1]:[(a>>16&255)/255,(a>>8&255)/255,(255&a)/255]},s=`#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`,c=`#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uResolution;
uniform float uDpr;
uniform vec2  uPhase;
uniform float uDensity;
uniform float uDrift;
uniform float uSeamWidth;
uniform float uSeamGlow;
uniform float uShatter;
uniform float uShatterRadius;
uniform float uCellContrast;
uniform vec2  uPointer;
uniform vec3  uSeam;
uniform vec3  uCell;
uniform vec3  uBg;

#define TAU 6.28318530718

vec2 hash2(vec2 cell) {
  vec3 p = fract(vec3(cell.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yzx + 33.33);
  return fract((p.xx + p.yz) * p.zy);
}

// (F1, F2, cell id). The id is the seed's own hash, so it survives the seeds
// moving — a cell keeps its brightness for the whole session instead of
// flickering as the ordering of the 3x3 search changes.
vec3 cells(vec2 p) {
  vec2 base = floor(p);
  vec2 local = fract(p);

  float f1 = 8.0;
  float f2 = 8.0;
  float id = 0.0;

  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 offset = vec2(float(i), float(j));
      vec2 rand = hash2(base + offset);
      // Orbit, not translation. Bounded by construction, so the seed can never
      // leave its own cell however high the drift goes.
      vec2 seed = offset + 0.5
        + (rand - 0.5) * 0.7
        + uDrift * vec2(sin(uPhase.x + rand.x * TAU), cos(uPhase.y + rand.y * TAU));

      float d = length(seed - local);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        id = rand.x;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return vec3(f1, f2, id);
}

void main() {
  vec2 res = uResolution / uDpr;
  vec2 uv = (gl_FragCoord.xy / uDpr) / res;
  float aspect = res.x / max(res.y, 1.0);

  vec2 centred = (uv - 0.5) * vec2(aspect, 1.0);
  // gl_FragCoord counts up from the bottom and the pointer is reported from the
  // top, so the y has to be flipped or the fracture appears mirrored about the
  // horizon from wherever the cursor actually is.
  vec2 cursor = vec2(uPointer.x, -uPointer.y) * 0.5 * vec2(aspect, 1.0);

  vec2 away = centred - cursor;
  float reach = max(uShatterRadius, 1e-4);
  // Gaussian rather than a linear falloff: a linear one has a hard outer edge
  // that reads as a circular seam of its own, which is a second shape nobody
  // asked for.
  float force = exp(-dot(away, away) / (reach * reach));
  // Displaced along the raw offset, NOT along its normalised direction. A
  // normalised push has constant magnitude however close to the cursor you get,
  // so every seam in the neighbourhood converges on one point and the fracture
  // collapses into a starburst with a singularity at its centre. Scaling by the
  // raw offset sends the displacement to zero at the cursor, which is what a
  // lens does and what the cells being pushed apart actually looks like.
  centred += away * force * uShatter * 2.0;

  vec3 v = cells(centred * uDensity);
  float border = v.y - v.x;

  // Derivatives outside any branch — fwidth inside divergent control flow is
  // undefined in GLSL ES 3.0, and the 3x3 search above is nothing but branches.
  float w = fwidth(border) + 1e-4;
  float seam = 1.0 - smoothstep(uSeamWidth - w, uSeamWidth + w, border);
  float bloom = exp(-border * 14.0) * uSeamGlow;

  vec3 color = mix(uBg, uCell, v.z * uCellContrast);
  color += uSeam * bloom;
  color = mix(color, uSeam, seam);

  fragColor = vec4(color, 1.0);
}`,f=(0,r.memo)(({density:e=9,drift:f=.28,seamWidth:d=.06,seamGlow:h=.6,shatter:m=.45,shatterRadius:v=.35,cellContrast:p=.35,seamColor:g="#e9d5ff",cellColor:w="#a855f7",backgroundColor:y="#08050e",paused:x=!1,reducedMotion:b=!1,className:C})=>{let R=(0,r.useRef)(null),S=(0,r.useRef)(null),P=(0,r.useRef)(null),A=(0,r.useRef)(null),[M,F]=(0,r.useState)(!1),k=(0,o.useAnimationLoop)({target:R,halted:x||b,dpr:"auto",onResize:e=>P.current?.(e),onFrame:({dt:e})=>!!S.current&&S.current(e),gl:()=>A.current}),D=(0,r.useRef)({density:e,drift:f,seamWidth:d,seamGlow:h,shatter:m,shatterRadius:v,cellContrast:p,seamColor:g,cellColor:w,backgroundColor:y});D.current={density:e,drift:f,seamWidth:d,seamGlow:h,shatter:m,shatterRadius:v,cellContrast:p,seamColor:g,cellColor:w,backgroundColor:y};let T=(0,r.useRef)({x:4,y:4,tx:4,ty:4,s:0,ts:0});(0,r.useEffect)(()=>{(()=>{try{return!!document.createElement("canvas").getContext("webgl2")}catch{return!1}})()||F(!0)},[]),(0,r.useEffect)(()=>{let t=R.current;if(M||!t)return;let r=new a.Renderer({webgl:2,alpha:!1,antialias:!1,powerPreference:"high-performance",dpr:Math.min(window.devicePixelRatio||1,2)}),o=r.gl;A.current=o;let x=o.canvas;x.style.display="block",x.style.position="absolute",x.style.top="0",x.style.left="0",t.appendChild(x);let b=new n.Program(o,{vertex:s,fragment:c,uniforms:{uResolution:{value:new Float32Array([1,1])},uDpr:{value:1},uPhase:{value:new Float32Array([0,0])},uDensity:{value:e},uDrift:{value:f},uSeamWidth:{value:d},uSeamGlow:{value:h},uShatter:{value:m},uShatterRadius:{value:v},uCellContrast:{value:p},uPointer:{value:new Float32Array([4,4])},uSeam:{value:new Float32Array(i(g))},uCell:{value:new Float32Array(i(w))},uBg:{value:new Float32Array(i(y))}}}),C=new u.Mesh(o,{geometry:new l.Triangle(o),program:b}),F=b.uniforms,z=new Float32Array([0,0]),j=[.41,.27],B=2*Math.PI,W=()=>{let e=D.current;F.uPhase.value.set(z),F.uDensity.value=e.density,F.uDrift.value=e.drift,F.uSeamWidth.value=e.seamWidth,F.uSeamGlow.value=e.seamGlow,F.uShatter.value=e.shatter*T.current.s,F.uShatterRadius.value=e.shatterRadius,F.uCellContrast.value=e.cellContrast,F.uPointer.value[0]=T.current.x,F.uPointer.value[1]=T.current.y,F.uSeam.value.set(i(e.seamColor)),F.uCell.value.set(i(e.cellColor)),F.uBg.value.set(i(e.backgroundColor))};return S.current=e=>{for(let t=0;t<2;t++)z[t]=(z[t]+e*j[t])%B;let t=T.current,a=Math.min(1,6*e);t.x+=(t.tx-t.x)*a,t.y+=(t.ty-t.y)*a;let n=Math.min(1,e*(t.ts>t.s?7:2.2));t.s+=(t.ts-t.s)*n,W(),r.render({scene:C})},P.current=({width:e,height:t,dpr:a})=>{r.dpr=a,r.setSize(Math.max(1,Math.floor(e)),Math.max(1,Math.floor(t)));let n=F.uResolution.value;n[0]=o.drawingBufferWidth,n[1]=o.drawingBufferHeight,F.uDpr.value=a,W(),r.render({scene:C})},k.resize(),k.start(),()=>{S.current=null,P.current=null,t.contains(x)&&t.removeChild(x)}},[M]),(0,r.useEffect)(()=>{k.paint()},[e,f,d,h,m,v,p,g,w,y,k]);let z=()=>{T.current.ts=0,k.start()};if(M){let r=100/Math.max(3,Math.round(e)),a=`${g} 0 1px, transparent 1px ${r}%`;return(0,t.jsx)("div",{className:C??"relative h-full w-full overflow-hidden",style:{backgroundColor:y,backgroundImage:`repeating-linear-gradient(64deg, ${a}), repeating-linear-gradient(-38deg, ${a}), radial-gradient(80% 80% at 50% 50%, ${w} 0%, transparent 70%)`,opacity:.85}})}return(0,t.jsx)("div",{ref:R,className:C??"relative h-full w-full overflow-hidden",onPointerMove:e=>{let t=e.currentTarget.getBoundingClientRect();if(0===t.width||0===t.height)return;let r=T.current;r.tx=(e.clientX-t.left)/t.width*2-1,r.ty=(e.clientY-t.top)/t.height*2-1,r.s<.02&&(r.x=r.tx,r.y=r.ty),r.ts=1,k.start()},onPointerLeave:z,onPointerCancel:z})});f.displayName="VoronoiShatter",e.s(["default",0,function({values:e,reducedMotion:r,paused:a}){return(0,t.jsxs)("div",{className:"relative h-full w-full",children:[(0,t.jsx)(f,{density:e.density,drift:e.drift,seamWidth:e.seamWidth,seamGlow:e.seamGlow,shatter:e.shatter,shatterRadius:e.shatterRadius,cellContrast:e.cellContrast,seamColor:e.seamColor,cellColor:e.cellColor,backgroundColor:e.backgroundColor,paused:a,reducedMotion:r}),r?null:(0,t.jsx)("p",{className:"pointer-events-none absolute right-3 bottom-2 font-display text-[9px] tracking-[0.28em] text-ink-mute uppercase",children:"move — fracture the field"})]})}],120456)},195145,function(e){e.n(e.i(120456))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let a=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{a.current=e});let n=(0,t.useRef)(null),u=(0,t.useRef)(null),l=(0,t.useRef)(!1),o=(0,t.useRef)(!1),i=(0,t.useRef)(0),s=(0,t.useRef)(0),c=(0,t.useRef)(0),f=(0,t.useCallback)(()=>{let e=a.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=a.current.dpr??"auto",n=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:n,bufferWidth:Math.max(1,Math.round(t.width*n)),bufferHeight:Math.max(1,Math.round(t.height*n))}},[]),d=(0,t.useCallback)(function e(t){if(o.current)return;0===i.current&&(i.current=t);let u=0===s.current?0:Math.min((t-s.current)/1e3,r);s.current=t;let f={now:t,dt:u,elapsed:(t-i.current)/1e3,frame:c.current++},d=a.current.onFrame?.(f);if(!o.current){if(!1===d||a.current.halted){l.current=!1,n.current=null;return}n.current=requestAnimationFrame(e)}},[]),h=(0,t.useCallback)(()=>{o.current||l.current||(l.current=!0,s.current=0,n.current=requestAnimationFrame(d))},[d]),m=(0,t.useCallback)(()=>{l.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null)},[]),v=(0,t.useCallback)(()=>h(),[h]),p=(0,t.useCallback)(()=>{let e=f();e&&(a.current.onResize?.(e),!1!==a.current.paintWhenHalted?v():a.current.halted||h())},[f,v,h]),g=e.deps??[];(0,t.useEffect)(()=>{o.current=!1;let e=a.current.target.current;if(!e)return;let t=()=>{o.current||p()},r=new ResizeObserver(()=>{let e=a.current.resizeDebounceMs??0;e<=0?t():(null!==u.current&&clearTimeout(u.current),u.current=setTimeout(()=>{u.current=null,t()},e))});return r.observe(e),p(),a.current.halted||h(),()=>{o.current=!0,l.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null),null!==u.current&&(clearTimeout(u.current),u.current=null),r.disconnect(),a.current.onDispose?.();let e=a.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),i.current=0,s.current=0,c.current=0}},g);let w=e.halted??!1;return(0,t.useEffect)(()=>{w||h()},[w,h]),(0,t.useMemo)(()=>({start:h,stop:m,paint:v,resize:p,get running(){return l.current}}),[h,m,v,p])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);