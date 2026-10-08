(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,357223,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(221663),n=e.i(956850),o=e.i(80075),l=e.i(994964),u=e.i(753604),i=e.i(450922);let c={150:150,300:300,400:400,700:700},s=e=>{let t=e.replace("#",""),r=3===t.length?t.split("").map(e=>e+e).join(""):t,a=parseInt(r,16);return Number.isNaN(a)||6!==r.length?[1,1,1]:[(a>>16&255)/255,(a>>8&255)/255,(255&a)/255]},d=`#version 300 es
in vec4 aPoint;
in vec2 aCorner;
uniform float uDist;
uniform float uSpeed;
uniform float uStreak;
uniform float uZoom;
uniform float uAspect;
uniform float uPx;
uniform float uRoll;
uniform vec2 uSteer;
uniform vec2 uPointer;
out float vFade;
out float vFast;
out float vAlong;
out float vSide;
out float vBright;

vec2 project(vec2 p, float z) {
  // Isotropic screen units (height = 2); x is divided by aspect at the end,
  // after the width has been applied, so a streak's thickness is the same on
  // screen whichever way it points.
  float persp = 1.0 / max(z, 0.05);
  return p * persp * 1.6 * uZoom;
}

void main() {
  // Depth cycles 0 (far) -> 1 (near). fract() IS the recycle.
  float depth = fract(aPoint.z + uDist * aPoint.w);
  float zNear = 0.55;
  float zFar = 13.0;
  float z = mix(zFar, zNear, depth);

  // Tail lags the head by an amount that GROWS as the star approaches: closer
  // stars have more apparent velocity, so longer tails are what sell the
  // acceleration.
  float len = uStreak * (0.3 + depth * 1.6);

  vec2 p = aPoint.xy;

  // Steering: the whole tunnel shears opposite the pointer, scaled by depth,
  // so distant streaks converge on the cursor exactly like a camera yawing.
  p -= uPointer * depth * 1.15;

  // Bank rolls the frame about the view axis.
  float cr = cos(uRoll), sr = sin(uRoll);
  p = vec2(p.x * cr - p.y * sr, p.x * sr + p.y * cr);

  vec2 head = project(p, z);
  vec2 tail = project(p, z + len);
  vec2 dir = head - tail;
  float L = length(dir);
  dir = L > 1e-5 ? dir / L : vec2(0.0, 1.0);
  vec2 nrm = vec2(-dir.y, dir.x);

  // Width: a thread far away, a bar up close — but never under a pixel and a
  // half, or the far field aliases into dust.
  float w = max(uPx * 1.5, 0.003 + depth * depth * 0.024);
  vec2 pos = mix(head, tail, aCorner.x) + nrm * aCorner.y * w * 0.5;
  pos.x /= uAspect;
  pos += uSteer * 0.22;
  gl_Position = vec4(pos, 0.0, 1.0);

  vAlong = aCorner.x;
  vSide = aCorner.y;

  // Alpha ramps hide both ends of the cycle: birth pops otherwise, and the
  // fly-past clip at the near plane otherwise reads as a glitch.
  float born = smoothstep(0.0, 0.10, depth);
  float died = 1.0 - smoothstep(0.86, 1.0, depth);
  vFade = born * died;
  // Far stars are dim; each star also carries its own magnitude so the field
  // is not seven hundred identical bulbs.
  float mag = fract(sin(aPoint.z * 91.7 + aPoint.x * 13.3) * 43758.5453);
  vBright = mix(0.3, 1.0, depth) * (0.55 + 0.45 * mag);
  // Velocity readout: only stars genuinely running hot earn the accent.
  vFast = clamp((uSpeed * aPoint.w - 0.95) * 1.4, 0.0, 1.0);
}`,h=`#version 300 es
precision highp float;
in float vFade;
in float vFast;
in float vAlong;
in float vSide;
in float vBright;
out vec4 fragColor;
uniform vec3 uStreakCol;
uniform vec3 uAccent;
void main() {
  // Across: soft edges, a hot core. Along: head bright, tail dying. The core
  // goes toward white — a bright enough light source burns out its own hue.
  float across = 1.0 - vSide * vSide;
  float along = pow(1.0 - vAlong, 1.6);
  float core = pow(across, 4.0) * (1.0 - vAlong);
  vec3 col = mix(uStreakCol, uAccent, vFast);
  col = mix(col, vec3(1.0), core * 0.55);
  float a = min(1.0, across * across * along * vFade * vBright * 1.5);
  fragColor = vec4(col, a);
}`,f=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`,p=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec3 uBg;
uniform vec3 uStreakCol;
uniform vec3 uAccent;
uniform vec2 uCenter;
uniform float uAspect;
uniform float uGlow;
uniform float uFlow;

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

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  vec2 d = (uv - uCenter) * vec2(uAspect, 1.0);
  float r = length(d);
  vec3 col = uBg;

  // Nebula in polar coordinates, log-radial so it streams OUT of the
  // vanishing point at the same perspective rate as the stars — the tunnel
  // wall going by, not a texture pasted on the glass.
  float ang = atan(d.y, d.x);
  vec2 nq = vec2(ang * 1.6, log(r + 0.04) * 2.2 - uFlow);
  float neb = vnoise(nq) * 0.6 + vnoise(nq * 2.3 + 7.1) * 0.4;
  neb = smoothstep(0.35, 0.95, neb) * smoothstep(0.0, 0.45, r);
  col += mix(uAccent, uStreakCol, 0.5) * neb * 0.07 * uGlow;

  // Bloom at the vanishing point: a tight core and a wide skirt.
  float core = exp(-r * r * 60.0) * 0.6 + exp(-r * 5.0) * 0.1;
  col += mix(uStreakCol, uAccent, 0.45) * core * uGlow;

  // Vignette: the cockpit frame the eye expects at the edges of a run.
  col *= 1.0 - 0.3 * smoothstep(0.6, 1.5, length(uv * vec2(uAspect, 1.0)));

  // Dither: eight-bit output bands a dark bloom into rings.
  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  fragColor = vec4(col, 1.0);
}`,v=(0,r.memo)(({density:e="700",streakColor:v="#e9d5ff",accentColor:m="#67e8f9",backgroundColor:g="#030308",speed:x=.2,streakLength:b=.1,steer:y=.6,rollOnDrag:w=!0,paused:C=!1,reducedMotion:A=!1,className:k})=>{let F=(0,r.useRef)(null),M=(0,r.useRef)(null),P=(0,r.useRef)(null),R=(0,r.useRef)(null),S=(0,r.useRef)({value:0,dragging:!1,lastX:0}),q=(0,r.useRef)({x:0,y:0,tx:0,ty:0}),[j,z]=(0,r.useState)(!1),N=(0,r.useRef)(C);N.current=C;let T=(0,i.useAnimationLoop)({target:F,halted:C,dpr:"auto",onResize:e=>P.current?.(e),onFrame:({dt:e})=>!!M.current&&M.current(e),gl:()=>R.current}),B=(0,r.useRef)({streakColor:v,accentColor:m,backgroundColor:g,speed:x,streakLength:b,steer:y,rollOnDrag:w,reducedMotion:A});B.current={streakColor:v,accentColor:m,backgroundColor:g,speed:x,streakLength:b,steer:y,rollOnDrag:w,reducedMotion:A},(0,r.useEffect)(()=>{let t,r=F.current;if(j||!r)return;try{t=new a.Renderer({alpha:!1,dpr:Math.min(window.devicePixelRatio||1,2)})}catch{z(!0);return}let i=t.gl;R.current=i;let y=i.canvas;y.style.display="block",y.style.position="absolute",y.style.top="0",y.style.left="0",r.appendChild(y);let{aPoint:w,aCorner:C,index:A}=function(e){let t=new Float32Array(4*e*4),r=new Float32Array(4*e*2),a=new Uint16Array(6*e);for(let n=0;n<e;n++){let e=Math.random()*Math.PI*2,o=.18+1.5*Math.sqrt(Math.random()),l=Math.cos(e)*o,u=Math.sin(e)*o,i=Math.random(),c=.7+.1*Math.round(6*Math.random());for(let e=0;e<4;e++){let a=(4*n+e)*4;t[a]=l,t[a+1]=u,t[a+2]=i,t[a+3]=c,r[(4*n+e)*2]=e>>1,r[(4*n+e)*2+1]=(1&e)*2-1}let s=4*n,d=6*n;a[d]=s,a[d+1]=s+1,a[d+2]=s+2,a[d+3]=s+2,a[d+4]=s+1,a[d+5]=s+3}return{aPoint:t,aCorner:r,index:a}}(c[e]??400),k=new l.Geometry(i,{aPoint:{size:4,data:w},aCorner:{size:2,data:C},index:{data:A}}),D=new n.Program(i,{vertex:d,fragment:h,transparent:!0,cullFace:!1,depthTest:!1,depthWrite:!1,uniforms:{uStreakCol:{value:new Float32Array(s(v))},uAccent:{value:new Float32Array(s(m))},uDist:{value:0},uSpeed:{value:x},uStreak:{value:b},uZoom:{value:1},uAspect:{value:1},uPx:{value:2/600},uRoll:{value:0},uSteer:{value:new Float32Array([0,0])},uPointer:{value:new Float32Array([0,0])}}});D.setBlendFunc(i.SRC_ALPHA,i.ONE);let L=new o.Mesh(i,{geometry:k,program:D}),O=D.uniforms,U=new n.Program(i,{vertex:f,fragment:p,cullFace:!1,depthTest:!1,depthWrite:!1,uniforms:{uBg:{value:new Float32Array(s(g))},uStreakCol:{value:new Float32Array(s(v))},uAccent:{value:new Float32Array(s(m))},uCenter:{value:new Float32Array([0,0])},uAspect:{value:1},uGlow:{value:1},uFlow:{value:0}}}),G=new o.Mesh(i,{geometry:new u.Triangle(i),program:U}),E=U.uniforms,I=0,W=0;return M.current=e=>{let r=B.current,a=Math.min(e,1/30);if(!(N.current||r.reducedMotion)){I=(I+a*r.speed*.09)%10,W=(W+a*r.speed*.35)%1e3,S.current.dragging||(S.current.value*=Math.pow(.02,a));let e=Math.min(1,4.5*a);q.current.x+=(q.current.tx-q.current.x)*e,q.current.y+=(q.current.ty-q.current.y)*e}let n=r.reducedMotion?0:r.steer,o=q.current.x*n,l=q.current.y*n;O.uStreakCol.value.set(s(r.streakColor)),O.uAccent.value.set(s(r.accentColor)),O.uDist.value=I,O.uSpeed.value=r.speed,O.uStreak.value=r.streakLength,O.uRoll.value=r.rollOnDrag?S.current.value:0;let u=O.uSteer.value;u[0]=o,u[1]=l;let c=O.uPointer.value;c[0]=o,c[1]=l,E.uBg.value.set(s(r.backgroundColor)),E.uStreakCol.value.set(s(r.streakColor)),E.uAccent.value.set(s(r.accentColor));let d=E.uCenter.value;d[0]=.22*o,d[1]=.22*l,E.uGlow.value=Math.min(1.6,.6+.4*r.speed),E.uFlow.value=W;let h=s(r.backgroundColor);i.clearColor(h[0],h[1],h[2],1),t.render({scene:G}),t.render({scene:L,clear:!1})},P.current=({width:e,height:r,dpr:a})=>{t.dpr=a,t.setSize(Math.max(1,Math.floor(e)),Math.max(1,Math.floor(r)));let n=Math.max(e,1)/Math.max(r,1);O.uAspect.value=n,E.uAspect.value=n,O.uPx.value=2/Math.max(r*a,1),M.current?.(.016)},T.resize(),T.start(),()=>{M.current=null,P.current=null,r.contains(y)&&r.removeChild(y)}},[j,e]),(0,r.useEffect)(()=>{T.paint()},[v,m,g,x,b,y,w,T]);let D=e=>{e.currentTarget.hasPointerCapture(e.pointerId)&&e.currentTarget.releasePointerCapture(e.pointerId),S.current.dragging=!1,T.start()};return j?(0,t.jsx)("div",{className:k??"relative h-full w-full overflow-hidden",style:{backgroundColor:g,backgroundImage:`radial-gradient(circle at 50% 50%, ${m}33 0%, transparent 40%), radial-gradient(circle at 50% 50%, ${v}22 0%, transparent 70%)`}}):(0,t.jsx)("div",{ref:F,className:k??"relative h-full w-full cursor-default overflow-hidden [&_canvas]:touch-none select-none",onPointerDown:e=>{S.current.dragging=!0,S.current.lastX=e.clientX,e.currentTarget.setPointerCapture(e.pointerId),T.start()},onPointerMove:e=>{let t=e.currentTarget.getBoundingClientRect();if(0===t.width||0===t.height||(q.current.tx=(e.clientX-t.left)/t.width*2-1,q.current.ty=-((e.clientY-t.top)/t.height*2-1),!S.current.dragging))return;let r=e.clientX-S.current.lastX;S.current.lastX=e.clientX,B.current.rollOnDrag&&!N.current&&(S.current.value=Math.max(-.55,Math.min(.55,S.current.value-.003*r))),T.start()},onPointerUp:D,onPointerLeave:()=>{S.current.dragging||(q.current.tx=0,q.current.ty=0,T.start())},onPointerCancel:D})});v.displayName="WarpRun";let m=["fleet","routes","archive","contact"];e.s(["default",0,function({values:e,reducedMotion:r,paused:a}){return(0,t.jsxs)("div",{className:"@container relative h-full min-h-80 w-full",children:[(0,t.jsx)(v,{density:e.density,streakColor:e.streakColor,accentColor:e.accentColor,backgroundColor:e.backgroundColor,speed:e.speed,streakLength:e.streakLength,steer:e.steer,rollOnDrag:e.rollOnDrag,paused:a,reducedMotion:r}),(0,t.jsx)("nav",{"aria-label":"Hero",className:"pointer-events-auto absolute left-1/2 top-[max(10px,3cqi)] flex -translate-x-1/2 gap-[max(14px,3.2cqi)]",children:m.map(e=>(0,t.jsx)("button",{type:"button",className:"cursor-pointer font-display text-[max(9px,1.35cqi)] tracking-[0.25em] text-[#b6aecb] uppercase transition-colors duration-150 hover:text-[#f2eff8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",children:e},e))}),(0,t.jsxs)("div",{className:"pointer-events-none absolute inset-0 flex flex-col justify-end p-[max(16px,4cqi)]",children:[(0,t.jsx)("p",{className:"font-display text-[max(9px,1.4cqi)] tracking-[0.32em] text-[#7d7691] uppercase",children:"hero templates"}),(0,t.jsxs)("h2",{className:"mt-[0.6cqi] font-display text-[max(30px,6.8cqi)] leading-none tracking-tight text-[#f2eff8]",children:["PUNCH",(0,t.jsx)("span",{style:{color:e.accentColor},children:"·"}),"THROUGH"]}),(0,t.jsx)("p",{className:"mt-[1.4cqi] max-w-[46cqi] font-sans text-[max(12px,1.9cqi)] leading-snug text-[#b6aecb]",children:"Every star a line, every line a second you did not spend getting there."}),(0,t.jsxs)("div",{className:"pointer-events-auto mt-[2cqi] flex gap-[1.6cqi]",children:[(0,t.jsx)("button",{type:"button",className:"cursor-pointer rounded-full px-[max(14px,2.4cqi)] py-[max(7px,1cqi)] font-display text-[max(10px,1.4cqi)] tracking-[0.18em] text-[#06060c] uppercase transition-transform duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95",style:{backgroundColor:e.accentColor},children:"engage"}),(0,t.jsx)("button",{type:"button",className:"cursor-pointer rounded-full border border-[rgba(244,242,250,0.22)] px-[max(14px,2.4cqi)] py-[max(7px,1cqi)] font-display text-[max(10px,1.4cqi)] tracking-[0.18em] text-[#b6aecb] uppercase transition-[color,border-color,transform] duration-150 hover:border-[#f2eff8] hover:text-[#f2eff8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95",children:"read the docs"})]})]})]})}],357223)},128433,function(e){e.n(e.i(357223))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let a=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{a.current=e});let n=(0,t.useRef)(null),o=(0,t.useRef)(null),l=(0,t.useRef)(!1),u=(0,t.useRef)(!1),i=(0,t.useRef)(0),c=(0,t.useRef)(0),s=(0,t.useRef)(0),d=(0,t.useCallback)(()=>{let e=a.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=a.current.dpr??"auto",n=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:n,bufferWidth:Math.max(1,Math.round(t.width*n)),bufferHeight:Math.max(1,Math.round(t.height*n))}},[]),h=(0,t.useCallback)(function e(t){if(u.current)return;0===i.current&&(i.current=t);let o=0===c.current?0:Math.min((t-c.current)/1e3,r);c.current=t;let d={now:t,dt:o,elapsed:(t-i.current)/1e3,frame:s.current++},h=a.current.onFrame?.(d);if(!u.current){if(!1===h||a.current.halted){l.current=!1,n.current=null;return}n.current=requestAnimationFrame(e)}},[]),f=(0,t.useCallback)(()=>{u.current||l.current||(l.current=!0,c.current=0,n.current=requestAnimationFrame(h))},[h]),p=(0,t.useCallback)(()=>{l.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null)},[]),v=(0,t.useCallback)(()=>f(),[f]),m=(0,t.useCallback)(()=>{let e=d();e&&(a.current.onResize?.(e),!1!==a.current.paintWhenHalted?v():a.current.halted||f())},[d,v,f]),g=e.deps??[];(0,t.useEffect)(()=>{u.current=!1;let e=a.current.target.current;if(!e)return;let t=()=>{u.current||m()},r=new ResizeObserver(()=>{let e=a.current.resizeDebounceMs??0;e<=0?t():(null!==o.current&&clearTimeout(o.current),o.current=setTimeout(()=>{o.current=null,t()},e))});return r.observe(e),m(),a.current.halted||f(),()=>{u.current=!0,l.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null),null!==o.current&&(clearTimeout(o.current),o.current=null),r.disconnect(),a.current.onDispose?.();let e=a.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),i.current=0,c.current=0,s.current=0}},g);let x=e.halted??!1;return(0,t.useEffect)(()=>{x||f()},[x,f]),(0,t.useMemo)(()=>({start:f,stop:p,paint:v,resize:m,get running(){return l.current}}),[f,p,v,m])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);