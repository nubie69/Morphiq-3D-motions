(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,637944,e=>{"use strict";var t=e.i(843476),r=e.i(271645),n=e.i(221663),u=e.i(956850),o=e.i(80075),i=e.i(753604),l=e.i(11308),a=e.i(450922);function s(e){let t=e.replace("#","").trim();if(3===t.length&&(t=t.split("").map(e=>e+e).join("")),6!==t.length)return[1,1,1];let r=parseInt(t,16);return Number.isNaN(r)?[1,1,1]:[(r>>16&255)/255,(r>>8&255)/255,(255&r)/255]}let c=[[.34,.2],[.24,.3],[.17,.24],[.3,.15],[.21,.32],[.13,.19],[.27,.23],[.19,.13],[.23,.28]],f=[[1,2],[2,1],[1,1],[3,2],[2,3],[1,3],[3,1],[2,2],[1,2]],d=[0,.9,2.1,3.3,4.2,5.1,.6,1.7,2.8],m=[.15,.12,.1,.13,.11,.09,.12,.09,.11],h=`
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`,v=`
precision highp float;

uniform vec2 uResolution;
uniform vec3 uBlobs[9];
uniform float uBlobCount;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform float uCohesion;
uniform float uSpikes;
uniform float uSpikeFrequency;
uniform float uMagnetRadius;
uniform float uSheen;
uniform vec3 uFluidColor;
uniform vec3 uAccentColor;

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);

  float field = 0.0;
  vec2 grad = vec2(0.0);
  for (int i = 0; i < 9; i++) {
    if (float(i) >= uBlobCount) break;
    vec3 b = uBlobs[i];
    vec2 d = p - b.xy;
    float d2 = max(dot(d, d), 1e-5);
    float f = (b.z * b.z) / d2;
    field += f;
    grad += (-2.0 * f / d2) * d;
  }

  vec2 md = p - uMouse;
  float md2 = max(dot(md, md), 1e-5);
  float mf = uMouseActive * 0.0144 / md2;
  field += mf;
  grad += (-2.0 * mf / md2) * md;

  float mdist = sqrt(md2);
  float infl = uMouseActive * (1.0 - smoothstep(0.0, uMagnetRadius, mdist));
  float theta = atan(md.y, md.x);
  float crown = pow(abs(cos(theta * uSpikeFrequency * 0.5)), 6.0);
  field += uSpikes * infl * crown * 1.4;

  float iso = 1.0;
  float w = uCohesion;
  float body = smoothstep(iso - w * 0.5, iso + w * 0.5, field);
  if (body < 0.003) discard;

  float rim = body * (1.0 - smoothstep(iso, iso + w * 1.6, field));

  vec3 n = normalize(vec3(-grad * 0.08, 1.0));
  vec3 lightDir = normalize(vec3(-0.42, 0.58, 0.7));
  vec3 halfway = normalize(lightDir + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, halfway), 0.0), 30.0) * uSheen;
  float grazing = max(dot(n, lightDir), 0.0) * 0.12;

  vec3 color = uFluidColor
    + vec3(grazing)
    + uAccentColor * (spec * 1.1 + rim * 0.55 + infl * crown * body * 0.3);

  float alpha = body;
  gl_FragColor = vec4(color * alpha, alpha);
}
`,g=({blobs:e=5,speed:g=1,cohesion:p=.35,spikes:b=.7,spikeFrequency:C=14,magnetRadius:w=.35,sheen:y=.6,fluidColor:x="#17121f",accentColor:R="#c4b5fd",paused:M=!1,reducedMotion:A=!1,className:F=""})=>{let k=(0,r.useRef)(null),E=(0,r.useRef)(null),S=(0,r.useRef)(null),L=(0,r.useRef)(null),[B,z]=(0,r.useState)(!1),N=(0,r.useRef)({blobs:e,speed:g,cohesion:p,spikes:b,spikeFrequency:C,magnetRadius:w,sheen:y,fluidColor:x,accentColor:R,paused:M,reducedMotion:A});N.current={blobs:e,speed:g,cohesion:p,spikes:b,spikeFrequency:C,magnetRadius:w,sheen:y,fluidColor:x,accentColor:R,paused:M,reducedMotion:A};let T=(0,a.useAnimationLoop)({target:k,halted:M||A,dpr:"auto",onResize:e=>S.current?.(e),onFrame:({dt:e})=>!!E.current&&E.current(e),gl:()=>L.current});return(0,r.useEffect)(()=>{let t,r=k.current;if(r&&!B){if(!function(){if("u"<typeof document)return!1;try{let e=document.createElement("canvas");return!!(e.getContext("webgl2")||e.getContext("webgl")||e.getContext("experimental-webgl"))}catch{return!1}}())return void z(!0);try{let a=new n.Renderer({alpha:!0,premultipliedAlpha:!0,dpr:Math.min(window.devicePixelRatio||1,2)});(t=a.gl).clearColor(0,0,0,0),t.enable(t.BLEND),t.blendFunc(t.ONE,t.ONE_MINUS_SRC_ALPHA),t.canvas.style.position="absolute",t.canvas.style.top="0",t.canvas.style.left="0",r.appendChild(t.canvas);let g=Array(27).fill(0),M=new i.Triangle(t),A=new u.Program(t,{vertex:h,fragment:v,uniforms:{uResolution:{value:[1,1]},uBlobs:{value:g},uBlobCount:{value:e},uMouse:{value:[10,10]},uMouseActive:{value:0},uCohesion:{value:p},uSpikes:{value:b},uSpikeFrequency:{value:C},uMagnetRadius:{value:w},uSheen:{value:y},uFluidColor:{value:new l.Color(x)},uAccentColor:{value:new l.Color(R)}}});if(!t.getProgramParameter(A.program,t.LINK_STATUS))throw Error("Ferrofluid shader program failed to link");let F=new o.Mesh(t,{geometry:M,program:A});L.current=t;S.current=e=>{0!==e.width&&0!==e.height&&(e.width,e.height,a.dpr=e.dpr,a.setSize(e.width,e.height),A.uniforms.uResolution.value=[a.gl.drawingBufferWidth,a.gl.drawingBufferHeight])};let k={x:10,y:10,tx:10,ty:10,active:0,target:0},B=e=>{let t=r.getBoundingClientRect(),n=Math.min(t.width,t.height);n<=0||(k.tx=(e.clientX-t.left-t.width/2)/n,k.ty=-(e.clientY-t.top-t.height/2)/n,k.target=1)},z=()=>{k.target=0};r.addEventListener("pointermove",B),r.addEventListener("pointerleave",z),r.addEventListener("pointercancel",z);let _=0,q=2*Math.PI;return E.current=e=>{let t=N.current;_=(_+e*t.speed*.5)%q;let r=Math.max(2,Math.min(9,Math.round(t.blobs)));for(let e=0;e<r;e++){let t=3*e;g[t]=c[e][0]*Math.cos(f[e][0]*_+d[e]),g[t+1]=c[e][1]*Math.sin(f[e][1]*_+d[e]),g[t+2]=m[e]}k.x+=(k.tx-k.x)*Math.min(1,8*e),k.y+=(k.ty-k.y)*Math.min(1,8*e),k.active+=(k.target-k.active)*Math.min(1,5*e),A.uniforms.uBlobCount.value=r,A.uniforms.uMouse.value=[k.x,k.y],A.uniforms.uMouseActive.value=k.active,A.uniforms.uCohesion.value=t.cohesion,A.uniforms.uSpikes.value=t.spikes,A.uniforms.uSpikeFrequency.value=t.spikeFrequency,A.uniforms.uMagnetRadius.value=t.magnetRadius,A.uniforms.uSheen.value=t.sheen;let[n,u,o]=s(t.fluidColor);A.uniforms.uFluidColor.value.r=n,A.uniforms.uFluidColor.value.g=u,A.uniforms.uFluidColor.value.b=o;let[i,l,h]=s(t.accentColor);A.uniforms.uAccentColor.value.r=i,A.uniforms.uAccentColor.value.g=l,A.uniforms.uAccentColor.value.b=h,a.render({scene:F})},T.resize(),T.start(),()=>{E.current=null,S.current=null,L.current=null,r.removeEventListener("pointermove",B),r.removeEventListener("pointerleave",z),r.removeEventListener("pointercancel",z),r.contains(t.canvas)&&r.removeChild(t.canvas)}}catch(e){console.warn("Ferrofluid: WebGL init failed",e),t&&(r.contains(t.canvas)&&r.removeChild(t.canvas),t.getExtension("WEBGL_lose_context")?.loseContext()),z(!0);return}}},[B]),(0,r.useEffect)(()=>{T.paint()},[e,g,p,b,C,w,y,x,R,T]),(0,t.jsx)("div",{ref:k,className:`relative h-full w-full overflow-hidden ${F}`.trim()})};e.s(["default",0,function({values:e,reducedMotion:r,paused:n}){return(0,t.jsxs)("div",{className:"relative h-full min-h-80 w-full",children:[(0,t.jsx)(g,{blobs:e.blobs,speed:e.speed,cohesion:e.cohesion,spikes:e.spikes,spikeFrequency:e.spikeFrequency,magnetRadius:e.magnetRadius,sheen:e.sheen,fluidColor:e.fluidColor,accentColor:e.accentColor,paused:n,reducedMotion:r}),(0,t.jsx)("p",{className:"pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.2em] text-ink-mute uppercase",children:"hold the cursor to the fluid"})]})}],637944)},218380,function(e){e.n(e.i(637944))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let n=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{n.current=e});let u=(0,t.useRef)(null),o=(0,t.useRef)(null),i=(0,t.useRef)(!1),l=(0,t.useRef)(!1),a=(0,t.useRef)(0),s=(0,t.useRef)(0),c=(0,t.useRef)(0),f=(0,t.useCallback)(()=>{let e=n.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=n.current.dpr??"auto",u=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:u,bufferWidth:Math.max(1,Math.round(t.width*u)),bufferHeight:Math.max(1,Math.round(t.height*u))}},[]),d=(0,t.useCallback)(function e(t){if(l.current)return;0===a.current&&(a.current=t);let o=0===s.current?0:Math.min((t-s.current)/1e3,r);s.current=t;let f={now:t,dt:o,elapsed:(t-a.current)/1e3,frame:c.current++},d=n.current.onFrame?.(f);if(!l.current){if(!1===d||n.current.halted){i.current=!1,u.current=null;return}u.current=requestAnimationFrame(e)}},[]),m=(0,t.useCallback)(()=>{l.current||i.current||(i.current=!0,s.current=0,u.current=requestAnimationFrame(d))},[d]),h=(0,t.useCallback)(()=>{i.current=!1,null!==u.current&&(cancelAnimationFrame(u.current),u.current=null)},[]),v=(0,t.useCallback)(()=>m(),[m]),g=(0,t.useCallback)(()=>{let e=f();e&&(n.current.onResize?.(e),!1!==n.current.paintWhenHalted?v():n.current.halted||m())},[f,v,m]),p=e.deps??[];(0,t.useEffect)(()=>{l.current=!1;let e=n.current.target.current;if(!e)return;let t=()=>{l.current||g()},r=new ResizeObserver(()=>{let e=n.current.resizeDebounceMs??0;e<=0?t():(null!==o.current&&clearTimeout(o.current),o.current=setTimeout(()=>{o.current=null,t()},e))});return r.observe(e),g(),n.current.halted||m(),()=>{l.current=!0,i.current=!1,null!==u.current&&(cancelAnimationFrame(u.current),u.current=null),null!==o.current&&(clearTimeout(o.current),o.current=null),r.disconnect(),n.current.onDispose?.();let e=n.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),a.current=0,s.current=0,c.current=0}},p);let b=e.halted??!1;return(0,t.useEffect)(()=>{b||m()},[b,m]),(0,t.useMemo)(()=>({start:m,stop:h,paint:v,resize:g,get running(){return i.current}}),[m,h,v,g])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])},11308,e=>{"use strict";let t={black:"#000000",white:"#ffffff",red:"#ff0000",green:"#00ff00",blue:"#0000ff",fuchsia:"#ff00ff",cyan:"#00ffff",yellow:"#ffff00",orange:"#ff8000"};function r(e){4===e.length&&(e=e[0]+e[1]+e[1]+e[2]+e[2]+e[3]+e[3]);let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t||console.warn(`Unable to convert hex string ${e} to rgb values`),[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]}function n(e){if(void 0===e)return[0,0,0];if(3==arguments.length)return arguments;if(!isNaN(e)){var n;return[((n=parseInt(n=e))>>16&255)/255,(n>>8&255)/255,(255&n)/255]}return"#"===e[0]?r(e):t[e.toLowerCase()]?r(t[e.toLowerCase()]):(console.warn("Color format not recognised"),[0,0,0])}e.s(["Color",0,class extends Array{constructor(e){if(Array.isArray(e))return super(...e);return super(...n(...arguments))}get r(){return this[0]}get g(){return this[1]}get b(){return this[2]}set r(e){this[0]=e}set g(e){this[1]=e}set b(e){this[2]=e}set(e){return Array.isArray(e)?this.copy(e):this.copy(n(...arguments))}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this}}],11308)}]);