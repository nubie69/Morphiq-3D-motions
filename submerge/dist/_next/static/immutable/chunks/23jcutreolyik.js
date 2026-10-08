(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,362135,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(221663),n=e.i(956850),i=e.i(80075),o=e.i(753604),l=e.i(450922);let u=e=>{let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[1,1,1]},s=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,c=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uDispersion;
uniform float uBands;
uniform float uBeamIntensity;
uniform float uSaturation;
uniform float uFog;
uniform float uYaw;
uniform float uPitch;
uniform vec3 uBeamColor;
out vec4 fragColor;

// GLSL mat3 fills column-major: these are the standard right-hand R_y / R_x.
// Sign check (geometry rotation, camera fixed at +z): drag down -> pitch grows
// -> the prism's top comes toward the viewer.
mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s, 0.,1.,0., s,0.,c);}
mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0., 0.,c,s, 0.,-s,c);}

// Equilateral prism: triangular cross-section in xy, length 2h.y along z.
float sdPrism(vec3 p, vec2 h){
  vec3 q = abs(p);
  return max(q.z - h.y, max(q.x * 0.866025 + p.y * 0.5, -p.y) - h.x * 0.5);
}

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Closest distance between the view ray and a light segment — the whole beam
// system is capsule glows, no secondary marching.
float raySeg(vec3 ro, vec3 rd, vec3 a, vec3 b){
  vec3 v = b - a;
  vec3 w = ro - a;
  float A = 1.0;
  float B = dot(rd, v);
  float C = dot(v, v);
  float D = dot(rd, w);
  float E = dot(v, w);
  float den = max(A * C - B * B, 1e-5);
  float s = max((B * E - C * D) / den, 0.0);
  float t = clamp((A * E - B * D) / den, 0.0, 1.0);
  return length((ro + rd * s) - (a + v * t));
}

