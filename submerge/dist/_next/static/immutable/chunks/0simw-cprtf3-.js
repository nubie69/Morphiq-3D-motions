(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,99636,e=>{"use strict";var r=e.i(843476),t=e.i(517428);e.s(["default",0,function({values:e,reducedMotion:n,paused:i}){let l=i||n;return(0,r.jsx)(t.default,{speed:l?0:e.speed,rayColor1:e.rayColor1,rayColor2:e.rayColor2,intensity:e.intensity,spread:e.spread,tilt:e.tilt,saturation:e.saturation,blend:e.blend,falloff:e.falloff,opacity:e.opacity,paused:l})}])},54762,function(e){e.n(e.i(99636))},517428,e=>{"use strict";var r=e.i(843476),t=e.i(271645),n=e.i(221663),i=e.i(956850),l=e.i(753604),o=e.i(80075),a=e.i(450922);let u=e=>{let r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return r?[parseInt(r[1],16)/255,parseInt(r[2],16)/255,parseInt(r[3],16)/255]:[1,1,1]},c=e=>{switch(e){case"top-left":return[1,0];case"bottom-right":return[0,1];case"bottom-left":return[1,1];default:return[0,0]}};e.s(["default",0,({speed:e=1,rayColor1:s="#a855f7",rayColor2:f="#22d3ee",intensity:d=2,spread:v=1,origin:p="top-right",tilt:y=0,saturation:m=1,blend:h=.5,falloff:g=1,opacity:R=.9,paused:C=!1,className:b=""})=>{let x=(0,t.useRef)(null),S=(0,t.useRef)(null),w=(0,t.useRef)(null),T=(0,t.useRef)(null),F=(0,t.useRef)(null),[A,P]=(0,t.useState)(!1),z=(0,t.useRef)(null),B=(0,a.useAnimationLoop)({target:x,halted:C,dpr:2,onResize:({width:e,height:r,dpr:t,bufferWidth:n,bufferHeight:i})=>{let l=w.current,o=S.current;l&&o&&(l.dpr=t,l.setSize(e,r),o.iResolution.value=[n,i])},onFrame:({now:e})=>{let r=w.current,t=T.current,n=S.current;if(!r||!t||!n)return!1;n.iTime.value=.001*e;try{r.render({scene:t})}catch{return!1}},gl:()=>w.current?.gl});return(0,t.useEffect)(()=>{if(x.current)return z.current=new IntersectionObserver(e=>{P(e[0].isIntersecting)},{threshold:.1}),z.current.observe(x.current),()=>{z.current&&(z.current.disconnect(),z.current=null)}},[]),(0,t.useEffect)(()=>{if(A&&x.current)return F.current&&(F.current(),F.current=null),(async()=>{if(!x.current||(await new Promise(e=>setTimeout(e,10)),!x.current))return;let r=new n.Renderer({dpr:Math.min(window.devicePixelRatio,2),alpha:!0,premultipliedAlpha:!0});w.current=r;let t=r.gl;for(t.canvas.style.width="100%",t.canvas.style.height="100%";x.current.firstChild;)x.current.removeChild(x.current.firstChild);x.current.appendChild(t.canvas);let a=`
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`,C=`precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform vec3 iRayColor1;
uniform vec3 iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iFlipX;
uniform float iFlipY;
uniform float iTilt;
uniform float iSaturation;
uniform float iBlend;
uniform float iFalloff;
uniform float iOpacity;

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
  return clamp(
    (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),
    0.0, 1.0) *
    clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
  if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);

  float tiltRad = iTilt * 3.14159265 / 180.0;
  float cs = cos(tiltRad);
  float sn = sin(tiltRad);
  vec2 rel = coord - rayPos;
  vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;

  float halfSpread = iSpread * 0.275;
  vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
  vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

  vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
  vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);

  vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

  float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;
  float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
  color.rgb *= brightness;

  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, iSaturation);

  color.a = max(color.r, max(color.g, color.b)) * iOpacity;
  // Premultiplied output — pairs with premultipliedAlpha:true so Safari
  // composites the alpha-gated glow instead of painting the raw HDR RGB.
  gl_FragColor = vec4(color.rgb * color.a, color.a);
}`,[b,A]=c(p),P={iTime:{value:0},iResolution:{value:[1,1]},iSpeed:{value:e},iRayColor1:{value:u(s)},iRayColor2:{value:u(f)},iIntensity:{value:d},iSpread:{value:v},iFlipX:{value:b},iFlipY:{value:A},iTilt:{value:y},iSaturation:{value:m},iBlend:{value:h},iFalloff:{value:g},iOpacity:{value:R}};S.current=P;let z=new l.Triangle(t),M=new i.Program(t,{vertex:a,fragment:C,uniforms:P});T.current=new o.Mesh(t,{geometry:z,program:M}),B.resize(),B.start(),F.current=()=>{try{let e=r.gl.canvas;e&&e.parentNode&&e.parentNode.removeChild(e)}catch{}w.current=null,S.current=null,T.current=null}})(),()=>{F.current&&(F.current(),F.current=null)}},[A]),(0,t.useEffect)(()=>{if(!S.current)return;let r=S.current;r.iSpeed.value=e,r.iRayColor1.value=u(s),r.iRayColor2.value=u(f),r.iIntensity.value=d,r.iSpread.value=v;let[t,n]=c(p);r.iFlipX.value=t,r.iFlipY.value=n,r.iTilt.value=y,r.iSaturation.value=m,r.iBlend.value=h,r.iFalloff.value=g,r.iOpacity.value=R},[e,s,f,d,v,p,y,m,h,g,R]),(0,r.jsx)("div",{ref:x,className:`pointer-events-none relative z-[3] h-full w-full overflow-hidden ${b}`.trim()})}])},450922,e=>{"use strict";var r=e.i(271645);let t=1/15;e.s(["useAnimationLoop",0,function(e){let n=(0,r.useRef)(e);(0,r.useLayoutEffect)(()=>{n.current=e});let i=(0,r.useRef)(null),l=(0,r.useRef)(null),o=(0,r.useRef)(!1),a=(0,r.useRef)(!1),u=(0,r.useRef)(0),c=(0,r.useRef)(0),s=(0,r.useRef)(0),f=(0,r.useCallback)(()=>{let e=n.current.target.current;if(!e)return null;let r=e.getBoundingClientRect(),t=n.current.dpr??"auto",i=Math.min(window.devicePixelRatio||1,"auto"===t?2:t);return{width:r.width,height:r.height,dpr:i,bufferWidth:Math.max(1,Math.round(r.width*i)),bufferHeight:Math.max(1,Math.round(r.height*i))}},[]),d=(0,r.useCallback)(function e(r){if(a.current)return;0===u.current&&(u.current=r);let l=0===c.current?0:Math.min((r-c.current)/1e3,t);c.current=r;let f={now:r,dt:l,elapsed:(r-u.current)/1e3,frame:s.current++},d=n.current.onFrame?.(f);if(!a.current){if(!1===d||n.current.halted){o.current=!1,i.current=null;return}i.current=requestAnimationFrame(e)}},[]),v=(0,r.useCallback)(()=>{a.current||o.current||(o.current=!0,c.current=0,i.current=requestAnimationFrame(d))},[d]),p=(0,r.useCallback)(()=>{o.current=!1,null!==i.current&&(cancelAnimationFrame(i.current),i.current=null)},[]),y=(0,r.useCallback)(()=>v(),[v]),m=(0,r.useCallback)(()=>{let e=f();e&&(n.current.onResize?.(e),!1!==n.current.paintWhenHalted?y():n.current.halted||v())},[f,y,v]),h=e.deps??[];(0,r.useEffect)(()=>{a.current=!1;let e=n.current.target.current;if(!e)return;let r=()=>{a.current||m()},t=new ResizeObserver(()=>{let e=n.current.resizeDebounceMs??0;e<=0?r():(null!==l.current&&clearTimeout(l.current),l.current=setTimeout(()=>{l.current=null,r()},e))});return t.observe(e),m(),n.current.halted||v(),()=>{a.current=!0,o.current=!1,null!==i.current&&(cancelAnimationFrame(i.current),i.current=null),null!==l.current&&(clearTimeout(l.current),l.current=null),t.disconnect(),n.current.onDispose?.();let e=n.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),u.current=0,c.current=0,s.current=0}},h);let g=e.halted??!1;return(0,r.useEffect)(()=>{g||v()},[g,v]),(0,r.useMemo)(()=>({start:v,stop:p,paint:y,resize:m,get running(){return o.current}}),[v,p,y,m])}])},753604,e=>{"use strict";var r=e.i(994964);class t extends r.Geometry{constructor(e,{attributes:r={}}={}){Object.assign(r,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,r)}}e.s(["Triangle",0,t])}]);