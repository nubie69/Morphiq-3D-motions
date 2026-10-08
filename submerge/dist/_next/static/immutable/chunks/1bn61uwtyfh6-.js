(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,915716,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(532181),i=e.i(221663),s=e.i(956850),n=e.i(80075),o=e.i(753604),l=e.i(450922);let c={16:16,28:28,48:48},u=200*Math.PI,d=e=>{let t=e.replace("#",""),r=3===t.length?t.split("").map(e=>e+e).join(""):t,a=parseInt(r,16);return Number.isNaN(a)||6!==r.length?[1,1,1]:[(a>>16&255)/255,(a>>8&255)/255,(255&a)/255]},h=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`,p=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec3 uCore;
uniform vec3 uRim;
uniform vec3 uBg;
uniform float uPhase;
uniform float uAspect;
uniform float uDisc;
uniform float uRays;
uniform float uBreathe;
uniform float uSteps;
uniform vec2 uPointer;

// Interleaved gradient noise — a screen-space dither that costs two fracts and
// still decorrelates neighbouring pixels well enough to hide the march steps.
float ign(vec2 px) {
  return fract(52.9829189 * fract(0.06711056 * px.x + 0.00583715 * px.y));
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Thin cirrus between the viewer and the light. Two octaves is enough for a
// veil, and the march samples it up to 48 times per pixel.
float veil(vec2 q) {
  return smoothstep(0.42, 0.88, vnoise(q) * 0.62 + vnoise(q * 2.13 + 7.3) * 0.38);
}

// 1 where the disc blocks the sample, 0 in the clear.
float occ(vec2 p, vec2 c, float r) {
  return smoothstep(r + 0.004, r - 0.004, distance(p, c));
}

void main() {
  // Aspect-corrected frame space, so the disc stays a circle at any size.
  vec2 p = (vUv * 2.0 - 1.0) * vec2(uAspect, 1.0);

  // Disc and light shift in opposite directions under the pointer — two
  // layers moving against each other is the whole depth illusion. The disc
  // sits in the upper half so the copy has the lower half to itself.
  vec2 discPos = vec2(0.0, 0.32) + uPointer * vec2(0.06, 0.04);
  vec2 lightPos = vec2(0.0, 0.32) - uPointer * vec2(0.05, 0.035);

  float breath = sin(uPhase * 0.7);
  float radius = uDisc * (1.0 + 0.006 * breath);
  // The corona swells on the breath; the bead flares on its crest only.
  float swell = 1.0 + uBreathe * 0.45 * breath;
  float flare = uBreathe * smoothstep(-0.3, 1.0, breath);

  // Sky: darker overhead, a 360-degree twilight band at the bottom edge —
  // under a total eclipse the horizon glows all the way round.
  vec3 col = uBg * mix(1.35, 0.55, vUv.y);
  col += uRim * 0.07 * pow(1.0 - vUv.y, 3.0);

  // Stars on a jittered cell lattice, fixed in the frame: they never sway
  // with the disc, which is exactly what says they are further away.
  float dist = distance(p, discPos);
  vec2 sc = p * 60.0;
  vec2 ci = floor(sc);
  float sh = hash21(ci);
  vec2 sj = vec2(hash21(ci + 3.1), hash21(ci + 7.7));
  float sd = length(fract(sc) - sj);
  float star = step(0.955, sh) * smoothstep(0.09, 0.0, sd) * (0.3 + 0.7 * fract(sh * 43.0));
  star *= smoothstep(radius * 1.2, radius * 2.8, dist) * smoothstep(0.0, 0.45, vUv.y);
  col += vec3(0.88, 0.92, 1.0) * star * 0.5;

  // Volumetric scatter: march from this pixel toward the light, summing what
  // the disc and the cirrus leave clear, older samples decayed. The jitter
  // offsets the whole ladder per pixel. Weights are normalised so a higher
  // sample count changes the grain, never the brightness.
  vec2 drift = vec2(cos(uPhase * 0.02), sin(uPhase * 0.01)) * 1.2;
  float jitter = ign(gl_FragCoord.xy);
  float illum = 0.0;
  float decay = 1.0;
  float wsum = 0.0;
  for (int i = 0; i < 48; i++) {
    if (float(i) >= uSteps) break;
    vec2 sp = mix(p, lightPos, (float(i) + jitter) / uSteps);
    float clear = (1.0 - occ(sp, discPos, radius)) * (1.0 - veil(sp * 2.2 + drift) * 0.9);
    illum += clear * decay;
    wsum += decay;
    decay *= 0.962;
  }
  illum /= wsum;

  float d = distance(p, lightPos);
  col += uCore * illum * illum * exp(-d * 2.1) * uRays * swell * 1.1;
  // The veil itself, lit from behind where the rays reach it.
  float vHere = veil(p * 2.2 + drift);
  col += mix(uRim, uCore, 0.4) * vHere * exp(-d * 2.4) * illum * uRays * 0.4;

  // Corona: a bright structure-free inner ring, then streamers — angular
  // harmonics that drift at different rates, longest along the equator,
  // short polar plumes. Integer harmonics stay continuous across the seam.
  float t = max(dist - radius, 0.0);
  float cang = atan(p.y - discPos.y, p.x - discPos.x);
  float streamer = 0.55
    + 0.25 * sin(cang * 6.0 + 1.3 + uPhase * 0.03)
    + 0.14 * sin(cang * 11.0 - 0.7 - uPhase * 0.02)
    + 0.06 * sin(cang * 23.0 + 2.1);
  streamer *= 0.72 + 0.28 * cos(2.0 * cang);
  float corona = (exp(-t * 3.4) * 0.5 + 0.16 / (1.0 + t * t * 70.0)) * streamer
    + exp(-t * 26.0) * 0.75;
  corona *= swell * (1.0 - occ(p, discPos, radius));
  col += mix(uCore, uRim, smoothstep(0.0, 0.35, t)) * corona;

  // The disc itself: matte, near-black, a whisper of earthshine at the limb.
  // Painted over the rays — it is the occluder.
  float discMask = occ(p, discPos, radius);
  vec3 discCol = uBg * 0.1 + uRim * 0.035 * smoothstep(radius * 0.7, radius, dist);
  col = mix(col, discCol, discMask);

  // Chromosphere: the thin pink-red ring a real eclipse shows at the limb.
  float edge = dist - radius;
  col += mix(uRim, vec3(1.0, 0.42, 0.36), 0.6) * exp(-max(edge, 0.0) * 110.0) * (1.0 - discMask) * 0.7 * swell;

  // Diamond ring: the first bead of sun clearing the limb, on the side the
  // light leans toward. Brightest on the crest of the breath.
  vec2 beadDir = normalize(vec2(0.45, 0.6) - uPointer * vec2(1.4, 1.0));
  vec2 beadPos = discPos + beadDir * radius;
  float side = 0.6 + 0.4 * dot(normalize(p - discPos + 1e-4), beadDir);
  col += uRim * exp(-abs(edge) * 32.0) * side * 0.45;
  float bd = distance(p, beadPos);
  float bead = (exp(-bd * 70.0) * 2.2 + exp(-bd * 14.0) * 0.45) * (0.35 + flare);
  col += mix(uCore, vec3(1.0), 0.5) * bead;
  // Anamorphic streak off the bead, and lens ghosts strung through the frame
  // centre — the camera's admission that it is looking at the sun.
  col += uCore * exp(-abs(p.y - beadPos.y) * 70.0) * exp(-abs(p.x - beadPos.x) * 2.6) * 0.5 * (0.2 + flare);
  for (int k = 0; k < 3; k++) {
    float f = 0.55 + float(k) * 0.35;
    vec2 gp = mix(beadPos, -beadPos, f);
    float gr = 0.035 + float(k) * 0.03;
    float g = smoothstep(gr, gr - 0.012, distance(p, gp)) * (k == 1 ? 0.07 : 0.045);
    col += mix(uRim, uCore, 0.5) * g * (0.3 + flare);
  }

  // Vignette, then film grain riding the same clock so a settled scene holds
  // a still frame, then a dither so the dark gradients never band.
  col *= 1.0 - 0.14 * dot(p, p);
  col += (ign(gl_FragCoord.xy + vec2(fract(uPhase * 0.31) * 61.0, fract(uPhase * 0.17) * 43.0)) - 0.5) * 0.024;
  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  fragColor = vec4(col, 1.0);
}`,f=(0,r.memo)(({title:e="After the eclipse",subtitle:a="Light finds its way around everything you put in front of it.",ctaLabel:f="Step into the light",onCtaClick:m,coreColor:x="#f6e3b4",rimColor:g="#e8b96a",backgroundColor:v="#060409",discSize:b=.28,rayIntensity:y=1,breathe:w=.6,speed:k=1,quality:C="28",parallax:P=!0,paused:q=!1,reducedMotion:R=!1,className:_})=>{let j=(0,r.useRef)(null),M=(0,r.useRef)(null),z=(0,r.useRef)(null),A=(0,r.useRef)(null),N=(0,r.useRef)({x:0,y:0,tx:0,ty:0}),[S,T]=(0,r.useState)(!1),[F,B]=(0,r.useState)(!1),$=(0,r.useRef)(q);$.current=q,(0,r.useEffect)(()=>B(!0),[]);let D=(0,l.useAnimationLoop)({target:j,halted:q,dpr:"auto",onResize:e=>z.current?.(e),onFrame:({dt:e})=>!!M.current&&M.current(e),gl:()=>A.current}),E=(0,r.useRef)({coreColor:x,rimColor:g,backgroundColor:v,discSize:b,rayIntensity:y,breathe:w,speed:k,quality:C,parallax:P,reducedMotion:R});E.current={coreColor:x,rimColor:g,backgroundColor:v,discSize:b,rayIntensity:y,breathe:w,speed:k,quality:C,parallax:P,reducedMotion:R},(0,r.useEffect)(()=>{let e,t=j.current;if(S||!t)return;try{e=new i.Renderer({dpr:Math.min(window.devicePixelRatio||1,2),alpha:!1})}catch{T(!0);return}let r=e.gl;A.current=r;let a=r.canvas;a.style.display="block",a.style.position="absolute",a.style.top="0",a.style.left="0",t.appendChild(a);let l=new s.Program(r,{vertex:h,fragment:p,cullFace:!1,depthTest:!1,depthWrite:!1,uniforms:{uCore:{value:new Float32Array(d(x))},uRim:{value:new Float32Array(d(g))},uBg:{value:new Float32Array(d(v))},uPhase:{value:0},uAspect:{value:1},uDisc:{value:b},uRays:{value:y},uBreathe:{value:w},uSteps:{value:c[C]??28},uPointer:{value:new Float32Array([0,0])}}}),f=new n.Mesh(r,{geometry:new o.Triangle(r),program:l}),m=l.uniforms,k=0;return M.current=t=>{let r=E.current,a=Math.min(t,1/30);if(!($.current||r.reducedMotion)){k=(k+a*r.speed)%u;let e=Math.min(1,4*a);N.current.x+=(N.current.tx-N.current.x)*e,N.current.y+=(N.current.ty-N.current.y)*e}let i=r.parallax&&!r.reducedMotion?1:0;m.uCore.value.set(d(r.coreColor)),m.uRim.value.set(d(r.rimColor)),m.uBg.value.set(d(r.backgroundColor)),m.uPhase.value=k,m.uDisc.value=r.discSize,m.uRays.value=r.rayIntensity,m.uBreathe.value=r.reducedMotion?0:r.breathe,m.uSteps.value=c[r.quality]??28;let s=m.uPointer.value;s[0]=N.current.x*i,s[1]=N.current.y*i,e.render({scene:f})},z.current=({width:t,height:r,dpr:a})=>{e.dpr=a,e.setSize(Math.max(1,Math.floor(t)),Math.max(1,Math.floor(r))),m.uAspect.value=Math.max(t,1)/Math.max(r,1),M.current?.(.016)},D.resize(),D.start(),()=>{M.current=null,z.current=null,t.contains(a)&&t.removeChild(a)}},[S]),(0,r.useEffect)(()=>{D.paint()},[x,g,v,b,y,w,k,C,P,D]);let I=e=>R?{}:{opacity:+!!F,transform:F?"none":"translateY(14px)",transition:`opacity 700ms cubic-bezier(0.22,1,0.36,1) ${110*e}ms, transform 700ms cubic-bezier(0.22,1,0.36,1) ${110*e}ms`},U=(0,t.jsxs)("div",{className:"pointer-events-none absolute inset-x-0 top-1/2 z-10 flex flex-col items-center px-[max(16px,4cqi)] text-center",children:[e?(0,t.jsx)("h1",{className:"max-w-[80cqi] text-[max(28px,5.2cqi)] leading-[1.02] font-semibold tracking-tight text-white",style:I(0),children:e}):null,a?(0,t.jsx)("p",{className:"mt-[max(10px,1.4cqi)] max-w-[54cqi] text-[max(12px,1.7cqi)] leading-snug text-white/70",style:I(1),children:a}):null,f?(0,t.jsx)("button",{type:"button",onClick:m,className:"relative overflow-hidden rounded-full border border-white/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.05)_48%,rgba(255,255,255,0.12))] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(255,255,255,0.08),0_14px_40px_-14px_rgba(0,0,0,0.7)] backdrop-blur-xl backdrop-saturate-150 before:pointer-events-none before:absolute before:inset-x-[8%] before:top-0 before:h-[46%] before:rounded-full before:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.3),rgba(255,255,255,0))] before:content-[''] pointer-events-auto mt-[max(18px,2.6cqi)] cursor-pointer px-[max(18px,2.6cqi)] py-[max(9px,1.1cqi)] text-[max(12px,1.35cqi)] font-medium text-white transition-[transform,background-color] duration-200 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 active:scale-95",style:I(2),children:(0,t.jsx)("span",{className:"relative",children:f})}):null]});return S?(0,t.jsx)("div",{className:_??"@container relative h-full w-full overflow-hidden",style:{backgroundColor:v,backgroundImage:`radial-gradient(circle at 50% 34%, ${g}55 0%, transparent 30%), radial-gradient(circle at 50% 34%, ${x}44 0%, transparent 60%), linear-gradient(to bottom, ${v}, ${v})`},children:U}):(0,t.jsx)("div",{ref:j,className:_??"@container relative h-full w-full overflow-hidden",onPointerMove:e=>{let t=e.currentTarget.getBoundingClientRect();0!==t.width&&0!==t.height&&(N.current.tx=(e.clientX-t.left)/t.width*2-1,N.current.ty=-((e.clientY-t.top)/t.height*2-1),D.start())},onPointerLeave:()=>{N.current.tx=0,N.current.ty=0,D.start()},children:U})});f.displayName="EclipseFlare";let m=["totality","path","archive","contact"],x="overflow-hidden border border-white/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05)_48%,rgba(255,255,255,0.11))] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(255,255,255,0.08),0_14px_40px_-14px_rgba(0,0,0,0.7)] backdrop-blur-xl backdrop-saturate-150 before:pointer-events-none before:absolute before:inset-x-[8%] before:top-0 before:h-[46%] before:rounded-full before:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.26),rgba(255,255,255,0))] before:content-['']";e.s(["default",0,function({values:e,reducedMotion:i,paused:s}){let n=e.rimColor,[o,l]=(0,r.useState)("totality");return(0,t.jsxs)("div",{className:"@container relative h-full min-h-80 w-full",children:[(0,t.jsx)(f,{title:"After the eclipse",subtitle:"Light finds its way around everything you put in front of it.",ctaLabel:"Step into the light",coreColor:e.coreColor,rimColor:n,backgroundColor:e.backgroundColor,discSize:e.discSize,rayIntensity:e.rayIntensity,breathe:e.breathe,speed:e.speed,quality:e.quality,parallax:e.parallax,paused:s,reducedMotion:i}),(0,t.jsx)("nav",{"aria-label":"Hero",className:`${x} pointer-events-auto absolute left-1/2 top-[max(10px,2.6cqi)] z-10 flex -translate-x-1/2 gap-[max(4px,0.6cqi)] rounded-full p-[max(3px,0.4cqi)]`,children:m.map(e=>(0,t.jsxs)("button",{type:"button","aria-current":o===e?"page":void 0,onClick:()=>l(e),className:`relative cursor-pointer rounded-full px-[max(10px,1.6cqi)] py-[max(5px,0.7cqi)] font-display text-[max(9px,1.2cqi)] tracking-[0.22em] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 ${o===e?"text-white":"text-white/60 hover:text-white/90"}`,children:[o===e?(0,t.jsx)(a.motion.span,{layoutId:"__sg_eclipse_pill","aria-hidden":!0,className:"absolute inset-0 rounded-full bg-[linear-gradient(160deg,rgba(255,255,255,0.34),rgba(255,255,255,0.1)_55%,rgba(255,255,255,0.22))]",style:{backgroundColor:`${n}26`,boxShadow:`inset 0 0 0 1px rgba(255,255,255,0.5), inset 0 1.5px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(255,255,255,0.18), 0 0 0 1px rgba(255,255,255,0.1), 0 0 14px -2px ${n}66`},transition:i?{duration:0}:{type:"spring",stiffness:420,damping:24,mass:.9}}):null,(0,t.jsx)("span",{className:"relative",children:e})]},e))}),(0,t.jsxs)("div",{className:`${x} pointer-events-none absolute left-[max(12px,2.6cqi)] top-[max(10px,2.6cqi)] z-10 hidden items-center gap-[max(8px,1cqi)] rounded-full px-[max(12px,1.5cqi)] py-[max(6px,0.8cqi)] @xl:flex`,children:[(0,t.jsx)("span",{className:"relative block size-[max(6px,0.7cqi)] rounded-full",style:{backgroundColor:n,boxShadow:`0 0 max(8px,1cqi) ${n}`}}),(0,t.jsx)("span",{className:"relative font-display text-[max(8px,1.05cqi)] tracking-[0.24em] text-white/80 uppercase",children:"totality · 02:41"})]}),(0,t.jsxs)("div",{className:`${x} pointer-events-none absolute bottom-[max(8px,2cqi)] left-[max(12px,2.6cqi)] z-10 hidden items-baseline gap-[max(6px,0.8cqi)] rounded-full px-[max(12px,1.5cqi)] py-[max(6px,0.8cqi)] @xl:flex`,children:[(0,t.jsx)("span",{className:"relative font-display text-[max(8px,1.05cqi)] tracking-[0.24em] text-white/55 uppercase",children:"c2"}),(0,t.jsx)("span",{className:"relative font-display text-[max(9px,1.2cqi)] tracking-[0.12em] text-white/85",children:"+00:12"})]})]})}],915716)},617042,function(e){e.n(e.i(915716))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let a=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{a.current=e});let i=(0,t.useRef)(null),s=(0,t.useRef)(null),n=(0,t.useRef)(!1),o=(0,t.useRef)(!1),l=(0,t.useRef)(0),c=(0,t.useRef)(0),u=(0,t.useRef)(0),d=(0,t.useCallback)(()=>{let e=a.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=a.current.dpr??"auto",i=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:i,bufferWidth:Math.max(1,Math.round(t.width*i)),bufferHeight:Math.max(1,Math.round(t.height*i))}},[]),h=(0,t.useCallback)(function e(t){if(o.current)return;0===l.current&&(l.current=t);let s=0===c.current?0:Math.min((t-c.current)/1e3,r);c.current=t;let d={now:t,dt:s,elapsed:(t-l.current)/1e3,frame:u.current++},h=a.current.onFrame?.(d);if(!o.current){if(!1===h||a.current.halted){n.current=!1,i.current=null;return}i.current=requestAnimationFrame(e)}},[]),p=(0,t.useCallback)(()=>{o.current||n.current||(n.current=!0,c.current=0,i.current=requestAnimationFrame(h))},[h]),f=(0,t.useCallback)(()=>{n.current=!1,null!==i.current&&(cancelAnimationFrame(i.current),i.current=null)},[]),m=(0,t.useCallback)(()=>p(),[p]),x=(0,t.useCallback)(()=>{let e=d();e&&(a.current.onResize?.(e),!1!==a.current.paintWhenHalted?m():a.current.halted||p())},[d,m,p]),g=e.deps??[];(0,t.useEffect)(()=>{o.current=!1;let e=a.current.target.current;if(!e)return;let t=()=>{o.current||x()},r=new ResizeObserver(()=>{let e=a.current.resizeDebounceMs??0;e<=0?t():(null!==s.current&&clearTimeout(s.current),s.current=setTimeout(()=>{s.current=null,t()},e))});return r.observe(e),x(),a.current.halted||p(),()=>{o.current=!0,n.current=!1,null!==i.current&&(cancelAnimationFrame(i.current),i.current=null),null!==s.current&&(clearTimeout(s.current),s.current=null),r.disconnect(),a.current.onDispose?.();let e=a.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),l.current=0,c.current=0,u.current=0}},g);let v=e.halted??!1;return(0,t.useEffect)(()=>{v||p()},[v,p]),(0,t.useMemo)(()=>({start:p,stop:f,paint:m,resize:x,get running(){return n.current}}),[p,f,m,x])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);