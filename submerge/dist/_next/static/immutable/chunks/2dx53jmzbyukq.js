(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,492713,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(221663),n=e.i(956850),o=e.i(80075),i=e.i(753604),s=e.i(450922);let l=e=>{let t=e.replace("#",""),r=3===t.length?t.split("").map(e=>e+e).join(""):t,a=parseInt(r,16);return Number.isNaN(a)||6!==r.length?[1,1,1]:[(a>>16&255)/255,(a>>8&255)/255,(255&a)/255]},u=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`,c=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec3 uLine;
uniform vec3 uSun;
uniform vec3 uHaze;
uniform vec3 uBg;
uniform float uTime;
uniform float uAspect;
uniform float uDensity;
uniform float uScroll;
uniform float uSunSize;
uniform float uHorizonGlow;
uniform float uYaw;
uniform float uPitch;
uniform vec2 uPointer;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1, 0)), u.x),
    mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x),
    u.y);
}
float fbm(vec2 p) {
  return vnoise(p) * 0.65 + vnoise(p * 2.7 + 13.1) * 0.35;
}

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

vec3 rayDir(vec2 uv) {
  // Camera basis straight from the two orbit angles. Rotating RAYS is the
  // inverse of rotating the world, which is exactly what makes this the
  // camera-side of the sign convention.
  vec3 d = normalize(vec3(uv.x * uAspect, uv.y, -1.15));
  d.yz *= rot(-uPitch);
  d.xz *= rot(-uYaw);
  return d;
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  // Slight lens: corners compress a touch, which keeps the sun from clipping
  // flat against the viewport edge on narrow screens.
  uv *= 1.0 - 0.06 * dot(uv, uv) * 0.5;
  vec3 rd = rayDir(uv);
  vec3 ro = vec3(0.0, 0.55, 0.0);
  float elev = asin(clamp(rd.y, -1.0, 1.0));
  float az = atan(rd.x, -rd.z);

  // Sun. Pinned in the WORLD: the rays already carry the camera rotation, so
  // the sun direction must NOT be rotated again — rotating both by the same
  // angles leaves their dot product unchanged, which glued the disc to the
  // glass while the ridges swung past it. Its elevation rides on its radius:
  // the bottom edge always sits at 0.14 rad, level with the ridge tops
  // (typically 0.06–0.14), so the disc rests on the skyline whatever size it
  // is tuned to. A touch right of centre, so it shares the frame with a
  // bottom-left copy block instead of sitting under the headline.
  float sunR = max(uSunSize, 0.02);
  float sunElev = 0.14 + sunR;
  vec3 sunDir = vec3(sin(0.3) * cos(sunElev), sin(sunElev), -cos(0.3) * cos(sunElev));
  float ang = dot(rd, sunDir);
  float theta = acos(clamp(ang, -1.0, 1.0));

  // Sky in three layers rather than one ramp. A cool zenith falling into the
  // background colour; a horizon haze that hugs the skyline and swells on the
  // sun's side (forward scatter); and the sun's bloom — a tight core plus a
  // wide lobe that is strongest low down, where the air is thickest. Together
  // they read as atmosphere lit from behind rather than a gradient with a
  // sticker on it.
  float zenith = smoothstep(-0.05, 0.85, elev);
  vec3 col = uBg * mix(1.3, 0.42, zenith);
  float toward = 0.5 + 0.5 * dot(normalize(rd.xz + 1e-5), normalize(sunDir.xz + 1e-5));
  float haze = exp(-max(elev, 0.0) * 6.0) * (0.45 + 0.55 * toward * toward);
  col += uHaze * haze * uHorizonGlow;
  float bloom = exp(-theta * 9.0) * 0.45
              + exp(-theta * 2.6) * 0.14 * (0.4 + 0.6 * haze);
  col += uSun * bloom * uHorizonGlow;

  // Thin cirrus stretched along the horizon and lit by the sun. A sky with
  // nothing in it reads as a gradient, not as air; kept faint so it stays
  // texture rather than weather.
  float cir = fbm(vec2(az * 2.4 + uTime * 0.008, elev * 11.0 + 5.0));
  cir = smoothstep(0.52, 0.8, cir) * smoothstep(0.02, 0.2, elev)
      * smoothstep(0.75, 0.3, elev);
  col += mix(uHaze, uSun, 0.35 + 0.45 * exp(-theta * 2.0)) * cir * 0.22 * uHorizonGlow;

  // Stars pinned to the SKY, not the screen: cells live on the direction
  // itself (a cube lattice over the unit sphere), so a yaw swings the field
  // with the sun instead of leaving it painted on the glass. Each star is a
  // jittered point inside its cell drawn as a soft dot a pixel or two wide —
  // never a whole square cell.
  vec3 sc = floor(rd * 44.0);
  float sh = hash(sc.xy + sc.z * 17.31);
  vec3 jitter = vec3(hash(sc.xy * 1.7 + sc.z), hash(sc.yz * 2.3 + sc.x), hash(sc.zx * 3.1 + sc.y));
  vec3 sp = normalize((sc + 0.5 + (jitter - 0.5) * 0.7) / 44.0);
  float sd = length(rd - sp);
  float sr = 0.0012 + 0.0022 * pow(hash(sc.xz + sc.y * 7.7), 4.0);
  float sw = fwidth(sd) + 1e-4;
  float star = step(0.94, sh) * (1.0 - smoothstep(sr - sw, sr + sw, sd));
  float twinkle = 0.7 + 0.3 * sin(uTime * 1.7 + sh * 90.0);
  col += vec3(0.88, 0.9, 1.0) * star * twinkle * (0.4 + 0.6 * sh)
       * smoothstep(0.0, 0.2, elev) * (1.0 - min(bloom * 2.5, 1.0))
       * (1.0 - min(cir * 2.0, 1.0));

  // Banded sun disc: bands cut the lower hemisphere only, drifting downward.
  // Keyed off the vertical component difference — linear enough this close
  // to centre.
  float cosR = cos(sunR);
  float disc = smoothstep(cosR, cosR + 0.0022, ang);
  float vOff = (rd.y - sunDir.y) / sunR;
  float bands = 1.0;
  if (vOff < 0.0) {
    float k = fract(vOff * 7.0 + uTime * 0.35);
    bands = smoothstep(0.0, 0.28, k);
  }
  col = mix(col, uSun * (0.85 + 0.3 * bands), disc * bands);

  // Twin ridges. Azimuth drives the profile, so the silhouette wraps the
  // full 360 and survives any yaw; the nearer layer samples a coarser octave
  // and sits higher, which is all "parallax" needs to read. Aerial
  // perspective does the rest: the far ridge is lighter and sunk into haze,
  // the near one a dark cut-out — two tones are what make two ridges read as
  // depth rather than one jagged line drawn twice.
  float ridgeFar = 0.045 + fbm(vec2(az * 3.1, 2.7)) * 0.10;
  float ridgeNear = 0.03 + fbm(vec2(az * 1.9 + 40.0, 8.2)) * 0.14;
  vec3 farCol = mix(uBg * 0.5, uHaze, 0.55);
  vec3 nearCol = mix(uBg * 0.22, uHaze, 0.2);
  float farMask = 1.0 - smoothstep(ridgeFar - 0.004, ridgeFar + 0.004, rd.y);
  col = mix(col, farCol, farMask);
  // Rim light kisses just the ridge line — the haze source behind the sun.
  col += uHaze * uHorizonGlow * smoothstep(ridgeFar - 0.012, ridgeFar, rd.y) * farMask * 0.7;
  float nearMask = 1.0 - smoothstep(ridgeNear - 0.004, ridgeNear + 0.004, rd.y);
  col = mix(col, nearCol, nearMask);
  col += uHaze * uHorizonGlow * smoothstep(ridgeNear - 0.010, ridgeNear, rd.y) * nearMask * 0.45;

  // Floor: analytic intersection, so the grid is exact rather than marched.
  if (rd.y < -0.002) {
    float t = -ro.y / rd.y;
    vec3 p = ro + rd * t;
    p.z += uTime * uScroll * 2.4;

    vec2 g = p.xz * (uDensity / 2.2);
    vec2 w = fwidth(g) * 1.5 + 1e-4;
    vec2 gg = abs(fract(g) - 0.5);
    float lines = 1.0 - min(min(gg.x / w.x, gg.y / w.y), 1.0);
    float att = exp(-t * 0.14);
    vec3 floorCol = uLine * lines * att * 1.15;

    // Pulse expanding from the vanishing point, tied to the same clock as the
    // scroll so the whole floor breathes on one rhythm.
    float r = length(p.xz);
    float ring = fract(uTime * 0.20);
    floorCol += uLine * lines * exp(-abs(r / 34.0 - ring) * 30.0) * 0.9;

    // A soft pool of light where the cursor would land — cheap, but it makes
    // the steering feel physical rather than like a cropped video.
    float pd = distance(uv * vec2(uAspect, 1.0), uPointer * vec2(uAspect, 1.0));
    floorCol += uLine * lines * exp(-pd * pd * 6.0) * 0.5;

    // Fog the floor into the SAME colour the sky paints at the horizon so the
    // seam never reads as a polygon edge.
    col = mix(floorCol + uHaze * uHorizonGlow * 0.08, col, smoothstep(3.0, 26.0, t));
  }

  // Dither: eight-bit output steps a dark sky into visible bands; a third
  // of a level of noise breaks them without being seen.
  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  fragColor = vec4(col, 1.0);
}`,h=(0,r.memo)(({lineColor:e="#a855f7",sunColor:h="#f0abfc",hazeColor:d="#2e1065",backgroundColor:f="#070312",scrollSpeed:p=.35,gridDensity:v=1,sunSize:m=.22,horizonGlow:g=1,enableMouseInteraction:x=!0,paused:w=!1,reducedMotion:y=!1,className:b})=>{let z=(0,r.useRef)(null),k=(0,r.useRef)(null),C=(0,r.useRef)(null),M=(0,r.useRef)(null),R=(0,r.useRef)({yaw:0,pitch:-.28,vYaw:0,vPitch:0,dragging:!1,pointerId:-1,lastX:0,lastY:0,lastT:0}),S=(0,r.useRef)({x:0,y:0,tx:0,ty:0}),[A,P]=(0,r.useState)(!1),T=(0,r.useRef)(w);T.current=w;let j=(0,s.useAnimationLoop)({target:z,halted:w,dpr:"auto",onResize:e=>C.current?.(e),onFrame:({dt:e})=>!!k.current&&k.current(e),gl:()=>M.current}),H=(0,r.useRef)({lineColor:e,sunColor:h,hazeColor:d,backgroundColor:f,scrollSpeed:p,gridDensity:v,sunSize:m,horizonGlow:g,enableMouseInteraction:x,reducedMotion:y});H.current={lineColor:e,sunColor:h,hazeColor:d,backgroundColor:f,scrollSpeed:p,gridDensity:v,sunSize:m,horizonGlow:g,enableMouseInteraction:x,reducedMotion:y},(0,r.useEffect)(()=>{let t,r=z.current;if(A||!r)return;try{t=new a.Renderer({dpr:Math.min(window.devicePixelRatio||1,2),alpha:!1})}catch{P(!0);return}let s=t.gl;M.current=s;let x=s.canvas;x.style.display="block",x.style.position="absolute",x.style.top="0",x.style.left="0",r.appendChild(x);let w=new n.Program(s,{vertex:u,fragment:c,cullFace:!1,depthTest:!1,depthWrite:!1,uniforms:{uLine:{value:new Float32Array(l(e))},uSun:{value:new Float32Array(l(h))},uHaze:{value:new Float32Array(l(d))},uBg:{value:new Float32Array(l(f))},uTime:{value:0},uAspect:{value:1},uDensity:{value:v},uScroll:{value:p},uSunSize:{value:m},uHorizonGlow:{value:g},uYaw:{value:0},uPitch:{value:-.28},uPointer:{value:new Float32Array([10,10])}}}),y=new o.Mesh(s,{geometry:new i.Triangle(s),program:w}),b=w.uniforms,N=0;return k.current=e=>{let r=H.current,a=R.current,n=Math.min(e,1/30);if(!(T.current||r.reducedMotion)){if(N=(N+n)%1e3,!a.dragging){a.yaw+=a.vYaw*n,a.pitch=Math.max(-.55,Math.min(.2,a.pitch+a.vPitch*n));let e=Math.pow(.92,60*n);a.vYaw*=e,a.vPitch*=e}a.yaw%=2*Math.PI;let e=Math.min(1,4.5*n);S.current.x+=(S.current.tx-S.current.x)*e,S.current.y+=(S.current.ty-S.current.y)*e}let o=r.enableMouseInteraction&&!r.reducedMotion?1:0;b.uLine.value.set(l(r.lineColor)),b.uSun.value.set(l(r.sunColor)),b.uHaze.value.set(l(r.hazeColor)),b.uBg.value.set(l(r.backgroundColor)),b.uTime.value=N,b.uDensity.value=r.gridDensity,b.uScroll.value=r.reducedMotion?0:r.scrollSpeed,b.uSunSize.value=r.sunSize,b.uHorizonGlow.value=r.horizonGlow,b.uYaw.value=a.yaw+.22*S.current.x*o,b.uPitch.value=a.pitch-.12*S.current.y*o;let i=b.uPointer.value;i[0]=r.enableMouseInteraction?S.current.tx:10,i[1]=r.enableMouseInteraction?S.current.ty:10,t.render({scene:y})},C.current=({width:e,height:r,dpr:a})=>{t.dpr=a,t.setSize(Math.max(1,Math.floor(e)),Math.max(1,Math.floor(r))),b.uAspect.value=Math.max(e,1)/Math.max(r,1),k.current?.(.016)},j.resize(),j.start(),()=>{k.current=null,C.current=null,r.contains(x)&&r.removeChild(x)}},[A]),(0,r.useEffect)(()=>{j.paint()},[e,h,d,f,p,v,m,g,x,j]);let N=()=>{R.current.dragging=!1,R.current.pointerId=-1},F=e=>{let t=R.current;-1!==t.pointerId&&e.currentTarget.hasPointerCapture(t.pointerId)&&e.currentTarget.releasePointerCapture(t.pointerId),N(),j.start()};return A?(0,t.jsx)("div",{className:b??"relative h-full w-full overflow-hidden",style:{backgroundColor:f,backgroundImage:`radial-gradient(circle at 50% 62%, ${e}66 0%, transparent 55%), radial-gradient(circle at 60% 46%, ${h}88 0%, transparent 24%), linear-gradient(to bottom, ${f}, ${d})`}}):(0,t.jsx)("div",{ref:z,className:b??"relative h-full w-full cursor-default overflow-hidden [&_canvas]:touch-none",onPointerDown:e=>{let t=R.current;t.dragging=!0,t.pointerId=e.pointerId,t.lastX=e.clientX,t.lastY=e.clientY,t.lastT=e.timeStamp,t.vYaw=0,t.vPitch=0,e.currentTarget.setPointerCapture(e.pointerId),j.start()},onPointerMove:e=>{let t=e.currentTarget.getBoundingClientRect();if(0===t.width||0===t.height)return;S.current.tx=(e.clientX-t.left)/t.width*2-1,S.current.ty=-((e.clientY-t.top)/t.height*2-1);let r=R.current;if(!r.dragging||e.pointerId!==r.pointerId)return;let a=e.clientX-r.lastX,n=e.clientY-r.lastY,o=(e.timeStamp-r.lastT)/1e3,i=.008*a,s=-(.006*n);r.yaw+=i,r.pitch=Math.max(-.55,Math.min(.2,r.pitch+s)),o>.001&&(r.vYaw=i/o,r.vPitch=s/o),r.lastX=e.clientX,r.lastY=e.clientY,r.lastT=e.timeStamp,j.start()},onPointerUp:F,onPointerLeave:N,onPointerCancel:F})});h.displayName="GridHorizon";let d=["route","machines","archive","contact"];e.s(["default",0,function({values:e,reducedMotion:r,paused:a}){return(0,t.jsxs)("div",{className:"@container relative h-full min-h-80 w-full",children:[(0,t.jsx)(h,{lineColor:e.lineColor,sunColor:e.sunColor,hazeColor:e.hazeColor,backgroundColor:e.backgroundColor,scrollSpeed:e.scrollSpeed,gridDensity:e.gridDensity,sunSize:e.sunSize,horizonGlow:e.horizonGlow,enableMouseInteraction:e.enableMouseInteraction,paused:a,reducedMotion:r}),(0,t.jsx)("nav",{"aria-label":"Hero",className:"pointer-events-auto absolute left-1/2 top-[max(10px,3cqi)] flex -translate-x-1/2 gap-[max(14px,3.2cqi)]",children:d.map(e=>(0,t.jsx)("button",{type:"button",className:"cursor-pointer font-display text-[max(9px,1.35cqi)] tracking-[0.25em] text-[#b6aecb] uppercase transition-colors duration-150 hover:text-[#f2eff8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",children:e},e))}),(0,t.jsxs)("div",{className:"pointer-events-none absolute inset-0 flex flex-col justify-end p-[max(16px,4cqi)]",children:[(0,t.jsx)("p",{className:"font-display text-[max(9px,1.4cqi)] tracking-[0.32em] text-[#7d7691] uppercase",children:"hero templates"}),(0,t.jsxs)("h2",{className:"mt-[0.6cqi] font-display text-[max(30px,6.8cqi)] leading-none tracking-tight text-[#f2eff8]",children:["NEVER",(0,t.jsx)("span",{style:{color:e.lineColor},children:"·"}),"ARRIVE"]}),(0,t.jsx)("p",{className:"mt-[1.4cqi] max-w-[46cqi] font-sans text-[max(12px,1.9cqi)] leading-snug text-[#b6aecb]",children:"A floor that streams forever, a sun that never finishes setting, and a road with no far end."}),(0,t.jsxs)("div",{className:"pointer-events-auto mt-[2cqi] flex gap-[1.6cqi]",children:[(0,t.jsx)("button",{type:"button",className:"cursor-pointer rounded-full px-[max(14px,2.4cqi)] py-[max(7px,1cqi)] font-display text-[max(10px,1.4cqi)] tracking-[0.18em] text-on-accent uppercase transition-transform duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95",style:{backgroundColor:e.lineColor},children:"start the run"}),(0,t.jsx)("button",{type:"button",className:"cursor-pointer rounded-full border border-[rgba(244,242,250,0.22)] px-[max(14px,2.4cqi)] py-[max(7px,1cqi)] font-display text-[max(10px,1.4cqi)] tracking-[0.18em] text-[#b6aecb] uppercase transition-[color,border-color,transform] duration-150 hover:border-[#f2eff8] hover:text-[#f2eff8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95",children:"read the docs"})]})]})]})}],492713)},882475,function(e){e.n(e.i(492713))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let a=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{a.current=e});let n=(0,t.useRef)(null),o=(0,t.useRef)(null),i=(0,t.useRef)(!1),s=(0,t.useRef)(!1),l=(0,t.useRef)(0),u=(0,t.useRef)(0),c=(0,t.useRef)(0),h=(0,t.useCallback)(()=>{let e=a.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=a.current.dpr??"auto",n=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:n,bufferWidth:Math.max(1,Math.round(t.width*n)),bufferHeight:Math.max(1,Math.round(t.height*n))}},[]),d=(0,t.useCallback)(function e(t){if(s.current)return;0===l.current&&(l.current=t);let o=0===u.current?0:Math.min((t-u.current)/1e3,r);u.current=t;let h={now:t,dt:o,elapsed:(t-l.current)/1e3,frame:c.current++},d=a.current.onFrame?.(h);if(!s.current){if(!1===d||a.current.halted){i.current=!1,n.current=null;return}n.current=requestAnimationFrame(e)}},[]),f=(0,t.useCallback)(()=>{s.current||i.current||(i.current=!0,u.current=0,n.current=requestAnimationFrame(d))},[d]),p=(0,t.useCallback)(()=>{i.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null)},[]),v=(0,t.useCallback)(()=>f(),[f]),m=(0,t.useCallback)(()=>{let e=h();e&&(a.current.onResize?.(e),!1!==a.current.paintWhenHalted?v():a.current.halted||f())},[h,v,f]),g=e.deps??[];(0,t.useEffect)(()=>{s.current=!1;let e=a.current.target.current;if(!e)return;let t=()=>{s.current||m()},r=new ResizeObserver(()=>{let e=a.current.resizeDebounceMs??0;e<=0?t():(null!==o.current&&clearTimeout(o.current),o.current=setTimeout(()=>{o.current=null,t()},e))});return r.observe(e),m(),a.current.halted||f(),()=>{s.current=!0,i.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null),null!==o.current&&(clearTimeout(o.current),o.current=null),r.disconnect(),a.current.onDispose?.();let e=a.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),l.current=0,u.current=0,c.current=0}},g);let x=e.halted??!1;return(0,t.useEffect)(()=>{x||f()},[x,f]),(0,t.useMemo)(()=>({start:f,stop:p,paint:v,resize:m,get running(){return i.current}}),[f,p,v,m])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);