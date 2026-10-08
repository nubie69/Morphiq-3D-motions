(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,673791,t=>{"use strict";var e=t.i(843476),i=t.i(271645),r=t.i(221663),s=t.i(956850),a=t.i(80075),l=t.i(753604),n=t.i(899925),h=t.i(450922);let o=1/1.85,u=t=>{let e=t.replace("#",""),i=3===e.length?e.split("").map(t=>t+t).join(""):e,r=parseInt(i,16);return Number.isNaN(r)||6!==i.length?[1,1,1]:[(r>>16&255)/255,(r>>8&255)/255,(255&r)/255]},c=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`,g=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uGlyph;
uniform float uTime;
uniform float uProgress;
uniform float uMelt;
uniform float uViscosity;
uniform float uThreshold;
uniform float uSoftness;
uniform float uDrip;
uniform float uWobble;
uniform float uPhase;
uniform float uBand;
uniform vec3  uInk;
uniform vec3  uHot;

float hash21(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
    f.y);
}

void main() {
  vec2 uv = vUv;

  // The melt travels left to right. Scaling progress by (1 + uPhase) before the
  // lag is subtracted keeps the rightmost column still reaching 1 — without it,
  // raising the phase would quietly stop the end of the word ever melting.
  float lag = clamp(uProgress * (1.0 + uPhase) - uv.x * uPhase, 0.0, 1.0);

  // How far this column has run. Two octaves, because one is not enough: a
  // single frequency gives every column a similar amount and the line comes down
  // as a slab with a wavy hem. Real dripping is uneven at more than one scale —
  // a broad lean across the word, and within it individual runs that go much
  // further than their neighbours. Noise coordinates stay small and time is
  // reduced by the caller, so the field keeps its precision over a long session.
  float n = valueNoise(vec2(uv.x * 3.0, uTime * 0.17)) * 0.62
          + valueNoise(vec2(uv.x * 11.0 + 7.3, uTime * 0.31)) * 0.38;
  float drop = uMelt * lag * mix(1.0, 0.18 + 1.5 * n, uWobble);

  // The deformation is a per-column vertical stretch anchored at the cap line,
  // and it has to stay MONOTONIC in y. The obvious version — displace the sample
  // by a sag that grows downward — is not: two different output rows then resolve
  // to the same source row, so every horizontal stroke smears into a vertical
  // bar and the word turns into a picket fence. Dividing the depth instead maps
  // each output row to exactly one source row, so strokes elongate rather than
  // duplicate.
  float d = 1.0 - uv.y;
  // Depth normalised against the text band, so it keeps meaning past the
  // baseline where the drip zone is.
  float dn = clamp(d / max(uBand, 1e-3), 0.0, 1.6);

  float local = 1.0 + drop * mix(0.5, 2.2 * dn, uViscosity) + drop * uDrip * 1.4;
  vec2 s = vec2(uv.x, 1.0 - d / local);

  s.x += (valueNoise(vec2(uv.y * 6.0 + 3.1, uTime * 0.19)) - 0.5) * uWobble * 0.012 * lag;

  // Blur, then cut. This is the whole merge: thresholding a blurred coverage
  // field is a metaball test, so two stems whose blurred haloes overlap resolve
  // to one closed outline rather than two shapes crossing. The blur is bought
  // from the mip chain and costs one fetch instead of a kernel.
  //
  // It is weighted by depth as well as by progress, and that is what separates
  // melting from stretching. A uniform blur elongates the whole letter and the
  // word just reads as a condensed face; blurring hardest at the bottom lets the
  // cap line stay crisp and legible while the feet round off, run together and
  // pool — which is the direction real material actually fails.
  float lod = drop * (1.1 + 3.6 * dn);
  float coverage = textureLod(uGlyph, s, lod).a;

  float ink = smoothstep(uThreshold - uSoftness, uThreshold + uSoftness, coverage);
  vec3 col = mix(uInk, uHot, clamp(drop * (0.45 + 1.3 * dn) + lag * 0.1, 0.0, 1.0));

  // Premultiplied. The canvas sits over live page content, and straight alpha
  // would fringe every edge with whatever the clear colour happened to be.
  fragColor = vec4(col * ink, ink);
}`,p=(0,i.memo)(({text:t="MOLTEN",mode:p="loop",melt:m=.7,viscosity:d=.55,cycle:f=5.2,threshold:v=.5,softness:T=.06,drip:E=.35,wobble:w=.5,phase:x=.18,baseColor:y="#e9e6f2",meltColor:R="#a855f7",paused:A=!1,reducedMotion:_=!1,className:b})=>{let M=(0,i.useRef)(null),P=(0,i.useRef)(null),S=(0,i.useRef)(null),U=(0,i.useRef)(null),C=(0,i.useRef)(null),F=(0,i.useRef)(null),I=(0,i.useRef)(!1),[N,D]=(0,i.useState)(!1),L=(0,h.useAnimationLoop)({target:M,halted:A||_,dpr:"auto",onResize:t=>U.current?.(t),onFrame:({dt:t})=>!!S.current&&S.current(t),gl:()=>F.current}),k=(0,i.useRef)({mode:p,melt:m,viscosity:d,cycle:f,threshold:v,softness:T,drip:E,wobble:w,phase:x,baseColor:y,meltColor:R,reducedMotion:_});k.current={mode:p,melt:m,viscosity:d,cycle:f,threshold:v,softness:T,drip:E,wobble:w,phase:x,baseColor:y,meltColor:R,reducedMotion:_},(0,i.useEffect)(()=>{let e,i=M.current,h=P.current;if(N||!i||!h)return;try{if(!((e=new r.Renderer({webgl:2,alpha:!0,premultipliedAlpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)})).gl instanceof WebGL2RenderingContext))throw Error("Molten requires WebGL2")}catch{D(!0);return}let p=e.gl;F.current=p,p.clearColor(0,0,0,0);let f=p.canvas;f.style.display="block",f.style.position="absolute",f.style.top="0",f.style.left="0",f.style.pointerEvents="none",i.appendChild(f);let A=document.createElement("canvas"),_=new n.Texture(p,{generateMipmaps:!0,minFilter:p.LINEAR_MIPMAP_LINEAR,magFilter:p.LINEAR,wrapS:p.CLAMP_TO_EDGE,wrapT:p.CLAMP_TO_EDGE}),b=new l.Triangle(p),B=new s.Program(p,{vertex:c,fragment:g,depthTest:!1,depthWrite:!1,transparent:!0,uniforms:{uGlyph:{value:_},uTime:{value:0},uProgress:{value:0},uMelt:{value:m},uViscosity:{value:d},uThreshold:{value:v},uSoftness:{value:T},uDrip:{value:E},uWobble:{value:w},uPhase:{value:x},uBand:{value:o},uInk:{value:new Float32Array(u(y))},uHot:{value:new Float32Array(u(R))}}});B.setBlendFunc(p.ONE,p.ONE_MINUS_SRC_ALPHA);let G=new a.Mesh(p,{geometry:b,program:B}),X=B.uniforms,O=()=>{let e=h.getBoundingClientRect(),r=i.getBoundingClientRect();if(e.width<1||e.height<1||r.height<1)return;let s=getComputedStyle(h),a=parseFloat(s.fontSize)||16;X.uBand.value=Math.min(1,e.height/r.height);let l=Math.max(2,Math.round(2*e.width)),n=Math.max(2,Math.round(2*e.height)),o=Math.max(n+2,Math.round(2*r.height));A.width=l,A.height=o;let u=A.getContext("2d");u&&(u.clearRect(0,0,l,o),u.font=`${s.fontStyle} ${s.fontWeight} ${2*a}px ${s.fontFamily}`,"letterSpacing"in u&&(u.letterSpacing="normal"===s.letterSpacing?"0px":`${2*parseFloat(s.letterSpacing)}px`),u.fillStyle="#ffffff",u.textAlign="center",u.textBaseline="middle",u.fillText(t,l/2,n/2),_.image=A,_.needsUpdate=!0)};C.current=O;let W=0,Y=(k.current.reducedMotion,0);S.current=t=>{let i=k.current;if(W=(W+t)%3600,"loop"===i.mode){let t=W/Math.max(i.cycle,.1)%1,e=t<.64?t/.64:1-(t-.64)/.36;Y=e*e*(3-2*e)}else{let e=+!!I.current;Y+=(e-Y)*(1-Math.exp(-(6*t)))}X.uTime.value=W,X.uProgress.value=Y,X.uMelt.value=i.melt,X.uViscosity.value=i.viscosity,X.uThreshold.value=i.threshold,X.uSoftness.value=i.softness,X.uDrip.value=i.drip,X.uWobble.value=i.wobble,X.uPhase.value=i.phase,X.uInk.value.set(u(i.baseColor)),X.uHot.value.set(u(i.meltColor)),e.render({scene:G})},U.current=({width:t,height:i,dpr:r})=>{e.dpr=r,e.setSize(Math.max(1,Math.floor(t)),Math.max(1,Math.floor(i))),O()};let z=!0,j=parseFloat(getComputedStyle(h).fontSize)||16,H=getComputedStyle(h).fontFamily,$=getComputedStyle(h).fontWeight;return Promise.resolve().then(()=>document.fonts.load(`${$} ${j}px ${H}`)).then(()=>document.fonts.ready).then(()=>{z&&(O(),L.paint())}).catch(()=>{}),L.resize(),L.start(),()=>{z=!1,S.current=null,U.current=null,C.current=null,i.contains(f)&&i.removeChild(f)}},[N,t]),(0,i.useEffect)(()=>{C.current?.(),L.paint()},[t,L]);let B=()=>{_||(I.current=!0,L.start())},G=()=>{I.current=!1,L.start()},X="hover"===p,O="hold"===p;return(0,e.jsx)("div",{ref:M,style:{paddingBottom:"0.85em"},className:`relative inline-block ${b??"font-display text-[clamp(2.5rem,11vw,6.5rem)] leading-none font-extrabold tracking-tight"}`,onPointerEnter:X?B:void 0,onPointerLeave:X||O?G:void 0,onPointerDown:O?B:void 0,onPointerUp:O?G:void 0,onPointerCancel:G,children:(0,e.jsx)("span",{ref:P,className:"relative block whitespace-pre",style:{color:N?y:"transparent"},children:t})})});p.displayName="Molten",t.s(["default",0,function({values:t,reducedMotion:i,paused:r}){let s=t.mode;return(0,e.jsxs)("div",{className:"flex h-full w-full flex-col items-center justify-center gap-6 px-8",children:[(0,e.jsx)(p,{text:"MOLTEN",mode:s,melt:t.melt,viscosity:t.viscosity,cycle:t.cycle,threshold:t.threshold,softness:t.softness,drip:t.drip,wobble:t.wobble,phase:t.phase,baseColor:t.baseColor,meltColor:t.meltColor,paused:r,reducedMotion:i}),(0,e.jsx)("p",{className:"font-display text-[10px] tracking-[0.28em] text-ink-mute uppercase",children:"loop"===s?"select the word — it is still text":"hover"===s?"hover the word · still selectable":"press and hold the word"})]})}],673791)},775033,function(t){t.n(t.i(673791))},450922,t=>{"use strict";var e=t.i(271645);let i=1/15;t.s(["useAnimationLoop",0,function(t){let r=(0,e.useRef)(t);(0,e.useLayoutEffect)(()=>{r.current=t});let s=(0,e.useRef)(null),a=(0,e.useRef)(null),l=(0,e.useRef)(!1),n=(0,e.useRef)(!1),h=(0,e.useRef)(0),o=(0,e.useRef)(0),u=(0,e.useRef)(0),c=(0,e.useCallback)(()=>{let t=r.current.target.current;if(!t)return null;let e=t.getBoundingClientRect(),i=r.current.dpr??"auto",s=Math.min(window.devicePixelRatio||1,"auto"===i?2:i);return{width:e.width,height:e.height,dpr:s,bufferWidth:Math.max(1,Math.round(e.width*s)),bufferHeight:Math.max(1,Math.round(e.height*s))}},[]),g=(0,e.useCallback)(function t(e){if(n.current)return;0===h.current&&(h.current=e);let a=0===o.current?0:Math.min((e-o.current)/1e3,i);o.current=e;let c={now:e,dt:a,elapsed:(e-h.current)/1e3,frame:u.current++},g=r.current.onFrame?.(c);if(!n.current){if(!1===g||r.current.halted){l.current=!1,s.current=null;return}s.current=requestAnimationFrame(t)}},[]),p=(0,e.useCallback)(()=>{n.current||l.current||(l.current=!0,o.current=0,s.current=requestAnimationFrame(g))},[g]),m=(0,e.useCallback)(()=>{l.current=!1,null!==s.current&&(cancelAnimationFrame(s.current),s.current=null)},[]),d=(0,e.useCallback)(()=>p(),[p]),f=(0,e.useCallback)(()=>{let t=c();t&&(r.current.onResize?.(t),!1!==r.current.paintWhenHalted?d():r.current.halted||p())},[c,d,p]),v=t.deps??[];(0,e.useEffect)(()=>{n.current=!1;let t=r.current.target.current;if(!t)return;let e=()=>{n.current||f()},i=new ResizeObserver(()=>{let t=r.current.resizeDebounceMs??0;t<=0?e():(null!==a.current&&clearTimeout(a.current),a.current=setTimeout(()=>{a.current=null,e()},t))});return i.observe(t),f(),r.current.halted||p(),()=>{n.current=!0,l.current=!1,null!==s.current&&(cancelAnimationFrame(s.current),s.current=null),null!==a.current&&(clearTimeout(a.current),a.current=null),i.disconnect(),r.current.onDispose?.();let t=r.current.gl?.();t?.getExtension("WEBGL_lose_context")?.loseContext(),h.current=0,o.current=0,u.current=0}},v);let T=t.halted??!1;return(0,e.useEffect)(()=>{T||p()},[T,p]),(0,e.useMemo)(()=>({start:p,stop:m,paint:d,resize:f,get running(){return l.current}}),[p,m,d,f])}])},899925,t=>{"use strict";let e=new Uint8Array(4),i=1;t.s(["Texture",0,class{constructor(t,{image:e,target:r=t.TEXTURE_2D,type:s=t.UNSIGNED_BYTE,format:a=t.RGBA,internalFormat:l=a,wrapS:n=t.CLAMP_TO_EDGE,wrapT:h=t.CLAMP_TO_EDGE,wrapR:o=t.CLAMP_TO_EDGE,generateMipmaps:u=r===(t.TEXTURE_2D||t.TEXTURE_CUBE_MAP),minFilter:c=u?t.NEAREST_MIPMAP_LINEAR:t.LINEAR,magFilter:g=t.LINEAR,premultiplyAlpha:p=!1,unpackAlignment:m=4,flipY:d=r==(t.TEXTURE_2D||t.TEXTURE_3D),anisotropy:f=0,level:v=0,width:T,height:E=T,length:w=1}={}){this.gl=t,this.id=i++,this.image=e,this.target=r,this.type=s,this.format=a,this.internalFormat=l,this.minFilter=c,this.magFilter=g,this.wrapS=n,this.wrapT=h,this.wrapR=o,this.generateMipmaps=u,this.premultiplyAlpha=p,this.unpackAlignment=m,this.flipY=d,this.anisotropy=Math.min(f,this.gl.renderer.parameters.maxAnisotropy),this.level=v,this.width=T,this.height=E,this.length=w,this.texture=this.gl.createTexture(),this.store={image:null},this.glState=this.gl.renderer.state,this.state={},this.state.minFilter=this.gl.NEAREST_MIPMAP_LINEAR,this.state.magFilter=this.gl.LINEAR,this.state.wrapS=this.gl.REPEAT,this.state.wrapT=this.gl.REPEAT,this.state.anisotropy=0}bind(){this.glState.textureUnits[this.glState.activeTextureUnit]!==this.id&&(this.gl.bindTexture(this.target,this.texture),this.glState.textureUnits[this.glState.activeTextureUnit]=this.id)}update(t=0){let i=!(this.image===this.store.image&&!this.needsUpdate);if((i||this.glState.textureUnits[t]!==this.id)&&(this.gl.renderer.activeTexture(t),this.bind()),i){if(this.needsUpdate=!1,this.flipY!==this.glState.flipY&&(this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL,this.flipY),this.glState.flipY=this.flipY),this.premultiplyAlpha!==this.glState.premultiplyAlpha&&(this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),this.glState.premultiplyAlpha=this.premultiplyAlpha),this.unpackAlignment!==this.glState.unpackAlignment&&(this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT,this.unpackAlignment),this.glState.unpackAlignment=this.unpackAlignment),this.minFilter!==this.state.minFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MIN_FILTER,this.minFilter),this.state.minFilter=this.minFilter),this.magFilter!==this.state.magFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MAG_FILTER,this.magFilter),this.state.magFilter=this.magFilter),this.wrapS!==this.state.wrapS&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_S,this.wrapS),this.state.wrapS=this.wrapS),this.wrapT!==this.state.wrapT&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_T,this.wrapT),this.state.wrapT=this.wrapT),this.wrapR!==this.state.wrapR&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_R,this.wrapR),this.state.wrapR=this.wrapR),this.anisotropy&&this.anisotropy!==this.state.anisotropy&&(this.gl.texParameterf(this.target,this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT,this.anisotropy),this.state.anisotropy=this.anisotropy),this.image){if(this.image.width&&(this.width=this.image.width,this.height=this.image.height),this.target===this.gl.TEXTURE_CUBE_MAP)for(let t=0;t<6;t++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+t,this.level,this.internalFormat,this.format,this.type,this.image[t]);else if(ArrayBuffer.isView(this.image))this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,this.image):(this.target===this.gl.TEXTURE_2D_ARRAY||this.target===this.gl.TEXTURE_3D)&&this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);else if(this.image.isCompressedTexture)for(let t=0;t<this.image.length;t++)this.gl.compressedTexImage2D(this.target,t,this.internalFormat,this.image[t].width,this.image[t].height,0,this.image[t].data);else this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.format,this.type,this.image):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);if(this.generateMipmaps){var r,s;this.gl.renderer.isWebgl2||((r=this.image.width)&r-1)==0&&((s=this.image.height)&s-1)==0?this.gl.generateMipmap(this.target):(this.generateMipmaps=!1,this.wrapS=this.wrapT=this.gl.CLAMP_TO_EDGE,this.minFilter=this.gl.LINEAR)}this.onUpdate&&this.onUpdate()}else if(this.target===this.gl.TEXTURE_CUBE_MAP)for(let t=0;t<6;t++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,e);else this.width?this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,null):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,null):this.gl.texImage2D(this.target,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,e);this.store.image=this.image}}}])},753604,t=>{"use strict";var e=t.i(994964);class i extends e.Geometry{constructor(t,{attributes:e={}}={}){Object.assign(e,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(t,e)}}t.s(["Triangle",0,i])}]);