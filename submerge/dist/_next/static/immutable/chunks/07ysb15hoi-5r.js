(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,996820,e=>{"use strict";var t=e.i(843476),r=e.i(271645),n=e.i(450922);let o=`
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`,i=`
precision highp float;
uniform vec2 uRes;
uniform float uFlip;
uniform float uTime;
uniform vec3 uPointer; // x, y, pull (0 to 1)
uniform vec3 uCore;
uniform vec3 uHaze;
uniform float uHorizon;
uniform float uCurve;
uniform float uReach;
uniform float uIntensity;

// Sin-free hash: stays stable as the drift carries the noise coordinates far from the origin.
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.3, 9.1); a *= 0.5; }
  return v;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  if (uFlip > 0.5) frag.y = uRes.y - frag.y;
  vec2 p = frag / uRes.y;
  float aspect = uRes.x / uRes.y;
  float cx = p.x - aspect * 0.5;
  float t = uTime;

  // The horizon arcs down at the edges, so the light tapers into the corners.
  float d = p.y - uHorizon + cx * cx * (uCurve / aspect);

  // Near the pointer the strands lean toward it and the light climbs to meet it.
  float dx = uPointer.x - p.x;
  float near = uPointer.z * exp(-dx * dx * 1.6) * exp(-max(uPointer.y - uHorizon - 0.3 * uReach, 0.0) * 1.5);
  float lean = 0.3 * sin(t * 0.07 + cx * 1.3) + clamp(dx, -0.7, 0.7) * near * 2.4;

  // Shear the field along the lean: noise stretched that way reads as strands of smoke.
  vec2 q = vec2(cx - d * lean, d / uReach);
  vec2 warp = vec2(fbm(q * vec2(1.4, 2.2) + vec2(t * 0.04, -t * 0.07)),
                   fbm(q * vec2(1.4, 2.2) + vec2(5.2, 1.3) - t * 0.05));
  float body = fbm(vec2(q.x * 1.6 + warp.x * 1.2 + t * 0.03, q.y * 1.4 + warp.y * 0.8 - t * 0.06));
  float strands = fbm(vec2(q.x * 7.0 + warp.x * 2.5, q.y * 1.1 - t * 0.09));

  float reach = (0.06 + 0.24 * body * body + near * 0.3) * uReach;
  float density = exp(-max(d, 0.0) / reach) * (0.35 + 1.3 * strands * body) * (1.0 + 0.9 * near);
  // A bright rim right on the horizon, the way light pools at the edge of a planet.
  density += exp(-max(d, 0.0) / 0.025) * 0.45;
  density *= smoothstep(-0.03, 0.0, d);
  // Gone before the top edge, wherever the horizon sits and whatever the pointer pulls up.
  density *= 1.0 - smoothstep(0.45 * uReach, 0.95 * uReach, d);
  density *= 1.0 - smoothstep(0.82, 1.0, p.y);
  density *= uIntensity;

  // Thin smoke falls off fast, and it blends mostly as light:
  // alpha below coverage, so the sky behind stays lit.
  float a = pow(clamp(density, 0.0, 1.0), 1.5);
  vec3 col = mix(uHaze, uCore, smoothstep(0.35, 0.95, density));
  gl_FragColor = vec4(col * a, a * 0.7);
}
`;function u(e){let t=e.replace("#","").trim();if(3===t.length&&(t=t.split("").map(e=>e+e).join("")),6!==t.length)return[1,1,1];let r=parseInt(t,16);return[(r>>16&255)/255,(r>>8&255)/255,(255&r)/255]}function a(e,t,r){let n=e.createShader(t);return n?(e.shaderSource(n,r),e.compileShader(n),e.getShaderParameter(n,e.COMPILE_STATUS)?n:null):null}function l({position:e="bottom",horizon:c=0,curvature:s=0,reach:f=1,speed:h=1,intensity:d=1,pull:m=1,coreColor:p="#e9d5ff",hazeColor:v="#a855f7",skyColor:g="#07060b",paused:x=!1,reducedMotion:y=!1,className:b=""}){let R=(0,r.useRef)(null),C=(0,r.useRef)(null),A=(0,r.useRef)(null),w=(0,r.useRef)(null),z=(0,r.useRef)({position:e,horizon:c,curvature:s,reach:f,speed:h,intensity:d,pull:m,coreColor:p,hazeColor:v});z.current={position:e,horizon:c,curvature:s,reach:f,speed:h,intensity:d,pull:m,coreColor:p,hazeColor:v};let E=(0,n.useAnimationLoop)({target:R,halted:x||y,dpr:1,onResize:({bufferWidth:e,bufferHeight:t})=>A.current?.(e,t),onFrame:({dt:e})=>!!C.current&&C.current(y?0:e)});return(0,r.useEffect)(()=>{let e=R.current;if(!e)return;let t=document.createElement("canvas");t.className="absolute inset-0 size-full";let r=t.getContext("webgl",{alpha:!0,premultipliedAlpha:!0,antialias:!1}),n=r&&a(r,r.VERTEX_SHADER,o),l=r&&a(r,r.FRAGMENT_SHADER,i),c=r?.createProgram();if(r&&n&&l&&c&&(r.attachShader(c,n),r.attachShader(c,l),r.linkProgram(c)),!r||!c||!r.getProgramParameter(c,r.LINK_STATUS))return w.current?.removeAttribute("hidden"),()=>w.current?.setAttribute("hidden","");e.append(t),r.useProgram(c),r.bindBuffer(r.ARRAY_BUFFER,r.createBuffer()),r.bufferData(r.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),r.STATIC_DRAW);let s=r.getAttribLocation(c,"position");r.enableVertexAttribArray(s),r.vertexAttribPointer(s,2,r.FLOAT,!1,0,0);let f=r.getUniformLocation(c,"uRes"),h=r.getUniformLocation(c,"uFlip"),d=r.getUniformLocation(c,"uTime"),m=r.getUniformLocation(c,"uPointer"),p=r.getUniformLocation(c,"uCore"),v=r.getUniformLocation(c,"uHaze"),g=r.getUniformLocation(c,"uHorizon"),x=r.getUniformLocation(c,"uCurve"),y=r.getUniformLocation(c,"uReach"),b=r.getUniformLocation(c,"uIntensity"),L={x:0,y:0,pull:0},T={x:0,y:0,pull:0},F=40,P=t=>{let r=e.getBoundingClientRect();if(!r.height)return;let n="touch"!==t.pointerType&&t.clientX>=r.left&&t.clientX<=r.right&&t.clientY>=r.top&&t.clientY<=r.bottom;L.pull=+!!n,n&&(L.x=(t.clientX-r.left)/r.height,L.y=("top"===z.current.position?t.clientY-r.top:r.bottom-t.clientY)/r.height,T.pull<.01&&Object.assign(T,{x:L.x,y:L.y}))},S=()=>{L.pull=0};return window.addEventListener("pointermove",P,{passive:!0}),document.documentElement.addEventListener("pointerleave",S),A.current=(e,n)=>{t.width=e,t.height=n,r.viewport(0,0,e,n),r.uniform2f(f,e,n)},C.current=e=>{let t=z.current;F+=e*t.speed;let n=Math.min(1,2.2*e);T.x+=(L.x-T.x)*n,T.y+=(L.y-T.y)*n;let o=L.pull>T.pull?1.5:.9;T.pull+=(L.pull-T.pull)*Math.min(1,e*o),r.uniform1f(d,F),r.uniform1f(h,+("top"===t.position)),r.uniform3f(m,T.x,T.y,T.pull*t.pull),r.uniform3fv(p,u(t.coreColor)),r.uniform3fv(v,u(t.hazeColor)),r.uniform1f(g,t.horizon),r.uniform1f(x,t.curvature),r.uniform1f(y,Math.max(.05,t.reach)),r.uniform1f(b,t.intensity),r.drawArrays(r.TRIANGLES,0,3)},E.resize(),E.start(),()=>{window.removeEventListener("pointermove",P),document.documentElement.removeEventListener("pointerleave",S),C.current=null,A.current=null,t.remove(),r.getExtension("WEBGL_lose_context")?.loseContext()}},[E]),(0,r.useEffect)(()=>{E.paint()},[e,c,s,f,d,m,p,v,E]),(0,t.jsx)("div",{ref:R,"aria-hidden":!0,className:`pointer-events-none relative h-full w-full overflow-hidden ${b}`.trim(),style:{backgroundColor:g},children:(0,t.jsx)("div",{ref:w,hidden:!0,className:"absolute inset-x-0",style:{[e]:`${100*c}%`,height:"70%",background:`radial-gradient(60% 100% at 50% ${"top"===e?"0%":"100%"}, ${v}66, ${v}1a 55%, transparent)`}})})}e.s(["default",0,function({values:e,reducedMotion:r,paused:n}){return(0,t.jsx)("div",{className:"relative h-full min-h-80 w-full",children:(0,t.jsx)(l,{position:e.position,horizon:e.horizon,curvature:e.curvature,reach:e.reach,speed:e.speed,intensity:e.intensity,pull:e.pull,coreColor:e.coreColor,hazeColor:e.hazeColor,skyColor:e.skyColor,paused:n,reducedMotion:r})})}],996820)},427670,function(e){e.n(e.i(996820))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let n=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{n.current=e});let o=(0,t.useRef)(null),i=(0,t.useRef)(null),u=(0,t.useRef)(!1),a=(0,t.useRef)(!1),l=(0,t.useRef)(0),c=(0,t.useRef)(0),s=(0,t.useRef)(0),f=(0,t.useCallback)(()=>{let e=n.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=n.current.dpr??"auto",o=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:o,bufferWidth:Math.max(1,Math.round(t.width*o)),bufferHeight:Math.max(1,Math.round(t.height*o))}},[]),h=(0,t.useCallback)(function e(t){if(a.current)return;0===l.current&&(l.current=t);let i=0===c.current?0:Math.min((t-c.current)/1e3,r);c.current=t;let f={now:t,dt:i,elapsed:(t-l.current)/1e3,frame:s.current++},h=n.current.onFrame?.(f);if(!a.current){if(!1===h||n.current.halted){u.current=!1,o.current=null;return}o.current=requestAnimationFrame(e)}},[]),d=(0,t.useCallback)(()=>{a.current||u.current||(u.current=!0,c.current=0,o.current=requestAnimationFrame(h))},[h]),m=(0,t.useCallback)(()=>{u.current=!1,null!==o.current&&(cancelAnimationFrame(o.current),o.current=null)},[]),p=(0,t.useCallback)(()=>d(),[d]),v=(0,t.useCallback)(()=>{let e=f();e&&(n.current.onResize?.(e),!1!==n.current.paintWhenHalted?p():n.current.halted||d())},[f,p,d]),g=e.deps??[];(0,t.useEffect)(()=>{a.current=!1;let e=n.current.target.current;if(!e)return;let t=()=>{a.current||v()},r=new ResizeObserver(()=>{let e=n.current.resizeDebounceMs??0;e<=0?t():(null!==i.current&&clearTimeout(i.current),i.current=setTimeout(()=>{i.current=null,t()},e))});return r.observe(e),v(),n.current.halted||d(),()=>{a.current=!0,u.current=!1,null!==o.current&&(cancelAnimationFrame(o.current),o.current=null),null!==i.current&&(clearTimeout(i.current),i.current=null),r.disconnect(),n.current.onDispose?.();let e=n.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),l.current=0,c.current=0,s.current=0}},g);let x=e.halted??!1;return(0,t.useEffect)(()=>{x||d()},[x,d]),(0,t.useMemo)(()=>({start:d,stop:m,paint:p,resize:v,get running(){return u.current}}),[d,m,p,v])}])}]);