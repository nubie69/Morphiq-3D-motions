(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,288417,t=>{"use strict";var e=t.i(843476),i=t.i(271645),r=t.i(221663),s=t.i(956850),l=t.i(80075),a=t.i(753604),h=t.i(562611),n=t.i(899925),u=t.i(450922);let o={"torus-knot":0,cube:1,sphere:2,gyroid:3,column:4},g={classic:" .:-=+*#%@",blocks:" .:oO0@#",minimal:" .:*#",binary:" .01",dots:" .·:•●"},c=t=>{let e=t.replace("#",""),i=3===e.length?e.split("").map(t=>t+t).join(""):e,r=parseInt(i,16);return Number.isNaN(r)||6!==i.length?[1,1,1]:[(r>>16&255)/255,(r>>8&255)/255,(255&r)/255]};function f(t){let e=document.createElement("canvas");e.width=32*t.length,e.height=32;let i=e.getContext("2d");if(!i)return e;i.fillStyle="#000",i.fillRect(0,0,e.width,e.height),i.fillStyle="#fff",i.font=`${Math.round(24.96)}px ui-monospace, "Cascadia Mono", Menlo, monospace`,i.textAlign="center",i.textBaseline="middle";for(let e=0;e<t.length;e++)i.fillText(t[e],32*e+16,17);return e}let d=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`,p=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform vec2  uGrid;
uniform float uSolid;
uniform float uSpin;
uniform float uTilt;
uniform float uZoom;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float sdTorusKnot(vec3 p) {
  float a = atan(p.z, p.x);
  vec2 q = vec2(length(p.xz) - 1.05, p.y);
  q *= rot(a * 1.5);
  q.x = abs(q.x) - 0.34;
  return length(q) - 0.13;
}
float sdBox(vec3 p, vec3 b) {
  vec3 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}
float sdGyroid(vec3 p) {
  p *= 2.4;
  // Gyroid is not a true distance field, so the march is scaled down to keep it
  // from stepping straight through the surface.
  return (abs(dot(sin(p), cos(p.zxy))) - 0.42) * 0.22;
}
float sdColumn(vec3 p) {
  vec3 q = p;
  q.xz *= rot(q.y * 1.1);
  float flutes = length(max(abs(q.xz) - 0.10, 0.0)) - 0.30;
  return max(flutes, abs(p.y) - 1.05);
}

float map(vec3 p) {
  if (uSolid < 0.5) return sdTorusKnot(p);
  if (uSolid < 1.5) return sdBox(p, vec3(0.78));
  if (uSolid < 2.5) return length(p) - 1.05;
  if (uSolid < 3.5) return sdGyroid(p);
  return sdColumn(p);
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

void main() {
  vec2 uv = (vUv - 0.5) * 2.0;
  uv.x *= uGrid.x / max(uGrid.y, 1.0);

  vec3 ro = vec3(0.0, 0.0, 3.4);
  // Narrowing the field of view rather than moving the camera. Dollying in
  // would clip the near face of the solid long before the silhouette filled
  // the frame.
  vec3 rd = normalize(vec3(uv / max(uZoom, 0.05), -1.9));

  float pitch = uTilt * 0.9;
  ro.yz *= rot(pitch); rd.yz *= rot(pitch);
  ro.xz *= rot(uSpin); rd.xz *= rot(uSpin);

  float t = 0.0;
  float hit = 0.0;
  for (int i = 0; i < 72; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);
    if (d < 0.0015) { hit = 1.0; break; }
    t += d;
    if (t > 7.0) break;
  }

  float lum = 0.0;
  float edge = 0.0;
  if (hit > 0.5) {
    vec3 p = ro + rd * t;
    vec3 n = normalAt(p);
    vec3 l = normalize(vec3(0.6, 0.8, 0.45));
    float diff = max(dot(n, l), 0.0);
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.0);
    lum = 0.12 + diff * 0.85;
    // The silhouette term, carried in G so the display pass can add it back
    // without it polluting the shading it is meant to rescue.
    edge = rim;
  }
  fragColor = vec4(lum, edge, 0.0, 1.0);
}`,m=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uScene;
uniform sampler2D uAtlas;
uniform vec2  uResolution;
uniform vec2  uGrid;
uniform float uCell;
uniform float uCount;
uniform float uContrast;
uniform float uEdgeBoost;
uniform float uGlow;
uniform vec3  uInk;
uniform vec3  uBg;

void main() {
  vec2 px = gl_FragCoord.xy;
  vec2 cell = floor(px / uCell);
  vec2 inCell = fract(px / uCell);

  vec2 sceneUv = (cell + 0.5) / uGrid;
  vec4 s = texture(uScene, sceneUv);
  float lum = clamp(s.r + s.g * uEdgeBoost, 0.0, 1.0);
  lum = pow(lum, 1.0 / max(uContrast, 0.05));

  float idx = floor(lum * (uCount - 0.001));
  // gl_FragCoord runs bottom-up and the atlas was drawn top-down, so the glyph
  // is sampled upside down unless y is flipped here. Everything still "works"
  // without this and every letter is silently mirrored.
  vec2 atlasUv = vec2((idx + inCell.x) / uCount, 1.0 - inCell.y);
  float g = texture(uAtlas, atlasUv).r;

  vec3 col = mix(uBg, uInk, g);
  col += uInk * lum * uGlow * 0.22;
  fragColor = vec4(col, 1.0);
}`,E=(0,i.memo)(({solid:t="torus-knot",charset:E="classic",cellSize:T=10,spinSpeed:v=.35,tilt:R=.4,zoom:x=1,contrast:w=1.1,edgeBoost:_=.5,glow:A=.3,inkColor:S="#7ef0c0",backgroundColor:C="#04060a",paused:b=!1,reducedMotion:N=!1,className:y})=>{let F=(0,i.useRef)(null),M=(0,i.useRef)(null),D=(0,i.useRef)(null),P=(0,i.useRef)(null),U=(0,i.useRef)(null),B=(0,i.useRef)({yaw:0,pitch:0,vYaw:0,vPitch:0,dragging:!1,pointerId:-1,lastX:0,lastY:0,lastT:0}),[I,G]=(0,i.useState)(!1),L=(0,u.useAnimationLoop)({target:F,halted:b||N,dpr:1,onResize:t=>D.current?.(t),onFrame:({dt:t})=>!!M.current&&M.current(t),gl:()=>P.current}),X=(0,i.useRef)({solid:t,charset:E,cellSize:T,spinSpeed:v,tilt:R,zoom:x,contrast:w,edgeBoost:_,glow:A,inkColor:S,backgroundColor:C});X.current={solid:t,charset:E,cellSize:T,spinSpeed:v,tilt:R,zoom:x,contrast:w,edgeBoost:_,glow:A,inkColor:S,backgroundColor:C},(0,i.useEffect)(()=>{(()=>{try{return!!document.createElement("canvas").getContext("webgl2")}catch{return!1}})()||G(!0)},[]),(0,i.useEffect)(()=>{let e=F.current;if(I||!e)return;let i=new r.Renderer({webgl:2,alpha:!1,antialias:!1,powerPreference:"high-performance",dpr:1}),u=i.gl;P.current=u;let v=u.canvas;v.style.display="block",v.style.position="absolute",v.style.top="0",v.style.left="0",e.appendChild(v);let b=new a.Triangle(u),N=new h.RenderTarget(u,{width:64,height:64,depth:!1,minFilter:u.NEAREST,magFilter:u.NEAREST,wrapS:u.CLAMP_TO_EDGE,wrapT:u.CLAMP_TO_EDGE}),y=new n.Texture(u,{image:f(g[E]),generateMipmaps:!1,minFilter:u.LINEAR,magFilter:u.LINEAR,wrapS:u.CLAMP_TO_EDGE,wrapT:u.CLAMP_TO_EDGE,flipY:!1}),G=g[E].length,O=new s.Program(u,{vertex:d,fragment:p,uniforms:{uGrid:{value:new Float32Array([64,64])},uSolid:{value:o[t]??0},uSpin:{value:0},uTilt:{value:R},uZoom:{value:x}}}),k=new s.Program(u,{vertex:d,fragment:m,uniforms:{uScene:{value:N.texture},uAtlas:{value:y},uResolution:{value:new Float32Array([1,1])},uGrid:{value:new Float32Array([64,64])},uCell:{value:T},uCount:{value:G},uContrast:{value:w},uEdgeBoost:{value:_},uGlow:{value:A},uInk:{value:new Float32Array(c(S))},uBg:{value:new Float32Array(c(C))}}}),z=new l.Mesh(u,{geometry:b,program:O}),Y=new l.Mesh(u,{geometry:b,program:k}),H=O.uniforms,W=k.uniforms;U.current=t=>{y.image=f(t),y.needsUpdate=!0,G=t.length};let q=0,j=64,K=64,Z=()=>{let t=X.current,e=B.current;H.uSolid.value=o[t.solid]??0,H.uSpin.value=q+e.yaw,H.uTilt.value=Math.max(-1.45,Math.min(1.45,t.tilt+e.pitch)),H.uZoom.value=t.zoom,H.uGrid.value[0]=j,H.uGrid.value[1]=K,i.render({scene:z,target:N}),W.uScene.value=N.texture,W.uGrid.value[0]=j,W.uGrid.value[1]=K,W.uCell.value=Math.max(t.cellSize,2),W.uCount.value=G,W.uContrast.value=t.contrast,W.uEdgeBoost.value=t.edgeBoost,W.uGlow.value=t.glow,W.uInk.value.set(c(t.inkColor)),W.uBg.value.set(c(t.backgroundColor)),i.render({scene:Y})};return M.current=t=>{let e=B.current;if(!e.dragging){e.yaw+=e.vYaw*t,e.pitch=Math.max(-1.45,Math.min(1.45,e.pitch+e.vPitch*t));let i=Math.pow(.92,60*t);e.vYaw*=i,e.vPitch*=i,q=(q+t*X.current.spinSpeed*.6)%(2*Math.PI)}e.yaw%=2*Math.PI,Z()},D.current=({width:t,height:e})=>{i.setSize(Math.max(1,Math.floor(t)),Math.max(1,Math.floor(e)));let r=Math.max(X.current.cellSize,2);j=Math.max(2,Math.ceil(t/r)),K=Math.max(2,Math.ceil(e/r)),N.setSize(j,K);let s=W.uResolution;s.value[0]=t,s.value[1]=e,Z()},L.resize(),L.start(),()=>{M.current=null,D.current=null,U.current=null,e.contains(v)&&e.removeChild(v)}},[I]),(0,i.useEffect)(()=>{L.resize()},[T,L]),(0,i.useEffect)(()=>{U.current?.(g[E]),L.paint()},[E,L]),(0,i.useEffect)(()=>{L.paint()},[t,v,R,x,w,_,A,S,C,L]);let O=t=>{let e=B.current;-1!==e.pointerId&&t.currentTarget.hasPointerCapture(e.pointerId)&&t.currentTarget.releasePointerCapture(e.pointerId),e.dragging=!1,e.pointerId=-1,L.start()};return I?(0,e.jsx)("div",{className:y??"relative h-full w-full overflow-hidden",style:{backgroundColor:C,color:S,fontFamily:"ui-monospace, Menlo, monospace",fontSize:`${Math.max(T,6)}px`,lineHeight:1,padding:"1rem",overflow:"hidden",whiteSpace:"pre"},children:Array.from({length:14},()=>"=+*#%@#*+=".repeat(12)).join("\n")}):(0,e.jsx)("div",{ref:F,className:y??"relative h-full w-full cursor-grab overflow-hidden active:cursor-grabbing [&_canvas]:touch-none",onPointerDown:t=>{let e=B.current;e.dragging=!0,e.pointerId=t.pointerId,e.lastX=t.clientX,e.lastY=t.clientY,e.lastT=t.timeStamp,e.vYaw=0,e.vPitch=0,t.currentTarget.setPointerCapture(t.pointerId),L.start()},onPointerMove:t=>{let e=B.current;if(!e.dragging||t.pointerId!==e.pointerId)return;let i=t.clientX-e.lastX,r=t.clientY-e.lastY,s=(t.timeStamp-e.lastT)/1e3,l=.008*i,a=-(.006*r);e.yaw+=l,e.pitch=Math.max(-1.45,Math.min(1.45,e.pitch+a)),s>.001&&(e.vYaw=l/s,e.vPitch=a/s),e.lastX=t.clientX,e.lastY=t.clientY,e.lastT=t.timeStamp,L.start()},onPointerUp:O,onPointerCancel:O})});E.displayName="AsciiEngine",t.s(["default",0,function({values:t,reducedMotion:i,paused:r}){return(0,e.jsxs)("div",{className:"relative h-full min-h-80 w-full",children:[(0,e.jsx)(E,{solid:t.solid,charset:t.charset,cellSize:t.cellSize,spinSpeed:t.spinSpeed,tilt:t.tilt,zoom:t.zoom,contrast:t.contrast,edgeBoost:t.edgeBoost,glow:t.glow,inkColor:t.inkColor,backgroundColor:t.backgroundColor,paused:r,reducedMotion:i}),(0,e.jsx)("p",{className:"pointer-events-none absolute right-3 bottom-2 font-display text-[9px] tracking-[0.28em] text-ink-mute uppercase",children:i?`${t.cellSize}px cells`:`drag to orbit — ${t.cellSize}px cells`})]})}],288417)},411290,function(t){t.n(t.i(288417))},450922,t=>{"use strict";var e=t.i(271645);let i=1/15;t.s(["useAnimationLoop",0,function(t){let r=(0,e.useRef)(t);(0,e.useLayoutEffect)(()=>{r.current=t});let s=(0,e.useRef)(null),l=(0,e.useRef)(null),a=(0,e.useRef)(!1),h=(0,e.useRef)(!1),n=(0,e.useRef)(0),u=(0,e.useRef)(0),o=(0,e.useRef)(0),g=(0,e.useCallback)(()=>{let t=r.current.target.current;if(!t)return null;let e=t.getBoundingClientRect(),i=r.current.dpr??"auto",s=Math.min(window.devicePixelRatio||1,"auto"===i?2:i);return{width:e.width,height:e.height,dpr:s,bufferWidth:Math.max(1,Math.round(e.width*s)),bufferHeight:Math.max(1,Math.round(e.height*s))}},[]),c=(0,e.useCallback)(function t(e){if(h.current)return;0===n.current&&(n.current=e);let l=0===u.current?0:Math.min((e-u.current)/1e3,i);u.current=e;let g={now:e,dt:l,elapsed:(e-n.current)/1e3,frame:o.current++},c=r.current.onFrame?.(g);if(!h.current){if(!1===c||r.current.halted){a.current=!1,s.current=null;return}s.current=requestAnimationFrame(t)}},[]),f=(0,e.useCallback)(()=>{h.current||a.current||(a.current=!0,u.current=0,s.current=requestAnimationFrame(c))},[c]),d=(0,e.useCallback)(()=>{a.current=!1,null!==s.current&&(cancelAnimationFrame(s.current),s.current=null)},[]),p=(0,e.useCallback)(()=>f(),[f]),m=(0,e.useCallback)(()=>{let t=g();t&&(r.current.onResize?.(t),!1!==r.current.paintWhenHalted?p():r.current.halted||f())},[g,p,f]),E=t.deps??[];(0,e.useEffect)(()=>{h.current=!1;let t=r.current.target.current;if(!t)return;let e=()=>{h.current||m()},i=new ResizeObserver(()=>{let t=r.current.resizeDebounceMs??0;t<=0?e():(null!==l.current&&clearTimeout(l.current),l.current=setTimeout(()=>{l.current=null,e()},t))});return i.observe(t),m(),r.current.halted||f(),()=>{h.current=!0,a.current=!1,null!==s.current&&(cancelAnimationFrame(s.current),s.current=null),null!==l.current&&(clearTimeout(l.current),l.current=null),i.disconnect(),r.current.onDispose?.();let t=r.current.gl?.();t?.getExtension("WEBGL_lose_context")?.loseContext(),n.current=0,u.current=0,o.current=0}},E);let T=t.halted??!1;return(0,e.useEffect)(()=>{T||f()},[T,f]),(0,e.useMemo)(()=>({start:f,stop:d,paint:p,resize:m,get running(){return a.current}}),[f,d,p,m])}])},562611,t=>{"use strict";var e=t.i(899925);t.s(["RenderTarget",0,class{constructor(t,{width:i=t.canvas.width,height:r=t.canvas.height,target:s=t.FRAMEBUFFER,color:l=1,depth:a=!0,stencil:h=!1,depthTexture:n=!1,wrapS:u=t.CLAMP_TO_EDGE,wrapT:o=t.CLAMP_TO_EDGE,wrapR:g=t.CLAMP_TO_EDGE,minFilter:c=t.LINEAR,magFilter:f=c,type:d=t.UNSIGNED_BYTE,format:p=t.RGBA,internalFormat:m=p,unpackAlignment:E,premultiplyAlpha:T}={}){this.gl=t,this.width=i,this.height=r,this.depth=a,this.stencil=h,this.buffer=this.gl.createFramebuffer(),this.target=s,this.gl.renderer.bindFramebuffer(this),this.textures=[];const v=[];for(let s=0;s<l;s++)this.textures.push(new e.Texture(t,{width:i,height:r,wrapS:u,wrapT:o,wrapR:g,minFilter:c,magFilter:f,type:d,format:p,internalFormat:m,unpackAlignment:E,premultiplyAlpha:T,flipY:!1,generateMipmaps:!1})),this.textures[s].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+s,this.gl.TEXTURE_2D,this.textures[s].texture,0),v.push(this.gl.COLOR_ATTACHMENT0+s);v.length>1&&this.gl.renderer.drawBuffers(v),this.texture=this.textures[0],n&&(this.gl.renderer.isWebgl2||this.gl.renderer.getExtension("WEBGL_depth_texture"))?(this.depthTexture=new e.Texture(t,{width:i,height:r,minFilter:this.gl.NEAREST,magFilter:this.gl.NEAREST,format:this.stencil?this.gl.DEPTH_STENCIL:this.gl.DEPTH_COMPONENT,internalFormat:t.renderer.isWebgl2?this.stencil?this.gl.DEPTH24_STENCIL8:this.gl.DEPTH_COMPONENT16:this.gl.DEPTH_COMPONENT,type:this.stencil?this.gl.UNSIGNED_INT_24_8:this.gl.UNSIGNED_INT}),this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.stencil?this.gl.DEPTH_STENCIL_ATTACHMENT:this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(a&&!h&&(this.depthBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,i,r),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.RENDERBUFFER,this.depthBuffer)),h&&!a&&(this.stencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,i,r),this.gl.framebufferRenderbuffer(this.target,this.gl.STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.stencilBuffer)),a&&h&&(this.depthStencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,i,r),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.depthStencilBuffer))),this.gl.renderer.bindFramebuffer({target:this.target})}setSize(t,e){if(this.width!==t||this.height!==e){this.width=t,this.height=e,this.gl.renderer.bindFramebuffer(this);for(let i=0;i<this.textures.length;i++)this.textures[i].width=t,this.textures[i].height=e,this.textures[i].needsUpdate=!0,this.textures[i].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+i,this.gl.TEXTURE_2D,this.textures[i].texture,0);this.depthTexture?(this.depthTexture.width=t,this.depthTexture.height=e,this.depthTexture.needsUpdate=!0,this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(this.depthBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,t,e)),this.stencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,t,e)),this.depthStencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,t,e))),this.gl.renderer.bindFramebuffer({target:this.target})}}}])},899925,t=>{"use strict";let e=new Uint8Array(4),i=1;t.s(["Texture",0,class{constructor(t,{image:e,target:r=t.TEXTURE_2D,type:s=t.UNSIGNED_BYTE,format:l=t.RGBA,internalFormat:a=l,wrapS:h=t.CLAMP_TO_EDGE,wrapT:n=t.CLAMP_TO_EDGE,wrapR:u=t.CLAMP_TO_EDGE,generateMipmaps:o=r===(t.TEXTURE_2D||t.TEXTURE_CUBE_MAP),minFilter:g=o?t.NEAREST_MIPMAP_LINEAR:t.LINEAR,magFilter:c=t.LINEAR,premultiplyAlpha:f=!1,unpackAlignment:d=4,flipY:p=r==(t.TEXTURE_2D||t.TEXTURE_3D),anisotropy:m=0,level:E=0,width:T,height:v=T,length:R=1}={}){this.gl=t,this.id=i++,this.image=e,this.target=r,this.type=s,this.format=l,this.internalFormat=a,this.minFilter=g,this.magFilter=c,this.wrapS=h,this.wrapT=n,this.wrapR=u,this.generateMipmaps=o,this.premultiplyAlpha=f,this.unpackAlignment=d,this.flipY=p,this.anisotropy=Math.min(m,this.gl.renderer.parameters.maxAnisotropy),this.level=E,this.width=T,this.height=v,this.length=R,this.texture=this.gl.createTexture(),this.store={image:null},this.glState=this.gl.renderer.state,this.state={},this.state.minFilter=this.gl.NEAREST_MIPMAP_LINEAR,this.state.magFilter=this.gl.LINEAR,this.state.wrapS=this.gl.REPEAT,this.state.wrapT=this.gl.REPEAT,this.state.anisotropy=0}bind(){this.glState.textureUnits[this.glState.activeTextureUnit]!==this.id&&(this.gl.bindTexture(this.target,this.texture),this.glState.textureUnits[this.glState.activeTextureUnit]=this.id)}update(t=0){let i=!(this.image===this.store.image&&!this.needsUpdate);if((i||this.glState.textureUnits[t]!==this.id)&&(this.gl.renderer.activeTexture(t),this.bind()),i){if(this.needsUpdate=!1,this.flipY!==this.glState.flipY&&(this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL,this.flipY),this.glState.flipY=this.flipY),this.premultiplyAlpha!==this.glState.premultiplyAlpha&&(this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),this.glState.premultiplyAlpha=this.premultiplyAlpha),this.unpackAlignment!==this.glState.unpackAlignment&&(this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT,this.unpackAlignment),this.glState.unpackAlignment=this.unpackAlignment),this.minFilter!==this.state.minFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MIN_FILTER,this.minFilter),this.state.minFilter=this.minFilter),this.magFilter!==this.state.magFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MAG_FILTER,this.magFilter),this.state.magFilter=this.magFilter),this.wrapS!==this.state.wrapS&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_S,this.wrapS),this.state.wrapS=this.wrapS),this.wrapT!==this.state.wrapT&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_T,this.wrapT),this.state.wrapT=this.wrapT),this.wrapR!==this.state.wrapR&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_R,this.wrapR),this.state.wrapR=this.wrapR),this.anisotropy&&this.anisotropy!==this.state.anisotropy&&(this.gl.texParameterf(this.target,this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT,this.anisotropy),this.state.anisotropy=this.anisotropy),this.image){if(this.image.width&&(this.width=this.image.width,this.height=this.image.height),this.target===this.gl.TEXTURE_CUBE_MAP)for(let t=0;t<6;t++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+t,this.level,this.internalFormat,this.format,this.type,this.image[t]);else if(ArrayBuffer.isView(this.image))this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,this.image):(this.target===this.gl.TEXTURE_2D_ARRAY||this.target===this.gl.TEXTURE_3D)&&this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);else if(this.image.isCompressedTexture)for(let t=0;t<this.image.length;t++)this.gl.compressedTexImage2D(this.target,t,this.internalFormat,this.image[t].width,this.image[t].height,0,this.image[t].data);else this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.format,this.type,this.image):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);if(this.generateMipmaps){var r,s;this.gl.renderer.isWebgl2||((r=this.image.width)&r-1)==0&&((s=this.image.height)&s-1)==0?this.gl.generateMipmap(this.target):(this.generateMipmaps=!1,this.wrapS=this.wrapT=this.gl.CLAMP_TO_EDGE,this.minFilter=this.gl.LINEAR)}this.onUpdate&&this.onUpdate()}else if(this.target===this.gl.TEXTURE_CUBE_MAP)for(let t=0;t<6;t++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,e);else this.width?this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,null):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,null):this.gl.texImage2D(this.target,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,e);this.store.image=this.image}}}])},753604,t=>{"use strict";var e=t.i(994964);class i extends e.Geometry{constructor(t,{attributes:e={}}={}){Object.assign(e,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(t,e)}}t.s(["Triangle",0,i])}]);