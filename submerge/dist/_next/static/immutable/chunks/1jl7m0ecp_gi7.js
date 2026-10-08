(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,512538,t=>{"use strict";var e=t.i(843476),i=t.i(221663),r=t.i(956850),s=t.i(80075),a=t.i(11308),l=t.i(753604),n=t.i(562611),h=t.i(271645),u=t.i(450922);let o=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,f=`#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[8];
uniform int uColorCount;
uniform int uStrandCount;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaviness;
uniform float uThickness;
uniform float uGlow;
uniform float uTaper;
uniform float uSpread;
uniform float uHueShift;
uniform float uIntensity;
uniform float uOpacity;
uniform float uScale;
uniform float uSaturation;
uniform float uEnvWidth;
uniform float uBrightTaper;

out vec4 fragColor;

const float PI = 3.14159265;

vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(2.0 * PI * (t + vec3(0.00, 0.33, 0.67)));
}

vec3 samplePalette(float t) {
  t = fract(t);
  float scaled = t * float(uColorCount);
  int idx = int(floor(scaled));
  float blend = fract(scaled);
  int nextIdx = idx + 1;
  if (nextIdx >= uColorCount) nextIdx = 0;
  return mix(uColors[idx], uColors[nextIdx], blend);
}

vec3 strandColor(float t) {
  if (uColorCount > 0) return samplePalette(t);
  return spectrum(t);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  uv /= max(uScale, 0.0001);

  float e = 0.06 + uIntensity * 0.94;
  // Envelope half-width in strand uv-space — when the glass is on it equals the
  // lens rim, so strand tips land exactly on the glass edge. Amplitude keeps the
  // full taper (waves converge to the center line, which meets the circle at
  // x = \xb1r). Brightness falloff is mode-aware via uBrightTaper: a gentle power
  // under glass so tips stay visible until they touch the rim, the full taper
  // without glass so light dissolves in a soft gradient instead of hitting the
  // envelope clamp at near-full strength.
  float nx = clamp(abs(uv.x) / uEnvWidth, 0.0, 1.0);
  float envCos = cos(nx * PI * 0.5);
  float env = pow(envCos, uTaper);
  float bright = pow(envCos, uBrightTaper);

  vec3 col = vec3(0.0);

  for (int i = 0; i < 12; i++) {
    if (i >= uStrandCount) break;

    float fi = float(i);
    float ph = fi * 1.7 * uSpread;
    float freq = (2.0 + fi * 0.35) * uWaviness;
    float spd = 1.4 + fi * 1.2;

    float tt = uTime * uSpeed;
    float w = sin(uv.x * freq + tt * spd + ph) * 0.60
            + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + ph * 1.7) * 0.40;

    float amp = (0.1 + 0.02 * e) * env * uAmplitude;
    float y = w * amp;

    float d = abs(uv.y - y);
    float thick = (0.001 + 0.05 * e) * (0.35 + env) * uThickness;
    float g = thick / (d + thick * 0.45);
    g = g * g;

    float h = fi / float(uStrandCount) + uv.x * 0.30 + uTime * 0.04 + uHueShift;
    col += strandColor(h) * g * bright;
  }

  col *= 0.45 + 0.7 * e;
  col = 1.0 - exp(-col * uGlow);

  float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(gray), col, uSaturation), 0.0);

  float lum = max(max(col.r, col.g), col.b);
  float alpha = clamp(lum, 0.0, 1.0) * uOpacity;

  fragColor = vec4(col * uOpacity, alpha);
}
`,g=`#version 300 es
precision highp float;

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uRadius;
uniform float uRefraction;
uniform float uDispersion;

out vec4 fragColor;

vec2 toUv(vec2 p) {
  return p * (uResolution.y / uResolution) + 0.5;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float d = length(p);
  float r = uRadius;

  float edge = fwidth(d) * 1.5;
  float mask = 1.0 - smoothstep(r - edge, r + edge, d);
  if (mask <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  // sphere height: 0 at the rim, 1 at the center
  float z = sqrt(max(r * r - d * d, 0.0)) / r;
  float nd = d / r; // 0 at the center, 1 at the rim

  // refraction is confined to a narrow band near the rim; the rest stays undistorted
  vec2 dir = d > 0.0 ? p / d : vec2(0.0);
  float lens = smoothstep(0.85, 1.0, nd) * pow(nd, 6.0);
  vec2 offset = -dir * lens * uRefraction * 0.15;
  vec2 disp = -dir * lens * uDispersion * 0.012;

  vec3 light;
  light.r = texture(uScene, toUv(p + offset - disp)).r;
  light.g = texture(uScene, toUv(p + offset)).g;
  light.b = texture(uScene, toUv(p + offset + disp)).b;

  // neutral fresnel rim (no color tint so the glass stays clear)
  float fres = pow(1.0 - z, 3.0);
  vec3 rim = vec3(1.0) * fres * 0.18;

  // specular highlight from the upper-left
  vec2 lightDir = normalize(vec2(-0.55, 0.6));
  float spec = pow(max(dot(p / max(r, 1e-4), lightDir), 0.0), 6.0);
  spec *= smoothstep(r, r * 0.55, d);

  vec3 emissive = light + rim + vec3(spec) * 0.4;
  float emissiveA = clamp(max(max(emissive.r, emissive.g), emissive.b), 0.0, 1.0);

  // almost clear glass body: only a faint neutral darkening, mostly near the rim
  float bodyA = 0.05 + fres * 0.05;

  // composite emissive light over the clear body (premultiplied)
  float outA = emissiveA + bodyA * (1.0 - emissiveA);
  vec3 outRGB = emissive;

  outRGB *= mask;
  outA *= mask;

  fragColor = vec4(outRGB, outA);
}
`,c=t=>{let e=t&&t.length?t:["#ffffff"],i=[];for(let t=0;t<8;t++){let r=e[t]??e[e.length-1],s=new a.Color(r);i.push([s.r,s.g,s.b])}return i};function d({colors:t=["#FF4242","#7C3AED","#06B6D4","#EAB308"],count:a=13,speed:m=.8,amplitude:p=1.25,waviness:E=1,thickness:T=1.55,strandWidth:v=100,glow:R=.25,taper:x=3,spread:A=1.65,hueShift:_=0,intensity:w=1,saturation:C=1,opacity:S=.9,scale:b=.9,glass:N=!0,refraction:D=1.3,dispersion:y=.5,glassSize:F=1,paused:U=!1,className:B="",style:P}){let I=(0,h.useRef)({colors:t,count:a,speed:m,amplitude:p,waviness:E,thickness:T,strandWidth:v,glow:R,taper:x,spread:A,hueShift:_,intensity:w,saturation:C,opacity:S,scale:b,glass:N,refraction:D,dispersion:y,glassSize:F});I.current={colors:t,count:a,speed:m,amplitude:p,waviness:E,thickness:T,strandWidth:v,glow:R,taper:x,spread:A,hueShift:_,intensity:w,saturation:C,opacity:S,scale:b,glass:N,refraction:D,dispersion:y,glassSize:F};let M=(0,h.useRef)(null),L=(0,h.useRef)(U);L.current=U;let O=(0,h.useRef)(null),H=(0,h.useRef)(null),G=(0,h.useRef)(null),k=(0,u.useAnimationLoop)({target:M,halted:U,dpr:2,onResize:t=>H.current?.(t),onFrame:({now:t})=>!!O.current&&O.current(t),gl:()=>G.current});return(0,h.useEffect)(()=>{let t=M.current;if(!t)return;let e=new i.Renderer({alpha:!0,premultipliedAlpha:!0,antialias:!0}),a=e.gl;a.clearColor(0,0,0,0),a.enable(a.BLEND),a.blendFunc(a.ONE,a.ONE_MINUS_SRC_ALPHA),a.canvas.style.backgroundColor="transparent";let h=new l.Triangle(a);h.attributes.uv&&delete h.attributes.uv;let u=a.drawingBufferWidth||t.offsetWidth,d=a.drawingBufferHeight||t.offsetHeight,U=new r.Program(a,{vertex:o,fragment:f,uniforms:{uTime:{value:0},uResolution:{value:[u,d]},uColors:{value:c(I.current.colors)},uColorCount:{value:Math.min(I.current.colors.length,8)},uStrandCount:{value:Math.min(I.current.count,12)},uSpeed:{value:m},uAmplitude:{value:p},uWaviness:{value:E},uThickness:{value:T},uGlow:{value:R},uTaper:{value:x},uSpread:{value:A},uHueShift:{value:_},uIntensity:{value:w},uOpacity:{value:S},uScale:{value:b},uSaturation:{value:C},uEnvWidth:{value:(N?.46*F:.3846)*Math.min(Math.max(v,1),100)*.01},uBrightTaper:{value:x*(N?.3:1)}}}),B=new s.Mesh(a,{geometry:h,program:U}),P=new n.RenderTarget(a,{width:u,height:d}),X=new r.Program(a,{vertex:o,fragment:g,uniforms:{uScene:{value:P.texture},uResolution:{value:[u,d]},uRadius:{value:.46*F*b},uRefraction:{value:D},uDispersion:{value:y}}}),W=new s.Mesh(a,{geometry:h,program:X});a.canvas.style.position="absolute",a.canvas.style.top="0",a.canvas.style.left="0",t.appendChild(a.canvas),G.current=a,H.current=({width:t,height:i,dpr:r,bufferWidth:s,bufferHeight:l})=>{e.dpr=r,e.setSize(t,i);let n=a.drawingBufferWidth||s,h=a.drawingBufferHeight||l;U.uniforms.uResolution.value=[n,h],P.setSize(n,h),X.uniforms.uResolution.value=[n,h]};let z=-1,Y=0;return O.current=t=>{let i=z>=0?t-z:0;z=t;let r=I.current;if(L.current||(Y+=i),U.uniforms.uTime.value=.001*Y,U.uniforms.uColors.value=c(r.colors),U.uniforms.uColorCount.value=Math.min(r.colors.length,8),U.uniforms.uStrandCount.value=Math.min(Math.max(Math.round(r.count),1),12),U.uniforms.uSpeed.value=r.speed,U.uniforms.uAmplitude.value=r.amplitude,U.uniforms.uWaviness.value=r.waviness,U.uniforms.uThickness.value=r.thickness,U.uniforms.uGlow.value=r.glow,U.uniforms.uTaper.value=r.taper,U.uniforms.uSpread.value=r.spread,U.uniforms.uHueShift.value=r.hueShift,U.uniforms.uIntensity.value=r.intensity,U.uniforms.uOpacity.value=r.opacity,U.uniforms.uScale.value=r.scale,U.uniforms.uSaturation.value=r.saturation,U.uniforms.uEnvWidth.value=(r.glass?.46*r.glassSize:.3846)*Math.min(Math.max(r.strandWidth,1),100)*.01,U.uniforms.uBrightTaper.value=r.taper*(r.glass?.3:1),r.glass?(e.render({scene:B,target:P}),X.uniforms.uScene.value=P.texture,X.uniforms.uRefraction.value=r.refraction,X.uniforms.uDispersion.value=r.dispersion,X.uniforms.uRadius.value=.46*r.glassSize*r.scale,e.render({scene:W})):e.render({scene:B}),L.current)return!1},k.resize(),k.start(),()=>{O.current=null,H.current=null,t&&a.canvas.parentNode===t&&t.removeChild(a.canvas)}},[]),(0,e.jsx)("div",{ref:M,className:`relative h-full w-full bg-transparent ${B}`,style:P})}let m=["#a855f7","#6d28d9","#22d3ee"];t.s(["default",0,function({values:t,reducedMotion:i,paused:r}){let s=r||i;return(0,e.jsx)("div",{className:"h-full w-full bg-bench-950 ",children:(0,e.jsx)(d,{colors:m,count:t.count,scale:t.scale,speed:s?0:t.speed,amplitude:t.amplitude,waviness:t.waviness,thickness:t.thickness,strandWidth:t.strandWidth,glow:t.glow,spread:t.spread,intensity:t.intensity,saturation:t.saturation,opacity:t.opacity,glass:t.glass,refraction:t.refraction,dispersion:t.dispersion,paused:s})})}],512538)},783997,function(t){t.n(t.i(512538))},450922,t=>{"use strict";var e=t.i(271645);let i=1/15;t.s(["useAnimationLoop",0,function(t){let r=(0,e.useRef)(t);(0,e.useLayoutEffect)(()=>{r.current=t});let s=(0,e.useRef)(null),a=(0,e.useRef)(null),l=(0,e.useRef)(!1),n=(0,e.useRef)(!1),h=(0,e.useRef)(0),u=(0,e.useRef)(0),o=(0,e.useRef)(0),f=(0,e.useCallback)(()=>{let t=r.current.target.current;if(!t)return null;let e=t.getBoundingClientRect(),i=r.current.dpr??"auto",s=Math.min(window.devicePixelRatio||1,"auto"===i?2:i);return{width:e.width,height:e.height,dpr:s,bufferWidth:Math.max(1,Math.round(e.width*s)),bufferHeight:Math.max(1,Math.round(e.height*s))}},[]),g=(0,e.useCallback)(function t(e){if(n.current)return;0===h.current&&(h.current=e);let a=0===u.current?0:Math.min((e-u.current)/1e3,i);u.current=e;let f={now:e,dt:a,elapsed:(e-h.current)/1e3,frame:o.current++},g=r.current.onFrame?.(f);if(!n.current){if(!1===g||r.current.halted){l.current=!1,s.current=null;return}s.current=requestAnimationFrame(t)}},[]),c=(0,e.useCallback)(()=>{n.current||l.current||(l.current=!0,u.current=0,s.current=requestAnimationFrame(g))},[g]),d=(0,e.useCallback)(()=>{l.current=!1,null!==s.current&&(cancelAnimationFrame(s.current),s.current=null)},[]),m=(0,e.useCallback)(()=>c(),[c]),p=(0,e.useCallback)(()=>{let t=f();t&&(r.current.onResize?.(t),!1!==r.current.paintWhenHalted?m():r.current.halted||c())},[f,m,c]),E=t.deps??[];(0,e.useEffect)(()=>{n.current=!1;let t=r.current.target.current;if(!t)return;let e=()=>{n.current||p()},i=new ResizeObserver(()=>{let t=r.current.resizeDebounceMs??0;t<=0?e():(null!==a.current&&clearTimeout(a.current),a.current=setTimeout(()=>{a.current=null,e()},t))});return i.observe(t),p(),r.current.halted||c(),()=>{n.current=!0,l.current=!1,null!==s.current&&(cancelAnimationFrame(s.current),s.current=null),null!==a.current&&(clearTimeout(a.current),a.current=null),i.disconnect(),r.current.onDispose?.();let t=r.current.gl?.();t?.getExtension("WEBGL_lose_context")?.loseContext(),h.current=0,u.current=0,o.current=0}},E);let T=t.halted??!1;return(0,e.useEffect)(()=>{T||c()},[T,c]),(0,e.useMemo)(()=>({start:c,stop:d,paint:m,resize:p,get running(){return l.current}}),[c,d,m,p])}])},562611,t=>{"use strict";var e=t.i(899925);t.s(["RenderTarget",0,class{constructor(t,{width:i=t.canvas.width,height:r=t.canvas.height,target:s=t.FRAMEBUFFER,color:a=1,depth:l=!0,stencil:n=!1,depthTexture:h=!1,wrapS:u=t.CLAMP_TO_EDGE,wrapT:o=t.CLAMP_TO_EDGE,wrapR:f=t.CLAMP_TO_EDGE,minFilter:g=t.LINEAR,magFilter:c=g,type:d=t.UNSIGNED_BYTE,format:m=t.RGBA,internalFormat:p=m,unpackAlignment:E,premultiplyAlpha:T}={}){this.gl=t,this.width=i,this.height=r,this.depth=l,this.stencil=n,this.buffer=this.gl.createFramebuffer(),this.target=s,this.gl.renderer.bindFramebuffer(this),this.textures=[];const v=[];for(let s=0;s<a;s++)this.textures.push(new e.Texture(t,{width:i,height:r,wrapS:u,wrapT:o,wrapR:f,minFilter:g,magFilter:c,type:d,format:m,internalFormat:p,unpackAlignment:E,premultiplyAlpha:T,flipY:!1,generateMipmaps:!1})),this.textures[s].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+s,this.gl.TEXTURE_2D,this.textures[s].texture,0),v.push(this.gl.COLOR_ATTACHMENT0+s);v.length>1&&this.gl.renderer.drawBuffers(v),this.texture=this.textures[0],h&&(this.gl.renderer.isWebgl2||this.gl.renderer.getExtension("WEBGL_depth_texture"))?(this.depthTexture=new e.Texture(t,{width:i,height:r,minFilter:this.gl.NEAREST,magFilter:this.gl.NEAREST,format:this.stencil?this.gl.DEPTH_STENCIL:this.gl.DEPTH_COMPONENT,internalFormat:t.renderer.isWebgl2?this.stencil?this.gl.DEPTH24_STENCIL8:this.gl.DEPTH_COMPONENT16:this.gl.DEPTH_COMPONENT,type:this.stencil?this.gl.UNSIGNED_INT_24_8:this.gl.UNSIGNED_INT}),this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.stencil?this.gl.DEPTH_STENCIL_ATTACHMENT:this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(l&&!n&&(this.depthBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,i,r),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.RENDERBUFFER,this.depthBuffer)),n&&!l&&(this.stencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,i,r),this.gl.framebufferRenderbuffer(this.target,this.gl.STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.stencilBuffer)),l&&n&&(this.depthStencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,i,r),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.depthStencilBuffer))),this.gl.renderer.bindFramebuffer({target:this.target})}setSize(t,e){if(this.width!==t||this.height!==e){this.width=t,this.height=e,this.gl.renderer.bindFramebuffer(this);for(let i=0;i<this.textures.length;i++)this.textures[i].width=t,this.textures[i].height=e,this.textures[i].needsUpdate=!0,this.textures[i].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+i,this.gl.TEXTURE_2D,this.textures[i].texture,0);this.depthTexture?(this.depthTexture.width=t,this.depthTexture.height=e,this.depthTexture.needsUpdate=!0,this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(this.depthBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,t,e)),this.stencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,t,e)),this.depthStencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,t,e))),this.gl.renderer.bindFramebuffer({target:this.target})}}}])},899925,t=>{"use strict";let e=new Uint8Array(4),i=1;t.s(["Texture",0,class{constructor(t,{image:e,target:r=t.TEXTURE_2D,type:s=t.UNSIGNED_BYTE,format:a=t.RGBA,internalFormat:l=a,wrapS:n=t.CLAMP_TO_EDGE,wrapT:h=t.CLAMP_TO_EDGE,wrapR:u=t.CLAMP_TO_EDGE,generateMipmaps:o=r===(t.TEXTURE_2D||t.TEXTURE_CUBE_MAP),minFilter:f=o?t.NEAREST_MIPMAP_LINEAR:t.LINEAR,magFilter:g=t.LINEAR,premultiplyAlpha:c=!1,unpackAlignment:d=4,flipY:m=r==(t.TEXTURE_2D||t.TEXTURE_3D),anisotropy:p=0,level:E=0,width:T,height:v=T,length:R=1}={}){this.gl=t,this.id=i++,this.image=e,this.target=r,this.type=s,this.format=a,this.internalFormat=l,this.minFilter=f,this.magFilter=g,this.wrapS=n,this.wrapT=h,this.wrapR=u,this.generateMipmaps=o,this.premultiplyAlpha=c,this.unpackAlignment=d,this.flipY=m,this.anisotropy=Math.min(p,this.gl.renderer.parameters.maxAnisotropy),this.level=E,this.width=T,this.height=v,this.length=R,this.texture=this.gl.createTexture(),this.store={image:null},this.glState=this.gl.renderer.state,this.state={},this.state.minFilter=this.gl.NEAREST_MIPMAP_LINEAR,this.state.magFilter=this.gl.LINEAR,this.state.wrapS=this.gl.REPEAT,this.state.wrapT=this.gl.REPEAT,this.state.anisotropy=0}bind(){this.glState.textureUnits[this.glState.activeTextureUnit]!==this.id&&(this.gl.bindTexture(this.target,this.texture),this.glState.textureUnits[this.glState.activeTextureUnit]=this.id)}update(t=0){let i=!(this.image===this.store.image&&!this.needsUpdate);if((i||this.glState.textureUnits[t]!==this.id)&&(this.gl.renderer.activeTexture(t),this.bind()),i){if(this.needsUpdate=!1,this.flipY!==this.glState.flipY&&(this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL,this.flipY),this.glState.flipY=this.flipY),this.premultiplyAlpha!==this.glState.premultiplyAlpha&&(this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),this.glState.premultiplyAlpha=this.premultiplyAlpha),this.unpackAlignment!==this.glState.unpackAlignment&&(this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT,this.unpackAlignment),this.glState.unpackAlignment=this.unpackAlignment),this.minFilter!==this.state.minFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MIN_FILTER,this.minFilter),this.state.minFilter=this.minFilter),this.magFilter!==this.state.magFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MAG_FILTER,this.magFilter),this.state.magFilter=this.magFilter),this.wrapS!==this.state.wrapS&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_S,this.wrapS),this.state.wrapS=this.wrapS),this.wrapT!==this.state.wrapT&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_T,this.wrapT),this.state.wrapT=this.wrapT),this.wrapR!==this.state.wrapR&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_R,this.wrapR),this.state.wrapR=this.wrapR),this.anisotropy&&this.anisotropy!==this.state.anisotropy&&(this.gl.texParameterf(this.target,this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT,this.anisotropy),this.state.anisotropy=this.anisotropy),this.image){if(this.image.width&&(this.width=this.image.width,this.height=this.image.height),this.target===this.gl.TEXTURE_CUBE_MAP)for(let t=0;t<6;t++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+t,this.level,this.internalFormat,this.format,this.type,this.image[t]);else if(ArrayBuffer.isView(this.image))this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,this.image):(this.target===this.gl.TEXTURE_2D_ARRAY||this.target===this.gl.TEXTURE_3D)&&this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);else if(this.image.isCompressedTexture)for(let t=0;t<this.image.length;t++)this.gl.compressedTexImage2D(this.target,t,this.internalFormat,this.image[t].width,this.image[t].height,0,this.image[t].data);else this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.format,this.type,this.image):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);if(this.generateMipmaps){var r,s;this.gl.renderer.isWebgl2||((r=this.image.width)&r-1)==0&&((s=this.image.height)&s-1)==0?this.gl.generateMipmap(this.target):(this.generateMipmaps=!1,this.wrapS=this.wrapT=this.gl.CLAMP_TO_EDGE,this.minFilter=this.gl.LINEAR)}this.onUpdate&&this.onUpdate()}else if(this.target===this.gl.TEXTURE_CUBE_MAP)for(let t=0;t<6;t++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,e);else this.width?this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,null):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,null):this.gl.texImage2D(this.target,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,e);this.store.image=this.image}}}])},753604,t=>{"use strict";var e=t.i(994964);class i extends e.Geometry{constructor(t,{attributes:e={}}={}){Object.assign(e,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(t,e)}}t.s(["Triangle",0,i])},11308,t=>{"use strict";let e={black:"#000000",white:"#ffffff",red:"#ff0000",green:"#00ff00",blue:"#0000ff",fuchsia:"#ff00ff",cyan:"#00ffff",yellow:"#ffff00",orange:"#ff8000"};function i(t){4===t.length&&(t=t[0]+t[1]+t[1]+t[2]+t[2]+t[3]+t[3]);let e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);return e||console.warn(`Unable to convert hex string ${t} to rgb values`),[parseInt(e[1],16)/255,parseInt(e[2],16)/255,parseInt(e[3],16)/255]}function r(t){if(void 0===t)return[0,0,0];if(3==arguments.length)return arguments;if(!isNaN(t)){var r;return[((r=parseInt(r=t))>>16&255)/255,(r>>8&255)/255,(255&r)/255]}return"#"===t[0]?i(t):e[t.toLowerCase()]?i(e[t.toLowerCase()]):(console.warn("Color format not recognised"),[0,0,0])}t.s(["Color",0,class extends Array{constructor(t){if(Array.isArray(t))return super(...t);return super(...r(...arguments))}get r(){return this[0]}get g(){return this[1]}get b(){return this[2]}set r(t){this[0]=t}set g(t){this[1]=t}set b(t){this[2]=t}set(t){return Array.isArray(t)?this.copy(t):this.copy(r(...arguments))}copy(t){return this[0]=t[0],this[1]=t[1],this[2]=t[2],this}}],11308)}]);