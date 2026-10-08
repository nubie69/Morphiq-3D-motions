(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,259534,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(221663),o=e.i(956850),n=e.i(80075),l=e.i(753604),i=e.i(450922);let u=e=>{let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[1,1,1]},s=(e,t)=>{let r=u(t);e[0]=r[0],e[1]=r[1],e[2]=r[2]},c=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,d=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uWarp;
uniform float uDetail;
uniform float uShimmer;
uniform float uHeight;
uniform float uWidth;
uniform float uGrain;
uniform vec3 uCoreColor;
uniform vec3 uFlameColor;
uniform vec3 uBgColor;
out vec4 fragColor;

vec2 hash(vec2 p){
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  float n = mix(
    mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y);
  return 0.5 + 0.5 * n;
}
// CONSTANT bound + break keeps the octave loop a compile-time constant while
// still honouring the live "detail" control (1..6 octaves).
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++){
    if (float(i) >= uDetail) break;
    v += a * noise(p);
    p = p * 2.0 + vec2(37.1, 17.7);
    a *= 0.5;
  }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float aspect = iResolution.x / max(iResolution.y, 1.0);
  float t = iTime;
  float vy = uv.y;                      // 0 bottom, 1 top

  // Heat shimmer: horizontally offset the sample point, stronger higher up.
  float shim = sin(vy * 22.0 - t * uSpeed * 1.5) * uShimmer * 0.03 * vy;
  vec2 p = vec2((uv.x - 0.5) * aspect + shim, vy);

  // Flame field scrolls upward over time. Sampled anisotropically — high
  // frequency across x, stretched along y — because fire is vertically
  // elongated. An isotropic field reads as round puffs of fog, and the extra
  // cells across the width are what separate the body into distinct tongues.
  vec2 fp = vec2(p.x * 4.6, p.y * 2.2 - t * uSpeed * 1.3);

  // Domain warp — the signature swirling licks of flame.
  vec2 warped = fp + uWarp * vec2(
    fbm(fp + vec2(0.0, t * uSpeed * 0.6)),
    fbm(fp + vec2(7.0, t * uSpeed * 0.6 + 7.0))
  );
  float density = fbm(warped);

  // Vertical taper: dense at the base, fading out by uHeight.
  float taper = 1.0 - smoothstep(0.0, uHeight, vy);
  // Base intake so the flame roots solidly at the very bottom.
  taper = max(taper, (1.0 - smoothstep(0.0, 0.12, vy)) * 0.9);

  // Horizontal envelope — a broad base narrowing into a licking tip.
  float wide = mix(0.62, 0.06, smoothstep(0.0, uHeight, vy)) * uWidth;
  float horiz = 1.0 - smoothstep(wide * 0.55, wide, abs(p.x));

  // Carve tongues out of the noise before shaping it. fbm returns a soft field
  // centred near 0.5; with no contrast window every value survives into the
  // colour ramp and the flame reads as haze with no edges.
  float body = smoothstep(0.33, 0.63, density);

  float flame = clamp(body * taper * horiz, 0.0, 1.0);
  flame = pow(flame, 1.1);

  // Colour ramp: background -> dark flame body -> amethyst core near the base.
  vec3 col = uBgColor;
  col = mix(col, uFlameColor, smoothstep(0.12, 0.55, flame));
  // Amethyst self-illumination so the dark flame reads as light against the void,
  // not black-on-black — the whole lick glows, the core just burns brightest.
  col += uCoreColor * pow(flame, 1.6) * 0.32;

  // Amethyst core: only the hottest density, weighted toward the base.
  float baseWeight = 1.0 - smoothstep(uHeight * 0.35, uHeight * 0.95, vy);
  float coreMask = smoothstep(0.45, 0.9, flame) * baseWeight;
  col = mix(col, uCoreColor, coreMask);
  // Soft additive bloom so the core reads as emitted light, not a flat fill.
  col += uCoreColor * pow(coreMask, 2.0) * 0.35;

  // Film grain — animated hash keyed off the pixel and fractional time.
  float g = fract(sin(dot(gl_FragCoord.xy + fract(iTime), vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * uGrain;

  col = clamp(col, 0.0, 1.0);
  fragColor = vec4(col, 1.0);
}
`,h=({coreColor:e="#a855f7",flameColor:h="#630475",backgroundColor:f="#05010a",speed:m=.6,warp:p=1,detail:v=4,shimmer:g=.5,height:y=.95,grain:b=.05,flameWidth:w=1.6,sparkCount:C=60,sparkSize:x=1.2,sparkSpeed:M=1,paused:k=!1,reducedMotion:R=!1,className:S=""})=>{let A=(0,r.useRef)(null),F=(0,r.useRef)(null),[z,W]=(0,r.useState)(!1),T=(0,r.useRef)({coreColor:e,flameColor:h,backgroundColor:f,speed:m,warp:p,detail:v,shimmer:g,height:y,grain:b,flameWidth:w,sparkCount:C,sparkSize:x,sparkSpeed:M,paused:k,reducedMotion:R});T.current={coreColor:e,flameColor:h,backgroundColor:f,speed:m,warp:p,detail:v,shimmer:g,height:y,grain:b,flameWidth:w,sparkCount:C,sparkSize:x,sparkSpeed:M,paused:k,reducedMotion:R};let $=(0,r.useRef)(null),E=(0,r.useRef)(null),H=(0,r.useRef)(null),B=(0,r.useRef)(null),I=(0,i.useAnimationLoop)({target:A,halted:!1,dpr:"auto",onResize:e=>H.current?.(e),onFrame:({dt:e})=>!!E.current&&E.current(e),gl:()=>B.current});if((0,r.useEffect)(()=>{let t,r=A.current;if(!r)return;if(!document.createElement("canvas").getContext("webgl2"))return void W(!0);try{t=new a.Renderer({webgl:2,alpha:!1,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)})}catch{W(!0);return}let i=t.gl,C=i.canvas;C.style.width="100%",C.style.height="100%",C.style.display="block",C.style.position="absolute",C.style.top="0",C.style.left="0",r.appendChild(C);let x=new l.Triangle(i),M=new o.Program(i,{vertex:c,fragment:d,uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uSpeed:{value:m},uWarp:{value:p},uDetail:{value:v},uShimmer:{value:g},uHeight:{value:y},uWidth:{value:w},uGrain:{value:b},uCoreColor:{value:new Float32Array(u(e))},uFlameColor:{value:new Float32Array(u(h))},uBgColor:{value:new Float32Array(u(f))}}}),k=new n.Mesh(i,{geometry:x,program:M}),R=M.uniforms,S=F.current,z=S?S.getContext("2d"):null,P=Math.min(window.devicePixelRatio||1,2),L=0,j=0,D=[],G=null,O="",_=e=>{let t=T.current,r=.3*L*t.flameWidth,a={x:L/2+(Math.random()+Math.random()-1)*r,y:j*(1-(.45+(2*Math.random()-1)*.14)),vy:.5+1.2*Math.random(),sway:Math.random()*Math.PI*2,size:t.sparkSize*(.35+Math.random()*Math.random()*1.9),life:e?0:Math.random(),maxLife:70+110*Math.random(),seed:Math.random()*Math.PI*2};return e||(a.y-=Math.random()*j*.35),a},N=(e,t)=>{if(!z)return;z.clearRect(0,0,L,j);let r=Math.max(0,Math.round(T.current.sparkCount));if(D.length>r)D.length=r;else for(;D.length<r;)D.push(_(!1));if(0===D.length)return;let a=T.current,o=a.sparkSpeed*t,n=a.coreColor;if(n!==O&&(G=function(e){let t=document.createElement("canvas");t.width=32,t.height=32;let r=t.getContext("2d");if(!r)return t;let[a,o,n]=u(e),l=e=>Math.round(255*e),i=e=>Math.round((e+(1-e)*.6)*255),s=`${l(a)},${l(o)},${l(n)}`,c=r.createRadialGradient(16,16,0,16,16,16);return c.addColorStop(0,`rgb(${i(a)},${i(o)},${i(n)})`),c.addColorStop(.22,`rgba(${s},1)`),c.addColorStop(.5,`rgba(${s},0.55)`),c.addColorStop(1,`rgba(${s},0)`),r.fillStyle=c,r.fillRect(0,0,32,32),t}(n),O=n),!G)return;let l=Math.min(3,60*e);z.globalCompositeOperation="lighter";for(let e=0;e<D.length;e++){let r=D[e];if(r.y-=r.vy*o*1.4*l,r.x+=.6*Math.sin(r.sway+.03*r.y)*o*l,r.life+=1/r.maxLife*(.4+t)*l,r.y<-6||r.life>=1){D[e]=_(!0);continue}let a=Math.min(1,9*r.life)*Math.max(0,1-Math.max(0,r.life-.4)/.6)*(.55+.45*Math.sin(r.seed+.2*r.y))*(.45+.55*t);if(a<=.01)continue;let n=(r.size*(1-.35*r.life)+.5)*1.9;z.globalAlpha=Math.min(1,a),z.drawImage(G,r.x-n,r.y-n,2*n,2*n)}z.globalAlpha=1},q=0,K=T.current.paused||T.current.reducedMotion?0:1,U=!0,V=!document.hidden,J=()=>{let e=T.current;R.iTime.value=q,R.uSpeed.value=e.speed,R.uWarp.value=e.warp,R.uDetail.value=e.detail,R.uShimmer.value=e.shimmer,R.uHeight.value=e.height,R.uWidth.value=e.flameWidth,R.uGrain.value=e.grain,s(R.uCoreColor.value,e.coreColor),s(R.uFlameColor.value,e.flameColor),s(R.uBgColor.value,e.backgroundColor)},Q=()=>{J(),t.render({scene:k}),N(0,K)};$.current=Q,B.current=i,H.current=({width:e,height:r,dpr:a})=>{let o=Math.max(1,Math.floor(e)),n=Math.max(1,Math.floor(r));if(0===o||0===n)return;t.dpr=a,t.setSize(o,n);let l=R.iResolution.value;l[0]=i.drawingBufferWidth,l[1]=i.drawingBufferHeight,S&&z&&(S.width=Math.floor(o*P),S.height=Math.floor(n*P),L=o,j=n,z.setTransform(P,0,0,P,0,0)),Q()},E.current=e=>{let r=T.current,a=!U||!V||r.paused||r.reducedMotion?0:1;if(K+=(a-K)*Math.min(1,4*e),0===a&&K<.001&&(K=0),(q+=e*K)>300&&(q-=300),J(),t.render({scene:k}),N(e,K),0===a&&0===K)return!1};let X=new IntersectionObserver(([e])=>{(U=e.isIntersecting)&&I.start()},{threshold:0});X.observe(r);let Y=()=>{(V=!document.hidden)&&I.start()};return document.addEventListener("visibilitychange",Y),I.resize(),I.start(),()=>{E.current=null,H.current=null,X.disconnect(),document.removeEventListener("visibilitychange",Y),$.current=null,G=null;try{r.removeChild(C)}catch{}}},[]),(0,r.useEffect)(()=>{$.current?.()},[e,h,f,m,p,v,g,y,b,w,C,x,M]),(0,r.useEffect)(()=>{I.start()},[k,R,I]),z){let r={background:`radial-gradient(60% 55% at 50% 108%, ${e}dd, transparent 60%),radial-gradient(85% 70% at 50% 118%, ${h}cc, transparent 62%),${f}`};return(0,t.jsx)("div",{className:`relative h-full w-full overflow-hidden ${S}`.trim(),style:r})}return(0,t.jsx)("div",{ref:A,className:`relative h-full w-full overflow-hidden ${S}`.trim(),children:(0,t.jsx)("canvas",{ref:F,style:{position:"absolute",inset:0,width:"100%",height:"100%",zIndex:2,pointerEvents:"none"}})})};e.s(["default",0,function({values:e,reducedMotion:r,paused:a}){return(0,t.jsx)(h,{coreColor:e.coreColor,flameColor:e.flameColor,backgroundColor:e.backgroundColor,speed:e.speed,warp:e.warp,detail:e.detail,shimmer:e.shimmer,height:e.height,grain:e.grain,flameWidth:e.flameWidth,sparkCount:e.sparkCount,sparkSize:e.sparkSize,sparkSpeed:e.sparkSpeed,paused:a||r,reducedMotion:r})}],259534)},981432,function(e){e.n(e.i(259534))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let a=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{a.current=e});let o=(0,t.useRef)(null),n=(0,t.useRef)(null),l=(0,t.useRef)(!1),i=(0,t.useRef)(!1),u=(0,t.useRef)(0),s=(0,t.useRef)(0),c=(0,t.useRef)(0),d=(0,t.useCallback)(()=>{let e=a.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=a.current.dpr??"auto",o=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:o,bufferWidth:Math.max(1,Math.round(t.width*o)),bufferHeight:Math.max(1,Math.round(t.height*o))}},[]),h=(0,t.useCallback)(function e(t){if(i.current)return;0===u.current&&(u.current=t);let n=0===s.current?0:Math.min((t-s.current)/1e3,r);s.current=t;let d={now:t,dt:n,elapsed:(t-u.current)/1e3,frame:c.current++},h=a.current.onFrame?.(d);if(!i.current){if(!1===h||a.current.halted){l.current=!1,o.current=null;return}o.current=requestAnimationFrame(e)}},[]),f=(0,t.useCallback)(()=>{i.current||l.current||(l.current=!0,s.current=0,o.current=requestAnimationFrame(h))},[h]),m=(0,t.useCallback)(()=>{l.current=!1,null!==o.current&&(cancelAnimationFrame(o.current),o.current=null)},[]),p=(0,t.useCallback)(()=>f(),[f]),v=(0,t.useCallback)(()=>{let e=d();e&&(a.current.onResize?.(e),!1!==a.current.paintWhenHalted?p():a.current.halted||f())},[d,p,f]),g=e.deps??[];(0,t.useEffect)(()=>{i.current=!1;let e=a.current.target.current;if(!e)return;let t=()=>{i.current||v()},r=new ResizeObserver(()=>{let e=a.current.resizeDebounceMs??0;e<=0?t():(null!==n.current&&clearTimeout(n.current),n.current=setTimeout(()=>{n.current=null,t()},e))});return r.observe(e),v(),a.current.halted||f(),()=>{i.current=!0,l.current=!1,null!==o.current&&(cancelAnimationFrame(o.current),o.current=null),null!==n.current&&(clearTimeout(n.current),n.current=null),r.disconnect(),a.current.onDispose?.();let e=a.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),u.current=0,s.current=0,c.current=0}},g);let y=e.halted??!1;return(0,t.useEffect)(()=>{y||f()},[y,f]),(0,t.useMemo)(()=>({start:f,stop:m,paint:p,resize:v,get running(){return l.current}}),[f,m,p,v])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);