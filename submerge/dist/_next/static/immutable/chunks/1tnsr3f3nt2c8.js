(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,767691,e=>{"use strict";var r=e.i(843476),t=e.i(303234);e.s(["default",0,function({values:e,reducedMotion:n,paused:o}){let u=o||n;return(0,r.jsx)(t.default,{raysColor:e.raysColor,raysSpeed:u?0:e.raysSpeed,lightSpread:e.lightSpread,rayLength:e.rayLength,pulsating:!u&&e.pulsating,fadeDistance:e.fadeDistance,saturation:e.saturation,followMouse:e.followMouse,mouseInfluence:e.mouseInfluence,noiseAmount:e.noiseAmount,distortion:e.distortion})}])},354017,function(e){e.n(e.i(767691))},303234,e=>{"use strict";var r=e.i(843476),t=e.i(271645),n=e.i(221663),o=e.i(956850),u=e.i(753604),a=e.i(80075),i=e.i(450922);let l="#a855f7",c=e=>{let r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return r?[parseInt(r[1],16)/255,parseInt(r[2],16)/255,parseInt(r[3],16)/255]:[1,1,1]},s=(e,r,t)=>{switch(e){case"top-left":return{anchor:[0,-.2*t],dir:[0,1]};case"top-right":return{anchor:[r,-.2*t],dir:[0,1]};case"left":return{anchor:[-.2*r,.5*t],dir:[1,0]};case"right":return{anchor:[1.2*r,.5*t],dir:[-1,0]};case"bottom-left":return{anchor:[0,1.2*t],dir:[0,-1]};case"bottom-center":return{anchor:[.5*r,1.2*t],dir:[0,-1]};case"bottom-right":return{anchor:[r,1.2*t],dir:[0,-1]};default:return{anchor:[.5*r,-.2*t],dir:[0,1]}}};e.s(["default",0,({raysOrigin:e="top-center",raysColor:f=l,raysSpeed:d=1,lightSpread:m=1,rayLength:g=2,pulsating:v=!1,fadeDistance:h=1,saturation:p=1,followMouse:y=!0,mouseInfluence:R=.1,noiseAmount:C=.1,distortion:x=.2,maxDpr:w=2,className:b=""})=>{let A=(0,t.useRef)(null),D=(0,t.useRef)(null),S=(0,t.useRef)(null),T=(0,t.useRef)({x:.5,y:.5}),P=(0,t.useRef)({x:.5,y:.5}),F=(0,t.useRef)(null),L=(0,t.useRef)(null),[E,I]=(0,t.useState)(!1),z=(0,t.useRef)(null),M=(0,t.useRef)(d),B=(0,t.useRef)(y),W=(0,t.useRef)(R),_=(0,t.useRef)(null),k=(0,t.useRef)(null),G=(0,i.useAnimationLoop)({target:A,halted:d<=0,dpr:w,onResize:e=>k.current?.(e),onFrame:({now:e})=>!!_.current&&_.current(e)});return(0,t.useEffect)(()=>{if(A.current)return z.current=new IntersectionObserver(e=>{I(e[0].isIntersecting)},{threshold:.1}),z.current.observe(A.current),()=>{z.current&&(z.current.disconnect(),z.current=null)}},[]),(0,t.useEffect)(()=>{if(E&&A.current)return L.current&&(L.current(),L.current=null),(async()=>{if(!A.current||(await new Promise(e=>setTimeout(e,10)),!A.current))return;let r=new n.Renderer({dpr:Math.min(window.devicePixelRatio,w),alpha:!0,premultipliedAlpha:!0});S.current=r;let t=r.gl;for(t.canvas.style.width="100%",t.canvas.style.height="100%",t.canvas.style.opacity="0",t.canvas.style.transition="opacity 700ms ease";A.current.firstChild;)A.current.removeChild(A.current.firstChild);A.current.appendChild(t.canvas);let i=`
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`,l=`precision highp float;

uniform float iTime;
uniform vec2  iResolution;

uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;

varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);

  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  
  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  
  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;

  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  
  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  vec4 rays1 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349,
                           1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234,
                           1.1 * raysSpeed);

  fragColor = rays1 * 0.5 + rays2 * 0.4;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }

  float brightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x *= 0.1 + brightness * 0.8;
  fragColor.y *= 0.3 + brightness * 0.6;
  fragColor.z *= 0.5 + brightness * 0.5;

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  fragColor.rgb *= raysColor;
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  // Premultiplied output — pairs with premultipliedAlpha:true so Safari
  // composites the alpha-gated glow instead of painting the raw HDR RGB.
  gl_FragColor = vec4(color.rgb * color.a, color.a);
}`,y={iTime:{value:0},iResolution:{value:[1,1]},rayPos:{value:[0,0]},rayDir:{value:[0,1]},raysColor:{value:c(f)},raysSpeed:{value:d},lightSpread:{value:m},rayLength:{value:g},pulsating:{value:+!!v},fadeDistance:{value:h},saturation:{value:p},mousePos:{value:[.5,.5]},mouseInfluence:{value:R},noiseAmount:{value:C},distortion:{value:x}};D.current=y;let b=new u.Triangle(t),E=new o.Program(t,{vertex:i,fragment:l,uniforms:y}),I=new a.Mesh(t,{geometry:b,program:E});F.current=I,k.current=({width:t,height:n,dpr:o,bufferWidth:u,bufferHeight:a})=>{r.dpr=o,r.setSize(t,n),y.iResolution.value=[u,a];let{anchor:i,dir:l}=s(e,u,a);y.rayPos.value=i,y.rayDir.value=l};let z=!1;_.current=e=>{if(!S.current||!D.current||!F.current)return!1;y.iTime.value=.001*e,B.current&&W.current>0&&(P.current.x=.92*P.current.x+.07999999999999996*T.current.x,P.current.y=.92*P.current.y+.07999999999999996*T.current.y,y.mousePos.value=[P.current.x,P.current.y]);try{r.render({scene:I})}catch(e){return console.warn("WebGL rendering error:",e),!1}if(z||(z=!0,t.canvas.style.opacity="1"),M.current<=0)return!1},G.resize(),G.start(),L.current=()=>{_.current=null,k.current=null;let e=r.gl.canvas,t=()=>{try{r.gl.getExtension("WEBGL_lose_context")?.loseContext(),e&&e.parentNode&&e.parentNode.removeChild(e)}catch(e){console.warn("Error during WebGL cleanup:",e)}};e?(e.style.opacity="0",window.setTimeout(t,740)):t(),S.current===r&&(S.current=null),D.current=null,F.current=null}})(),()=>{L.current&&(L.current(),L.current=null)}},[E]),(0,t.useEffect)(()=>{if(M.current=d,B.current=y,W.current=R,!D.current||!A.current||!S.current)return;let r=D.current,t=S.current;r.raysColor.value=c(f),r.raysSpeed.value=d,r.lightSpread.value=m,r.rayLength.value=g,r.pulsating.value=+!!v,r.fadeDistance.value=h,r.saturation.value=p,r.mouseInfluence.value=R,r.noiseAmount.value=C,r.distortion.value=x;let{clientWidth:n,clientHeight:o}=A.current,u=t.dpr,{anchor:a,dir:i}=s(e,n*u,o*u);r.rayPos.value=a,r.rayDir.value=i,d>0&&G.start()},[f,d,m,e,g,v,h,p,y,R,C,x]),(0,t.useEffect)(()=>{let e=e=>{if(!A.current||!S.current)return;let r=A.current.getBoundingClientRect();T.current={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}};if(y)return window.addEventListener("pointermove",e),()=>window.removeEventListener("pointermove",e)},[y]),(0,r.jsx)("div",{ref:A,className:`${y?"touch-none":"pointer-events-none"} relative z-[3] h-full w-full overflow-hidden ${b}`.trim()})}])},450922,e=>{"use strict";var r=e.i(271645);let t=1/15;e.s(["useAnimationLoop",0,function(e){let n=(0,r.useRef)(e);(0,r.useLayoutEffect)(()=>{n.current=e});let o=(0,r.useRef)(null),u=(0,r.useRef)(null),a=(0,r.useRef)(!1),i=(0,r.useRef)(!1),l=(0,r.useRef)(0),c=(0,r.useRef)(0),s=(0,r.useRef)(0),f=(0,r.useCallback)(()=>{let e=n.current.target.current;if(!e)return null;let r=e.getBoundingClientRect(),t=n.current.dpr??"auto",o=Math.min(window.devicePixelRatio||1,"auto"===t?2:t);return{width:r.width,height:r.height,dpr:o,bufferWidth:Math.max(1,Math.round(r.width*o)),bufferHeight:Math.max(1,Math.round(r.height*o))}},[]),d=(0,r.useCallback)(function e(r){if(i.current)return;0===l.current&&(l.current=r);let u=0===c.current?0:Math.min((r-c.current)/1e3,t);c.current=r;let f={now:r,dt:u,elapsed:(r-l.current)/1e3,frame:s.current++},d=n.current.onFrame?.(f);if(!i.current){if(!1===d||n.current.halted){a.current=!1,o.current=null;return}o.current=requestAnimationFrame(e)}},[]),m=(0,r.useCallback)(()=>{i.current||a.current||(a.current=!0,c.current=0,o.current=requestAnimationFrame(d))},[d]),g=(0,r.useCallback)(()=>{a.current=!1,null!==o.current&&(cancelAnimationFrame(o.current),o.current=null)},[]),v=(0,r.useCallback)(()=>m(),[m]),h=(0,r.useCallback)(()=>{let e=f();e&&(n.current.onResize?.(e),!1!==n.current.paintWhenHalted?v():n.current.halted||m())},[f,v,m]),p=e.deps??[];(0,r.useEffect)(()=>{i.current=!1;let e=n.current.target.current;if(!e)return;let r=()=>{i.current||h()},t=new ResizeObserver(()=>{let e=n.current.resizeDebounceMs??0;e<=0?r():(null!==u.current&&clearTimeout(u.current),u.current=setTimeout(()=>{u.current=null,r()},e))});return t.observe(e),h(),n.current.halted||m(),()=>{i.current=!0,a.current=!1,null!==o.current&&(cancelAnimationFrame(o.current),o.current=null),null!==u.current&&(clearTimeout(u.current),u.current=null),t.disconnect(),n.current.onDispose?.();let e=n.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),l.current=0,c.current=0,s.current=0}},p);let y=e.halted??!1;return(0,r.useEffect)(()=>{y||m()},[y,m]),(0,r.useMemo)(()=>({start:m,stop:g,paint:v,resize:h,get running(){return a.current}}),[m,g,v,h])}])},753604,e=>{"use strict";var r=e.i(994964);class t extends r.Geometry{constructor(e,{attributes:r={}}={}){Object.assign(r,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,r)}}e.s(["Triangle",0,t])}]);