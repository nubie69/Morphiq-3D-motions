(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,855667,e=>{"use strict";var t=e.i(843476),r=e.i(271645),i=e.i(221663),a=e.i(956850),s=e.i(80075),n=e.i(753604),l=e.i(994964),h=e.i(562611),u=e.i(899925),o=e.i(450922);let g={"16k":128,"65k":256,"131k":362,"262k":512},c=e=>{let t=e.replace("#",""),r=3===t.length?t.split("").map(e=>e+e).join(""):t,i=parseInt(r,16);return Number.isNaN(i)||6!==r.length?[1,1,1]:[(i>>16&255)/255,(i>>8&255)/255,(255&i)/255]};function p(e,t){let r=document.createElement("canvas");r.width=512,r.height=160;let i=r.getContext("2d",{willReadFrequently:!0}),a=new Float32Array(4*t);if(!i)return a;i.fillStyle="#000",i.fillRect(0,0,512,160),i.fillStyle="#fff",i.textAlign="center",i.textBaseline="middle";let s=120;for(i.font=`700 ${s}px ui-monospace, Menlo, monospace`;i.measureText(e).width>471.04&&s>12;)s-=4,i.font=`700 ${s}px ui-monospace, Menlo, monospace`;i.fillText(e,256,80);let n=i.getImageData(0,0,512,160).data,l=[];for(let e=0;e<160;e++)for(let t=0;t<512;t++)n[(512*e+t)*4]>128&&l.push(t,e);for(let e=0;e<t;e++){let t=4*e;if(0===l.length){a[t]=0,a[t+1]=0,a[t+2]=0,a[t+3]=1;continue}let r=e%(l.length/2)*2,i=(l[r]+Math.random())/512,s=(l[r+1]+Math.random())/160;a[t]=(i-.5)*2.6,a[t+1]=-(.82*(s-.5)),a[t+2]=(Math.random()-.5)*.06,a[t+3]=1}return a}function f(e,t){let r=new Float32Array(4*t),i=Math.PI*(3-Math.sqrt(5));for(let a=0;a<t;a++){let s=4*a,n=0,l=0,h=0;if("sphere"===e){let e=1-a/Math.max(t-1,1)*2,r=Math.sqrt(Math.max(0,1-e*e)),s=i*a;n=Math.cos(s)*r,l=e,n*=.95,l*=.95,h=Math.sin(s)*r*.95}else if("torus"===e){let e=a/t*Math.PI*34,r=i*a;n=(.78+.3*Math.cos(r))*Math.cos(e),l=.3*Math.sin(r),h=(.78+.3*Math.cos(r))*Math.sin(e)}else if("grid"===e){let e=Math.ceil(Math.cbrt(t)),r=a%e,i=Math.floor(a/e)%e,s=Math.floor(a/(e*e));n=(r/(e-1)-.5)*1.9,l=(i/(e-1)-.5)*1.9,h=(s/(e-1)-.5)*1.9}else n=(Math.random()-.5)*3.2,l=(Math.random()-.5)*1.9,h=(Math.random()-.5)*2.2;r[s]=n,r[s+1]=l,r[s+2]=h,r[s+3]=1}return r}let m=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`,d=`
vec3 hash33(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
           dot(p, vec3(269.5, 183.3, 246.1)),
           dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453) * 2.0 - 1.0;
}
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(dot(hash33(i + vec3(0,0,0)), f - vec3(0,0,0)), dot(hash33(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
        mix(dot(hash33(i + vec3(0,1,0)), f - vec3(0,1,0)), dot(hash33(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
    mix(mix(dot(hash33(i + vec3(0,0,1)), f - vec3(0,0,1)), dot(hash33(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
        mix(dot(hash33(i + vec3(0,1,1)), f - vec3(0,1,1)), dot(hash33(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y),
    u.z);
}
// Curl of a noise field. Divergence-free by construction, which is the entire
// reason to use it here: it stirs without thinning or piling up.
vec3 curlNoise(vec3 p) {
  const float e = 0.12;
  float n1 = vnoise(p + vec3(0.0, e, 0.0)), n2 = vnoise(p - vec3(0.0, e, 0.0));
  float n3 = vnoise(p + vec3(0.0, 0.0, e)), n4 = vnoise(p - vec3(0.0, 0.0, e));
  float n5 = vnoise(p + vec3(e, 0.0, 0.0)), n6 = vnoise(p - vec3(e, 0.0, 0.0));
  return normalize(vec3(n1 - n2 - (n3 - n4), n3 - n4 - (n5 - n6), n5 - n6 - (n1 - n2)) + 1e-6);
}`,v=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uPos;
uniform sampler2D uVel;
uniform sampler2D uTarget;
uniform float uDt;
uniform float uMorph;
uniform float uStagger;
uniform float uCurl;
uniform float uDamping;
uniform float uRepel;
uniform vec2  uPointer;
uniform float uPointerOn;
uniform float uTime;
${d}

void main() {
  vec3 pos = texture(uPos, vUv).xyz;
  vec3 vel = texture(uVel, vUv).xyz;
  vec3 tgt = texture(uTarget, vUv).xyz;

  // Per-particle phase from its own texel, so the cloud arrives over a spread of
  // time rather than all at once. Deterministic, so it does not reshuffle when
  // the shape changes.
  float phase = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
  float gain = mix(1.0, 0.25 + phase * 1.5, uStagger);

  vec3 toTarget = tgt - pos;
  vec3 acc = toTarget * uMorph * 9.0 * gain;

  // uDamping is a fixed velocity decay — it does not scale with the spring it is
  // damping. At the default morphSpeed that decay sits almost exactly at
  // critical damping, which is why the default morph settles clean. The ratio
  // falls as morphSpeed rises though, and a stiff spring under a fixed decay
  // overshoots: the cloud flies past its target and springs back, which reads as
  // the whole thing zooming rather than morphing. Top the damping up to critical
  // whenever the spring outruns it. Derived from the NOMINAL stiffness, ignoring
  // the per-particle stagger gain, so the term is exactly zero at and below the
  // default and the shipped look is untouched.
  float cHave = -60.0 * log(clamp(uDamping, 0.01, 0.999));
  float cNeed = 2.0 * sqrt(uMorph * 9.0);
  acc -= vel * max(0.0, cNeed - cHave);

  // Turbulence fades out as a particle closes on its target. Applied at full
  // strength everywhere it competes with the restoring force near the target,
  // and the cloud hovers permanently in a band a few tenths wide — which reads
  // as an amorphous blob no matter what shape it was given. Fading it means the
  // curl stirs the crossing and lets the arrival settle.
  float travel = clamp(length(toTarget) * 1.6, 0.0, 1.0);
  acc += curlNoise(pos * 0.9 + uTime * 0.12) * uCurl * 1.6 * travel;

  if (uPointerOn > 0.5) {
    vec3 d = pos - vec3(uPointer, 0.0);
    float r2 = dot(d, d);
    acc += normalize(d + 1e-6) * uRepel * 4.0 * exp(-r2 * 5.0);
  }

  vel = vel * pow(uDamping, uDt * 60.0) + acc * uDt;
  fragColor = vec4(vel, 1.0);
}`,E=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uPos;
uniform sampler2D uVel;
uniform float uDt;
void main() {
  vec3 pos = texture(uPos, vUv).xyz;
  vec3 vel = texture(uVel, vUv).xyz;
  fragColor = vec4(pos + vel * uDt, 1.0);
}`,T=`#version 300 es
in vec2 reference;
uniform sampler2D uPos;
uniform sampler2D uVel;
uniform float uPointSize;
uniform float uAspect;
uniform float uSpin;
uniform float uPitch;
uniform float uZoom;
out float vSpeed;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

void main() {
  vec3 p = texture(uPos, reference).xyz;
  vSpeed = length(texture(uVel, reference).xyz);
  // Yaw before pitch. The other order tilts the axis the yaw then spins about,
  // so the cloud rolls instead of orbiting.
  p.xz *= rot(uSpin);
  p.yz *= rot(uPitch);
  // Weak perspective, computed here rather than through a matrix — there is one
  // camera, it never moves, and a uniform matrix would be three more uploads a
  // frame for a constant.
  float persp = 1.0 / (2.9 - p.z * 0.55);
  vec2 screen = vec2(p.x / uAspect, p.y) * persp * 2.2 * uZoom;
  gl_Position = vec4(screen, 0.0, 1.0);
  // Sprites scale with the zoom too. Leaving them fixed makes a zoomed-in
  // cloud look sparser rather than closer, which is the tell that the zoom is
  // a viewport crop rather than a camera.
  gl_PointSize = max(uPointSize * persp * 2.4 * uZoom, 1.0);
}`,R=`#version 300 es
precision highp float;
in float vSpeed;
out vec4 fragColor;
uniform vec3 uColor;
uniform vec3 uAccent;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = dot(d, d);
  if (r > 0.25) discard;
  float a = smoothstep(0.25, 0.02, r);
  // Moving particles take the accent; settled ones fall back to the base. The
  // colour is the readout of the simulation rather than decoration on it.
  vec3 col = mix(uColor, uAccent, clamp(vSpeed * 1.6, 0.0, 1.0));
  fragColor = vec4(col, a);
}`,x=["text","sphere","torus","grid"],w=(0,r.memo)(({density:e="65k",shape:d="auto",targets:w=["GARDEN","ETA","VII"],swapDuration:A=3.2,morphSpeed:P=1.1,stagger:M=.45,curl:_=.3,damping:S=.9,repel:D=1,pointSize:F=1.6,zoom:N=1,autoSpin:y=!0,particleColor:b="#a855f7",accentColor:C="#67e8f9",backgroundColor:U="#04040a",paused:I=!1,reducedMotion:B=!1,className:L})=>{let O=(0,r.useRef)(null),G=(0,r.useRef)(null),X=(0,r.useRef)(null),z=(0,r.useRef)(null),Y=(0,r.useRef)(null),k=(0,r.useRef)({x:0,y:0,on:!1}),H=(0,r.useRef)({yaw:0,pitch:0,vYaw:0,vPitch:0,dragging:!1,pointerId:-1,lastX:0,lastY:0,lastT:0}),[V,W]=(0,r.useState)(!1),j=(0,r.useRef)(I);j.current=I;let q=(0,o.useAnimationLoop)({target:O,halted:I,dpr:"auto",onResize:e=>X.current?.(e),onFrame:({dt:e})=>!!G.current&&G.current(e),gl:()=>z.current}),K=(0,r.useRef)({shape:d,targets:w,swapDuration:A,morphSpeed:P,stagger:M,curl:_,damping:S,repel:D,pointSize:F,zoom:N,autoSpin:y,particleColor:b,accentColor:C,backgroundColor:U,reducedMotion:B});K.current={shape:d,targets:w,swapDuration:A,morphSpeed:P,stagger:M,curl:_,damping:S,repel:D,pointSize:F,zoom:N,autoSpin:y,particleColor:b,accentColor:C,backgroundColor:U,reducedMotion:B},(0,r.useEffect)(()=>{let t,r=O.current;if(V||!r)return;let o=g[e]??256,A=o*o;try{if(!(t=new i.Renderer({webgl:2,alpha:!1,antialias:!1,powerPreference:"high-performance",dpr:Math.min(window.devicePixelRatio||1,2)})).gl.getExtension("EXT_color_buffer_float"))throw Error("Swarm requires EXT_color_buffer_float")}catch{W(!0);return}let y=t.gl;z.current=y;let U=y.canvas;U.style.display="block",U.style.position="absolute",U.style.top="0",U.style.left="0",r.appendChild(U);let I=()=>new h.RenderTarget(y,{width:o,height:o,depth:!1,type:y.FLOAT,format:y.RGBA,internalFormat:y.RGBA32F,minFilter:y.NEAREST,magFilter:y.NEAREST,wrapS:y.CLAMP_TO_EDGE,wrapT:y.CLAMP_TO_EDGE}),B=I(),L=I(),Z=I(),$=I(),J=new u.Texture(y,{image:"auto"===d||"text"===d?p(w[0]??"GARDEN",A):f(d,A),width:o,height:o,type:y.FLOAT,format:y.RGBA,internalFormat:y.RGBA32F,minFilter:y.NEAREST,magFilter:y.NEAREST,generateMipmaps:!1,flipY:!1}),Q=new n.Triangle(y),ee=f("disperse",A),et=new u.Texture(y,{image:ee,width:o,height:o,type:y.FLOAT,format:y.RGBA,internalFormat:y.RGBA32F,minFilter:y.NEAREST,magFilter:y.NEAREST,generateMipmaps:!1,flipY:!1}),er=new u.Texture(y,{image:new Float32Array(4*A),width:o,height:o,type:y.FLOAT,format:y.RGBA,internalFormat:y.RGBA32F,minFilter:y.NEAREST,magFilter:y.NEAREST,generateMipmaps:!1,flipY:!1}),ei=new a.Program(y,{vertex:m,fragment:`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSrc;
void main() { fragColor = texture(uSrc, vUv); }`,uniforms:{uSrc:{value:et}}}),ea=new s.Mesh(y,{geometry:Q,program:ei}),es=ei.uniforms;es.uSrc.value=et,t.render({scene:ea,target:B}),t.render({scene:ea,target:L}),es.uSrc.value=er,t.render({scene:ea,target:Z}),t.render({scene:ea,target:$});let en=new a.Program(y,{vertex:m,fragment:v,uniforms:{uPos:{value:B.texture},uVel:{value:Z.texture},uTarget:{value:J},uDt:{value:.016},uMorph:{value:P},uStagger:{value:M},uCurl:{value:_},uDamping:{value:S},uRepel:{value:D},uPointer:{value:new Float32Array([0,0])},uPointerOn:{value:0},uTime:{value:0}}}),el=new a.Program(y,{vertex:m,fragment:E,uniforms:{uPos:{value:B.texture},uVel:{value:Z.texture},uDt:{value:.016}}}),eh=new s.Mesh(y,{geometry:Q,program:en}),eu=new s.Mesh(y,{geometry:Q,program:el}),eo=new Float32Array(2*A);for(let e=0;e<A;e++)eo[2*e]=(e%o+.5)/o,eo[2*e+1]=(Math.floor(e/o)+.5)/o;let eg=new l.Geometry(y,{reference:{size:2,data:eo}}),ec=new a.Program(y,{vertex:T,fragment:R,transparent:!0,depthTest:!1,depthWrite:!1,uniforms:{uPos:{value:B.texture},uVel:{value:Z.texture},uPointSize:{value:F},uAspect:{value:1},uSpin:{value:0},uPitch:{value:0},uZoom:{value:N},uColor:{value:new Float32Array(c(b))},uAccent:{value:new Float32Array(c(C))}}});ec.setBlendFunc(y.SRC_ALPHA,y.ONE);let ep=new s.Mesh(y,{geometry:eg,program:ec,mode:y.POINTS}),ef=en.uniforms,em=el.uniforms,ed=ec.uniforms;Y.current=(e,t)=>{J.image="text"===e?p(t,A):f(e,A),J.needsUpdate=!0};let ev=0,eE=0,eT=0,eR=0,ex=0,ew=K.current.autoSpin,eA=!1,eP=0,eM=0,e_=0;return G.current=e=>{let r=K.current,i=H.current,a=Math.min(e,1/30),s=j.current;if(!s){if(ev=(ev+a)%1e3,!i.dragging){i.yaw+=i.vYaw*a,i.pitch=Math.max(-1.4,Math.min(1.4,i.pitch+i.vPitch*a));let e=Math.pow(.92,60*a);i.vYaw*=e,i.vPitch*=e,r.autoSpin&&!r.reducedMotion&&(eE=(eE+.14*a)%(2*Math.PI))}i.yaw%=2*Math.PI;let e="auto"===r.shape||"text"===r.shape;if(ew&&!r.autoSpin&&e&&!i.dragging&&(i.yaw=((eE+i.yaw+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI,eE=0,eM=i.yaw,e_=i.pitch,eP=0,eA=!0),ew=r.autoSpin,eA)if(i.dragging)eA=!1;else{let e=(eP=Math.min(1,eP+a/(r.reducedMotion?1e-4:.55)))*eP*(3-2*eP);i.yaw=eM*(1-e),i.pitch=e_*(1-e),i.vYaw=0,i.vPitch=0,eP>=1&&(eA=!1)}if("auto"===r.shape&&(eT+=a)>Math.max(r.swapDuration,.25)){eT=0,eR=(eR+1)%x.length;let e=x[eR];"text"===e&&(ex=(ex+1)%Math.max(r.targets.length,1));let t=r.targets[ex]??"GARDEN";Y.current?.(e,t)}}if(!s){ef.uPos.value=B.texture,ef.uVel.value=Z.texture,ef.uDt.value=a,ef.uMorph.value=r.reducedMotion?2.5:r.morphSpeed,ef.uStagger.value=r.stagger,ef.uCurl.value=r.reducedMotion?0:r.curl,ef.uDamping.value=r.damping,ef.uRepel.value=r.repel,ef.uTime.value=ev,ef.uPointerOn.value=k.current.on&&!r.reducedMotion?1:0;let e=ef.uPointer.value;e[0]=k.current.x,e[1]=k.current.y,t.render({scene:eh,target:$});let i=Z;Z=$,$=i,em.uPos.value=B.texture,em.uVel.value=Z.texture,em.uDt.value=a,t.render({scene:eu,target:L});let s=B;B=L,L=s}ed.uPos.value=B.texture,ed.uVel.value=Z.texture,ed.uPointSize.value=r.pointSize,ed.uSpin.value=eE+i.yaw,ed.uPitch.value=i.pitch,ed.uZoom.value=r.zoom,ed.uColor.value.set(c(r.particleColor)),ed.uAccent.value.set(c(r.accentColor));let n=c(r.backgroundColor);t.gl.clearColor(n[0],n[1],n[2],1),t.render({scene:ep})},X.current=({width:e,height:r,dpr:i})=>{t.dpr=i,t.setSize(Math.max(1,Math.floor(e)),Math.max(1,Math.floor(r))),ed.uAspect.value=Math.max(e,1)/Math.max(r,1),G.current?.(.016)},q.resize(),q.start(),()=>{G.current=null,X.current=null,Y.current=null,r.contains(U)&&r.removeChild(U)}},[V,e]),(0,r.useEffect)(()=>{"auto"!==d&&(Y.current?.(d,w[0]??"GARDEN"),q.paint())},[d,w,q]),(0,r.useEffect)(()=>{q.paint()},[A,P,M,_,S,D,F,N,y,b,C,U,q]);let Z=()=>{k.current.on=!1,H.current.dragging=!1,H.current.pointerId=-1};return V?(0,t.jsx)("div",{className:L??"relative h-full w-full overflow-hidden",style:{backgroundColor:U,backgroundImage:`radial-gradient(circle at 50% 50%, ${b}55 0%, transparent 55%), radial-gradient(circle at 35% 60%, ${C}33 0%, transparent 40%)`}}):(0,t.jsx)("div",{ref:O,className:L??"relative h-full w-full cursor-grab overflow-hidden active:cursor-grabbing [&_canvas]:touch-none",onPointerDown:e=>{let t=H.current;t.dragging=!0,t.pointerId=e.pointerId,t.lastX=e.clientX,t.lastY=e.clientY,t.lastT=e.timeStamp,t.vYaw=0,t.vPitch=0,k.current.on=!1,e.currentTarget.setPointerCapture(e.pointerId),q.start()},onPointerMove:e=>{let t=e.currentTarget.getBoundingClientRect();if(0===t.width||0===t.height)return;let r=H.current;if(r.dragging&&e.pointerId===r.pointerId){let t=e.clientX-r.lastX,i=e.clientY-r.lastY,a=(e.timeStamp-r.lastT)/1e3,s=-(.008*t),n=.006*i;r.yaw+=s,r.pitch=Math.max(-1.4,Math.min(1.4,r.pitch+n)),a>.001&&(r.vYaw=s/a,r.vPitch=n/a),r.lastX=e.clientX,r.lastY=e.clientY,r.lastT=e.timeStamp,q.start();return}let i=t.width/t.height;k.current.x=((e.clientX-t.left)/t.width*2-1)*i*.62,k.current.y=-(.62*((e.clientY-t.top)/t.height*2-1)),k.current.on=!0,q.start()},onPointerUp:e=>{let t=H.current;-1!==t.pointerId&&e.currentTarget.hasPointerCapture(t.pointerId)&&e.currentTarget.releasePointerCapture(t.pointerId),t.dragging=!1,t.pointerId=-1,q.start()},onPointerLeave:Z,onPointerCancel:Z})});w.displayName="Swarm";let A=["GARDEN","ETA","VII"];e.s(["default",0,function({values:e,reducedMotion:r,paused:i}){return(0,t.jsxs)("div",{className:"relative h-full min-h-80 w-full",children:[(0,t.jsx)(w,{density:e.density,shape:e.shape,targets:A,swapDuration:e.swapDuration,morphSpeed:e.morphSpeed,stagger:e.stagger,curl:e.curl,damping:e.damping,repel:e.repel,pointSize:e.pointSize,zoom:e.zoom,autoSpin:e.autoSpin,particleColor:e.particleColor,accentColor:e.accentColor,backgroundColor:e.backgroundColor,paused:i,reducedMotion:r}),r?null:(0,t.jsx)("p",{className:"pointer-events-none absolute right-3 bottom-2 font-display text-[9px] tracking-[0.28em] text-ink-mute uppercase",children:"move — push the cloud apart"})]})}],855667)},979963,function(e){e.n(e.i(855667))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let i=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{i.current=e});let a=(0,t.useRef)(null),s=(0,t.useRef)(null),n=(0,t.useRef)(!1),l=(0,t.useRef)(!1),h=(0,t.useRef)(0),u=(0,t.useRef)(0),o=(0,t.useRef)(0),g=(0,t.useCallback)(()=>{let e=i.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=i.current.dpr??"auto",a=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:a,bufferWidth:Math.max(1,Math.round(t.width*a)),bufferHeight:Math.max(1,Math.round(t.height*a))}},[]),c=(0,t.useCallback)(function e(t){if(l.current)return;0===h.current&&(h.current=t);let s=0===u.current?0:Math.min((t-u.current)/1e3,r);u.current=t;let g={now:t,dt:s,elapsed:(t-h.current)/1e3,frame:o.current++},c=i.current.onFrame?.(g);if(!l.current){if(!1===c||i.current.halted){n.current=!1,a.current=null;return}a.current=requestAnimationFrame(e)}},[]),p=(0,t.useCallback)(()=>{l.current||n.current||(n.current=!0,u.current=0,a.current=requestAnimationFrame(c))},[c]),f=(0,t.useCallback)(()=>{n.current=!1,null!==a.current&&(cancelAnimationFrame(a.current),a.current=null)},[]),m=(0,t.useCallback)(()=>p(),[p]),d=(0,t.useCallback)(()=>{let e=g();e&&(i.current.onResize?.(e),!1!==i.current.paintWhenHalted?m():i.current.halted||p())},[g,m,p]),v=e.deps??[];(0,t.useEffect)(()=>{l.current=!1;let e=i.current.target.current;if(!e)return;let t=()=>{l.current||d()},r=new ResizeObserver(()=>{let e=i.current.resizeDebounceMs??0;e<=0?t():(null!==s.current&&clearTimeout(s.current),s.current=setTimeout(()=>{s.current=null,t()},e))});return r.observe(e),d(),i.current.halted||p(),()=>{l.current=!0,n.current=!1,null!==a.current&&(cancelAnimationFrame(a.current),a.current=null),null!==s.current&&(clearTimeout(s.current),s.current=null),r.disconnect(),i.current.onDispose?.();let e=i.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),h.current=0,u.current=0,o.current=0}},v);let E=e.halted??!1;return(0,t.useEffect)(()=>{E||p()},[E,p]),(0,t.useMemo)(()=>({start:p,stop:f,paint:m,resize:d,get running(){return n.current}}),[p,f,m,d])}])},562611,e=>{"use strict";var t=e.i(899925);e.s(["RenderTarget",0,class{constructor(e,{width:r=e.canvas.width,height:i=e.canvas.height,target:a=e.FRAMEBUFFER,color:s=1,depth:n=!0,stencil:l=!1,depthTexture:h=!1,wrapS:u=e.CLAMP_TO_EDGE,wrapT:o=e.CLAMP_TO_EDGE,wrapR:g=e.CLAMP_TO_EDGE,minFilter:c=e.LINEAR,magFilter:p=c,type:f=e.UNSIGNED_BYTE,format:m=e.RGBA,internalFormat:d=m,unpackAlignment:v,premultiplyAlpha:E}={}){this.gl=e,this.width=r,this.height=i,this.depth=n,this.stencil=l,this.buffer=this.gl.createFramebuffer(),this.target=a,this.gl.renderer.bindFramebuffer(this),this.textures=[];const T=[];for(let a=0;a<s;a++)this.textures.push(new t.Texture(e,{width:r,height:i,wrapS:u,wrapT:o,wrapR:g,minFilter:c,magFilter:p,type:f,format:m,internalFormat:d,unpackAlignment:v,premultiplyAlpha:E,flipY:!1,generateMipmaps:!1})),this.textures[a].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+a,this.gl.TEXTURE_2D,this.textures[a].texture,0),T.push(this.gl.COLOR_ATTACHMENT0+a);T.length>1&&this.gl.renderer.drawBuffers(T),this.texture=this.textures[0],h&&(this.gl.renderer.isWebgl2||this.gl.renderer.getExtension("WEBGL_depth_texture"))?(this.depthTexture=new t.Texture(e,{width:r,height:i,minFilter:this.gl.NEAREST,magFilter:this.gl.NEAREST,format:this.stencil?this.gl.DEPTH_STENCIL:this.gl.DEPTH_COMPONENT,internalFormat:e.renderer.isWebgl2?this.stencil?this.gl.DEPTH24_STENCIL8:this.gl.DEPTH_COMPONENT16:this.gl.DEPTH_COMPONENT,type:this.stencil?this.gl.UNSIGNED_INT_24_8:this.gl.UNSIGNED_INT}),this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.stencil?this.gl.DEPTH_STENCIL_ATTACHMENT:this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(n&&!l&&(this.depthBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.RENDERBUFFER,this.depthBuffer)),l&&!n&&(this.stencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.stencilBuffer)),n&&l&&(this.depthStencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.depthStencilBuffer))),this.gl.renderer.bindFramebuffer({target:this.target})}setSize(e,t){if(this.width!==e||this.height!==t){this.width=e,this.height=t,this.gl.renderer.bindFramebuffer(this);for(let r=0;r<this.textures.length;r++)this.textures[r].width=e,this.textures[r].height=t,this.textures[r].needsUpdate=!0,this.textures[r].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+r,this.gl.TEXTURE_2D,this.textures[r].texture,0);this.depthTexture?(this.depthTexture.width=e,this.depthTexture.height=t,this.depthTexture.needsUpdate=!0,this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(this.depthBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,e,t)),this.stencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,e,t)),this.depthStencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,e,t))),this.gl.renderer.bindFramebuffer({target:this.target})}}}])},899925,e=>{"use strict";let t=new Uint8Array(4),r=1;e.s(["Texture",0,class{constructor(e,{image:t,target:i=e.TEXTURE_2D,type:a=e.UNSIGNED_BYTE,format:s=e.RGBA,internalFormat:n=s,wrapS:l=e.CLAMP_TO_EDGE,wrapT:h=e.CLAMP_TO_EDGE,wrapR:u=e.CLAMP_TO_EDGE,generateMipmaps:o=i===(e.TEXTURE_2D||e.TEXTURE_CUBE_MAP),minFilter:g=o?e.NEAREST_MIPMAP_LINEAR:e.LINEAR,magFilter:c=e.LINEAR,premultiplyAlpha:p=!1,unpackAlignment:f=4,flipY:m=i==(e.TEXTURE_2D||e.TEXTURE_3D),anisotropy:d=0,level:v=0,width:E,height:T=E,length:R=1}={}){this.gl=e,this.id=r++,this.image=t,this.target=i,this.type=a,this.format=s,this.internalFormat=n,this.minFilter=g,this.magFilter=c,this.wrapS=l,this.wrapT=h,this.wrapR=u,this.generateMipmaps=o,this.premultiplyAlpha=p,this.unpackAlignment=f,this.flipY=m,this.anisotropy=Math.min(d,this.gl.renderer.parameters.maxAnisotropy),this.level=v,this.width=E,this.height=T,this.length=R,this.texture=this.gl.createTexture(),this.store={image:null},this.glState=this.gl.renderer.state,this.state={},this.state.minFilter=this.gl.NEAREST_MIPMAP_LINEAR,this.state.magFilter=this.gl.LINEAR,this.state.wrapS=this.gl.REPEAT,this.state.wrapT=this.gl.REPEAT,this.state.anisotropy=0}bind(){this.glState.textureUnits[this.glState.activeTextureUnit]!==this.id&&(this.gl.bindTexture(this.target,this.texture),this.glState.textureUnits[this.glState.activeTextureUnit]=this.id)}update(e=0){let r=!(this.image===this.store.image&&!this.needsUpdate);if((r||this.glState.textureUnits[e]!==this.id)&&(this.gl.renderer.activeTexture(e),this.bind()),r){if(this.needsUpdate=!1,this.flipY!==this.glState.flipY&&(this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL,this.flipY),this.glState.flipY=this.flipY),this.premultiplyAlpha!==this.glState.premultiplyAlpha&&(this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),this.glState.premultiplyAlpha=this.premultiplyAlpha),this.unpackAlignment!==this.glState.unpackAlignment&&(this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT,this.unpackAlignment),this.glState.unpackAlignment=this.unpackAlignment),this.minFilter!==this.state.minFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MIN_FILTER,this.minFilter),this.state.minFilter=this.minFilter),this.magFilter!==this.state.magFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MAG_FILTER,this.magFilter),this.state.magFilter=this.magFilter),this.wrapS!==this.state.wrapS&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_S,this.wrapS),this.state.wrapS=this.wrapS),this.wrapT!==this.state.wrapT&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_T,this.wrapT),this.state.wrapT=this.wrapT),this.wrapR!==this.state.wrapR&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_R,this.wrapR),this.state.wrapR=this.wrapR),this.anisotropy&&this.anisotropy!==this.state.anisotropy&&(this.gl.texParameterf(this.target,this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT,this.anisotropy),this.state.anisotropy=this.anisotropy),this.image){if(this.image.width&&(this.width=this.image.width,this.height=this.image.height),this.target===this.gl.TEXTURE_CUBE_MAP)for(let e=0;e<6;e++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+e,this.level,this.internalFormat,this.format,this.type,this.image[e]);else if(ArrayBuffer.isView(this.image))this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,this.image):(this.target===this.gl.TEXTURE_2D_ARRAY||this.target===this.gl.TEXTURE_3D)&&this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);else if(this.image.isCompressedTexture)for(let e=0;e<this.image.length;e++)this.gl.compressedTexImage2D(this.target,e,this.internalFormat,this.image[e].width,this.image[e].height,0,this.image[e].data);else this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.format,this.type,this.image):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);if(this.generateMipmaps){var i,a;this.gl.renderer.isWebgl2||((i=this.image.width)&i-1)==0&&((a=this.image.height)&a-1)==0?this.gl.generateMipmap(this.target):(this.generateMipmaps=!1,this.wrapS=this.wrapT=this.gl.CLAMP_TO_EDGE,this.minFilter=this.gl.LINEAR)}this.onUpdate&&this.onUpdate()}else if(this.target===this.gl.TEXTURE_CUBE_MAP)for(let e=0;e<6;e++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t);else this.width?this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,null):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,null):this.gl.texImage2D(this.target,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t);this.store.image=this.image}}}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);