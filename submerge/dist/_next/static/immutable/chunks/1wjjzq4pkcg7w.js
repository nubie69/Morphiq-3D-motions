(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,498617,t=>{"use strict";var e=t.i(843476),i=t.i(271645),r=t.i(221663),a=t.i(956850),s=t.i(80075),l=t.i(753604),n=t.i(899925),h=t.i(450922);let u={molten:0,aurora:1,chrome:2,embers:3,tide:4},o=t=>{let e=t.replace("#",""),i=3===e.length?e.split("").map(t=>t+t).join(""):e,r=parseInt(i,16);return Number.isNaN(r)||6!==i.length?[1,1,1]:[(r>>16&255)/255,(r>>8&255)/255,(255&r)/255]},c=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`,g=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uMask;
uniform vec2  uResolution;
uniform float uTime;
uniform float uMaterial;
uniform float uScale;
uniform float uSweep;
uniform float uGlow;
uniform float uGrain;
uniform float uWarp;
uniform float uBoost;
uniform vec2  uPointer;
uniform vec3  uA;
uniform vec3  uB;

float hash21(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s;
}

vec3 materialAt(vec2 p, float t) {
  if (uMaterial < 0.5) {
    float v = fbm(p + vec2(t * 0.6, t * 0.2));
    float veins = smoothstep(0.42, 0.72, v);
    return mix(uA * 0.35, uB, veins) + uB * pow(veins, 3.0) * 0.6;
  }
  if (uMaterial < 1.5) {
    float band = fbm(p * vec2(0.7, 2.2) + vec2(t * 0.35, 0.0));
    return mix(uA, uB, smoothstep(0.25, 0.85, band)) * (0.7 + 0.6 * band);
  }
  if (uMaterial < 2.5) {
    // Chrome: hard light-to-dark steps rather than a gradient. The sharpness of
    // the transition is what reads as metal.
    float h = fbm(p * 1.4 + vec2(t * 0.25, 0.0));
    float step1 = smoothstep(0.44, 0.5, h);
    float step2 = smoothstep(0.62, 0.66, h);
    vec3 base = mix(uA * 0.25, vec3(0.85), step1);
    return mix(base, uB, step2 * 0.7);
  }
  if (uMaterial < 3.5) {
    float heat = fbm(p * 1.6 - vec2(0.0, t * 1.1));
    float core = smoothstep(0.35, 0.9, heat);
    return mix(uA * 0.2, uB, core) + vec3(1.0, 0.55, 0.15) * pow(core, 4.0) * 0.9;
  }
  float w = sin(p.x * 2.2 + t) * 0.5 + fbm(p + t * 0.15);
  return mix(uA, uB, smoothstep(-0.2, 1.2, w));
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = vec2(uv.x * aspect, uv.y) * max(uScale, 0.05) * 3.0;

  float t = uTime * (1.0 + uBoost);
  vec2 warp = vec2(fbm(p + t * 0.2), fbm(p.yx + 4.1 - t * 0.15)) - 0.5;
  vec3 col = materialAt(p + warp * uWarp * 1.6, t);

  // The pour runs against the glyph's own horizontal position, so it follows the
  // letterforms instead of a rectangle crossing them.
  float pour = uSweep <= 0.001 ? 1.0 : smoothstep(0.0, 1.0, (uTime / max(uSweep, 0.02)) - uv.x * 0.9);
  col *= pour;

  float mask = texture(uMask, vec2(uv.x, 1.0 - uv.y)).a;

  // Bloom taps the mask around the fragment rather than blurring the material —
  // the glow has to belong to the glyph edge, not to whatever colour happens to
  // sit near it.
  vec2 px = 1.0 / max(uResolution, vec2(1.0));
  float halo = 0.0;
  halo += texture(uMask, vec2(uv.x + px.x * 3.0, 1.0 - uv.y)).a;
  halo += texture(uMask, vec2(uv.x - px.x * 3.0, 1.0 - uv.y)).a;
  halo += texture(uMask, vec2(uv.x, 1.0 - uv.y + px.y * 3.0)).a;
  halo += texture(uMask, vec2(uv.x, 1.0 - uv.y - px.y * 3.0)).a;
  halo *= 0.25;

  float g = hash21(gl_FragCoord.xy) - 0.5;
  col += g * uGrain * 0.35;

  float pointerLift = exp(-dot(uv - uPointer, uv - uPointer) * 18.0) * uBoost * 0.4;
  col *= 1.0 + pointerLift;

  float alpha = clamp(mask + halo * uGlow * 0.55, 0.0, 1.0) * pour;
  fragColor = vec4(col * alpha, alpha);
}`,p=(0,i.memo)(({text:t="MOTION GARDEN",material:p="molten",flowSpeed:m=.4,scale:f=1.6,sweep:v=.8,glow:d=.4,grain:x=.15,warp:E=.25,hoverBoost:w=.6,colorA:T="#a855f7",colorB:A="#38bdf8",paused:R=!1,reducedMotion:y=!1,className:_})=>{let M=(0,i.useRef)(null),S=(0,i.useRef)(null),P=(0,i.useRef)(null),U=(0,i.useRef)(null),b=(0,i.useRef)(null),B=(0,i.useRef)({x:.5,y:.5,over:!1}),[F,C]=(0,i.useState)(!1),I=(0,h.useAnimationLoop)({target:M,halted:R||y,dpr:"auto",onResize:t=>U.current?.(t),onFrame:({dt:t})=>!!P.current&&P.current(t),gl:()=>b.current}),N=(0,i.useRef)({text:t,material:p,flowSpeed:m,scale:f,sweep:v,glow:d,grain:x,warp:E,hoverBoost:w,colorA:T,colorB:A});N.current={text:t,material:p,flowSpeed:m,scale:f,sweep:v,glow:d,grain:x,warp:E,hoverBoost:w,colorA:T,colorB:A},(0,i.useEffect)(()=>{(()=>{try{return!!document.createElement("canvas").getContext("webgl2")}catch{return!1}})()||C(!0)},[]),(0,i.useEffect)(()=>{let t=M.current;if(F||!t)return;let e=new r.Renderer({webgl:2,alpha:!0,antialias:!1,premultipliedAlpha:!0,powerPreference:"high-performance",dpr:Math.min(window.devicePixelRatio||1,2)}),i=e.gl;b.current=i,i.clearColor(0,0,0,0);let h=i.canvas;h.style.display="block",h.style.position="absolute",h.style.top="0",h.style.left="0",h.style.pointerEvents="none",t.appendChild(h);let m=document.createElement("canvas"),w=new n.Texture(i,{image:m,generateMipmaps:!1,minFilter:i.LINEAR,magFilter:i.LINEAR,wrapS:i.CLAMP_TO_EDGE,wrapT:i.CLAMP_TO_EDGE,premultiplyAlpha:!1,flipY:!1}),R=new a.Program(i,{vertex:c,fragment:g,transparent:!0,uniforms:{uMask:{value:w},uResolution:{value:new Float32Array([1,1])},uTime:{value:0},uMaterial:{value:u[p]??0},uScale:{value:f},uSweep:{value:v},uGlow:{value:d},uGrain:{value:x},uWarp:{value:E},uBoost:{value:0},uPointer:{value:new Float32Array([.5,.5])},uA:{value:new Float32Array(o(T))},uB:{value:new Float32Array(o(A))}}}),y=new s.Mesh(i,{geometry:new l.Triangle(i),program:R}),_=R.uniforms,C=0,k=0,D=()=>{let t=N.current;_.uTime.value=C,_.uMaterial.value=u[t.material]??0,_.uScale.value=t.scale,_.uSweep.value=t.sweep,_.uGlow.value=t.glow,_.uGrain.value=t.grain,_.uWarp.value=t.warp,_.uBoost.value=k;let e=_.uPointer.value;e[0]=B.current.x,e[1]=B.current.y,_.uA.value.set(o(t.colorA)),_.uB.value.set(o(t.colorB))};P.current=t=>{let i=N.current;C+=t*i.flowSpeed;let r=B.current.over?i.hoverBoost:0;k+=(r-k)*Math.min(1,6*t),D(),e.render({scene:y})},U.current=({width:t,height:r,dpr:a})=>{e.dpr=a,e.setSize(Math.max(1,Math.floor(t)),Math.max(1,Math.floor(r)));let s=_.uResolution.value;s[0]=i.drawingBufferWidth,s[1]=i.drawingBufferHeight,((t,e,i)=>{let r=S.current;if(!r||t<1||e<1)return;m.width=Math.max(1,Math.round(t*i)),m.height=Math.max(1,Math.round(e*i));let a=m.getContext("2d");if(!a)return;let s=getComputedStyle(r);a.clearRect(0,0,m.width,m.height),a.scale(i,i),a.font=`${s.fontStyle} ${s.fontWeight} ${s.fontSize} / ${s.lineHeight} ${s.fontFamily}`,a.letterSpacing=s.letterSpacing,a.textAlign="center",a.textBaseline="middle",a.fillStyle="#fff",a.fillText(N.current.text,t/2,e/2),w.image=m,w.needsUpdate=!0})(t,r,a),D(),e.render({scene:y})},I.resize(),I.start();let L=!1;return document.fonts?.ready.then(()=>{L||I.resize()}),()=>{L=!0,P.current=null,U.current=null,t.contains(h)&&t.removeChild(h)}},[F]),(0,i.useEffect)(()=>{I.resize()},[t,I]),(0,i.useEffect)(()=>{I.paint()},[p,m,f,v,d,x,E,w,T,A,I]);let k=()=>{B.current.over=!1,I.start()};return F?(0,e.jsx)("span",{className:_??"relative inline-block",style:{backgroundImage:`linear-gradient(100deg, ${T}, ${A})`,backgroundClip:"text",WebkitBackgroundClip:"text",color:"transparent"},children:t}):(0,e.jsx)("span",{ref:M,className:_??"relative inline-block",onPointerMove:t=>{let e=t.currentTarget.getBoundingClientRect();0!==e.width&&0!==e.height&&(B.current.x=(t.clientX-e.left)/e.width,B.current.y=1-(t.clientY-e.top)/e.height,B.current.over=!0,I.start())},onPointerLeave:k,onPointerCancel:k,children:(0,e.jsx)("span",{ref:S,style:{color:"transparent"},children:t})})});p.displayName="Inlay",t.s(["default",0,function({values:t,reducedMotion:i,paused:r}){return(0,e.jsxs)("div",{className:"relative flex h-full min-h-80 w-full flex-col items-center justify-center gap-4 px-8 text-center",children:[(0,e.jsx)("p",{className:"font-display text-[10px] tracking-[0.32em] text-ink-mute uppercase",children:"Real text, poured full"}),(0,e.jsx)("h2",{className:"font-display leading-none font-bold tracking-tight",style:{fontSize:"clamp(2rem, 7vw, 16rem)"},children:(0,e.jsx)(p,{text:"SHADOW",material:t.material,flowSpeed:t.flowSpeed,scale:t.scale,sweep:t.sweep,glow:t.glow,grain:t.grain,warp:t.warp,hoverBoost:t.hoverBoost,colorA:t.colorA,colorB:t.colorB,paused:r,reducedMotion:i})}),(0,e.jsx)("p",{className:"max-w-sm text-xs leading-relaxed text-ink-dim",children:"Select the word above. It is a real text node — the material is painted over it, not instead of it."})]})}],498617)},341336,function(t){t.n(t.i(498617))},450922,t=>{"use strict";var e=t.i(271645);let i=1/15;t.s(["useAnimationLoop",0,function(t){let r=(0,e.useRef)(t);(0,e.useLayoutEffect)(()=>{r.current=t});let a=(0,e.useRef)(null),s=(0,e.useRef)(null),l=(0,e.useRef)(!1),n=(0,e.useRef)(!1),h=(0,e.useRef)(0),u=(0,e.useRef)(0),o=(0,e.useRef)(0),c=(0,e.useCallback)(()=>{let t=r.current.target.current;if(!t)return null;let e=t.getBoundingClientRect(),i=r.current.dpr??"auto",a=Math.min(window.devicePixelRatio||1,"auto"===i?2:i);return{width:e.width,height:e.height,dpr:a,bufferWidth:Math.max(1,Math.round(e.width*a)),bufferHeight:Math.max(1,Math.round(e.height*a))}},[]),g=(0,e.useCallback)(function t(e){if(n.current)return;0===h.current&&(h.current=e);let s=0===u.current?0:Math.min((e-u.current)/1e3,i);u.current=e;let c={now:e,dt:s,elapsed:(e-h.current)/1e3,frame:o.current++},g=r.current.onFrame?.(c);if(!n.current){if(!1===g||r.current.halted){l.current=!1,a.current=null;return}a.current=requestAnimationFrame(t)}},[]),p=(0,e.useCallback)(()=>{n.current||l.current||(l.current=!0,u.current=0,a.current=requestAnimationFrame(g))},[g]),m=(0,e.useCallback)(()=>{l.current=!1,null!==a.current&&(cancelAnimationFrame(a.current),a.current=null)},[]),f=(0,e.useCallback)(()=>p(),[p]),v=(0,e.useCallback)(()=>{let t=c();t&&(r.current.onResize?.(t),!1!==r.current.paintWhenHalted?f():r.current.halted||p())},[c,f,p]),d=t.deps??[];(0,e.useEffect)(()=>{n.current=!1;let t=r.current.target.current;if(!t)return;let e=()=>{n.current||v()},i=new ResizeObserver(()=>{let t=r.current.resizeDebounceMs??0;t<=0?e():(null!==s.current&&clearTimeout(s.current),s.current=setTimeout(()=>{s.current=null,e()},t))});return i.observe(t),v(),r.current.halted||p(),()=>{n.current=!0,l.current=!1,null!==a.current&&(cancelAnimationFrame(a.current),a.current=null),null!==s.current&&(clearTimeout(s.current),s.current=null),i.disconnect(),r.current.onDispose?.();let t=r.current.gl?.();t?.getExtension("WEBGL_lose_context")?.loseContext(),h.current=0,u.current=0,o.current=0}},d);let x=t.halted??!1;return(0,e.useEffect)(()=>{x||p()},[x,p]),(0,e.useMemo)(()=>({start:p,stop:m,paint:f,resize:v,get running(){return l.current}}),[p,m,f,v])}])},899925,t=>{"use strict";let e=new Uint8Array(4),i=1;t.s(["Texture",0,class{constructor(t,{image:e,target:r=t.TEXTURE_2D,type:a=t.UNSIGNED_BYTE,format:s=t.RGBA,internalFormat:l=s,wrapS:n=t.CLAMP_TO_EDGE,wrapT:h=t.CLAMP_TO_EDGE,wrapR:u=t.CLAMP_TO_EDGE,generateMipmaps:o=r===(t.TEXTURE_2D||t.TEXTURE_CUBE_MAP),minFilter:c=o?t.NEAREST_MIPMAP_LINEAR:t.LINEAR,magFilter:g=t.LINEAR,premultiplyAlpha:p=!1,unpackAlignment:m=4,flipY:f=r==(t.TEXTURE_2D||t.TEXTURE_3D),anisotropy:v=0,level:d=0,width:x,height:E=x,length:w=1}={}){this.gl=t,this.id=i++,this.image=e,this.target=r,this.type=a,this.format=s,this.internalFormat=l,this.minFilter=c,this.magFilter=g,this.wrapS=n,this.wrapT=h,this.wrapR=u,this.generateMipmaps=o,this.premultiplyAlpha=p,this.unpackAlignment=m,this.flipY=f,this.anisotropy=Math.min(v,this.gl.renderer.parameters.maxAnisotropy),this.level=d,this.width=x,this.height=E,this.length=w,this.texture=this.gl.createTexture(),this.store={image:null},this.glState=this.gl.renderer.state,this.state={},this.state.minFilter=this.gl.NEAREST_MIPMAP_LINEAR,this.state.magFilter=this.gl.LINEAR,this.state.wrapS=this.gl.REPEAT,this.state.wrapT=this.gl.REPEAT,this.state.anisotropy=0}bind(){this.glState.textureUnits[this.glState.activeTextureUnit]!==this.id&&(this.gl.bindTexture(this.target,this.texture),this.glState.textureUnits[this.glState.activeTextureUnit]=this.id)}update(t=0){let i=!(this.image===this.store.image&&!this.needsUpdate);if((i||this.glState.textureUnits[t]!==this.id)&&(this.gl.renderer.activeTexture(t),this.bind()),i){if(this.needsUpdate=!1,this.flipY!==this.glState.flipY&&(this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL,this.flipY),this.glState.flipY=this.flipY),this.premultiplyAlpha!==this.glState.premultiplyAlpha&&(this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),this.glState.premultiplyAlpha=this.premultiplyAlpha),this.unpackAlignment!==this.glState.unpackAlignment&&(this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT,this.unpackAlignment),this.glState.unpackAlignment=this.unpackAlignment),this.minFilter!==this.state.minFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MIN_FILTER,this.minFilter),this.state.minFilter=this.minFilter),this.magFilter!==this.state.magFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MAG_FILTER,this.magFilter),this.state.magFilter=this.magFilter),this.wrapS!==this.state.wrapS&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_S,this.wrapS),this.state.wrapS=this.wrapS),this.wrapT!==this.state.wrapT&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_T,this.wrapT),this.state.wrapT=this.wrapT),this.wrapR!==this.state.wrapR&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_R,this.wrapR),this.state.wrapR=this.wrapR),this.anisotropy&&this.anisotropy!==this.state.anisotropy&&(this.gl.texParameterf(this.target,this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT,this.anisotropy),this.state.anisotropy=this.anisotropy),this.image){if(this.image.width&&(this.width=this.image.width,this.height=this.image.height),this.target===this.gl.TEXTURE_CUBE_MAP)for(let t=0;t<6;t++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+t,this.level,this.internalFormat,this.format,this.type,this.image[t]);else if(ArrayBuffer.isView(this.image))this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,this.image):(this.target===this.gl.TEXTURE_2D_ARRAY||this.target===this.gl.TEXTURE_3D)&&this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);else if(this.image.isCompressedTexture)for(let t=0;t<this.image.length;t++)this.gl.compressedTexImage2D(this.target,t,this.internalFormat,this.image[t].width,this.image[t].height,0,this.image[t].data);else this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.format,this.type,this.image):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);if(this.generateMipmaps){var r,a;this.gl.renderer.isWebgl2||((r=this.image.width)&r-1)==0&&((a=this.image.height)&a-1)==0?this.gl.generateMipmap(this.target):(this.generateMipmaps=!1,this.wrapS=this.wrapT=this.gl.CLAMP_TO_EDGE,this.minFilter=this.gl.LINEAR)}this.onUpdate&&this.onUpdate()}else if(this.target===this.gl.TEXTURE_CUBE_MAP)for(let t=0;t<6;t++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,e);else this.width?this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,null):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,null):this.gl.texImage2D(this.target,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,e);this.store.image=this.image}}}])},753604,t=>{"use strict";var e=t.i(994964);class i extends e.Geometry{constructor(t,{attributes:e={}}={}){Object.assign(e,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(t,e)}}t.s(["Triangle",0,i])}]);