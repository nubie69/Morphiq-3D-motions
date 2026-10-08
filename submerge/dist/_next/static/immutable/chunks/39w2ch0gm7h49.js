(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,471220,e=>{"use strict";var r=e.i(843476),t=e.i(271645),a=e.i(221663),n=e.i(956850),u=e.i(80075),o=e.i(753604),l=e.i(450922);let i=e=>{let r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return r?[parseInt(r[1],16)/255,parseInt(r[2],16)/255,parseInt(r[3],16)/255]:[1,1,1]},c=(e,r)=>{let t=i(r);e[0]=t[0],e[1]=t[1],e[2]=t[2]},s=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,f=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uIntensity;
uniform float uBands;
uniform float uWarp;
uniform float uCoverage;
uniform float uGrain;
uniform vec3 uBaseColor;
uniform vec3 uAuroraColor;
uniform vec3 uAuroraColor2;
out vec4 fragColor;

// hash / value-noise helpers
vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),dot(-1.0+2.0*hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(-1.0+2.0*hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);return 0.5+0.5*n;}
float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.0+vec2(37.1,17.7);a*=0.5;}return v;}

void main(){
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float aspect = iResolution.x / max(iResolution.y, 1.0);
  float px = (uv.x - 0.5) * aspect;   // aspect-corrected horizontal
  float vy = uv.y;                    // 0 bottom, 1 top
  float t = iTime;

  vec3 col = vec3(0.0);
  float lower = 1.0 - uCoverage;      // curtains reach down to here

  // CONSTANT bound + break so the loop stays a compile-time constant.
  for (int i = 0; i < 6; i++){
    if (float(i) >= uBands) break;
    float bf = float(i);

    // spread the band centers across the aspect-corrected field
    float slot = (bf + 0.5) / max(uBands, 1.0);
    float centerBase = (slot - 0.5) * 2.0 * aspect * 0.85;

    float freq = 1.3 + bf * 0.6;
    // wavy horizontal displacement varying with height + time -> curtains sway
    float disp = (fbm(vec2(vy * freq + t * uSpeed * 0.25, bf * 5.3)) - 0.5)
                 * uWarp * (aspect * 0.7);
    float cx = px - centerBase - disp;

    // soft vertical gaussian sheet
    float width = 0.10 + 0.06 * fbm(vec2(bf * 2.1, t * uSpeed * 0.10));
    float sheet = exp(-(cx * cx) / (2.0 * width * width));

    // top-weighted vertical falloff controlled by coverage
    float vfall = smoothstep(lower, lower + 0.35, vy)
                  * (1.0 - smoothstep(0.88, 1.02, vy));

    // intra-curtain vertical streaks (rays) scrolling in time
    float streak = fbm(vec2(cx * 9.0 + bf * 3.0, vy * 3.5 - t * uSpeed * 0.6));
    float rays = 0.55 + 0.65 * streak;

    // per-band colour blend between the two aurora hues
    float cmix = fbm(vec2(uv.x * 2.0 + bf, vy * 1.6 + t * uSpeed * 0.12));
    vec3 bandCol = mix(uAuroraColor, uAuroraColor2, clamp(cmix, 0.0, 1.0));

    float bright = sheet * vfall * rays * uIntensity;
    col += bandCol * bright;
  }

  // faint high-altitude glow toward the crown
  col += mix(uAuroraColor, uAuroraColor2, 0.5)
         * smoothstep(lower, 1.0, vy) * 0.04 * uIntensity;

  vec3 outc = uBaseColor + col;   // additive composite over the night base

  // hash-based grain
  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  outc += (g - 0.5) * uGrain;

  outc = clamp(outc, 0.0, 1.0);
  fragColor = vec4(outc, 1.0);
}
`,d=({baseColor:e="#05010a",auroraColor:d="#a855f7",auroraColor2:v="#22d3ee",speed:h=.6,intensity:m=1,bands:p=3,warp:g=1,coverage:b=.6,grain:w=.08,paused:y=!1,reducedMotion:C=!1,className:x=""})=>{let R=(0,t.useRef)(null),[A,M]=(0,t.useState)(!1),B=(0,t.useRef)({baseColor:e,auroraColor:d,auroraColor2:v,speed:h,intensity:m,bands:p,warp:g,coverage:b,grain:w,paused:y,reducedMotion:C});B.current={baseColor:e,auroraColor:d,auroraColor2:v,speed:h,intensity:m,bands:p,warp:g,coverage:b,grain:w,paused:y,reducedMotion:C};let T=(0,t.useRef)(null),F=(0,t.useRef)(null),k=(0,t.useRef)(null),E=(0,t.useRef)(null),S=(0,l.useAnimationLoop)({target:R,halted:!1,dpr:"auto",onResize:e=>k.current?.(e),onFrame:({now:e})=>!!F.current&&F.current(e),gl:()=>E.current});if((0,t.useEffect)(()=>{let r=R.current;if(!r)return;if(!document.createElement("canvas").getContext("webgl2"))return void M(!0);let t=new a.Renderer({webgl:2,alpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)}),l=t.gl;E.current=l;let y=l.canvas;y.style.width="100%",y.style.height="100%",y.style.display="block",y.style.position="absolute",y.style.top="0",y.style.left="0",r.appendChild(y);let C=new o.Triangle(l),x=new n.Program(l,{vertex:s,fragment:f,uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uSpeed:{value:h},uIntensity:{value:m},uBands:{value:p},uWarp:{value:g},uCoverage:{value:b},uGrain:{value:w},uBaseColor:{value:new Float32Array(i(e))},uAuroraColor:{value:new Float32Array(i(d))},uAuroraColor2:{value:new Float32Array(i(v))}}}),A=new u.Mesh(l,{geometry:C,program:x}),z=x.uniforms,I=0,W=B.current.paused||B.current.reducedMotion?0:1,j=performance.now(),G=!0,L=!document.hidden,O=()=>{let e=B.current;z.iTime.value=I,z.uSpeed.value=e.speed,z.uIntensity.value=e.intensity,z.uBands.value=e.bands,z.uWarp.value=e.warp,z.uCoverage.value=e.coverage,z.uGrain.value=e.grain,c(z.uBaseColor.value,e.baseColor),c(z.uAuroraColor.value,e.auroraColor),c(z.uAuroraColor2.value,e.auroraColor2)},P=()=>{O(),t.render({scene:A})};T.current=P,k.current=({width:e,height:r,dpr:a})=>{t.dpr=a,t.setSize(Math.max(1,Math.floor(e)),Math.max(1,Math.floor(r)));let n=z.iResolution.value;n[0]=l.drawingBufferWidth,n[1]=l.drawingBufferHeight,P()},F.current=e=>{let r=Math.min(.05,(e-j)/1e3);j=e;let a=B.current,n=!G||!L||a.paused||a.reducedMotion?0:1;if(W+=(n-W)*Math.min(1,4*r),0===n&&W<.001&&(W=0),(I+=r*W)>300&&(I-=300),O(),t.render({scene:A}),0===n&&0===W)return!1};let $=new IntersectionObserver(([e])=>{(G=e.isIntersecting)&&S.start()},{threshold:0});$.observe(r);let N=()=>{(L=!document.hidden)&&S.start()};return document.addEventListener("visibilitychange",N),S.resize(),S.start(),()=>{F.current=null,k.current=null,$.disconnect(),document.removeEventListener("visibilitychange",N),T.current=null;try{r.removeChild(y)}catch{}}},[]),(0,t.useEffect)(()=>{T.current?.()},[e,d,v,h,m,p,g,b,w]),(0,t.useEffect)(()=>{S.start()},[y,C,S]),A){let t={background:`radial-gradient(130% 80% at 32% -5%, ${d}cc, transparent 58%),radial-gradient(120% 75% at 68% 4%, ${v}99, transparent 55%),${e}`};return(0,r.jsx)("div",{className:`relative h-full w-full overflow-hidden ${x}`.trim(),style:t})}return(0,r.jsx)("div",{ref:R,className:`relative h-full w-full overflow-hidden ${x}`.trim()})};e.s(["default",0,function({values:e,reducedMotion:t,paused:a}){return(0,r.jsx)("div",{className:"relative h-full min-h-80 w-full",children:(0,r.jsx)(d,{baseColor:e.baseColor,auroraColor:e.auroraColor,auroraColor2:e.auroraColor2,speed:e.speed,intensity:e.intensity,bands:e.bands,warp:e.warp,coverage:e.coverage,grain:e.grain,paused:a||t,reducedMotion:t})})}],471220)},397924,function(e){e.n(e.i(471220))},450922,e=>{"use strict";var r=e.i(271645);let t=1/15;e.s(["useAnimationLoop",0,function(e){let a=(0,r.useRef)(e);(0,r.useLayoutEffect)(()=>{a.current=e});let n=(0,r.useRef)(null),u=(0,r.useRef)(null),o=(0,r.useRef)(!1),l=(0,r.useRef)(!1),i=(0,r.useRef)(0),c=(0,r.useRef)(0),s=(0,r.useRef)(0),f=(0,r.useCallback)(()=>{let e=a.current.target.current;if(!e)return null;let r=e.getBoundingClientRect(),t=a.current.dpr??"auto",n=Math.min(window.devicePixelRatio||1,"auto"===t?2:t);return{width:r.width,height:r.height,dpr:n,bufferWidth:Math.max(1,Math.round(r.width*n)),bufferHeight:Math.max(1,Math.round(r.height*n))}},[]),d=(0,r.useCallback)(function e(r){if(l.current)return;0===i.current&&(i.current=r);let u=0===c.current?0:Math.min((r-c.current)/1e3,t);c.current=r;let f={now:r,dt:u,elapsed:(r-i.current)/1e3,frame:s.current++},d=a.current.onFrame?.(f);if(!l.current){if(!1===d||a.current.halted){o.current=!1,n.current=null;return}n.current=requestAnimationFrame(e)}},[]),v=(0,r.useCallback)(()=>{l.current||o.current||(o.current=!0,c.current=0,n.current=requestAnimationFrame(d))},[d]),h=(0,r.useCallback)(()=>{o.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null)},[]),m=(0,r.useCallback)(()=>v(),[v]),p=(0,r.useCallback)(()=>{let e=f();e&&(a.current.onResize?.(e),!1!==a.current.paintWhenHalted?m():a.current.halted||v())},[f,m,v]),g=e.deps??[];(0,r.useEffect)(()=>{l.current=!1;let e=a.current.target.current;if(!e)return;let r=()=>{l.current||p()},t=new ResizeObserver(()=>{let e=a.current.resizeDebounceMs??0;e<=0?r():(null!==u.current&&clearTimeout(u.current),u.current=setTimeout(()=>{u.current=null,r()},e))});return t.observe(e),p(),a.current.halted||v(),()=>{l.current=!0,o.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null),null!==u.current&&(clearTimeout(u.current),u.current=null),t.disconnect(),a.current.onDispose?.();let e=a.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),i.current=0,c.current=0,s.current=0}},g);let b=e.halted??!1;return(0,r.useEffect)(()=>{b||v()},[b,v]),(0,r.useMemo)(()=>({start:v,stop:h,paint:m,resize:p,get running(){return o.current}}),[v,h,m,p])}])},753604,e=>{"use strict";var r=e.i(994964);class t extends r.Geometry{constructor(e,{attributes:r={}}={}){Object.assign(r,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,r)}}e.s(["Triangle",0,t])}]);