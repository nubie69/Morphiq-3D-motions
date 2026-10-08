(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,453272,t=>{"use strict";var e=t.i(843476),i=t.i(271645),r=t.i(221663),s=t.i(956850),a=t.i(80075),h=t.i(753604),l=t.i(562611),n=t.i(450922);let u={spots:0,ring:1,stripe:2,noise:3},o=t=>{let e=t.replace("#",""),i=3===e.length?e.split("").map(t=>t+t).join(""):e,r=parseInt(i,16);return Number.isNaN(r)||6!==i.length?[1,1,1]:[(r>>16&255)/255,(r>>8&255)/255,(255&r)/255]},g=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`,c=`
float hash21(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}`,f=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform float uSeed;
uniform float uJitter;
${c}

void main() {
  vec2 p = vUv - 0.5;
  float b = 0.0;
  if (uSeed < 0.5) {
    vec2 cell = floor(vUv * 6.0);
    vec2 g = fract(vUv * 6.0) - 0.5;
    // Each blob is jittered inside its cell. A perfect lattice grows into
    // wallpaper and stays there: the chemistry is isotropic, so it will never
    // break a symmetry the seed handed it. Asymmetry has to be planted.
    vec2 j = vec2(hash21(cell + 3.1), hash21(cell + 7.7)) - 0.5;
    b = step(length(g - j * 0.55), 0.13) * step(hash21(cell + uJitter), 0.45);
  } else if (uSeed < 1.5) {
    b = 1.0 - smoothstep(0.055, 0.075, abs(length(p) - 0.22));
  } else if (uSeed < 2.5) {
    b = 1.0 - smoothstep(0.016, 0.026, abs(p.y));
  } else {
    b = step(0.87, hash21(floor(vUv * 220.0) + uJitter));
  }
  // Canonical seeding: A drops to a half and B rises to a quarter inside the
  // blob, rather than A=1/B=1. Slamming both to one makes a*b*b spike to unity
  // in a single step, which burns the substrate out from under the colony
  // before it can spread — the blob then stabilises into a ring and sits there
  // forever, at any feed and kill you care to name. It reads exactly like a
  // frozen simulation and it is the seeding, not the chemistry.
  float mask = clamp(b, 0.0, 1.0);
  fragColor = vec4(mix(1.0, 0.5, mask), mask * 0.25, 0.0, 1.0);
}`,d=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uState;
uniform vec2  uTexel;
uniform float uFeed;
uniform float uKill;
uniform float uDa;
uniform float uDb;
uniform vec2  uPointer;
uniform float uBrush;
uniform float uBrushOn;

vec2 st(vec2 o) { return texture(uState, vUv + o * uTexel).rg; }

void main() {
  vec2 c = st(vec2(0.0));

  // Nine-point Laplacian. The five-point one is cheaper and visibly wrong here:
  // it propagates along the axes faster than along the diagonals, so every
  // colony grows square and the lattice of the grid ends up in the pattern.
  vec2 lap =
      (st(vec2(-1.0, 0.0)) + st(vec2(1.0, 0.0)) +
       st(vec2(0.0, -1.0)) + st(vec2(0.0, 1.0))) * 0.2
    + (st(vec2(-1.0, -1.0)) + st(vec2(1.0, -1.0)) +
       st(vec2(-1.0, 1.0)) + st(vec2(1.0, 1.0))) * 0.05
    - c;

  float a = c.x;
  float b = c.y;
  float reacted = a * b * b;

  float na = a + (uDa * lap.x - reacted + uFeed * (1.0 - a));
  float nb = b + (uDb * lap.y + reacted - (uKill + uFeed) * b);

  if (uBrushOn > 0.5) {
    // The grid is square, so a uv distance is a grid distance and the blob is
    // round without an aspect correction.
    float m = 1.0 - smoothstep(0.0, max(uBrush, 1e-4), length(vUv - uPointer));
    nb = mix(nb, 1.0, m * 0.85);
    na = mix(na, 0.0, m * 0.4);
  }

  fragColor = vec4(clamp(na, 0.0, 1.0), clamp(nb, 0.0, 1.0), 0.0, 1.0);
}`,p=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uState;
uniform vec2  uResolution;
uniform vec2  uTexel;
uniform float uSharpness;
uniform vec3  uLow;
uniform vec3  uHigh;

void main() {
  float ar = uResolution.x / max(uResolution.y, 1.0);
  // Cover, not stretch. The square grid fills the container and the overflow is
  // cropped, so a colony stays circular at any aspect ratio.
  vec2 k = ar > 1.0 ? vec2(1.0, 1.0 / ar) : vec2(ar, 1.0);
  vec2 uv = (vUv - 0.5) * k + 0.5;

  float b = texture(uState, uv).g;
  float v = clamp(b * 2.8, 0.0, 1.0);

  float w = mix(0.32, 0.006, clamp(uSharpness, 0.0, 1.0));
  float m = smoothstep(0.5 - w, 0.5 + w, v);

  // Membrane. The gradient is largest exactly at the cut, so this lifts the
  // boundary the sharpness control just created rather than a second edge of
  // its own.
  float gx = texture(uState, uv + vec2(uTexel.x, 0.0)).g
           - texture(uState, uv - vec2(uTexel.x, 0.0)).g;
  float gy = texture(uState, uv + vec2(0.0, uTexel.y)).g
           - texture(uState, uv - vec2(0.0, uTexel.y)).g;
  float rim = clamp(length(vec2(gx, gy)) * 14.0, 0.0, 1.0);

  vec3 col = mix(uLow, uHigh, m);
  col += uHigh * rim * 0.25;

  fragColor = vec4(col, 1.0);
}`,m=(0,i.memo)(({feed:t=.05,kill:c=.062,diffusion:m=1,steps:E=16,gridSize:T="512",seed:v="spots",brush:R=26,sharpness:x=.5,colorLow:b="#0a0a12",colorHigh:_="#a855f7",paused:A=!1,reducedMotion:w=!1,className:F})=>{let S=(0,i.useRef)(null),N=(0,i.useRef)(null),D=(0,i.useRef)(null),U=(0,i.useRef)(null),y=(0,i.useRef)(!0),P=(0,i.useRef)({x:.5,y:.5,on:!1}),[B,C]=(0,i.useState)(!1),M=(0,n.useAnimationLoop)({target:S,halted:A||w,dpr:"auto",onResize:t=>D.current?.(t),onFrame:({dt:t})=>!!N.current&&N.current(t),gl:()=>U.current}),I=(0,i.useRef)({feed:t,kill:c,diffusion:m,steps:E,seed:v,brush:R,sharpness:x,colorLow:b,colorHigh:_});I.current={feed:t,kill:c,diffusion:m,steps:E,seed:v,brush:R,sharpness:x,colorLow:b,colorHigh:_},(0,i.useEffect)(()=>{let e,i=S.current;if(B||!i)return;let n=Math.max(64,parseInt(T,10)||512);try{if(!(e=new r.Renderer({webgl:2,alpha:!1,antialias:!1,powerPreference:"high-performance",dpr:Math.min(window.devicePixelRatio||1,2)})).gl.getExtension("EXT_color_buffer_float"))throw Error("Turing requires EXT_color_buffer_float")}catch{C(!0);return}let E=e.gl;U.current=E;let A=E.canvas;A.style.display="block",A.style.position="absolute",A.style.top="0",A.style.left="0",i.appendChild(A);let w=E.getExtension("OES_texture_float_linear")?E.LINEAR:E.NEAREST,F=()=>new l.RenderTarget(E,{width:n,height:n,depth:!1,type:E.FLOAT,format:E.RGBA,internalFormat:E.RGBA32F,minFilter:w,magFilter:w,wrapS:E.CLAMP_TO_EDGE,wrapT:E.CLAMP_TO_EDGE}),L=F(),O=F(),H=new Float32Array([1/n,1/n]),X=new h.Triangle(E),k=new s.Program(E,{vertex:g,fragment:f,uniforms:{uSeed:{value:u[v]??0},uJitter:{value:0}}}),G=new s.Program(E,{vertex:g,fragment:d,uniforms:{uState:{value:L.texture},uTexel:{value:H},uFeed:{value:t},uKill:{value:c},uDa:{value:m},uDb:{value:.5},uPointer:{value:new Float32Array([.5,.5])},uBrush:{value:R/n},uBrushOn:{value:0}}}),Y=new s.Program(E,{vertex:g,fragment:p,uniforms:{uState:{value:L.texture},uResolution:{value:new Float32Array([1,1])},uTexel:{value:H},uSharpness:{value:x},uLow:{value:new Float32Array(o(b))},uHigh:{value:new Float32Array(o(_))}}}),W=new a.Mesh(E,{geometry:X,program:k}),j=new a.Mesh(E,{geometry:X,program:G}),z=new a.Mesh(E,{geometry:X,program:Y}),K=k.uniforms,q=G.uniforms,J=Y.uniforms,$=0,V=()=>{let t=I.current;J.uState.value=L.texture,J.uSharpness.value=t.sharpness,J.uLow.value.set(o(t.colorLow)),J.uHigh.value.set(o(t.colorHigh)),e.render({scene:z})};return N.current=()=>{let t=I.current;if(y.current){let t;t=I.current,K.uSeed.value=u[t.seed]??0,K.uJitter.value=$,$=($+17.13)%991,e.render({scene:W,target:L}),e.render({scene:W,target:O}),y.current=!1}q.uFeed.value=t.feed,q.uKill.value=t.kill,q.uDa.value=t.diffusion,q.uBrush.value=Math.max(t.brush,1)/n,q.uBrushOn.value=+!!P.current.on;let i=q.uPointer.value;i[0]=P.current.x,i[1]=P.current.y;let r=Math.max(1,Math.round(t.steps));for(let t=0;t<r;t++){q.uState.value=L.texture,e.render({scene:j,target:O});let t=L;L=O,O=t,q.uBrushOn.value=0}V()},D.current=({width:t,height:i,dpr:r})=>{e.dpr=r,e.setSize(Math.max(1,Math.floor(t)),Math.max(1,Math.floor(i)));let s=J.uResolution.value;s[0]=E.drawingBufferWidth,s[1]=E.drawingBufferHeight,V()},M.resize(),M.start(),()=>{N.current=null,D.current=null,i.contains(A)&&i.removeChild(A)}},[B,T]),(0,i.useEffect)(()=>{y.current=!0,M.paint()},[v,M]),(0,i.useEffect)(()=>{M.paint()},[t,c,m,E,R,x,b,_,M]);let L=()=>{P.current.on=!1};return B?(0,e.jsx)("div",{className:F??"relative h-full w-full overflow-hidden",style:{backgroundColor:b,backgroundImage:`radial-gradient(circle at 30% 35%, ${_}55 0 12%, transparent 13%), radial-gradient(circle at 68% 62%, ${_}44 0 9%, transparent 10%), radial-gradient(circle at 48% 80%, ${_}33 0 7%, transparent 8%)`}}):(0,e.jsx)("div",{ref:S,className:F??"relative h-full w-full overflow-hidden",onPointerMove:t=>{if(w)return;let e=t.currentTarget.getBoundingClientRect();if(0===e.width||0===e.height)return;let i=(t.clientX-e.left)/e.width,r=1-(t.clientY-e.top)/e.height,s=e.width/e.height;P.current.x=(i-.5)*(s>1?1:s)+.5,P.current.y=(r-.5)*(s>1?1/s:1)+.5,P.current.on=!0,M.start()},onPointerLeave:L,onPointerCancel:L})});m.displayName="Turing",t.s(["default",0,function({values:t,reducedMotion:i,paused:r}){return(0,e.jsxs)("div",{className:"relative h-full min-h-80 w-full",children:[(0,e.jsx)(m,{feed:t.feed,kill:t.kill,diffusion:t.diffusion,steps:t.steps,gridSize:t.gridSize,seed:t.seed,brush:t.brush,sharpness:t.sharpness,colorLow:t.colorLow,colorHigh:t.colorHigh,paused:r,reducedMotion:i}),i?null:(0,e.jsx)("p",{className:"pointer-events-none absolute right-3 bottom-2 font-display text-[9px] tracking-[0.28em] text-ink-mute uppercase",children:"move — inoculate the plate"})]})}],453272)},872203,function(t){t.n(t.i(453272))},450922,t=>{"use strict";var e=t.i(271645);let i=1/15;t.s(["useAnimationLoop",0,function(t){let r=(0,e.useRef)(t);(0,e.useLayoutEffect)(()=>{r.current=t});let s=(0,e.useRef)(null),a=(0,e.useRef)(null),h=(0,e.useRef)(!1),l=(0,e.useRef)(!1),n=(0,e.useRef)(0),u=(0,e.useRef)(0),o=(0,e.useRef)(0),g=(0,e.useCallback)(()=>{let t=r.current.target.current;if(!t)return null;let e=t.getBoundingClientRect(),i=r.current.dpr??"auto",s=Math.min(window.devicePixelRatio||1,"auto"===i?2:i);return{width:e.width,height:e.height,dpr:s,bufferWidth:Math.max(1,Math.round(e.width*s)),bufferHeight:Math.max(1,Math.round(e.height*s))}},[]),c=(0,e.useCallback)(function t(e){if(l.current)return;0===n.current&&(n.current=e);let a=0===u.current?0:Math.min((e-u.current)/1e3,i);u.current=e;let g={now:e,dt:a,elapsed:(e-n.current)/1e3,frame:o.current++},c=r.current.onFrame?.(g);if(!l.current){if(!1===c||r.current.halted){h.current=!1,s.current=null;return}s.current=requestAnimationFrame(t)}},[]),f=(0,e.useCallback)(()=>{l.current||h.current||(h.current=!0,u.current=0,s.current=requestAnimationFrame(c))},[c]),d=(0,e.useCallback)(()=>{h.current=!1,null!==s.current&&(cancelAnimationFrame(s.current),s.current=null)},[]),p=(0,e.useCallback)(()=>f(),[f]),m=(0,e.useCallback)(()=>{let t=g();t&&(r.current.onResize?.(t),!1!==r.current.paintWhenHalted?p():r.current.halted||f())},[g,p,f]),E=t.deps??[];(0,e.useEffect)(()=>{l.current=!1;let t=r.current.target.current;if(!t)return;let e=()=>{l.current||m()},i=new ResizeObserver(()=>{let t=r.current.resizeDebounceMs??0;t<=0?e():(null!==a.current&&clearTimeout(a.current),a.current=setTimeout(()=>{a.current=null,e()},t))});return i.observe(t),m(),r.current.halted||f(),()=>{l.current=!0,h.current=!1,null!==s.current&&(cancelAnimationFrame(s.current),s.current=null),null!==a.current&&(clearTimeout(a.current),a.current=null),i.disconnect(),r.current.onDispose?.();let t=r.current.gl?.();t?.getExtension("WEBGL_lose_context")?.loseContext(),n.current=0,u.current=0,o.current=0}},E);let T=t.halted??!1;return(0,e.useEffect)(()=>{T||f()},[T,f]),(0,e.useMemo)(()=>({start:f,stop:d,paint:p,resize:m,get running(){return h.current}}),[f,d,p,m])}])},562611,t=>{"use strict";var e=t.i(899925);t.s(["RenderTarget",0,class{constructor(t,{width:i=t.canvas.width,height:r=t.canvas.height,target:s=t.FRAMEBUFFER,color:a=1,depth:h=!0,stencil:l=!1,depthTexture:n=!1,wrapS:u=t.CLAMP_TO_EDGE,wrapT:o=t.CLAMP_TO_EDGE,wrapR:g=t.CLAMP_TO_EDGE,minFilter:c=t.LINEAR,magFilter:f=c,type:d=t.UNSIGNED_BYTE,format:p=t.RGBA,internalFormat:m=p,unpackAlignment:E,premultiplyAlpha:T}={}){this.gl=t,this.width=i,this.height=r,this.depth=h,this.stencil=l,this.buffer=this.gl.createFramebuffer(),this.target=s,this.gl.renderer.bindFramebuffer(this),this.textures=[];const v=[];for(let s=0;s<a;s++)this.textures.push(new e.Texture(t,{width:i,height:r,wrapS:u,wrapT:o,wrapR:g,minFilter:c,magFilter:f,type:d,format:p,internalFormat:m,unpackAlignment:E,premultiplyAlpha:T,flipY:!1,generateMipmaps:!1})),this.textures[s].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+s,this.gl.TEXTURE_2D,this.textures[s].texture,0),v.push(this.gl.COLOR_ATTACHMENT0+s);v.length>1&&this.gl.renderer.drawBuffers(v),this.texture=this.textures[0],n&&(this.gl.renderer.isWebgl2||this.gl.renderer.getExtension("WEBGL_depth_texture"))?(this.depthTexture=new e.Texture(t,{width:i,height:r,minFilter:this.gl.NEAREST,magFilter:this.gl.NEAREST,format:this.stencil?this.gl.DEPTH_STENCIL:this.gl.DEPTH_COMPONENT,internalFormat:t.renderer.isWebgl2?this.stencil?this.gl.DEPTH24_STENCIL8:this.gl.DEPTH_COMPONENT16:this.gl.DEPTH_COMPONENT,type:this.stencil?this.gl.UNSIGNED_INT_24_8:this.gl.UNSIGNED_INT}),this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.stencil?this.gl.DEPTH_STENCIL_ATTACHMENT:this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(h&&!l&&(this.depthBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,i,r),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.RENDERBUFFER,this.depthBuffer)),l&&!h&&(this.stencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,i,r),this.gl.framebufferRenderbuffer(this.target,this.gl.STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.stencilBuffer)),h&&l&&(this.depthStencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,i,r),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.depthStencilBuffer))),this.gl.renderer.bindFramebuffer({target:this.target})}setSize(t,e){if(this.width!==t||this.height!==e){this.width=t,this.height=e,this.gl.renderer.bindFramebuffer(this);for(let i=0;i<this.textures.length;i++)this.textures[i].width=t,this.textures[i].height=e,this.textures[i].needsUpdate=!0,this.textures[i].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+i,this.gl.TEXTURE_2D,this.textures[i].texture,0);this.depthTexture?(this.depthTexture.width=t,this.depthTexture.height=e,this.depthTexture.needsUpdate=!0,this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(this.depthBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,t,e)),this.stencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,t,e)),this.depthStencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,t,e))),this.gl.renderer.bindFramebuffer({target:this.target})}}}])},899925,t=>{"use strict";let e=new Uint8Array(4),i=1;t.s(["Texture",0,class{constructor(t,{image:e,target:r=t.TEXTURE_2D,type:s=t.UNSIGNED_BYTE,format:a=t.RGBA,internalFormat:h=a,wrapS:l=t.CLAMP_TO_EDGE,wrapT:n=t.CLAMP_TO_EDGE,wrapR:u=t.CLAMP_TO_EDGE,generateMipmaps:o=r===(t.TEXTURE_2D||t.TEXTURE_CUBE_MAP),minFilter:g=o?t.NEAREST_MIPMAP_LINEAR:t.LINEAR,magFilter:c=t.LINEAR,premultiplyAlpha:f=!1,unpackAlignment:d=4,flipY:p=r==(t.TEXTURE_2D||t.TEXTURE_3D),anisotropy:m=0,level:E=0,width:T,height:v=T,length:R=1}={}){this.gl=t,this.id=i++,this.image=e,this.target=r,this.type=s,this.format=a,this.internalFormat=h,this.minFilter=g,this.magFilter=c,this.wrapS=l,this.wrapT=n,this.wrapR=u,this.generateMipmaps=o,this.premultiplyAlpha=f,this.unpackAlignment=d,this.flipY=p,this.anisotropy=Math.min(m,this.gl.renderer.parameters.maxAnisotropy),this.level=E,this.width=T,this.height=v,this.length=R,this.texture=this.gl.createTexture(),this.store={image:null},this.glState=this.gl.renderer.state,this.state={},this.state.minFilter=this.gl.NEAREST_MIPMAP_LINEAR,this.state.magFilter=this.gl.LINEAR,this.state.wrapS=this.gl.REPEAT,this.state.wrapT=this.gl.REPEAT,this.state.anisotropy=0}bind(){this.glState.textureUnits[this.glState.activeTextureUnit]!==this.id&&(this.gl.bindTexture(this.target,this.texture),this.glState.textureUnits[this.glState.activeTextureUnit]=this.id)}update(t=0){let i=!(this.image===this.store.image&&!this.needsUpdate);if((i||this.glState.textureUnits[t]!==this.id)&&(this.gl.renderer.activeTexture(t),this.bind()),i){if(this.needsUpdate=!1,this.flipY!==this.glState.flipY&&(this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL,this.flipY),this.glState.flipY=this.flipY),this.premultiplyAlpha!==this.glState.premultiplyAlpha&&(this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),this.glState.premultiplyAlpha=this.premultiplyAlpha),this.unpackAlignment!==this.glState.unpackAlignment&&(this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT,this.unpackAlignment),this.glState.unpackAlignment=this.unpackAlignment),this.minFilter!==this.state.minFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MIN_FILTER,this.minFilter),this.state.minFilter=this.minFilter),this.magFilter!==this.state.magFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MAG_FILTER,this.magFilter),this.state.magFilter=this.magFilter),this.wrapS!==this.state.wrapS&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_S,this.wrapS),this.state.wrapS=this.wrapS),this.wrapT!==this.state.wrapT&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_T,this.wrapT),this.state.wrapT=this.wrapT),this.wrapR!==this.state.wrapR&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_R,this.wrapR),this.state.wrapR=this.wrapR),this.anisotropy&&this.anisotropy!==this.state.anisotropy&&(this.gl.texParameterf(this.target,this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT,this.anisotropy),this.state.anisotropy=this.anisotropy),this.image){if(this.image.width&&(this.width=this.image.width,this.height=this.image.height),this.target===this.gl.TEXTURE_CUBE_MAP)for(let t=0;t<6;t++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+t,this.level,this.internalFormat,this.format,this.type,this.image[t]);else if(ArrayBuffer.isView(this.image))this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,this.image):(this.target===this.gl.TEXTURE_2D_ARRAY||this.target===this.gl.TEXTURE_3D)&&this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);else if(this.image.isCompressedTexture)for(let t=0;t<this.image.length;t++)this.gl.compressedTexImage2D(this.target,t,this.internalFormat,this.image[t].width,this.image[t].height,0,this.image[t].data);else this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.format,this.type,this.image):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);if(this.generateMipmaps){var r,s;this.gl.renderer.isWebgl2||((r=this.image.width)&r-1)==0&&((s=this.image.height)&s-1)==0?this.gl.generateMipmap(this.target):(this.generateMipmaps=!1,this.wrapS=this.wrapT=this.gl.CLAMP_TO_EDGE,this.minFilter=this.gl.LINEAR)}this.onUpdate&&this.onUpdate()}else if(this.target===this.gl.TEXTURE_CUBE_MAP)for(let t=0;t<6;t++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,e);else this.width?this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,null):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,null):this.gl.texImage2D(this.target,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,e);this.store.image=this.image}}}])},753604,t=>{"use strict";var e=t.i(994964);class i extends e.Geometry{constructor(t,{attributes:e={}}={}){Object.assign(e,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(t,e)}}t.s(["Triangle",0,i])}]);