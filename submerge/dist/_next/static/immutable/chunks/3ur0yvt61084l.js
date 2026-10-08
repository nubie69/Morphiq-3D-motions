(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,374325,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(532181),n=e.i(221663),o=e.i(956850),i=e.i(80075),l=e.i(753604),s=e.i(450922);let c={2:2,3:3,4:4,5:5},u={40:40,64:64,96:96},f=200*Math.PI,d=e=>{let t=e.replace("#",""),r=3===t.length?t.split("").map(e=>e+e).join(""):t,a=parseInt(r,16);return Number.isNaN(a)||6!==r.length?[1,1,1]:[(a>>16&255)/255,(a>>8&255)/255,(255&a)/255]},h=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`,m=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec3 uChrome;
uniform vec3 uAccent;
uniform vec3 uBg;
uniform float uPhase;
uniform float uAspect;
uniform float uCount;
uniform float uSmooth;
uniform float uGloss;
uniform float uSteps;
uniform float uPixel;
uniform float uDist;
uniform vec2 uShift;
uniform vec2 uPointer;

const float FLOOR_Y = -1.1;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

// Each sphere rides its own Lissajous orbit — sin/cos with per-blob rate
// multipliers chosen off any common divisor, so the ensemble never visibly
// repeats even though every term is periodic and bounded.
vec3 blobCenter(int i, float t) {
  float fi = float(i);
  float a = t * (0.51 + fi * 0.17) + fi * 2.4;
  float b = t * (0.43 + fi * 0.21) + fi * 1.7;
  float c = t * (0.37 + fi * 0.15) + fi * 3.9;
  return vec3(sin(a) * 0.55, sin(b) * 0.4, sin(c) * 0.36);
}

float map(vec3 p, float t) {
  float d = 1e5;
  for (int i = 0; i < 5; i++) {
    if (float(i) >= uCount) break;
    vec3 c = blobCenter(i, t);
    float r = 0.45 + 0.06 * sin(t * (0.6 + float(i) * 0.21) + float(i));
    d = smin(d, length(p - c) - r, uSmooth);
  }
  // Liquid skin: a faint travelling ripple on the distance field. Tiny in
  // amplitude, but a mirror magnifies slope, so the softbox edges waver the
  // way they do on mercury. Small enough to keep the field near-Lipschitz.
  d += 0.005 * sin(p.x * 9.0 + t * 1.7) * sin(p.y * 8.0 - t * 1.3) * sin(p.z * 7.0 + t * 1.1);
  return d;
}

vec3 normalAt(vec3 p, float t) {
  // Tetrahedron gradient: four taps for a normal instead of six.
  vec2 k = vec2(1.0, -1.0) * 0.0018;
  return normalize(
    k.xyy * map(p + k.xyy, t) +
    k.yyx * map(p + k.yyx, t) +
    k.yxy * map(p + k.yxy, t) +
    k.xxx * map(p + k.xxx, t));
}

float occlusion(vec3 p, vec3 n, float t) {
  float o = 0.0, s = 1.0;
  for (int i = 1; i <= 4; i++) {
    float h = 0.04 * float(i);
    o += (h - map(p + n * h, t)) * s;
    s *= 0.72;
  }
  return clamp(1.0 - 2.4 * o, 0.0, 1.0);
}

// A rectangular softbox facing the origin: the direction is projected onto
// the light's plane one unit out, and the rectangle's edges are feathered
// by roughness. Sharp rectangles are what make chrome read as chrome.
float softbox(vec3 d, vec3 L, vec2 sz, float feather) {
  float dl = dot(d, L);
  if (dl <= 0.0) return 0.0;
  vec3 R = normalize(cross(vec3(0.0, 1.0, 0.0), L));
  vec3 U = cross(L, R);
  vec2 q = vec2(dot(d, R), dot(d, U)) / dl;
  vec2 e = sz - abs(q);
  return smoothstep(-feather, feather, e.x) * smoothstep(-feather, feather, e.y) * smoothstep(0.0, 0.25, dl);
}

// The whole studio, by direction. The ramp is most of the material: dark
// enough below that the metal has a belly, bright at eye level so the mass
// never reads as a silhouette, dark again overhead so the softboxes carry
// the highlights.
vec3 env(vec3 d) {
  float g = clamp(uGloss, 0.0, 1.0);
  float boost = 1.0 + max(uGloss - 1.0, 0.0) * 0.45;
  float feather = mix(0.5, 0.035, g);
  float lip = mix(0.35, 0.03, g);
  float up = d.y;
  vec3 floorC = uBg * 0.6 + vec3(0.05);
  vec3 lipC = vec3(0.86, 0.87, 0.9);
  vec3 wallC = vec3(0.42, 0.42, 0.47);
  vec3 ceilC = vec3(0.2, 0.2, 0.24);
  vec3 c = mix(floorC, lipC, smoothstep(-0.5, -lip, up));
  c = mix(c, wallC, smoothstep(lip * 0.3, 0.3 + lip, up));
  c = mix(c, ceilC, smoothstep(0.4, 0.95, up));
  c += vec3(1.0, 0.98, 0.95) * softbox(d, normalize(vec3(0.55, 0.72, 0.42)), vec2(0.7, 0.42), feather) * 2.2 * boost;
  c += uAccent * softbox(d, normalize(vec3(-0.78, 0.2, 0.5)), vec2(0.25, 0.8), feather * 1.3) * 1.8 * boost;
  c += vec3(0.9, 0.92, 1.0) * softbox(d, normalize(vec3(0.15, 0.35, -0.92)), vec2(1.0, 0.25), feather * 1.5) * 1.2;
  c += vec3(0.35) * softbox(d, normalize(vec3(0.0, -0.42, 0.9)), vec2(0.8, 0.35), feather * 2.0 + 0.2) * 0.8;
  return c;
}

// Metal: the tint is the base reflectance, and grazing angles go white.
vec3 chrome(vec3 e, vec3 rd, vec3 n) {
  float cosv = max(dot(-rd, n), 0.0);
  vec3 F = uChrome + (1.0 - uChrome) * pow(1.0 - cosv, 5.0);
  return e * F;
}

// The void behind everything: radial falloff around the form, an accent
// bloom, a whisper of key spill.
vec3 backdrop(vec2 uv) {
  float r = length(uv * vec2(0.8, 1.0));
  vec3 c = uBg * mix(1.45, 0.55, smoothstep(0.0, 1.8, r));
  c += uAccent * exp(-r * r * 1.6) * 0.13;
  c += vec3(0.55, 0.56, 0.62) * exp(-r * r * 0.9) * 0.05;
  return c;
}

void main() {
  vec2 uvn = vUv * 2.0 - 1.0;
  // Lens shift: the form's image moves, the perspective does not.
  vec2 uv = uvn * vec2(uAspect, 1.0) - uShift;

  // Slightly raised camera looking a few degrees down, so the floor and the
  // reflection in it are in frame; the pointer sways it around the form.
  vec3 ro = vec3(0.0, 0.14 * uDist, uDist);
  vec3 rd = normalize(vec3(uv * 0.62, -1.0));
  rd.yz *= rot(-0.14);
  float yaw = -uPointer.x * 0.22;
  float pitch = -uPointer.y * 0.16;
  ro.xz *= rot(yaw); rd.xz *= rot(yaw);
  ro.yz *= rot(pitch); rd.yz *= rot(pitch);
  float t = uPhase;

  float tf = rd.y < -1e-4 ? (FLOOR_Y - ro.y) / rd.y : 1e5;
  float tmax = min(tf, 7.5);

  // Sphere-trace with an early out, tracking the closest approach in pixels
  // so a near miss can still be shaded and blended: silhouette anti-aliasing
  // for the price of a division.
  float dist = 0.0, minR = 1e5;
  vec3 pNear = ro;
  bool hit = false;
  for (int i = 0; i < 96; i++) {
    if (float(i) >= uSteps) break;
    vec3 p = ro + rd * dist;
    float d = map(p, t);
    float px = max(uPixel * dist, 0.0007);
    if (d < px * 0.5) { hit = true; break; }
    float r = d / px;
    if (r < minR) { minR = r; pNear = p; }
    dist += d * 0.9;
    if (dist > tmax) break;
  }

  vec3 col = backdrop(uv);

  if (!hit && tf < 1e4) {
    // Black mirror floor: a darker copy of the backdrop, a soft contact
    // shadow, and the form's reflection — one march along the mirrored ray,
    // fresnel-weighted like glossy acrylic and faded with the distance to
    // the surface so only the underside ghosts through.
    vec3 pf = ro + rd * tf;
    // The key sits front-right-high, so the shadow falls back-left.
    float rs = length((pf.xz - vec2(-0.2, -0.35)) * vec2(1.0, 1.3));
    vec3 fc = col * 0.72;
    fc *= 1.0 - 0.3 * exp(-rs * rs * 2.0);
    vec3 rr = reflect(rd, vec3(0.0, 1.0, 0.0));
    float d2 = 0.0;
    bool h2 = false;
    for (int i = 0; i < 48; i++) {
      if (float(i) >= uSteps * 0.5) break;
      vec3 q = pf + rr * d2;
      float dd = map(q, t);
      if (dd < 0.002 * (1.0 + d2)) { h2 = true; break; }
      d2 += dd * 0.9;
      if (d2 > 6.0) break;
    }
    if (h2) {
      vec3 q = pf + rr * d2;
      vec3 n2 = normalAt(q, t);
      vec3 rc = aces(chrome(env(reflect(rr, n2)), rr, n2) * mix(0.6, 1.0, occlusion(q, n2, t)));
      float Ff = 0.3 + 0.7 * pow(1.0 - max(-rd.y, 0.0), 5.0);
      fc += rc * Ff * exp(-d2 * 0.9);
    }
    col = mix(fc, col, 1.0 - exp(-tf * 0.09));
  }

  float alpha = hit ? 1.0 : clamp(1.5 - minR, 0.0, 1.0);
  if (alpha > 0.0) {
    vec3 p = hit ? ro + rd * dist : pNear;
    vec3 n = normalAt(p, t);
    vec3 ref = reflect(rd, n);
    vec3 e = env(ref);
    // One mirror bounce: does the chrome see itself? Only the crevices do,
    // and that is exactly where the fused-mass read comes from.
    float d2 = 0.03;
    bool h2 = false;
    vec3 o2 = p + n * 0.006;
    for (int i = 0; i < 48; i++) {
      if (float(i) >= uSteps * 0.5) break;
      vec3 q = o2 + ref * d2;
      float dd = map(q, t);
      if (dd < 0.0025 * (1.0 + d2) && d2 > 0.05) { h2 = true; break; }
      d2 += dd * 0.9;
      if (d2 > 4.0) break;
    }
    if (h2) {
      vec3 q = o2 + ref * d2;
      vec3 n2 = normalAt(q, t);
      e = chrome(env(reflect(ref, n2)), ref, n2) * mix(0.55, 1.0, occlusion(q, n2, t));
    }
    vec3 c = chrome(e, rd, n) * mix(0.5, 1.0, occlusion(p, n, t));
    col = mix(col, aces(c), alpha);
  }

  // Gentle vignette to seat the copy; a hair of dither so the void's
  // gradient never bands.
  col *= 1.0 - 0.28 * dot(uvn * 0.6, uvn * 0.6);
  col += (hash(gl_FragCoord.xy) - 0.5) * (1.0 / 128.0);

  fragColor = vec4(col, 1.0);
}`,p=(0,r.memo)(({title:e="Form in flux",subtitle:a="Never the same shape twice, always the same substance.",ctaLabel:p="Watch it move",onCtaClick:v,chromeColor:x="#dfe4ee",accentColor:g="#a855f7",backgroundColor:b="#0a0a12",blobCount:y="4",morphSpeed:w=1,smoothness:k=.35,gloss:_=1,quality:C="64",parallax:q=!0,paused:z=!1,reducedMotion:R=!1,className:A})=>{let j=(0,r.useRef)(null),M=(0,r.useRef)(null),N=(0,r.useRef)(null),S=(0,r.useRef)(null),F=(0,r.useRef)({x:0,y:0,tx:0,ty:0}),[P,L]=(0,r.useState)(!1),[T,B]=(0,r.useState)(!1),O=(0,r.useRef)(z);O.current=z,(0,r.useEffect)(()=>B(!0),[]);let $=(0,s.useAnimationLoop)({target:j,halted:z,dpr:"auto",onResize:e=>N.current?.(e),onFrame:({dt:e})=>!!M.current&&M.current(e),gl:()=>S.current}),E=(0,r.useRef)({chromeColor:x,accentColor:g,backgroundColor:b,blobCount:y,morphSpeed:w,smoothness:k,gloss:_,quality:C,parallax:q,reducedMotion:R});E.current={chromeColor:x,accentColor:g,backgroundColor:b,blobCount:y,morphSpeed:w,smoothness:k,gloss:_,quality:C,parallax:q,reducedMotion:R},(0,r.useEffect)(()=>{let e,t=j.current;if(P||!t)return;try{e=new n.Renderer({dpr:Math.min(window.devicePixelRatio||1,2),alpha:!1})}catch{L(!0);return}let r=e.gl;S.current=r;let a=r.canvas;a.style.display="block",a.style.position="absolute",a.style.top="0",a.style.left="0",t.appendChild(a);let s=new o.Program(r,{vertex:h,fragment:m,cullFace:!1,depthTest:!1,depthWrite:!1,uniforms:{uChrome:{value:new Float32Array(d(x))},uAccent:{value:new Float32Array(d(g))},uBg:{value:new Float32Array(d(b))},uPhase:{value:0},uAspect:{value:1},uCount:{value:c[y]??4},uSmooth:{value:k},uGloss:{value:_},uSteps:{value:u[C]??64},uPixel:{value:.002},uDist:{value:2.7},uShift:{value:new Float32Array([0,0])},uPointer:{value:new Float32Array([0,0])}}}),p=new i.Mesh(r,{geometry:new l.Triangle(r),program:s}),v=s.uniforms,w=0;return M.current=t=>{let r=E.current,a=Math.min(t,1/30);if(!(O.current||r.reducedMotion)){w=(w+a*r.morphSpeed)%f;let e=Math.min(1,4*a);F.current.x+=(F.current.tx-F.current.x)*e,F.current.y+=(F.current.ty-F.current.y)*e}let n=r.parallax&&!r.reducedMotion?1:0;v.uChrome.value.set(d(r.chromeColor)),v.uAccent.value.set(d(r.accentColor)),v.uBg.value.set(d(r.backgroundColor)),v.uPhase.value=w,v.uCount.value=c[r.blobCount]??4,v.uSmooth.value=r.smoothness,v.uGloss.value=r.gloss,v.uSteps.value=u[r.quality]??64;let o=v.uPointer.value;o[0]=F.current.x*n,o[1]=F.current.y*n,e.render({scene:p})},N.current=({width:t,height:r,dpr:a})=>{e.dpr=a,e.setSize(Math.max(1,Math.floor(t)),Math.max(1,Math.floor(r)));let n=Math.max(t,1)/Math.max(r,1);v.uAspect.value=n,v.uPixel.value=1.24/Math.max(r*a,1);let o=v.uShift.value;o[0]=n>1?.36*n:0,o[1]=n>1?.1:.3,v.uDist.value=2.7*Math.min(1.6,Math.max(1,.85/n)),M.current?.(.016)},$.resize(),$.start(),()=>{M.current=null,N.current=null,t.contains(a)&&t.removeChild(a)}},[P]),(0,r.useEffect)(()=>{$.paint()},[x,g,b,y,w,k,_,C,q,$]);let G=e=>R?{}:{opacity:+!!T,transform:T?"none":"translateY(14px)",transition:`opacity 700ms cubic-bezier(0.22,1,0.36,1) ${110*e}ms, transform 700ms cubic-bezier(0.22,1,0.36,1) ${110*e}ms`},[U,D,I]=d(x),W=(0,t.jsxs)("div",{className:"pointer-events-none absolute inset-0 z-10 flex flex-col items-start justify-end bg-[linear-gradient(0deg,rgba(0,0,0,0.45),rgba(0,0,0,0)_55%)] px-[max(20px,5.5cqi)] pb-[max(20px,6cqi)] text-left [@container(orientation:landscape)]:justify-center [@container(orientation:landscape)]:bg-[linear-gradient(90deg,rgba(0,0,0,0.3),rgba(0,0,0,0)_55%)] [@container(orientation:landscape)]:pb-0",children:[e?(0,t.jsx)("h1",{className:"max-w-[max(260px,44cqi)] text-[max(28px,5.4cqi)] leading-[1.02] font-semibold tracking-tight text-white",style:G(0),children:e}):null,a?(0,t.jsx)("p",{className:"mt-[max(10px,1.4cqi)] max-w-[max(220px,38cqi)] text-[max(12px,1.7cqi)] leading-snug text-white/70",style:G(1),children:a}):null,p&&!R?(0,t.jsx)("style",{children:`@keyframes __sg_lc_sheen { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
.__sg_lc_cta:hover .__sg_lc_sheen, .__sg_lc_cta:focus-visible .__sg_lc_sheen { animation: __sg_lc_sheen 900ms cubic-bezier(0.4,0,0.2,1) forwards; }`}):null,p?(0,t.jsxs)("button",{type:"button",onClick:v,className:"__sg_lc_cta pointer-events-auto relative mt-[max(18px,2.6cqi)] cursor-pointer overflow-hidden rounded-full px-[max(22px,3cqi)] py-[max(11px,1.4cqi)] text-[max(11px,1.3cqi)] font-bold tracking-[0.2em] uppercase shadow-[0_14px_34px_-12px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(0,0,0,0.4)] transition-[transform,filter] duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 active:scale-95",style:{...G(2),color:.2126*U+.7152*D+.0722*I>.45?"#0c0c14":"#f4f2fa",backgroundColor:x,backgroundImage:`radial-gradient(120% 90% at 16% 12%, color-mix(in srgb, ${g} 45%, transparent), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 42%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.22) 60%, rgba(255,255,255,0.15) 85%, rgba(255,255,255,0.55) 100%)`},children:[(0,t.jsx)("span",{"aria-hidden":!0,className:"__sg_lc_sheen pointer-events-none absolute inset-0",style:{transform:"translateX(-100%)",backgroundImage:"linear-gradient(105deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.22) 44%, rgba(255,255,255,0.9) 50%, rgba(0,0,0,0.22) 56%, rgba(0,0,0,0) 70%)"}}),(0,t.jsx)("span",{className:"relative",children:p})]}):null]});return P?(0,t.jsx)("div",{className:A??"relative h-full w-full overflow-hidden @container-size",style:{backgroundColor:b,backgroundImage:`radial-gradient(circle at 68% 50%, ${x}55 0%, transparent 30%), radial-gradient(circle at 62% 44%, ${g}44 0%, transparent 42%), linear-gradient(to bottom, ${b}, ${b})`},children:W}):(0,t.jsx)("div",{ref:j,className:A??"relative h-full w-full overflow-hidden @container-size",onPointerMove:e=>{let t=e.currentTarget.getBoundingClientRect();0!==t.width&&0!==t.height&&(F.current.tx=(e.clientX-t.left)/t.width*2-1,F.current.ty=-((e.clientY-t.top)/t.height*2-1),$.start())},onPointerLeave:()=>{F.current.tx=0,F.current.ty=0,$.start()},children:W})});p.displayName="LiquidChrome";let v=["alloy","forms","studio","contact"];e.s(["default",0,function({values:e,reducedMotion:n,paused:o}){let i=e.chromeColor,l=e.accentColor,[s,c]=(0,r.useState)("alloy");return(0,t.jsxs)("div",{className:"relative h-full min-h-80 w-full @container-size",children:[(0,t.jsx)(p,{title:"Form in flux",subtitle:"Never the same shape twice, always the same substance.",ctaLabel:"Watch it move",chromeColor:i,accentColor:l,backgroundColor:e.backgroundColor,blobCount:e.blobCount,morphSpeed:e.morphSpeed,smoothness:e.smoothness,gloss:e.gloss,quality:e.quality,parallax:e.parallax,paused:o,reducedMotion:n}),(0,t.jsx)("nav",{"aria-label":"Hero",className:"pointer-events-auto absolute left-1/2 top-[max(10px,3cqi)] z-10 flex -translate-x-1/2 gap-[max(14px,3.2cqi)]",children:v.map(e=>(0,t.jsxs)("button",{type:"button","aria-current":s===e?"page":void 0,onClick:()=>c(e),className:`relative cursor-pointer pb-[max(4px,0.5cqi)] font-display text-[max(9px,1.35cqi)] tracking-[0.25em] uppercase transition-colors duration-150 hover:text-[#f2eff8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 ${s===e?"text-[#f2eff8]":"text-[#b6aecb]"}`,children:[e,s===e?(0,t.jsx)(a.motion.span,{layoutId:"__sg_lc_underline","aria-hidden":!0,className:"absolute inset-x-0 bottom-0 h-0.5 rounded-full",style:{backgroundImage:`linear-gradient(90deg, transparent, ${i}, transparent)`},transition:n?{duration:0}:{type:"spring",stiffness:420,damping:30,mass:.8}}):null]},e))}),(0,t.jsxs)("div",{className:"pointer-events-none absolute left-[max(16px,4cqi)] top-[max(10px,3cqi)] z-10 hidden items-center gap-[max(8px,1cqi)] @xl:flex",children:[(0,t.jsx)("span",{className:"block size-[max(6px,0.7cqi)] rounded-full",style:{backgroundColor:l,boxShadow:`0 0 max(8px,1cqi) ${l}`}}),(0,t.jsx)("span",{className:"font-display text-[max(8px,1.05cqi)] tracking-[0.24em] text-[#b6aecb] uppercase",children:"specimen · hg-80"})]}),(0,t.jsxs)("div",{className:"pointer-events-none absolute bottom-[max(8px,2cqi)] left-[max(16px,4cqi)] z-10 hidden flex-col [@container(orientation:landscape)]:@xl:flex",children:[(0,t.jsx)("span",{className:"font-display text-[max(7px,0.9cqi)] tracking-[0.26em] text-[#7d7691] uppercase",children:"melting point"}),(0,t.jsx)("span",{className:"font-display text-[max(10px,1.3cqi)] tracking-widest text-[#f2eff8]",children:"−38.83 °c"})]})]})}],374325)},584046,function(e){e.n(e.i(374325))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let a=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{a.current=e});let n=(0,t.useRef)(null),o=(0,t.useRef)(null),i=(0,t.useRef)(!1),l=(0,t.useRef)(!1),s=(0,t.useRef)(0),c=(0,t.useRef)(0),u=(0,t.useRef)(0),f=(0,t.useCallback)(()=>{let e=a.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=a.current.dpr??"auto",n=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:n,bufferWidth:Math.max(1,Math.round(t.width*n)),bufferHeight:Math.max(1,Math.round(t.height*n))}},[]),d=(0,t.useCallback)(function e(t){if(l.current)return;0===s.current&&(s.current=t);let o=0===c.current?0:Math.min((t-c.current)/1e3,r);c.current=t;let f={now:t,dt:o,elapsed:(t-s.current)/1e3,frame:u.current++},d=a.current.onFrame?.(f);if(!l.current){if(!1===d||a.current.halted){i.current=!1,n.current=null;return}n.current=requestAnimationFrame(e)}},[]),h=(0,t.useCallback)(()=>{l.current||i.current||(i.current=!0,c.current=0,n.current=requestAnimationFrame(d))},[d]),m=(0,t.useCallback)(()=>{i.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null)},[]),p=(0,t.useCallback)(()=>h(),[h]),v=(0,t.useCallback)(()=>{let e=f();e&&(a.current.onResize?.(e),!1!==a.current.paintWhenHalted?p():a.current.halted||h())},[f,p,h]),x=e.deps??[];(0,t.useEffect)(()=>{l.current=!1;let e=a.current.target.current;if(!e)return;let t=()=>{l.current||v()},r=new ResizeObserver(()=>{let e=a.current.resizeDebounceMs??0;e<=0?t():(null!==o.current&&clearTimeout(o.current),o.current=setTimeout(()=>{o.current=null,t()},e))});return r.observe(e),v(),a.current.halted||h(),()=>{l.current=!0,i.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null),null!==o.current&&(clearTimeout(o.current),o.current=null),r.disconnect(),a.current.onDispose?.();let e=a.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),s.current=0,c.current=0,u.current=0}},x);let g=e.halted??!1;return(0,t.useEffect)(()=>{g||h()},[g,h]),(0,t.useMemo)(()=>({start:h,stop:m,paint:p,resize:v,get running(){return i.current}}),[h,m,p,v])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);