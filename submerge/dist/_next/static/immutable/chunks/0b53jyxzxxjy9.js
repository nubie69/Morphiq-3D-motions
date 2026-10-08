(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,560510,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(221663),n=e.i(956850),l=e.i(80075),o=e.i(753604),i=e.i(450922);let u=e=>{let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[1,1,1]},c={blobs:0,stripes:1,checker:2},s=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,d=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uIor;
uniform float uDispersion;
uniform float uFrostUv;
uniform float uEdgeWidth;
uniform float uGlare;
uniform float uSlabWidth;
uniform float uScene;
uniform vec2 uCenter;
uniform vec3 uTint;
out vec4 fragColor;

float sdRoundBox(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec2 hash2(vec2 p){
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// The backdrop the glass bends. Procedural, so refraction can sample it at
// any offset with no framebuffer round-trip.
vec3 scene(vec2 p, float t){
  if (uScene < 0.5) {
    // drifting gradient blobs
    vec3 col = vec3(0.035, 0.025, 0.06);
    vec2 c1 = vec2(0.55 + 0.30 * sin(t * 0.31), 0.55 + 0.24 * cos(t * 0.23));
    vec2 c2 = vec2(1.05 + 0.34 * cos(t * 0.17), 0.40 + 0.27 * sin(t * 0.27));
    vec2 c3 = vec2(0.80 + 0.30 * sin(t * 0.21 + 2.1), 0.75 + 0.22 * cos(t * 0.19 + 1.2));
    col += vec3(0.55, 0.25, 0.85) * exp(-dot(p - c1, p - c1) * 9.0);
    col += vec3(0.15, 0.45, 0.85) * exp(-dot(p - c2, p - c2) * 11.0);
    col += vec3(0.85, 0.30, 0.45) * exp(-dot(p - c3, p - c3) * 13.0);
    return col;
  }
  if (uScene < 1.5) {
    // slanted travelling stripes
    float s = sin((p.x + p.y) * 18.0 - t * 0.7);
    float band = smoothstep(-0.15, 0.15, s);
    return mix(vec3(0.05, 0.03, 0.09), vec3(0.55, 0.35, 0.9), band * 0.75 + 0.05);
  }
  // checker
  vec2 g = floor(p * 7.0 + vec2(t * 0.15, 0.0));
  float c = mod(g.x + g.y, 2.0);
  return mix(vec3(0.05, 0.04, 0.08), vec3(0.42, 0.32, 0.65), c * 0.8 + 0.05);
}

void main(){
  float aspect = iResolution.x / max(iResolution.y, 1.0);
  // y-normalized coords: x in [0, aspect], y in [0, 1]
  vec2 p = gl_FragCoord.xy / iResolution.y;
  float t = iTime;

  vec2 halfSize = vec2(uSlabWidth * aspect * 0.5, uSlabWidth * aspect * 0.31);
  float corner = 0.30 * min(halfSize.x, halfSize.y);
  vec2 rel = p - uCenter;
  float d = sdRoundBox(rel, halfSize, corner);

  vec3 col;
  if (d > 0.0) {
    col = scene(p, t);
    // soft drop shadow hugging the slab
    float shadow = 1.0 - 0.35 * exp(-d * d * 900.0);
    col *= shadow;
  } else {
    // ── inside the glass ───────────────────────────────────────────────────
    // Height profile: flat middle, smooth falloff over the bevel band.
    float edge = uEdgeWidth * min(halfSize.x, halfSize.y) * 2.0;
    float h = smoothstep(0.0, edge, -d);

    // Normal of the height field — analytic gradient via 4 cheap SDF taps.
    float e = 0.002;
    float hx = smoothstep(0.0, edge, -sdRoundBox(rel + vec2(e, 0.0), halfSize, corner))
             - smoothstep(0.0, edge, -sdRoundBox(rel - vec2(e, 0.0), halfSize, corner));
    float hy = smoothstep(0.0, edge, -sdRoundBox(rel + vec2(0.0, e), halfSize, corner))
             - smoothstep(0.0, edge, -sdRoundBox(rel - vec2(0.0, e), halfSize, corner));
    vec2 grad = vec2(hx, hy) / (2.0 * e);
    float slope = length(grad);

    // The bevel bends; the flat middle passes almost straight through.
    vec2 bend = grad * uIor * 0.22;

    // Three channels sampled at wavelength-spread strengths, 8-tap frost each
    // folded into one loop: accumulate scene at poisson offsets around the
    // three refracted anchors.
    vec2 uvR = p - bend * (1.0 + uDispersion * 0.35);
    vec2 uvG = p - bend;
    vec2 uvB = p - bend * (1.0 - uDispersion * 0.35);

    vec2 taps[8];
    taps[0] = vec2(-0.71, -0.19); taps[1] = vec2(0.28, -0.72);
    taps[2] = vec2(0.82, 0.17);  taps[3] = vec2(-0.24, 0.75);
    taps[4] = vec2(-0.45, -0.61); taps[5] = vec2(0.61, -0.35);
    taps[6] = vec2(0.31, 0.62);  taps[7] = vec2(-0.68, 0.36);

    vec3 acc = vec3(0.0);
    for (int i = 0; i < 8; i++){
      vec2 o = taps[i] * uFrostUv;
      acc.r += scene(uvR + o, t).r;
      acc.g += scene(uvG + o, t).g;
      acc.b += scene(uvB + o, t).b;
    }
    col = acc / 8.0;

    // glass body: faint tint, brighter where the pane is thin (the bevel)
    col = mix(col, col * uTint + uTint * 0.06, 0.28);

    // Fresnel rim: the bevel's slope is the grazing angle
    float fres = clamp(slope * 0.10, 0.0, 1.0);
    col += uTint * fres * fres * uGlare * 0.9;

    // travelling specular streak across the pane
    float sweep = fract(t * 0.11);
    float band = dot(rel, normalize(vec2(0.8, 0.6))) / (halfSize.x * 2.0) + 0.5;
    float streak = exp(-pow((band - sweep) * 7.0, 2.0));
    col += vec3(1.0) * streak * uGlare * (0.10 + fres * 0.5);

    // top-edge highlight so the slab reads lit from above
    col += vec3(1.0) * max(-grad.y, 0.0) * 0.02 * uGlare;

    // frosted grain
    float g = hash2(gl_FragCoord.xy).x;
    col += (g - 0.5) * 0.025;
  }

  col = clamp(col, 0.0, 1.0);
  fragColor = vec4(col, 1.0);
}
`,h=({ior:e=.18,dispersion:h=.35,frost:f=6,edgeWidth:v=.18,glare:p=.5,slabWidth:g=46,scene:m="blobs",tint:x="#e9e6ff",paused:b=!1,reducedMotion:y=!1,className:w=""})=>{let M=(0,r.useRef)(null),[R,S]=(0,r.useState)(!1),T=(0,r.useRef)({ior:e,dispersion:h,frost:f,edgeWidth:v,glare:p,slabWidth:g,scene:m,tint:x,paused:b,reducedMotion:y});T.current={ior:e,dispersion:h,frost:f,edgeWidth:v,glare:p,slabWidth:g,scene:m,tint:x,paused:b,reducedMotion:y};let C=(0,r.useRef)({x:.9,y:.5,vx:0,vy:0,dragging:!1,grabDx:0,grabDy:0,lastX:0,lastY:0,lastT:0}),z=(0,r.useRef)(null),E=(0,r.useRef)(null),W=(0,r.useRef)(null),F=(0,r.useRef)(null),k=(0,i.useAnimationLoop)({target:M,halted:!1,dpr:"auto",onResize:e=>W.current?.(e),onFrame:({now:e})=>!!E.current&&E.current(e),gl:()=>F.current});return((0,r.useEffect)(()=>{let t=M.current;if(!t)return;if(!document.createElement("canvas").getContext("webgl2"))return void S(!0);let r=new a.Renderer({webgl:2,alpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)}),i=r.gl;F.current=i;let f=i.canvas;f.style.width="100%",f.style.height="100%",f.style.display="block",f.style.position="absolute",f.style.top="0",f.style.left="0",t.appendChild(f);let b=new o.Triangle(i),y=new n.Program(i,{vertex:s,fragment:d,uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uIor:{value:e},uDispersion:{value:h},uFrostUv:{value:0},uEdgeWidth:{value:v},uGlare:{value:p},uSlabWidth:{value:g/100},uScene:{value:c[m]},uCenter:{value:new Float32Array([.9,.5])},uTint:{value:new Float32Array(u(x))}}}),w=new l.Mesh(i,{geometry:b,program:y}),R=y.uniforms,B=0,D=T.current.paused||T.current.reducedMotion?0:1,A=performance.now(),L=1,G=1,I=()=>{let e=L/Math.max(G,1),t=T.current.slabWidth/100*e*.5;return{hx:t,hy:.62*t,aspect:e}},P=()=>{var e;let t,r=T.current,a=C.current;R.iTime.value=B,R.uIor.value=r.ior,R.uDispersion.value=r.dispersion,R.uFrostUv.value=r.frost/Math.max(G,1),R.uEdgeWidth.value=r.edgeWidth,R.uGlare.value=r.glare,R.uSlabWidth.value=r.slabWidth/100,R.uScene.value=c[r.scene]??0;let n=R.uCenter.value;n[0]=a.x,n[1]=a.y,e=R.uTint.value,t=u(r.tint),e[0]=t[0],e[1]=t[1],e[2]=t[2]},j=()=>{P(),r.render({scene:w})};z.current=j,W.current=({width:e,height:t,dpr:a})=>{L=Math.max(1,e),G=Math.max(1,t),r.dpr=a,r.setSize(Math.max(1,Math.floor(e)),Math.max(1,Math.floor(t)));let n=R.iResolution.value;n[0]=i.drawingBufferWidth,n[1]=i.drawingBufferHeight,j()},E.current=e=>{let t=Math.min(.05,(e-A)/1e3);A=e;let a=T.current,n=C.current,l=a.paused||a.reducedMotion?0:1;D+=(l-D)*Math.min(1,4*t),0===l&&D<.001&&(D=0),(B+=t*D)>300&&(B-=300);let{hx:o,hy:i,aspect:u}=I();if(!n.dragging){n.x+=n.vx*t,n.y+=n.vy*t;let e=Math.exp(-4.5*t);n.vx*=e,n.vy*=e;let r=Math.max(o,Math.min(u-o,n.x)),a=Math.max(i,Math.min(1-i,n.y));n.x+=(r-n.x)*Math.min(1,10*t),n.y+=(a-n.y)*Math.min(1,10*t)}P(),r.render({scene:w});let c=!n.dragging&&.001>Math.abs(n.vx)&&.001>Math.abs(n.vy);if(0===l&&0===D&&c)return!1};let q=e=>{let r=t.getBoundingClientRect();return{x:(e.clientX-r.left)/Math.max(r.height,1),y:(r.bottom-e.clientY)/Math.max(r.height,1)}},U=e=>{let r=C.current,a=q(e),{hx:n,hy:l}=I();Math.abs(a.x-r.x)>n||Math.abs(a.y-r.y)>l||(r.dragging=!0,r.grabDx=r.x-a.x,r.grabDy=r.y-a.y,r.lastX=a.x,r.lastY=a.y,r.lastT=performance.now(),r.vx=0,r.vy=0,t.setPointerCapture(e.pointerId),k.start())},_=e=>{let t=C.current;if(!t.dragging)return;let r=q(e),a=performance.now(),n=Math.max(a-t.lastT,1),{hx:l,hy:o,aspect:i}=I(),u=r.x+t.grabDx,c=r.y+t.grabDy,s=Math.max(l,Math.min(i-l,u)),d=Math.max(o,Math.min(1-o,c));t.x=s+(u-s)*.35,t.y=d+(c-d)*.35,t.vx=(r.x-t.lastX)/n*1e3,t.vy=(r.y-t.lastY)/n*1e3,t.lastX=r.x,t.lastY=r.y,t.lastT=a,k.start()},N=e=>{let r=C.current;if(r.dragging){r.dragging=!1;try{t.releasePointerCapture(e.pointerId)}catch{}k.start()}};return t.addEventListener("pointerdown",U),t.addEventListener("pointermove",_),t.addEventListener("pointerup",N),t.addEventListener("pointercancel",N),k.resize(),k.start(),()=>{E.current=null,W.current=null,z.current=null,t.removeEventListener("pointerdown",U),t.removeEventListener("pointermove",_),t.removeEventListener("pointerup",N),t.removeEventListener("pointercancel",N);try{t.removeChild(f)}catch{}}},[]),(0,r.useEffect)(()=>{z.current?.()},[e,h,f,v,p,g,m,x]),(0,r.useEffect)(()=>{k.start()},[b,y,k]),R)?(0,t.jsx)("div",{className:`relative h-full w-full overflow-hidden ${w}`.trim(),style:{background:"radial-gradient(60% 90% at 30% 40%, #8b5cf655, transparent), radial-gradient(50% 80% at 75% 55%, #3b82f633, transparent), #0a0712"},children:(0,t.jsx)("div",{className:"absolute left-1/2 top-1/2 h-2/5 w-2/5 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md",style:{boxShadow:"0 20px 60px rgba(0,0,0,0.45)"}})}):(0,t.jsx)("div",{ref:M,className:`relative h-full w-full cursor-grab overflow-hidden active:cursor-grabbing [&_canvas]:touch-none ${w}`.trim()})};e.s(["default",0,function({values:e,reducedMotion:r,paused:a}){return(0,t.jsx)("div",{className:"relative h-full min-h-80 w-full",children:(0,t.jsx)(h,{ior:e.ior,dispersion:e.dispersion,frost:e.frost,edgeWidth:e.edgeWidth,glare:e.glare,slabWidth:e.slabWidth,scene:e.scene,tint:e.tint,paused:a,reducedMotion:r})})}],560510)},175110,function(e){e.n(e.i(560510))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let a=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{a.current=e});let n=(0,t.useRef)(null),l=(0,t.useRef)(null),o=(0,t.useRef)(!1),i=(0,t.useRef)(!1),u=(0,t.useRef)(0),c=(0,t.useRef)(0),s=(0,t.useRef)(0),d=(0,t.useCallback)(()=>{let e=a.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=a.current.dpr??"auto",n=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:n,bufferWidth:Math.max(1,Math.round(t.width*n)),bufferHeight:Math.max(1,Math.round(t.height*n))}},[]),h=(0,t.useCallback)(function e(t){if(i.current)return;0===u.current&&(u.current=t);let l=0===c.current?0:Math.min((t-c.current)/1e3,r);c.current=t;let d={now:t,dt:l,elapsed:(t-u.current)/1e3,frame:s.current++},h=a.current.onFrame?.(d);if(!i.current){if(!1===h||a.current.halted){o.current=!1,n.current=null;return}n.current=requestAnimationFrame(e)}},[]),f=(0,t.useCallback)(()=>{i.current||o.current||(o.current=!0,c.current=0,n.current=requestAnimationFrame(h))},[h]),v=(0,t.useCallback)(()=>{o.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null)},[]),p=(0,t.useCallback)(()=>f(),[f]),g=(0,t.useCallback)(()=>{let e=d();e&&(a.current.onResize?.(e),!1!==a.current.paintWhenHalted?p():a.current.halted||f())},[d,p,f]),m=e.deps??[];(0,t.useEffect)(()=>{i.current=!1;let e=a.current.target.current;if(!e)return;let t=()=>{i.current||g()},r=new ResizeObserver(()=>{let e=a.current.resizeDebounceMs??0;e<=0?t():(null!==l.current&&clearTimeout(l.current),l.current=setTimeout(()=>{l.current=null,t()},e))});return r.observe(e),g(),a.current.halted||f(),()=>{i.current=!0,o.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null),null!==l.current&&(clearTimeout(l.current),l.current=null),r.disconnect(),a.current.onDispose?.();let e=a.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),u.current=0,c.current=0,s.current=0}},m);let x=e.halted??!1;return(0,t.useEffect)(()=>{x||f()},[x,f]),(0,t.useMemo)(()=>({start:f,stop:v,paint:p,resize:g,get running(){return o.current}}),[f,v,p,g])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);