// Spectral hue ramp, red -> violet across the fan: an HSV hue sweep, squared
// for saturation. (A cosine palette with per-channel frequencies parks every
// channel in its negative trough mid-range — the middle bands render black.)
vec3 spectral(float k){
  vec3 c = clamp(abs(fract(k * 0.78 + vec3(1.0, 0.666667, 0.333333)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
  return c * c;
}

void main(){
  vec2 uv = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
  float t = iTime;

  mat3 M = rotY(uYaw) * rotX(uPitch);
  mat3 Minv = transpose(M);

  vec3 ro = vec3(0.0, 0.0, 3.4);
  vec3 rd = normalize(vec3(uv, -1.75));

  vec2 prismSize = vec2(1.15, 0.85);

  // ── march the solid ──────────────────────────────────────────────────────
  float travel = 0.0;
  bool hit = false;
  vec3 pos = ro;
  for (int i = 0; i < 64; i++){
    pos = ro + rd * travel;
    float d = sdPrism(Minv * pos, prismSize);
    if (d < 0.002) { hit = true; break; }
    travel += d;
    if (travel > 9.0) break;
  }

  // ── base: near-black with a breathing haze gradient ──────────────────────
  vec3 col = vec3(0.012, 0.008, 0.022);
  float haze = uFog * (0.5 + 0.5 * sin(uv.x * 1.7 + t * 0.21) * sin(uv.y * 1.3 - t * 0.13));
  col += vec3(0.05, 0.03, 0.09) * haze * 0.4;

  float fogGain = 0.25 + uFog * 0.75;

  // ── entry shaft: world-fixed, terminating at the prism heart ─────────────
  vec3 heart = vec3(0.0, 0.1, 0.0);
  float dIn = raySeg(ro, rd, vec3(-4.2, 0.95, 0.0), heart);
  float gIn = 0.0016 / (dIn * dIn + 0.0016);
  col += uBeamColor * gIn * uBeamIntensity * fogGain * 1.4;

  // ── exit fan: attached to the geometry, sweeps as the prism turns ────────
  vec3 inDir = normalize(heart - vec3(-4.2, 0.95, 0.0));
  for (int i = 0; i < 8; i++){
    if (float(i) >= uBands) break;
    float k = (float(i) + 0.5) / max(uBands, 1.0);
    // deviation: base bend plus wavelength-dependent spread
    float dev = 0.55 + (k - 0.5) * (0.25 + uDispersion * 0.85);
    float c = cos(-dev), s = sin(-dev);
    vec3 outDir = normalize(vec3(
      inDir.x * c - inDir.y * s,
      inDir.x * s + inDir.y * c,
      0.0));
    vec3 a = M * heart;
    vec3 b = a + M * outDir * 5.0;
    float d = raySeg(ro, rd, a, b);
    float g = 0.0011 / (d * d + 0.0011);
    vec3 bandCol = mix(uBeamColor, spectral(k), uSaturation);
    col += bandCol * g * uBeamIntensity * fogGain * (1.05 - k * 0.25);
  }

  // dust motes drifting through whatever glow is present
  float dust = hash12(floor(uv * 90.0) + floor(t * 3.0));
  col += col * step(0.985, dust) * uFog * 1.5;

  // ── glass surface: Fresnel rim + faint interior ──────────────────────────
  if (hit){
    vec3 pl = Minv * pos;
    vec2 e = vec2(0.004, 0.0);
    vec3 n = normalize(vec3(
      sdPrism(pl + e.xyy, prismSize) - sdPrism(pl - e.xyy, prismSize),
      sdPrism(pl + e.yxy, prismSize) - sdPrism(pl - e.yxy, prismSize),
      sdPrism(pl + e.yyx, prismSize) - sdPrism(pl - e.yyx, prismSize)));
    n = M * n;
    float fres = pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 3.0);
    // mostly transparent body with a cold tint; the beams behind stay visible
    col = mix(col, col * vec3(0.82, 0.86, 1.0) + vec3(0.015, 0.012, 0.03), 0.35);
    col += vec3(0.75, 0.78, 1.0) * fres * 0.55;
    // one crisp specular from a fixed key light
    vec3 keyDir = normalize(vec3(-0.5, 0.8, 0.6));
    float spec = pow(max(dot(reflect(rd, n), keyDir), 0.0), 60.0);
    col += vec3(1.0) * spec * 0.5;
  }

  // soft vignette keeps the frame edges quiet
  col *= 1.0 - 0.35 * dot(uv * 0.55, uv * 0.55);
  col = 1.0 - exp(-col * 1.6);
  fragColor = vec4(col, 1.0);
}
`,d=({dispersion:e=.5,bands:d=6,beamIntensity:f=1,beamColor:v="#ffffff",saturation:m=.9,fog:h=.3,autoRotate:p=!0,rotateSpeed:g=.3,paused:y=!1,reducedMotion:w=!1,className:b=""})=>{let x=(0,r.useRef)(null),[M,R]=(0,r.useState)(!1),C=(0,r.useRef)({dispersion:e,bands:d,beamIntensity:f,beamColor:v,saturation:m,fog:h,autoRotate:p,rotateSpeed:g,paused:y,reducedMotion:w});C.current={dispersion:e,bands:d,beamIntensity:f,beamColor:v,saturation:m,fog:h,autoRotate:p,rotateSpeed:g,paused:y,reducedMotion:w};let z=(0,r.useRef)({yaw:.5,pitch:.12,velYaw:0,velPitch:0,dragging:!1,lastX:0,lastY:0}),B=(0,r.useRef)(null),P=(0,r.useRef)(null),k=(0,r.useRef)(null),S=(0,r.useRef)(null),E=(0,l.useAnimationLoop)({target:x,halted:!1,dpr:"auto",onResize:e=>k.current?.(e),onFrame:({now:e})=>!!P.current&&P.current(e),gl:()=>S.current});return((0,r.useEffect)(()=>{let t=x.current;if(!t)return;if(!document.createElement("canvas").getContext("webgl2"))return void R(!0);let r=new a.Renderer({webgl:2,alpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)}),l=r.gl;S.current=l;let p=l.canvas;p.style.width="100%",p.style.height="100%",p.style.display="block",p.style.position="absolute",p.style.top="0",p.style.left="0",t.appendChild(p);let g=new o.Triangle(l),y=new n.Program(l,{vertex:s,fragment:c,uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uDispersion:{value:e},uBands:{value:d},uBeamIntensity:{value:f},uSaturation:{value:m},uFog:{value:h},uYaw:{value:z.current.yaw},uPitch:{value:z.current.pitch},uBeamColor:{value:new Float32Array(u(v))}}}),w=new i.Mesh(l,{geometry:g,program:y}),b=y.uniforms,M=0,Y=C.current.paused||C.current.reducedMotion?0:1,D=performance.now(),F=()=>{var e;let t,r=C.current,a=z.current;b.iTime.value=M,b.uDispersion.value=r.dispersion,b.uBands.value=r.bands,b.uBeamIntensity.value=r.beamIntensity,b.uSaturation.value=r.saturation,b.uFog.value=r.fog,b.uYaw.value=a.yaw,b.uPitch.value=a.pitch,e=b.uBeamColor.value,t=u(r.beamColor),e[0]=t[0],e[1]=t[1],e[2]=t[2]},I=()=>{F(),r.render({scene:w})};B.current=I,k.current=({width:e,height:t,dpr:a})=>{r.dpr=a,r.setSize(Math.max(1,Math.floor(e)),Math.max(1,Math.floor(t)));let n=b.iResolution.value;n[0]=l.drawingBufferWidth,n[1]=l.drawingBufferHeight,I()},P.current=e=>{let t=Math.min(.05,(e-D)/1e3);D=e;let a=C.current,n=z.current,i=a.paused||a.reducedMotion?0:1;if(Y+=(i-Y)*Math.min(1,4*t),0===i&&Y<.001&&(Y=0),(M+=t*Y)>300&&(M-=300),!n.dragging){n.yaw+=n.velYaw*t,n.pitch+=n.velPitch*t;let e=Math.exp(-3.2*t);n.velYaw*=e,n.velPitch*=e,a.autoRotate&&(n.yaw+=.5*a.rotateSpeed*t*Y)}n.pitch=Math.max(-1.3,Math.min(1.3,n.pitch)),F(),r.render({scene:w});let o=.001>Math.abs(n.velYaw)&&.001>Math.abs(n.velPitch)&&!n.dragging;if(0===i&&0===Y&&o)return!1};let A=e=>{let r=z.current;r.dragging=!0,r.velYaw=0,r.velPitch=0,r.lastX=e.clientX,r.lastY=e.clientY,t.setPointerCapture(e.pointerId)},L=e=>{let t=z.current;if(!t.dragging)return;let r=e.clientX-t.lastX,a=e.clientY-t.lastY;t.lastX=e.clientX,t.lastY=e.clientY,t.yaw+=.006*r,t.pitch+=.006*a,t.pitch=Math.max(-1.3,Math.min(1.3,t.pitch)),t.velYaw=.006*r*60,t.velPitch=.006*a*60,E.start()},T=e=>{let r=z.current;if(r.dragging){r.dragging=!1;try{t.releasePointerCapture(e.pointerId)}catch{}E.start()}};return t.addEventListener("pointerdown",A),t.addEventListener("pointermove",L),t.addEventListener("pointerup",T),t.addEventListener("pointercancel",T),E.resize(),E.start(),()=>{P.current=null,k.current=null,B.current=null,t.removeEventListener("pointerdown",A),t.removeEventListener("pointermove",L),t.removeEventListener("pointerup",T),t.removeEventListener("pointercancel",T);try{t.removeChild(p)}catch{}}},[]),(0,r.useEffect)(()=>{B.current?.()},[e,d,f,v,m,h]),(0,r.useEffect)(()=>{E.start()},[y,w,p,g,E]),M)?(0,t.jsx)("div",{className:`relative h-full w-full overflow-hidden ${b}`.trim(),style:{background:"conic-gradient(from 210deg at 55% 45%, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, transparent 65%), #05010a"}}):(0,t.jsx)("div",{ref:x,className:`relative h-full w-full cursor-grab overflow-hidden active:cursor-grabbing [&_canvas]:touch-none ${b}`.trim()})};e.s(["default",0,function({values:e,reducedMotion:r,paused:a}){return(0,t.jsx)("div",{className:"relative h-full min-h-80 w-full",children:(0,t.jsx)(d,{dispersion:e.dispersion,bands:e.bands,beamIntensity:e.beamIntensity,beamColor:e.beamColor,saturation:e.saturation,fog:e.fog,autoRotate:e.autoRotate,rotateSpeed:e.rotateSpeed,paused:a,reducedMotion:r})})}],362135)},983613,function(e){e.n(e.i(362135))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let a=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{a.current=e});let n=(0,t.useRef)(null),i=(0,t.useRef)(null),o=(0,t.useRef)(!1),l=(0,t.useRef)(!1),u=(0,t.useRef)(0),s=(0,t.useRef)(0),c=(0,t.useRef)(0),d=(0,t.useCallback)(()=>{let e=a.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=a.current.dpr??"auto",n=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:n,bufferWidth:Math.max(1,Math.round(t.width*n)),bufferHeight:Math.max(1,Math.round(t.height*n))}},[]),f=(0,t.useCallback)(function e(t){if(l.current)return;0===u.current&&(u.current=t);let i=0===s.current?0:Math.min((t-s.current)/1e3,r);s.current=t;let d={now:t,dt:i,elapsed:(t-u.current)/1e3,frame:c.current++},f=a.current.onFrame?.(d);if(!l.current){if(!1===f||a.current.halted){o.current=!1,n.current=null;return}n.current=requestAnimationFrame(e)}},[]),v=(0,t.useCallback)(()=>{l.current||o.current||(o.current=!0,s.current=0,n.current=requestAnimationFrame(f))},[f]),m=(0,t.useCallback)(()=>{o.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null)},[]),h=(0,t.useCallback)(()=>v(),[v]),p=(0,t.useCallback)(()=>{let e=d();e&&(a.current.onResize?.(e),!1!==a.current.paintWhenHalted?h():a.current.halted||v())},[d,h,v]),g=e.deps??[];(0,t.useEffect)(()=>{l.current=!1;let e=a.current.target.current;if(!e)return;let t=()=>{l.current||p()},r=new ResizeObserver(()=>{let e=a.current.resizeDebounceMs??0;e<=0?t():(null!==i.current&&clearTimeout(i.current),i.current=setTimeout(()=>{i.current=null,t()},e))});return r.observe(e),p(),a.current.halted||v(),()=>{l.current=!0,o.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null),null!==i.current&&(clearTimeout(i.current),i.current=null),r.disconnect(),a.current.onDispose?.();let e=a.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),u.current=0,s.current=0,c.current=0}},g);let y=e.halted??!1;return(0,t.useEffect)(()=>{y||v()},[y,v]),(0,t.useMemo)(()=>({start:v,stop:m,paint:h,resize:p,get running(){return o.current}}),[v,m,h,p])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);