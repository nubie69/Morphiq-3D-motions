(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,422120,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(532181),n=e.i(221663),o=e.i(956850),s=e.i(80075),i=e.i(753604),l=e.i(450922);let c={20:20,32:32,48:48},u=200*Math.PI,h=e=>{let t=e.replace("#",""),r=3===t.length?t.split("").map(e=>e+e).join(""):t,a=parseInt(r,16);return Number.isNaN(a)||6!==r.length?[1,1,1]:[(a>>16&255)/255,(a>>8&255)/255,(255&a)/255]},d=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`,p=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec3 uWater;
uniform vec3 uSky;
uniform vec3 uSun;
uniform vec3 uFoam;
uniform float uPhase;
uniform float uAspect;
uniform float uSwell;
uniform float uChop;
uniform float uSunH;
uniform float uSteps;
uniform vec2 uPointer;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
// The fraction is derived from the floor, never from fract(): on some GPU
// paths (NVIDIA under D3D11) floor() and fract() of an FMA-contracted
// argument round differently at an exact cell boundary, so the cell index
// and the fraction disagree and the noise jumps — a one-pixel seam wherever
// a sample lands on an integer, which the centre ray column always does.
float vnoise(vec2 p) {
  vec2 i = floor(p), f = p - i;
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1, 0)), u.x),
    mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x),
    u.y);
}
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

// Phase speed per octave follows deep-water dispersion (faster for shorter
// waves). Each is a multiple of 0.01 so the 200π clock wrap is seamless.
const float SPD[6] = float[6](0.48, 0.66, 0.91, 1.26, 1.73, 2.39);

// Trochoid octaves on a warped domain. The warp is a static low-frequency
// noise displacement: the sea rolls through it, so crests bend and wander
// instead of running straight to the horizon. Each octave's direction turns
// by an odd angle so no two ever phase-lock. Choppiness sharpens the crest
// exponent, strongest on the long swells.
float height(vec2 p, float chop, int oct) {
  p += (vec2(vnoise(p * 0.045), vnoise(p * 0.045 + 19.0)) - 0.5) * 9.0;
  float h = 0.0;
  float amp = 1.0;
  float k = 0.17;
  vec2 dir = normalize(vec2(0.3, 1.0));
  mat2 R = rot(1.93);
  for (int i = 0; i < 6; i++) {
    if (i >= oct) break;
    float x = dot(dir, p) * k + uPhase * SPD[i];
    float s = chop * (2.0 - 0.3 * float(i));
    float c = 0.5 + 0.5 * sin(x);
    h += (pow(c, 1.0 + s) - 1.0 / (2.0 + s)) * amp;
    dir = R * dir;
    k *= 1.9;
    amp *= 0.5;
  }
  return h * uSwell * 0.55;
}

// Dusk sky: darkest overhead, an ember band pressed against the horizon,
// forward scatter around the sun in three widths, a disc, backlit cirrus low
// in the sky and a scatter of stars overhead. disc = 0 for reflections, so the
// sun path on the water comes from the soft glow and the glitter pass, not a
// hard-edged mirror image.
vec3 skyAt(vec3 rd, vec3 sunDir, float disc) {
  float up = clamp(rd.y, 0.0, 1.0);
  vec3 zenith = uSky * 0.5;
  vec3 horizon = mix(uSky * 1.5, uSun, 0.3);
  vec3 c = mix(horizon, zenith, pow(up, 0.5));
  // The ember band hugs the horizon; the glow stays tight to the sun so the
  // rest of the sky keeps the dusk colour instead of going brown.
  c += uSun * exp(-up * 12.0) * 0.22;
  float ang = max(dot(rd, sunDir), 0.0);
  c += uSun * (pow(ang, 14.0) * 0.16 + pow(ang, 60.0) * 0.4 + pow(ang, 500.0) * 1.1);

  // Stars: one per cell of a gnomonic lattice (no atan, so no branch cut
  // for a reflected ray that points back past the camera), fading toward
  // the horizon haze and into the sun's glow.
  vec2 sq = rd.xz / (up + 0.25) * 30.0;
  vec2 cell = floor(sq);
  float sh = hash(cell);
  vec2 off = vec2(hash(cell + 1.7), hash(cell + 3.1)) - 0.5;
  float sr = length(sq - cell - 0.5 - off * 0.6);
  float star = (1.0 - smoothstep(0.0, 0.09, sr)) * step(0.94, sh) * (0.4 + 0.6 * hash(cell + 5.3));
  star *= smoothstep(0.06, 0.4, rd.y) * (1.0 - pow(ang, 6.0));
  c += vec3(0.9, 0.93, 1.0) * star * 0.55;

  // Cirrus: a cloud layer projected onto the sky plane, stretched sideways
  // into streaks, catching the sun from below.
  float band = smoothstep(0.0, 0.05, rd.y) * (1.0 - smoothstep(0.06, 0.5, rd.y));
  vec2 cq = rd.xz / (rd.y + 0.06) * vec2(0.09, 0.3) + vec2(uPhase * 0.01, 0.0);
  float cl = vnoise(cq) * 0.6 + vnoise(cq * 2.3 + 5.0) * 0.4;
  cl = smoothstep(0.5, 0.78, cl) * band;
  vec3 cloudCol = mix(uSky * 0.75, uSun * 1.05, 0.2 + 0.7 * pow(ang, 3.0));
  c = mix(c, cloudCol, cl * 0.6);

  c = mix(c, uSun * 1.6 + 0.35, smoothstep(0.99935, 0.99965, ang) * disc);
  return c;
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  vec3 rd = normalize(vec3(uv.x * uAspect, uv.y - 0.12, -1.35));
  rd.yz *= rot(uPointer.y * 0.05);
  rd.xz *= rot(-uPointer.x * 0.09);
  vec3 ro = vec3(0.0, 2.8, 0.0);

  vec3 sunDir = normalize(vec3(0.42, uSunH, -1.0));
  vec3 horizonCol = skyAt(normalize(vec3(rd.x, 0.001, rd.z)), sunDir, 0.0);
  // Periodic drifts for the ripple and foam textures — closed loops on the
  // phase clock, so they never jump at the wrap.
  vec2 drift = vec2(cos(uPhase * 0.03), sin(uPhase * 0.02)) * 4.0;

  vec3 col;
  float chop = uChop;

  // The camera rides above the tallest swell, so an upward ray can never hit
  // water — sky rays skip the march entirely.
  if (rd.y > -0.004) {
    col = skyAt(rd, sunDir, 1.0);
  } else {
    // Geometric march from t=1 to the fog distance in exactly uSteps steps,
    // then a short bisection once the ray crosses the surface.
    float g = pow(190.0, 1.0 / uSteps);
    float t = 1.0;
    float tPrev = 1.0;
    bool hit = false;
    for (int i = 0; i < 48; i++) {
      if (float(i) >= uSteps) break;
      t = tPrev * g;
      vec3 sp = ro + rd * t;
      if (sp.y - height(sp.xz, chop, 3) < 0.0) { hit = true; break; }
      tPrev = t;
    }
    if (!hit) {
      col = horizonCol;
    } else {
      for (int i = 0; i < 5; i++) {
        float tm = (tPrev + t) * 0.5;
        vec3 sp = ro + rd * tm;
        if (sp.y - height(sp.xz, chop, 6) < 0.0) { t = tm; } else { tPrev = tm; }
      }
      vec3 p = ro + rd * t;
      float hC = height(p.xz, chop, 6);
      float near = 1.0 - smoothstep(6.0, 45.0, t);

      // Normal epsilon scales with distance — the anti-moir\xe9 valve.
      float e = 0.012 + t * 0.006;
      vec3 n = normalize(vec3(
        height(p.xz - vec2(e, 0.0), chop, 6) - height(p.xz + vec2(e, 0.0), chop, 6),
        2.0 * e,
        height(p.xz - vec2(0.0, e), chop, 6) - height(p.xz + vec2(0.0, e), chop, 6)));
      // Wind ripple: a fine normal perturbation that fades with distance,
      // which is what breaks the glassy sheen on the near swells.
      float slope = 1.0 - n.y;
      vec2 rq = p.xz * 4.5 + drift;
      n.xz += (vec2(vnoise(rq), vnoise(rq + 17.0)) - 0.5) * 0.16 * near * (0.4 + 0.6 * chop);
      n = normalize(n);

      vec3 ref = reflect(rd, n);
      ref.y = abs(ref.y);
      float fres = 0.02 + 0.98 * pow(1.0 - max(dot(-rd, n), 0.0), 5.0);

      // Body colour: deep water lit by the sky, lifting toward the crests,
      // plus light passing through a crest that stands between the eye and
      // the sun — the glow that makes a swell read as water and not paint.
      float crest = clamp(hC / max(uSwell, 0.15) * 1.2 + 0.2, 0.0, 1.0);
      float sss = pow(max(dot(rd, sunDir), 0.0), 3.0) * crest * crest;
      vec3 body = uWater * (0.35 + 0.65 * max(n.y, 0.0)) + uWater * 0.6 * crest
        + mix(uWater, uSun, 0.45) * 1.4 * sss;
      col = mix(body, skyAt(ref, sunDir, 0.0), fres);

      // Sun path: a tight specular lobe broken up by a cell twinkle so it
      // sparkles instead of smearing, over a broad soft lobe.
      vec3 hv = normalize(sunDir - rd);
      float nh = max(dot(n, hv), 0.0);
      float cellT = 0.4 + 0.6 * hash(floor(p.xz * 3.1) + floor(uPhase * 3.0));
      col += uSun * (pow(nh, 900.0) * 2.4 * cellT + pow(nh, 80.0) * 0.16);

      // Foam breaks only where a crest is both high and steep, near the
      // camera; the slope is the coarse one, before the ripple, so wind
      // texture never reads as whitewater. Noise keeps the edge ragged.
      float foam = smoothstep(0.66, 0.92, crest + (vnoise(p.xz * 2.3 + drift) - 0.5) * 0.25)
        * smoothstep(0.08, 0.3, slope);
      foam *= (0.45 + 0.55 * vnoise(p.xz * 8.0 - drift)) * near * min(chop + 0.2, 1.0);
      col = mix(col, uFoam * (0.6 + 0.4 * max(n.y, 0.0)), clamp(foam, 0.0, 1.0) * 0.8);

      // Aerial perspective: fog the water into the colour the sky paints at
      // the horizon in this direction so the seam never reads as an edge.
      col = mix(col, horizonCol, smoothstep(25.0, 175.0, t));
    }
  }

  // Vignette to seat the copy, grain and a dither so the dusk gradient
  // never bands.
  col *= 1.0 - 0.12 * dot(uv * vec2(0.8, 1.0), uv * vec2(0.8, 1.0));
  col += (hash(vUv * 1731.0 + fract(uPhase)) - 0.5) * 0.022;
  col += (hash(vUv * 977.0) - 0.5) / 255.0;

  fragColor = vec4(col, 1.0);
}`,f=(0,r.memo)(({title:e="Built for the long swell",subtitle:a="Steady under everything the surface does.",ctaLabel:f="Chart a course",onCtaClick:m,waterColor:v="#0a1e33",skyColor:x="#2a1636",sunColor:g="#ffab5e",foamColor:y="#dcecf5",swellHeight:w=1,choppiness:b=1,speed:k=1,sunHeight:C=.12,quality:z="32",parallax:S=!0,paused:_=!1,reducedMotion:q=!1,className:P})=>{let j=(0,r.useRef)(null),R=(0,r.useRef)(null),A=(0,r.useRef)(null),M=(0,r.useRef)(null),N=(0,r.useRef)({x:0,y:0,tx:0,ty:0}),[F,T]=(0,r.useState)(!1),[D,H]=(0,r.useState)(!1),$=(0,r.useRef)(_);$.current=_,(0,r.useEffect)(()=>H(!0),[]);let W=(0,l.useAnimationLoop)({target:j,halted:_,dpr:"auto",onResize:e=>A.current?.(e),onFrame:({dt:e})=>!!R.current&&R.current(e),gl:()=>M.current}),E=(0,r.useRef)({waterColor:v,skyColor:x,sunColor:g,foamColor:y,swellHeight:w,choppiness:b,speed:k,sunHeight:C,quality:z,parallax:S,reducedMotion:q});E.current={waterColor:v,skyColor:x,sunColor:g,foamColor:y,swellHeight:w,choppiness:b,speed:k,sunHeight:C,quality:z,parallax:S,reducedMotion:q},(0,r.useEffect)(()=>{let e,t=j.current;if(F||!t)return;try{e=new n.Renderer({dpr:Math.min(window.devicePixelRatio||1,2),alpha:!1})}catch{T(!0);return}let r=e.gl;M.current=r;let a=r.canvas;a.style.display="block",a.style.position="absolute",a.style.top="0",a.style.left="0",t.appendChild(a);let l=new o.Program(r,{vertex:d,fragment:p,cullFace:!1,depthTest:!1,depthWrite:!1,uniforms:{uWater:{value:new Float32Array(h(v))},uSky:{value:new Float32Array(h(x))},uSun:{value:new Float32Array(h(g))},uFoam:{value:new Float32Array(h(y))},uPhase:{value:0},uAspect:{value:1},uSwell:{value:w},uChop:{value:b},uSunH:{value:C},uSteps:{value:c[z]??32},uPointer:{value:new Float32Array([0,0])}}}),f=new s.Mesh(r,{geometry:new i.Triangle(r),program:l}),m=l.uniforms,k=0;return R.current=t=>{let r=E.current,a=Math.min(t,1/30);if(!($.current||r.reducedMotion)){k=(k+a*r.speed)%u;let e=Math.min(1,4*a);N.current.x+=(N.current.tx-N.current.x)*e,N.current.y+=(N.current.ty-N.current.y)*e}let n=r.parallax&&!r.reducedMotion?1:0;m.uWater.value.set(h(r.waterColor)),m.uSky.value.set(h(r.skyColor)),m.uSun.value.set(h(r.sunColor)),m.uFoam.value.set(h(r.foamColor)),m.uPhase.value=k,m.uSwell.value=r.swellHeight,m.uChop.value=r.choppiness,m.uSunH.value=r.sunHeight,m.uSteps.value=c[r.quality]??32;let o=m.uPointer.value;o[0]=N.current.x*n,o[1]=N.current.y*n,e.render({scene:f})},A.current=({width:t,height:r,dpr:a})=>{e.dpr=a,e.setSize(Math.max(1,Math.floor(t)),Math.max(1,Math.floor(r))),m.uAspect.value=Math.max(t,1)/Math.max(r,1),R.current?.(.016)},W.resize(),W.start(),()=>{R.current=null,A.current=null,t.contains(a)&&t.removeChild(a)}},[F]),(0,r.useEffect)(()=>{W.paint()},[v,x,g,y,w,b,k,C,z,S,W]);let B=e=>q?{}:{opacity:+!!D,transform:D?"none":"translateY(14px)",transition:`opacity 700ms cubic-bezier(0.22,1,0.36,1) ${110*e}ms, transform 700ms cubic-bezier(0.22,1,0.36,1) ${110*e}ms`},U=(0,t.jsxs)("div",{className:"pointer-events-none absolute inset-0 z-10 flex flex-col items-start justify-center bg-[linear-gradient(90deg,rgba(0,0,0,0.32),rgba(0,0,0,0)_58%)] px-[max(20px,5.5cqi)] text-left",children:[e?(0,t.jsx)("h1",{className:"max-w-[max(260px,52cqi)] text-[max(28px,5.4cqi)] leading-[1.02] font-semibold tracking-tight text-white",style:B(0),children:e}):null,a?(0,t.jsx)("p",{className:"mt-[max(10px,1.4cqi)] max-w-[max(220px,40cqi)] text-[max(12px,1.7cqi)] leading-snug text-white/70",style:B(1),children:a}):null,f&&!q?(0,t.jsx)("style",{children:`@keyframes __sg_tidal_wave { to { transform: translateX(-200px); } }
.__sg_tidal_cta g { animation: __sg_tidal_wave 11s linear infinite paused; }
.__sg_tidal_cta g:first-of-type { animation-duration: 19s; }
.__sg_tidal_cta:hover g, .__sg_tidal_cta:focus-visible g { animation-play-state: running; }`}):null,f?(0,t.jsxs)("button",{type:"button",onClick:m,className:"__sg_tidal_cta pointer-events-auto relative mt-[max(18px,2.6cqi)] cursor-pointer overflow-hidden rounded-md px-[max(22px,3cqi)] py-[max(11px,1.4cqi)] text-[max(11px,1.3cqi)] font-bold tracking-[0.2em] uppercase shadow-[0_12px_30px_-12px_rgba(0,0,0,0.8)] transition-[transform,filter] duration-150 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 active:scale-95",style:{...B(2),color:v,backgroundImage:`radial-gradient(circle at 88% 26%, ${g} 0 4.5%, transparent 6%), linear-gradient(to bottom, ${g} 0%, ${y} 100%)`},children:[(0,t.jsxs)("svg",{"aria-hidden":!0,viewBox:"0 0 400 40",preserveAspectRatio:"none",className:"absolute inset-x-0 -bottom-px h-[58%] w-full",children:[(0,t.jsx)("g",{children:(0,t.jsx)("path",{fill:v,fillOpacity:.5,d:"M0 28 C 30 12, 60 12, 100 24 S 170 40, 200 28 C 230 12, 260 12, 300 24 S 370 40, 400 28 C 430 12, 460 12, 500 24 S 570 40, 600 28 V 40 H 0 Z"})}),(0,t.jsx)("g",{children:(0,t.jsx)("path",{fill:v,d:"M0 34 C 40 20, 70 36, 100 26 S 160 14, 200 34 C 240 20, 270 36, 300 26 S 360 14, 400 34 C 440 20, 470 36, 500 26 S 560 14, 600 34 V 40 H 0 Z"})})]}),(0,t.jsx)("span",{className:"relative",children:f})]}):null]});return F?(0,t.jsx)("div",{className:P??"@container relative h-full w-full overflow-hidden",style:{backgroundColor:x,backgroundImage:`radial-gradient(circle at 66% 50%, ${g}88 0%, transparent 34%), linear-gradient(to bottom, ${x} 0%, ${g}40 52%, ${v} 56%, ${v} 100%)`},children:U}):(0,t.jsx)("div",{ref:j,className:P??"@container relative h-full w-full overflow-hidden",onPointerMove:e=>{let t=e.currentTarget.getBoundingClientRect();0!==t.width&&0!==t.height&&(N.current.tx=(e.clientX-t.left)/t.width*2-1,N.current.ty=-((e.clientY-t.top)/t.height*2-1),W.start())},onPointerLeave:()=>{N.current.tx=0,N.current.ty=0,W.start()},children:U})});f.displayName="Tidal";let m=["harbour","tides","charts","contact"];e.s(["default",0,function({values:e,reducedMotion:n,paused:o}){let s=e.sunColor,i=e.foamColor,[l,c]=(0,r.useState)("harbour");return(0,t.jsxs)("div",{className:"@container relative h-full min-h-80 w-full",children:[(0,t.jsx)(f,{title:"Built for the long swell",subtitle:"Steady under everything the surface does.",ctaLabel:"Chart a course",waterColor:e.waterColor,skyColor:e.skyColor,sunColor:s,foamColor:i,swellHeight:e.swellHeight,choppiness:e.choppiness,speed:e.speed,sunHeight:e.sunHeight,quality:e.quality,parallax:e.parallax,paused:o,reducedMotion:n}),(0,t.jsx)("nav",{"aria-label":"Hero",className:"pointer-events-auto absolute left-1/2 top-[max(10px,3cqi)] z-10 flex -translate-x-1/2 gap-[max(14px,3.2cqi)]",children:m.map(e=>(0,t.jsxs)("button",{type:"button","aria-current":l===e?"page":void 0,onClick:()=>c(e),className:`relative cursor-pointer pb-[max(4px,0.5cqi)] font-display text-[max(9px,1.35cqi)] tracking-[0.25em] uppercase transition-colors duration-150 hover:text-[#f2eff8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 ${l===e?"text-[#f2eff8]":"text-[#b6aecb]"}`,children:[e,l===e?(0,t.jsx)(a.motion.span,{layoutId:"__sg_tidal_underline","aria-hidden":!0,className:"absolute inset-x-0 bottom-0 h-0.5 rounded-full",style:{backgroundColor:i},transition:n?{duration:0}:{type:"spring",stiffness:420,damping:30,mass:.8}}):null]},e))}),(0,t.jsxs)("div",{className:"pointer-events-none absolute left-[max(16px,4cqi)] top-[max(10px,3cqi)] z-10 hidden items-center gap-[max(8px,1cqi)] @xl:flex",children:[(0,t.jsx)("span",{className:"block size-[max(6px,0.7cqi)] rounded-full",style:{backgroundColor:s,boxShadow:`0 0 max(8px,1cqi) ${s}`}}),(0,t.jsx)("span",{className:"font-display text-[max(8px,1.05cqi)] tracking-[0.24em] text-[#b6aecb] uppercase",children:"high tide · 18:42"})]}),(0,t.jsxs)("div",{className:"pointer-events-none absolute bottom-[max(8px,2cqi)] left-[max(16px,4cqi)] z-10 hidden flex-col @xl:flex",children:[(0,t.jsx)("span",{className:"font-display text-[max(7px,0.9cqi)] tracking-[0.26em] text-[#7d7691] uppercase",children:"swell"}),(0,t.jsx)("span",{className:"font-display text-[max(10px,1.3cqi)] tracking-widest text-[#f2eff8]",children:"2.1 m · 14 s"})]})]})}],422120)},17727,function(e){e.n(e.i(422120))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let a=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{a.current=e});let n=(0,t.useRef)(null),o=(0,t.useRef)(null),s=(0,t.useRef)(!1),i=(0,t.useRef)(!1),l=(0,t.useRef)(0),c=(0,t.useRef)(0),u=(0,t.useRef)(0),h=(0,t.useCallback)(()=>{let e=a.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=a.current.dpr??"auto",n=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:n,bufferWidth:Math.max(1,Math.round(t.width*n)),bufferHeight:Math.max(1,Math.round(t.height*n))}},[]),d=(0,t.useCallback)(function e(t){if(i.current)return;0===l.current&&(l.current=t);let o=0===c.current?0:Math.min((t-c.current)/1e3,r);c.current=t;let h={now:t,dt:o,elapsed:(t-l.current)/1e3,frame:u.current++},d=a.current.onFrame?.(h);if(!i.current){if(!1===d||a.current.halted){s.current=!1,n.current=null;return}n.current=requestAnimationFrame(e)}},[]),p=(0,t.useCallback)(()=>{i.current||s.current||(s.current=!0,c.current=0,n.current=requestAnimationFrame(d))},[d]),f=(0,t.useCallback)(()=>{s.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null)},[]),m=(0,t.useCallback)(()=>p(),[p]),v=(0,t.useCallback)(()=>{let e=h();e&&(a.current.onResize?.(e),!1!==a.current.paintWhenHalted?m():a.current.halted||p())},[h,m,p]),x=e.deps??[];(0,t.useEffect)(()=>{i.current=!1;let e=a.current.target.current;if(!e)return;let t=()=>{i.current||v()},r=new ResizeObserver(()=>{let e=a.current.resizeDebounceMs??0;e<=0?t():(null!==o.current&&clearTimeout(o.current),o.current=setTimeout(()=>{o.current=null,t()},e))});return r.observe(e),v(),a.current.halted||p(),()=>{i.current=!0,s.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null),null!==o.current&&(clearTimeout(o.current),o.current=null),r.disconnect(),a.current.onDispose?.();let e=a.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),l.current=0,c.current=0,u.current=0}},x);let g=e.halted??!1;return(0,t.useEffect)(()=>{g||p()},[g,p]),(0,t.useMemo)(()=>({start:p,stop:f,paint:m,resize:v,get running(){return s.current}}),[p,f,m,v])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);