(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,846929,e=>{"use strict";var t=e.i(843476),r=e.i(859290);e.s(["default",0,function({values:e,reducedMotion:n,paused:a}){return(0,t.jsx)(r.default,{color:e.color,amplitude:e.amplitude,distance:e.distance,saturation:e.saturation,opacity:e.opacity,enableMouseInteraction:e.enableMouseInteraction,paused:a||n})}])},924510,function(e){e.n(e.i(846929))},859290,e=>{"use strict";var t=e.i(843476),r=e.i(271645),n=e.i(221663),a=e.i(956850),u=e.i(80075),i=e.i(753604),l=e.i(11308),o=e.i(450922);let s=`
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`,c=`
precision highp float;

uniform float uOpacity;
uniform float iTime;
uniform vec3 iResolution;
uniform vec3 uColor;
uniform float uAmplitude;
uniform float uDistance;
uniform vec2 uMouse;
uniform float uSaturation;

#define PI 3.1415926538

const int u_line_count = 60;
const float u_line_width = 1.2;
const float u_line_blur = 5.0;

float Perlin2D(vec2 P) {
    vec2 Pi = floor(P);
    vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);
    vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);
    Pt = Pt - floor(Pt * (1.0 / 71.0)) * 71.0;
    Pt += vec2(26.0, 161.0).xyxy;
    Pt *= Pt;
    Pt = Pt.xzxz * Pt.yyww;
    vec4 hash_x = fract(Pt * (1.0 / 951.135664));
    vec4 hash_y = fract(Pt * (1.0 / 642.949883));
    vec4 grad_x = hash_x - 0.49999;
    vec4 grad_y = hash_y - 0.49999;
    vec4 grad_results = inversesqrt(grad_x * grad_x + grad_y * grad_y)
        * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);
    grad_results *= 1.4142135623730950;
    vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy
               * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
    vec4 blend2 = vec4(blend, vec2(1.0 - blend));
    return dot(grad_results, blend2.zxzx * blend2.wwyy);
}

float pixel(float count, vec2 resolution) {
    return (1.0 / max(resolution.x, resolution.y)) * count;
}

float lineFn(vec2 st, float width, float perc, float offset, vec2 mouse, float time, float amplitude, float distance) {
    float time_scaled = time / 6.0 + (mouse.x - 0.5) * 1.5;

    float organic_sweep = mix(
        Perlin2D(vec2(time_scaled, st.x + perc) * 1.5),
        sin(st.x * 2.5 + time_scaled) * cos(st.x * 3.0 - time_scaled * 0.5 + perc * PI * 1.5) * 1.5,
        0.5 + perc * 0.5
    );

    float amplitude_strength = amplitude * (0.2 + (mouse.y - 0.5) * 0.2);

    float base_spread = distance > 0.0 ? (perc - 0.5) * distance : 0.0;

    float line_offset = perc * PI * 2.0;
    float structural_envelope = sin(st.x * 3.0 + time_scaled * 2.0 + line_offset) * 0.15 * amplitude_strength;

    float y = 0.5 + base_spread + organic_sweep * amplitude_strength + structural_envelope;

    float blur = u_line_blur * pixel(1.0, iResolution.xy) * (0.5 + perc * 1.5);
    float width_px = width * (1.2 - perc * 0.4);

    float line_start = smoothstep(y + (width_px / 2.0) + blur, y, st.y);
    float line_end = smoothstep(y, y - (width_px / 2.0) - blur, st.y);

    float depth_alpha = 1.0 - smoothstep(0.4, 1.0, perc);
    float vignette = smoothstep(0.0, 0.08, st.x) * (1.0 - smoothstep(0.92, 1.0, st.x));

    return clamp((line_start - line_end) * depth_alpha * vignette, 0.0, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    float line_strength = 1.0;
    for (int i = 0; i < u_line_count; i++) {
        float p = float(i) / float(u_line_count);
        line_strength *= (1.0 - lineFn(
            uv,
            u_line_width * pixel(1.0, iResolution.xy),
            p,
            (PI * 1.0) * p,
            uMouse,
            iTime,
            uAmplitude,
            uDistance
        ));
    }

    float colorVal = 1.0 - line_strength;

    vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(uColor, W));
    vec3 finalColor = mix(intensity, uColor, uSaturation);

    float alpha = colorVal * uOpacity;
    fragColor = vec4(finalColor * alpha, alpha);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;e.s(["default",0,({color:e="#a855f7",amplitude:f=1.5,distance:d=.2,opacity:v=.7,saturation:m=1,enableMouseInteraction:p=!0,paused:h=!1,maxDpr:g=2,fallbackSrc:_,className:y})=>{let x=(0,r.useRef)(null),P=(0,r.useRef)(null),b=(0,r.useRef)(null),w=(0,r.useRef)(null),C=(0,r.useRef)({color:e,amplitude:f,distance:d,opacity:v,saturation:m,paused:h});C.current={color:e,amplitude:f,distance:d,opacity:v,saturation:m,paused:h};let R=(0,o.useAnimationLoop)({target:x,halted:!1,dpr:g,onResize:e=>b.current?.(e),onFrame:({dt:e})=>!!P.current&&P.current(e),gl:()=>w.current}),[A,E]=(0,r.useState)(!1);return((0,r.useEffect)(()=>{_&&(!("u"<typeof navigator)&&(/iPhone|iPad|iPod/.test(navigator.userAgent)||"MacIntel"===navigator.platform&&navigator.maxTouchPoints>1)||!function(){if("u"<typeof document)return!1;try{let e=document.createElement("canvas");return!!(e.getContext("webgl2")||e.getContext("webgl")||e.getContext("experimental-webgl"))}catch{return!1}}())&&E(!0)},[_]),(0,r.useEffect)(()=>{let t;if(A||!x.current)return;let r=x.current;try{let y=new n.Renderer({alpha:!0,premultipliedAlpha:!0,dpr:Math.min(window.devicePixelRatio||1,g)});(t=y.gl).clearColor(0,0,0,0),t.enable(t.BLEND),t.blendFunc(t.ONE,t.ONE_MINUS_SRC_ALPHA),t.canvas.style.position="absolute",t.canvas.style.top="0",t.canvas.style.left="0",r.appendChild(t.canvas);let x=new i.Triangle(t),A=new a.Program(t,{vertex:s,fragment:c,uniforms:{iTime:{value:0},iResolution:{value:new l.Color(t.canvas.width,t.canvas.height,t.canvas.width/t.canvas.height)},uColor:{value:new l.Color(e)},uOpacity:{value:v},uAmplitude:{value:f},uDistance:{value:d},uMouse:{value:new Float32Array([.5,.5])},uSaturation:{value:m}}});if(!t.getProgramParameter(A.program,t.LINK_STATUS))throw Error("Waves shader program failed to link");let E=new u.Mesh(t,{geometry:x,program:A});w.current=t,b.current=({width:e,height:t,dpr:r})=>{if(0===e||0===t)return;y.dpr=r,y.setSize(e,t);let n=y.gl.drawingBufferWidth,a=y.gl.drawingBufferHeight;A.uniforms.iResolution.value.r=n,A.uniforms.iResolution.value.g=a,A.uniforms.iResolution.value.b=n/a};let M=[.5,.5],L=[.5,.5];function o(e){let t=r.getBoundingClientRect(),n=(e.clientX-t.left)/t.width,a=1-(e.clientY-t.top)/t.height;L=[n,a]}function _(){L=[.5,.5]}p&&(r.addEventListener("pointermove",o),r.addEventListener("pointerleave",_),r.addEventListener("pointercancel",_));let I=0,T=+!h;return P.current=e=>{let t=C.current,r=+!t.paused;T+=(r-T)*.05,I+=e*T,A.uniforms.iTime.value=I;let[n,a,u]=function(e){let t=e.replace("#","").trim();if(3===t.length&&(t=t.split("").map(e=>e+e).join("")),6!==t.length)return[1,1,1];let r=parseInt(t,16);return Number.isNaN(r)?[1,1,1]:[(r>>16&255)/255,(r>>8&255)/255,(255&r)/255]}(t.color);if(A.uniforms.uColor.value.r=n,A.uniforms.uColor.value.g=a,A.uniforms.uColor.value.b=u,A.uniforms.uOpacity.value=t.opacity,A.uniforms.uAmplitude.value=t.amplitude,A.uniforms.uDistance.value=t.distance,A.uniforms.uSaturation.value=t.saturation,p?(M[0]+=.05*(L[0]-M[0]),M[1]+=.05*(L[1]-M[1]),A.uniforms.uMouse.value[0]=M[0],A.uniforms.uMouse.value[1]=M[1]):(A.uniforms.uMouse.value[0]=.5,A.uniforms.uMouse.value[1]=.5),y.render({scene:E}),t.paused&&T<.001)return!1},R.resize(),R.start(),()=>{P.current=null,b.current=null,w.current=null,p&&(r.removeEventListener("pointermove",o),r.removeEventListener("pointerleave",_),r.removeEventListener("pointercancel",_)),r.contains(t.canvas)&&r.removeChild(t.canvas)}}catch(e){console.warn("Waves: WebGL init failed, falling back to static image",e),t&&(r.contains(t.canvas)&&r.removeChild(t.canvas),t.getExtension("WEBGL_lose_context")?.loseContext()),E(!0);return}},[p,A,g]),(0,r.useEffect)(()=>{h||R.start()},[h,R]),A&&_)?(0,t.jsx)("div",{className:y??"relative h-full w-full",children:(0,t.jsx)("img",{src:_,alt:"","aria-hidden":!0,className:"absolute inset-0 h-full w-full object-cover",style:{opacity:v}})}):(0,t.jsx)("div",{ref:x,className:`[&_canvas]:touch-none ${y??"relative h-full w-full"}`})}])},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let n=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{n.current=e});let a=(0,t.useRef)(null),u=(0,t.useRef)(null),i=(0,t.useRef)(!1),l=(0,t.useRef)(!1),o=(0,t.useRef)(0),s=(0,t.useRef)(0),c=(0,t.useRef)(0),f=(0,t.useCallback)(()=>{let e=n.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=n.current.dpr??"auto",a=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:a,bufferWidth:Math.max(1,Math.round(t.width*a)),bufferHeight:Math.max(1,Math.round(t.height*a))}},[]),d=(0,t.useCallback)(function e(t){if(l.current)return;0===o.current&&(o.current=t);let u=0===s.current?0:Math.min((t-s.current)/1e3,r);s.current=t;let f={now:t,dt:u,elapsed:(t-o.current)/1e3,frame:c.current++},d=n.current.onFrame?.(f);if(!l.current){if(!1===d||n.current.halted){i.current=!1,a.current=null;return}a.current=requestAnimationFrame(e)}},[]),v=(0,t.useCallback)(()=>{l.current||i.current||(i.current=!0,s.current=0,a.current=requestAnimationFrame(d))},[d]),m=(0,t.useCallback)(()=>{i.current=!1,null!==a.current&&(cancelAnimationFrame(a.current),a.current=null)},[]),p=(0,t.useCallback)(()=>v(),[v]),h=(0,t.useCallback)(()=>{let e=f();e&&(n.current.onResize?.(e),!1!==n.current.paintWhenHalted?p():n.current.halted||v())},[f,p,v]),g=e.deps??[];(0,t.useEffect)(()=>{l.current=!1;let e=n.current.target.current;if(!e)return;let t=()=>{l.current||h()},r=new ResizeObserver(()=>{let e=n.current.resizeDebounceMs??0;e<=0?t():(null!==u.current&&clearTimeout(u.current),u.current=setTimeout(()=>{u.current=null,t()},e))});return r.observe(e),h(),n.current.halted||v(),()=>{l.current=!0,i.current=!1,null!==a.current&&(cancelAnimationFrame(a.current),a.current=null),null!==u.current&&(clearTimeout(u.current),u.current=null),r.disconnect(),n.current.onDispose?.();let e=n.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),o.current=0,s.current=0,c.current=0}},g);let _=e.halted??!1;return(0,t.useEffect)(()=>{_||v()},[_,v]),(0,t.useMemo)(()=>({start:v,stop:m,paint:p,resize:h,get running(){return i.current}}),[v,m,p,h])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])},11308,e=>{"use strict";let t={black:"#000000",white:"#ffffff",red:"#ff0000",green:"#00ff00",blue:"#0000ff",fuchsia:"#ff00ff",cyan:"#00ffff",yellow:"#ffff00",orange:"#ff8000"};function r(e){4===e.length&&(e=e[0]+e[1]+e[1]+e[2]+e[2]+e[3]+e[3]);let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t||console.warn(`Unable to convert hex string ${e} to rgb values`),[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]}function n(e){if(void 0===e)return[0,0,0];if(3==arguments.length)return arguments;if(!isNaN(e)){var n;return[((n=parseInt(n=e))>>16&255)/255,(n>>8&255)/255,(255&n)/255]}return"#"===e[0]?r(e):t[e.toLowerCase()]?r(t[e.toLowerCase()]):(console.warn("Color format not recognised"),[0,0,0])}e.s(["Color",0,class extends Array{constructor(e){if(Array.isArray(e))return super(...e);return super(...n(...arguments))}get r(){return this[0]}get g(){return this[1]}get b(){return this[2]}set r(e){this[0]=e}set g(e){this[1]=e}set b(e){this[2]=e}set(e){return Array.isArray(e)?this.copy(e):this.copy(n(...arguments))}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this}}],11308)}]);