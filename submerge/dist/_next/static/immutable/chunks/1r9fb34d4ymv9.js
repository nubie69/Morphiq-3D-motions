(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,515970,e=>{"use strict";var t=e.i(843476),r=e.i(271645),i=e.i(221663),s=e.i(956850),a=e.i(80075),l=e.i(753604),u=e.i(562611),n=e.i(450922);function h(e){let t=e.replace("#","").trim();if(3===t.length&&(t=t.split("").map(e=>e+e).join("")),6!==t.length)return[.66,.33,.97];let r=parseInt(t,16);return Number.isNaN(r)?[.66,.33,.97]:[(r>>16&255)/255,(r>>8&255)/255,(255&r)/255]}let o=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = vec4(position, 0.0, 1.0);
}
`,c=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform vec2 texelSize;
void main() {
	float L = texture(uVelocity, vUv - vec2(texelSize.x, 0.0)).y;
	float R = texture(uVelocity, vUv + vec2(texelSize.x, 0.0)).y;
	float T = texture(uVelocity, vUv + vec2(0.0, texelSize.y)).x;
	float B = texture(uVelocity, vUv - vec2(0.0, texelSize.y)).x;
	float vort = R - L - T + B;
	fragColor = vec4(0.5 * vort, 0.0, 0.0, 1.0);
}
`,g=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 texelSize;
uniform float uCurlStrength;
uniform float dt;
void main() {
	float L = texture(uCurl, vUv - vec2(texelSize.x, 0.0)).x;
	float R = texture(uCurl, vUv + vec2(texelSize.x, 0.0)).x;
	float T = texture(uCurl, vUv + vec2(0.0, texelSize.y)).x;
	float B = texture(uCurl, vUv - vec2(0.0, texelSize.y)).x;
	float C = texture(uCurl, vUv).x;
	vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
	force /= length(force) + 1e-4;
	force *= uCurlStrength * C;
	force.y *= -1.0;
	vec2 vel = texture(uVelocity, vUv).xy;
	vel += force * dt;
	vel = clamp(vel, -3000.0, 3000.0);
	fragColor = vec4(vel, 0.0, 1.0);
}
`,f=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uDye;
uniform float uBuoyancy;
uniform float dt;
void main() {
	vec2 vel = texture(uVelocity, vUv).xy;
	vec3 d = texture(uDye, vUv).rgb;
	float dens = dot(d, vec3(0.299, 0.587, 0.114));
	vel.y += uBuoyancy * dens * dt;
	fragColor = vec4(vel, 0.0, 1.0);
}
`,v=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec3 uColor;
uniform vec2 uPoint;
uniform float uRadius;
void main() {
	vec2 p = vUv - uPoint;
	p.x *= uAspect;
	float rr = uRadius * uRadius;
	vec3 splat = exp(-dot(p, p) / max(rr, 1e-6)) * uColor;
	vec3 base = texture(uTarget, vUv).rgb;
	fragColor = vec4(base + splat, 1.0);
}
`,d=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform vec2 texelSize;
void main() {
	float L = texture(uVelocity, vUv - vec2(texelSize.x, 0.0)).x;
	float R = texture(uVelocity, vUv + vec2(texelSize.x, 0.0)).x;
	float T = texture(uVelocity, vUv + vec2(0.0, texelSize.y)).y;
	float B = texture(uVelocity, vUv - vec2(0.0, texelSize.y)).y;
	vec2 C = texture(uVelocity, vUv).xy;
	if (vUv.x - texelSize.x < 0.0) L = -C.x;
	if (vUv.x + texelSize.x > 1.0) R = -C.x;
	if (vUv.y + texelSize.y > 1.0) T = -C.y;
	if (vUv.y - texelSize.y < 0.0) B = -C.y;
	float div = 0.5 * (R - L + T - B);
	fragColor = vec4(div, 0.0, 0.0, 1.0);
}
`,m=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 texelSize;
void main() {
	float L = texture(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
	float R = texture(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
	float T = texture(uPressure, vUv + vec2(0.0, texelSize.y)).x;
	float B = texture(uPressure, vUv - vec2(0.0, texelSize.y)).x;
	float div = texture(uDivergence, vUv).x;
	float p = (L + R + B + T - div) * 0.25;
	fragColor = vec4(p, 0.0, 0.0, 1.0);
}
`,p=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 texelSize;
void main() {
	float L = texture(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
	float R = texture(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
	float T = texture(uPressure, vUv + vec2(0.0, texelSize.y)).x;
	float B = texture(uPressure, vUv - vec2(0.0, texelSize.y)).x;
	vec2 vel = texture(uVelocity, vUv).xy;
	vel -= 0.5 * vec2(R - L, T - B);
	fragColor = vec4(vel, 0.0, 1.0);
}
`,x=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float uDissipation;
void main() {
	vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
	vec4 result = texture(uSource, coord);
	fragColor = uDissipation * result;
}
`,E=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uDye;
uniform vec3 uBg;
uniform float uExposure;
uniform float uGrain;
uniform float uTime;
float hash(vec2 p) {
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}
void main() {
	vec3 dye = texture(uDye, vUv).rgb;
	vec3 hdr = uBg + dye * uExposure;
	vec3 col = vec3(1.0) - exp(-hdr);
	float g = hash(gl_FragCoord.xy + fract(uTime * 13.7) * 97.0) - 0.5;
	col += g * uGrain * (1.0 - 0.6 * dot(col, vec3(0.333)));
	fragColor = vec4(max(col, 0.0), 1.0);
}
`;function T(e,t,r){let i=t/Math.max(r,1);i<1&&(i=1/i);let s=Math.max(1,Math.round(e)),a=Math.max(1,Math.round(e*i));return t>r?{w:a,h:s}:{w:s,h:a}}let R=({dyeColor:e="#a855f7",backgroundColor:R="#05010a",quality:y="medium",pressureIterations:w=25,velocityFade:_=.98,densityFade:S=.97,curl:U=20,splatRadius:C=.2,splatForce:A=1,autoPlume:D=!0,buoyancy:b=1,exposure:F=1.2,grain:P=.04,paused:N=!1,reducedMotion:M=!1,fallbackSrc:B,className:L})=>{let I=(0,r.useRef)(null),z=(0,r.useRef)(null),G=(0,r.useRef)(null),X=(0,r.useRef)(null),O=(0,n.useAnimationLoop)({target:I,halted:N||M,dpr:"auto",onResize:e=>G.current?.(e),onFrame:({dt:e})=>!!z.current&&z.current(e),gl:()=>X.current});(0,r.useRef)(null);let V=(0,r.useRef)({dyeColor:e,backgroundColor:R,pressureIterations:w,velocityFade:_,densityFade:S,curl:U,splatRadius:C,splatForce:A,autoPlume:D,buoyancy:b,exposure:F,grain:P,paused:N,reducedMotion:M});V.current={dyeColor:e,backgroundColor:R,pressureIterations:w,velocityFade:_,densityFade:S,curl:U,splatRadius:C,splatForce:A,autoPlume:D,buoyancy:b,exposure:F,grain:P,paused:N,reducedMotion:M};let[H,k]=(0,r.useState)(!1);(0,r.useEffect)(()=>{!function(){if("u"<typeof document)return!1;try{return!!document.createElement("canvas").getContext("webgl2")}catch{return!1}}()&&k(!0)},[]),(0,r.useEffect)(()=>{let e;if(H||!I.current)return;let t=I.current;try{let I=new i.Renderer({alpha:!1,antialias:!1,premultipliedAlpha:!1,powerPreference:"high-performance",dpr:Math.min(window.devicePixelRatio||1,1.5),webgl:2});if(e=I.gl,"u"<typeof WebGL2RenderingContext||!(e instanceof WebGL2RenderingContext))throw Error("SmokeField requires a WebGL2 context");e.clearColor(0,0,0,1),e.canvas.style.position="absolute",e.canvas.style.top="0",e.canvas.style.left="0",t.appendChild(e.canvas);let H=I.gl,k=H.getExtension("EXT_color_buffer_float");if(H.getExtension("OES_texture_float_linear"),!k)throw Error("SmokeField requires EXT_color_buffer_float");let W=(e,t)=>new u.RenderTarget(H,{width:Math.max(1,e),height:Math.max(1,t),depth:!1,type:H.HALF_FLOAT,format:H.RGBA,internalFormat:H.RGBA16F,minFilter:H.LINEAR,magFilter:H.LINEAR,wrapS:H.CLAMP_TO_EDGE,wrapT:H.CLAMP_TO_EDGE}),Y=(e,t)=>{let r={read:W(e,t),write:W(e,t),swap(){let e=r.read;r.read=r.write,r.write=e},setSize(e,t){r.read.setSize(Math.max(1,e),Math.max(1,t)),r.write.setSize(Math.max(1,e),Math.max(1,t))}};return r};I.setSize(t.clientWidth||1,t.clientHeight||1);let j="low"===y?{sim:128,dye:256}:"high"===y?{sim:256,dye:1024}:{sim:192,dye:512},$=T(j.sim,e.drawingBufferWidth,e.drawingBufferHeight),q=T(j.dye,e.drawingBufferWidth,e.drawingBufferHeight),K=$.w,J=$.h,Q=q.w,Z=q.h,ee=new Float32Array([1/K,1/J]),et=Y(K,J),er=Y(Q,Z),ei=Y(K,J),es=W(K,J),ea=W(K,J),el=new l.Triangle(e),eu=(t,r)=>new s.Program(e,{vertex:o,fragment:t,uniforms:r}),en=eu(c,{uVelocity:{value:et.read.texture},texelSize:{value:ee}}),eh=eu(g,{uVelocity:{value:et.read.texture},uCurl:{value:ea.texture},texelSize:{value:ee},uCurlStrength:{value:U},dt:{value:.016}}),eo=eu(f,{uVelocity:{value:et.read.texture},uDye:{value:er.read.texture},uBuoyancy:{value:4500*b},dt:{value:.016}}),ec=eu(v,{uTarget:{value:et.read.texture},uAspect:{value:K/J},uColor:{value:new Float32Array([0,0,0])},uPoint:{value:new Float32Array([.5,.5])},uRadius:{value:.1}}),eg=eu(d,{uVelocity:{value:et.read.texture},texelSize:{value:ee}}),ef=eu(m,{uPressure:{value:ei.read.texture},uDivergence:{value:es.texture},texelSize:{value:ee}}),ev=eu(p,{uPressure:{value:ei.read.texture},uVelocity:{value:et.read.texture},texelSize:{value:ee}}),ed=eu(x,{uVelocity:{value:et.read.texture},uSource:{value:et.read.texture},texelSize:{value:ee},dt:{value:.016},uDissipation:{value:_}}),em=eu(E,{uDye:{value:er.read.texture},uBg:{value:new Float32Array(h(R))},uExposure:{value:F},uGrain:{value:P},uTime:{value:0}});if(!e.getProgramParameter(em.program,e.LINK_STATUS))throw Error("SmokeField display shader failed to link");let ep=new a.Mesh(e,{geometry:el,program:en}),ex=new a.Mesh(e,{geometry:el,program:eh}),eE=new a.Mesh(e,{geometry:el,program:eo}),eT=new a.Mesh(e,{geometry:el,program:ec}),eR=new a.Mesh(e,{geometry:el,program:eg}),ey=new a.Mesh(e,{geometry:el,program:ef}),ew=new a.Mesh(e,{geometry:el,program:ev}),e_=new a.Mesh(e,{geometry:el,program:ed}),eS=new a.Mesh(e,{geometry:el,program:em}),eU=0;function r(e,t,r,i,s,a){ec.uniforms.uAspect.value=K/J,ec.uniforms.uRadius.value=a;let l=ec.uniforms.uPoint.value;l[0]=e,l[1]=t;let u=ec.uniforms.uColor.value;ec.uniforms.uTarget.value=et.read.texture,u[0]=r,u[1]=i,u[2]=0,I.render({scene:eT,target:et.write}),et.swap(),ec.uniforms.uTarget.value=er.read.texture,u[0]=s[0],u[1]=s[1],u[2]=s[2],I.render({scene:eT,target:er.write}),er.swap()}function n(e){let t=V.current;t.curl>0&&(en.uniforms.uVelocity.value=et.read.texture,I.render({scene:ep,target:ea}),eh.uniforms.uVelocity.value=et.read.texture,eh.uniforms.uCurl.value=ea.texture,eh.uniforms.uCurlStrength.value=t.curl,eh.uniforms.dt.value=.016,I.render({scene:ex,target:et.write}),et.swap()),e(),eo.uniforms.uVelocity.value=et.read.texture,eo.uniforms.uDye.value=er.read.texture,eo.uniforms.uBuoyancy.value=4500*t.buoyancy,eo.uniforms.dt.value=.016,I.render({scene:eE,target:et.write}),et.swap(),eg.uniforms.uVelocity.value=et.read.texture,I.render({scene:eR,target:es});let r=Math.max(1,Math.round(t.pressureIterations));for(let e=0;e<r;e++)ef.uniforms.uPressure.value=ei.read.texture,ef.uniforms.uDivergence.value=es.texture,I.render({scene:ey,target:ei.write}),ei.swap();ev.uniforms.uPressure.value=ei.read.texture,ev.uniforms.uVelocity.value=et.read.texture,I.render({scene:ew,target:et.write}),et.swap(),ed.uniforms.uVelocity.value=et.read.texture,ed.uniforms.uSource.value=et.read.texture,ed.uniforms.dt.value=.016,ed.uniforms.uDissipation.value=t.velocityFade,I.render({scene:e_,target:et.write}),et.swap(),ed.uniforms.uVelocity.value=et.read.texture,ed.uniforms.uSource.value=er.read.texture,ed.uniforms.uDissipation.value=t.densityFade,I.render({scene:e_,target:er.write}),er.swap()}let eC=[];function w(){let e=V.current;for(;eC.length;){let e=eC.shift();r(e.x,e.y,e.fx,e.fy,e.rgb,e.radius)}if(e.autoPlume){let t=h(e.dyeColor),i=.12*Math.sin(1.3*eU)+.06*Math.sin(.7*eU+1),s=Math.max(.02,.35*e.splatRadius);r(.5+.15*i,.06,700*i,700,t,s)}}function S(){let e=V.current,t=h(e.dyeColor),i=Math.max(.02,.35*e.splatRadius);r(.5,.06,0,700,t,i)}function C(){let e=V.current,t=h(e.dyeColor);r(.5,.08,0,1400,t,Math.max(.03,.4*e.splatRadius))}function A(e){for(let t=0;t<e;t++)eU+=.016,n(S)}function D(){let e=V.current;em.uniforms.uDye.value=er.read.texture;let t=h(e.backgroundColor),r=em.uniforms.uBg.value;r[0]=t[0],r[1]=t[1],r[2]=t[2],em.uniforms.uExposure.value=e.exposure,em.uniforms.uGrain.value=e.grain,em.uniforms.uTime.value=eU%1e3,I.render({scene:eS})}z.current=e=>{let t=V.current;if(t.paused||t.reducedMotion)return D(),!1;eU+=Math.min(e,.05),n(w),D()},G.current=t=>{(function({width:t,height:r,dpr:i}){if(0===t||0===r)return!1;I.dpr=i,I.setSize(t,r);let s=e.drawingBufferWidth,a=e.drawingBufferHeight,l=T(j.sim,s,a),u=T(j.dye,s,a);return(l.w!==K||l.h!==J||u.w!==Q||u.h!==Z)&&(K=l.w,J=l.h,Q=u.w,Z=u.h,ee[0]=1/K,ee[1]=1/J,et.setSize(K,J),ei.setSize(K,J),es.setSize(K,J),ea.setSize(K,J),er.setSize(Q,Z),!0)})(t)&&(C(),(V.current.paused||V.current.reducedMotion)&&A(48),D())},X.current=e,O.resize(),C(),V.current.paused||V.current.reducedMotion?(A(64),D()):O.start();let eA=e.canvas,eD=!1,eb=0,eF=0;function N(e,t){let r=eA.getBoundingClientRect();if(0===r.width||0===r.height)return;let i=V.current,s=(e.clientX-r.left)/r.width,a=1-(e.clientY-r.top)/r.height,l=0,u=0;t&&(l=(e.clientX-eb)/r.width*6e3*i.splatForce,u=-(e.clientY-eF)/r.height*6e3*i.splatForce),eb=e.clientX,eF=e.clientY,eC.push({x:s,y:a,fx:l,fy:u,rgb:h(i.dyeColor),radius:Math.max(.02,.4*i.splatRadius)})}function M(e){let t=V.current;if(!t.paused&&!t.reducedMotion&&("mouse"!==e.pointerType||0===e.button)){e.preventDefault(),eD=!0,eb=e.clientX,eF=e.clientY,N(e,!1);try{eA.setPointerCapture(e.pointerId)}catch{}O.start()}}function B(e){eD&&N(e,!0)}function L(e){if(eD){eD=!1;try{eA.releasePointerCapture(e.pointerId)}catch{}}}return eA.addEventListener("pointerdown",M),window.addEventListener("pointermove",B),window.addEventListener("pointerup",L),window.addEventListener("pointercancel",L),()=>{z.current=null,G.current=null,eA.removeEventListener("pointerdown",M),window.removeEventListener("pointermove",B),window.removeEventListener("pointerup",L),window.removeEventListener("pointercancel",L),t.contains(e.canvas)&&t.removeChild(e.canvas)}}catch(r){console.warn("SmokeField: WebGL2 init failed, falling back to static image",r),e&&(t.contains(e.canvas)&&t.removeChild(e.canvas),e.getExtension("WEBGL_lose_context")?.loseContext()),k(!0);return}},[H,y]);let W="relative h-full w-full";return H?B?(0,t.jsx)("div",{className:L?`${W} ${L}`:W,children:(0,t.jsx)("img",{src:B,alt:"","aria-hidden":!0,className:"absolute inset-0 h-full w-full object-cover"})}):(0,t.jsx)("div",{"aria-hidden":!0,className:L?`${W} ${L}`:W,style:{background:"radial-gradient(120% 90% at 50% 100%, rgba(168,85,247,0.32) 0%, rgba(126,58,206,0.14) 28%, rgba(20,8,32,0.6) 55%, #05010a 80%)"}}):(0,t.jsx)("div",{ref:I,className:L?`${W} [&_canvas]:cursor-grab [&_canvas]:touch-none [&_canvas:active]:cursor-grabbing ${L}`:`${W} [&_canvas]:cursor-grab [&_canvas]:touch-none [&_canvas:active]:cursor-grabbing`})};e.s(["default",0,function({values:e,reducedMotion:r,paused:i}){return(0,t.jsxs)("div",{className:"relative h-full min-h-80 w-full",children:[(0,t.jsx)(R,{dyeColor:e.dyeColor,backgroundColor:e.backgroundColor,quality:e.quality,pressureIterations:e.pressureIterations,velocityFade:e.velocityFade,densityFade:e.densityFade,curl:e.curl,splatRadius:e.splatRadius,splatForce:e.splatForce,autoPlume:e.autoPlume,buoyancy:e.buoyancy,exposure:e.exposure,grain:e.grain,paused:i||r,reducedMotion:r}),(0,t.jsx)("div",{className:"pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 select-none text-xs tracking-wide text-dim",children:"drag to stir"})]})}],515970)},672580,function(e){e.n(e.i(515970))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let i=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{i.current=e});let s=(0,t.useRef)(null),a=(0,t.useRef)(null),l=(0,t.useRef)(!1),u=(0,t.useRef)(!1),n=(0,t.useRef)(0),h=(0,t.useRef)(0),o=(0,t.useRef)(0),c=(0,t.useCallback)(()=>{let e=i.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=i.current.dpr??"auto",s=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:s,bufferWidth:Math.max(1,Math.round(t.width*s)),bufferHeight:Math.max(1,Math.round(t.height*s))}},[]),g=(0,t.useCallback)(function e(t){if(u.current)return;0===n.current&&(n.current=t);let a=0===h.current?0:Math.min((t-h.current)/1e3,r);h.current=t;let c={now:t,dt:a,elapsed:(t-n.current)/1e3,frame:o.current++},g=i.current.onFrame?.(c);if(!u.current){if(!1===g||i.current.halted){l.current=!1,s.current=null;return}s.current=requestAnimationFrame(e)}},[]),f=(0,t.useCallback)(()=>{u.current||l.current||(l.current=!0,h.current=0,s.current=requestAnimationFrame(g))},[g]),v=(0,t.useCallback)(()=>{l.current=!1,null!==s.current&&(cancelAnimationFrame(s.current),s.current=null)},[]),d=(0,t.useCallback)(()=>f(),[f]),m=(0,t.useCallback)(()=>{let e=c();e&&(i.current.onResize?.(e),!1!==i.current.paintWhenHalted?d():i.current.halted||f())},[c,d,f]),p=e.deps??[];(0,t.useEffect)(()=>{u.current=!1;let e=i.current.target.current;if(!e)return;let t=()=>{u.current||m()},r=new ResizeObserver(()=>{let e=i.current.resizeDebounceMs??0;e<=0?t():(null!==a.current&&clearTimeout(a.current),a.current=setTimeout(()=>{a.current=null,t()},e))});return r.observe(e),m(),i.current.halted||f(),()=>{u.current=!0,l.current=!1,null!==s.current&&(cancelAnimationFrame(s.current),s.current=null),null!==a.current&&(clearTimeout(a.current),a.current=null),r.disconnect(),i.current.onDispose?.();let e=i.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),n.current=0,h.current=0,o.current=0}},p);let x=e.halted??!1;return(0,t.useEffect)(()=>{x||f()},[x,f]),(0,t.useMemo)(()=>({start:f,stop:v,paint:d,resize:m,get running(){return l.current}}),[f,v,d,m])}])},562611,e=>{"use strict";var t=e.i(899925);e.s(["RenderTarget",0,class{constructor(e,{width:r=e.canvas.width,height:i=e.canvas.height,target:s=e.FRAMEBUFFER,color:a=1,depth:l=!0,stencil:u=!1,depthTexture:n=!1,wrapS:h=e.CLAMP_TO_EDGE,wrapT:o=e.CLAMP_TO_EDGE,wrapR:c=e.CLAMP_TO_EDGE,minFilter:g=e.LINEAR,magFilter:f=g,type:v=e.UNSIGNED_BYTE,format:d=e.RGBA,internalFormat:m=d,unpackAlignment:p,premultiplyAlpha:x}={}){this.gl=e,this.width=r,this.height=i,this.depth=l,this.stencil=u,this.buffer=this.gl.createFramebuffer(),this.target=s,this.gl.renderer.bindFramebuffer(this),this.textures=[];const E=[];for(let s=0;s<a;s++)this.textures.push(new t.Texture(e,{width:r,height:i,wrapS:h,wrapT:o,wrapR:c,minFilter:g,magFilter:f,type:v,format:d,internalFormat:m,unpackAlignment:p,premultiplyAlpha:x,flipY:!1,generateMipmaps:!1})),this.textures[s].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+s,this.gl.TEXTURE_2D,this.textures[s].texture,0),E.push(this.gl.COLOR_ATTACHMENT0+s);E.length>1&&this.gl.renderer.drawBuffers(E),this.texture=this.textures[0],n&&(this.gl.renderer.isWebgl2||this.gl.renderer.getExtension("WEBGL_depth_texture"))?(this.depthTexture=new t.Texture(e,{width:r,height:i,minFilter:this.gl.NEAREST,magFilter:this.gl.NEAREST,format:this.stencil?this.gl.DEPTH_STENCIL:this.gl.DEPTH_COMPONENT,internalFormat:e.renderer.isWebgl2?this.stencil?this.gl.DEPTH24_STENCIL8:this.gl.DEPTH_COMPONENT16:this.gl.DEPTH_COMPONENT,type:this.stencil?this.gl.UNSIGNED_INT_24_8:this.gl.UNSIGNED_INT}),this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.stencil?this.gl.DEPTH_STENCIL_ATTACHMENT:this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(l&&!u&&(this.depthBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.RENDERBUFFER,this.depthBuffer)),u&&!l&&(this.stencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.stencilBuffer)),l&&u&&(this.depthStencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.depthStencilBuffer))),this.gl.renderer.bindFramebuffer({target:this.target})}setSize(e,t){if(this.width!==e||this.height!==t){this.width=e,this.height=t,this.gl.renderer.bindFramebuffer(this);for(let r=0;r<this.textures.length;r++)this.textures[r].width=e,this.textures[r].height=t,this.textures[r].needsUpdate=!0,this.textures[r].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+r,this.gl.TEXTURE_2D,this.textures[r].texture,0);this.depthTexture?(this.depthTexture.width=e,this.depthTexture.height=t,this.depthTexture.needsUpdate=!0,this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(this.depthBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,e,t)),this.stencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,e,t)),this.depthStencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,e,t))),this.gl.renderer.bindFramebuffer({target:this.target})}}}])},899925,e=>{"use strict";let t=new Uint8Array(4),r=1;e.s(["Texture",0,class{constructor(e,{image:t,target:i=e.TEXTURE_2D,type:s=e.UNSIGNED_BYTE,format:a=e.RGBA,internalFormat:l=a,wrapS:u=e.CLAMP_TO_EDGE,wrapT:n=e.CLAMP_TO_EDGE,wrapR:h=e.CLAMP_TO_EDGE,generateMipmaps:o=i===(e.TEXTURE_2D||e.TEXTURE_CUBE_MAP),minFilter:c=o?e.NEAREST_MIPMAP_LINEAR:e.LINEAR,magFilter:g=e.LINEAR,premultiplyAlpha:f=!1,unpackAlignment:v=4,flipY:d=i==(e.TEXTURE_2D||e.TEXTURE_3D),anisotropy:m=0,level:p=0,width:x,height:E=x,length:T=1}={}){this.gl=e,this.id=r++,this.image=t,this.target=i,this.type=s,this.format=a,this.internalFormat=l,this.minFilter=c,this.magFilter=g,this.wrapS=u,this.wrapT=n,this.wrapR=h,this.generateMipmaps=o,this.premultiplyAlpha=f,this.unpackAlignment=v,this.flipY=d,this.anisotropy=Math.min(m,this.gl.renderer.parameters.maxAnisotropy),this.level=p,this.width=x,this.height=E,this.length=T,this.texture=this.gl.createTexture(),this.store={image:null},this.glState=this.gl.renderer.state,this.state={},this.state.minFilter=this.gl.NEAREST_MIPMAP_LINEAR,this.state.magFilter=this.gl.LINEAR,this.state.wrapS=this.gl.REPEAT,this.state.wrapT=this.gl.REPEAT,this.state.anisotropy=0}bind(){this.glState.textureUnits[this.glState.activeTextureUnit]!==this.id&&(this.gl.bindTexture(this.target,this.texture),this.glState.textureUnits[this.glState.activeTextureUnit]=this.id)}update(e=0){let r=!(this.image===this.store.image&&!this.needsUpdate);if((r||this.glState.textureUnits[e]!==this.id)&&(this.gl.renderer.activeTexture(e),this.bind()),r){if(this.needsUpdate=!1,this.flipY!==this.glState.flipY&&(this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL,this.flipY),this.glState.flipY=this.flipY),this.premultiplyAlpha!==this.glState.premultiplyAlpha&&(this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),this.glState.premultiplyAlpha=this.premultiplyAlpha),this.unpackAlignment!==this.glState.unpackAlignment&&(this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT,this.unpackAlignment),this.glState.unpackAlignment=this.unpackAlignment),this.minFilter!==this.state.minFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MIN_FILTER,this.minFilter),this.state.minFilter=this.minFilter),this.magFilter!==this.state.magFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MAG_FILTER,this.magFilter),this.state.magFilter=this.magFilter),this.wrapS!==this.state.wrapS&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_S,this.wrapS),this.state.wrapS=this.wrapS),this.wrapT!==this.state.wrapT&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_T,this.wrapT),this.state.wrapT=this.wrapT),this.wrapR!==this.state.wrapR&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_R,this.wrapR),this.state.wrapR=this.wrapR),this.anisotropy&&this.anisotropy!==this.state.anisotropy&&(this.gl.texParameterf(this.target,this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT,this.anisotropy),this.state.anisotropy=this.anisotropy),this.image){if(this.image.width&&(this.width=this.image.width,this.height=this.image.height),this.target===this.gl.TEXTURE_CUBE_MAP)for(let e=0;e<6;e++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+e,this.level,this.internalFormat,this.format,this.type,this.image[e]);else if(ArrayBuffer.isView(this.image))this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,this.image):(this.target===this.gl.TEXTURE_2D_ARRAY||this.target===this.gl.TEXTURE_3D)&&this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);else if(this.image.isCompressedTexture)for(let e=0;e<this.image.length;e++)this.gl.compressedTexImage2D(this.target,e,this.internalFormat,this.image[e].width,this.image[e].height,0,this.image[e].data);else this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.format,this.type,this.image):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);if(this.generateMipmaps){var i,s;this.gl.renderer.isWebgl2||((i=this.image.width)&i-1)==0&&((s=this.image.height)&s-1)==0?this.gl.generateMipmap(this.target):(this.generateMipmaps=!1,this.wrapS=this.wrapT=this.gl.CLAMP_TO_EDGE,this.minFilter=this.gl.LINEAR)}this.onUpdate&&this.onUpdate()}else if(this.target===this.gl.TEXTURE_CUBE_MAP)for(let e=0;e<6;e++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t);else this.width?this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,null):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,null):this.gl.texImage2D(this.target,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t);this.store.image=this.image}}}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);