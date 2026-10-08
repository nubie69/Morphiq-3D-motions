(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,551175,e=>{"use strict";var t=e.i(843476),r=e.i(271645),u=e.i(221663),n=e.i(956850),a=e.i(80075),o=e.i(753604),l=e.i(450922);let i=e=>{let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[1,1,1]},c=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,s=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uTimeSpeed;
uniform float uColorBalance;
uniform float uWarpStrength;
uniform float uWarpFrequency;
uniform float uWarpSpeed;
uniform float uWarpAmplitude;
uniform float uBlendAngle;
uniform float uBlendSoftness;
uniform float uRotationAmount;
uniform float uNoiseScale;
uniform float uGrainAmount;
uniform float uGrainScale;
uniform float uGrainAnimated;
uniform float uContrast;
uniform float uGamma;
uniform float uSaturation;
uniform vec2 uCenterOffset;
uniform float uZoom;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;
#define S(a,b,t) smoothstep(a,b,t)
mat2 Rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),dot(-1.0+2.0*hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(-1.0+2.0*hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);return 0.5+0.5*n;}
void mainImage(out vec4 o, vec2 C){
  float t=iTime*uTimeSpeed;
  vec2 uv=C/iResolution.xy;
  float ratio=iResolution.x/iResolution.y;
  vec2 tuv=uv-0.5+uCenterOffset;
  tuv/=max(uZoom,0.001);

  float degree=noise(vec2(t*0.1,tuv.x*tuv.y)*uNoiseScale);
  tuv.y*=1.0/ratio;
  tuv*=Rot(radians((degree-0.5)*uRotationAmount+180.0));
  tuv.y*=ratio;

  float frequency=uWarpFrequency;
  float ws=max(uWarpStrength,0.001);
  float amplitude=uWarpAmplitude/ws;
  float warpTime=t*uWarpSpeed;
  tuv.x+=sin(tuv.y*frequency+warpTime)/amplitude;
  tuv.y+=sin(tuv.x*(frequency*1.5)+warpTime)/(amplitude*0.5);

  vec3 colLav=uColor1;
  vec3 colOrg=uColor2;
  vec3 colDark=uColor3;
  float b=uColorBalance;
  float s=max(uBlendSoftness,0.0);
  mat2 blendRot=Rot(radians(uBlendAngle));
  float blendX=(tuv*blendRot).x;
  float edge0=-0.3-b-s;
  float edge1=0.2-b+s;
  float v0=0.5-b+s;
  float v1=-0.3-b-s;
  vec3 layer1=mix(colDark,colOrg,S(edge0,edge1,blendX));
  vec3 layer2=mix(colOrg,colLav,S(edge0,edge1,blendX));
  vec3 col=mix(layer1,layer2,S(v0,v1,tuv.y));

  vec2 grainUv=uv*max(uGrainScale,0.001);
  if(uGrainAnimated>0.5){grainUv+=vec2(iTime*0.05);}
  float grain=fract(sin(dot(grainUv,vec2(12.9898,78.233)))*43758.5453);
  col+=(grain-0.5)*uGrainAmount;

  col=(col-0.5)*uContrast+0.5;
  float luma=dot(col,vec3(0.2126,0.7152,0.0722));
  col=mix(vec3(luma),col,uSaturation);
  col=pow(max(col,0.0),vec3(1.0/max(uGamma,0.001)));
  col=clamp(col,0.0,1.0);

  o=vec4(col,1.0);
}
void main(){
  vec4 o=vec4(0.0);
  mainImage(o,gl_FragCoord.xy);
  fragColor=o;
}
`,f=new WeakMap,m=({blendAngle:e=0,blendSoftness:m=.5,centerX:v=0,centerY:d=0,color1:p="#f754f1",color2:h="#6d28d9",color3:g="#22d3ee",colorBalance:y=0,contrast:w=1,gamma:S=1,grainAmount:C=.12,grainAnimated:A=!1,grainScale:R=1.6,noiseScale:b=1.2,rotationAmount:x=800,saturation:F=1.1,timeSpeed:T=1,warpAmplitude:W=50,warpFrequency:B=2,warpSpeed:G=2,warpStrength:M=.8,zoom:O=1,paused:q=!1,className:k=""})=>{let z=(0,r.useRef)(null),E=(0,r.useRef)(q);E.current=q;let L=(0,r.useRef)(null),I=(0,r.useRef)(null),P=(0,r.useRef)(null),N=(0,l.useAnimationLoop)({target:z,halted:!1,dpr:"auto",onResize:e=>I.current?.(e),onFrame:({now:e})=>!!L.current&&L.current(e),gl:()=>P.current});return(0,r.useEffect)(()=>{let e=z.current;if(!e)return;let t=new u.Renderer({webgl:2,alpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)}),r=t.gl;P.current=r;let l=r.canvas;l.style.width="100%",l.style.height="100%",l.style.display="block",e.appendChild(l);let m=new o.Triangle(r),v=new n.Program(r,{vertex:c,fragment:s,uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uTimeSpeed:{value:.9},uColorBalance:{value:0},uWarpStrength:{value:1.6},uWarpFrequency:{value:5},uWarpSpeed:{value:2},uWarpAmplitude:{value:50},uBlendAngle:{value:0},uBlendSoftness:{value:.22},uRotationAmount:{value:500},uNoiseScale:{value:.25},uGrainAmount:{value:0},uGrainScale:{value:1.6},uGrainAnimated:{value:0},uContrast:{value:1.5},uGamma:{value:1},uSaturation:{value:1.1},uCenterOffset:{value:new Float32Array([0,0])},uZoom:{value:.95},uColor1:{value:new Float32Array(i("#FF9FFC"))},uColor2:{value:new Float32Array(i("#2754ff"))},uColor3:{value:new Float32Array(i("#ee27af"))}}}),d=new a.Mesh(r,{geometry:m,program:v});f.set(e,{renderer:t,program:v,mesh:d}),I.current=({width:e,height:u,dpr:n})=>{t.dpr=n,t.setSize(Math.max(1,Math.floor(e)),Math.max(1,Math.floor(u)));let a=v.uniforms.iResolution.value;a[0]=r.drawingBufferWidth,a[1]=r.drawingBufferHeight,t.render({scene:d})};let p=!0,h=!document.hidden,g=performance.now();L.current=e=>{if(v.uniforms.iTime.value=(e-g)*.001,t.render({scene:d}),!p||!h||E.current)return!1};let y=new IntersectionObserver(([e])=>{(p=e.isIntersecting)&&N.start()},{threshold:0});y.observe(e);let w=()=>{(h=!document.hidden)&&N.start()};return document.addEventListener("visibilitychange",w),N.resize(),N.start(),()=>{L.current=null,I.current=null,y.disconnect(),document.removeEventListener("visibilitychange",w),f.delete(e);try{e.removeChild(l)}catch{}}},[]),(0,r.useEffect)(()=>{let t=z.current;if(!t)return;let r=f.get(t);if(!r)return;let{program:u}=r,n=u.uniforms;n.uTimeSpeed.value=T,n.uColorBalance.value=y,n.uWarpStrength.value=M,n.uWarpFrequency.value=B,n.uWarpSpeed.value=G,n.uWarpAmplitude.value=W,n.uBlendAngle.value=e,n.uBlendSoftness.value=m,n.uRotationAmount.value=x,n.uNoiseScale.value=b,n.uGrainAmount.value=C,n.uGrainScale.value=R,n.uGrainAnimated.value=+!!A,n.uContrast.value=w,n.uGamma.value=S,n.uSaturation.value=F,n.uCenterOffset.value=new Float32Array([v,d]),n.uZoom.value=O,n.uColor1.value=new Float32Array(i(p)),n.uColor2.value=new Float32Array(i(h)),n.uColor3.value=new Float32Array(i(g)),E.current&&r.renderer.render({scene:r.mesh})},[T,y,M,B,G,W,e,m,x,b,C,R,A,w,S,F,v,d,O,p,h,g]),(0,r.useEffect)(()=>{q||N.start()},[q,N]),(0,t.jsx)("div",{ref:z,className:`relative h-full w-full overflow-hidden ${k}`.trim()})};e.s(["default",0,function({values:e,reducedMotion:r,paused:u}){let n=u||r;return(0,t.jsx)(m,{timeSpeed:n?0:e.timeSpeed,warpStrength:e.warpStrength,warpFrequency:e.warpFrequency,warpSpeed:+!n,blendSoftness:e.blendSoftness,noiseScale:e.noiseScale,grainAmount:e.grainAmount,contrast:e.contrast,saturation:e.saturation,zoom:e.zoom,color1:e.color1,color2:e.color2,color3:e.color3,paused:n})}],551175)},221521,function(e){e.n(e.i(551175))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let u=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{u.current=e});let n=(0,t.useRef)(null),a=(0,t.useRef)(null),o=(0,t.useRef)(!1),l=(0,t.useRef)(!1),i=(0,t.useRef)(0),c=(0,t.useRef)(0),s=(0,t.useRef)(0),f=(0,t.useCallback)(()=>{let e=u.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=u.current.dpr??"auto",n=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:n,bufferWidth:Math.max(1,Math.round(t.width*n)),bufferHeight:Math.max(1,Math.round(t.height*n))}},[]),m=(0,t.useCallback)(function e(t){if(l.current)return;0===i.current&&(i.current=t);let a=0===c.current?0:Math.min((t-c.current)/1e3,r);c.current=t;let f={now:t,dt:a,elapsed:(t-i.current)/1e3,frame:s.current++},m=u.current.onFrame?.(f);if(!l.current){if(!1===m||u.current.halted){o.current=!1,n.current=null;return}n.current=requestAnimationFrame(e)}},[]),v=(0,t.useCallback)(()=>{l.current||o.current||(o.current=!0,c.current=0,n.current=requestAnimationFrame(m))},[m]),d=(0,t.useCallback)(()=>{o.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null)},[]),p=(0,t.useCallback)(()=>v(),[v]),h=(0,t.useCallback)(()=>{let e=f();e&&(u.current.onResize?.(e),!1!==u.current.paintWhenHalted?p():u.current.halted||v())},[f,p,v]),g=e.deps??[];(0,t.useEffect)(()=>{l.current=!1;let e=u.current.target.current;if(!e)return;let t=()=>{l.current||h()},r=new ResizeObserver(()=>{let e=u.current.resizeDebounceMs??0;e<=0?t():(null!==a.current&&clearTimeout(a.current),a.current=setTimeout(()=>{a.current=null,t()},e))});return r.observe(e),h(),u.current.halted||v(),()=>{l.current=!0,o.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null),null!==a.current&&(clearTimeout(a.current),a.current=null),r.disconnect(),u.current.onDispose?.();let e=u.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),i.current=0,c.current=0,s.current=0}},g);let y=e.halted??!1;return(0,t.useEffect)(()=>{y||v()},[y,v]),(0,t.useMemo)(()=>({start:v,stop:d,paint:p,resize:h,get running(){return o.current}}),[v,d,p,h])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);