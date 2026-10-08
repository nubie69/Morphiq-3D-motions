(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,775890,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(221663),l=e.i(956850),n=e.i(80075),o=e.i(753604),s=e.i(450922);let i={testcard:0,bars:1,grid:2,snow:3},u=e=>{let t=e.replace("#",""),r=3===t.length?t.split("").map(e=>e+e).join(""):t,a=parseInt(r,16);return Number.isNaN(a)||6!==r.length?[1,1,1]:[(a>>16&255)/255,(a>>8&255)/255,(255&a)/255]},c=`#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`,h=`#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uResolution;
uniform float uDpr;
uniform float uSignal;
uniform float uPhase;
uniform float uFrame;
uniform float uSteady;
uniform float uRoll;
uniform float uScanlineDensity;
uniform float uScanlineDepth;
uniform float uCurvature;
uniform float uBloom;
uniform float uPersistence;
uniform float uChromaOffset;
uniform vec3  uPhosphor;
uniform vec3  uBg;

const float TAU = 6.2831853;

// Integer hash. A float one built on fract(p * k) runs out of mantissa at the
// cell counts a wide canvas reaches and the snow grows diagonal structure.
float hash(vec2 cell, float seed) {
  uvec3 q = uvec3(ivec3(int(cell.x), int(cell.y), int(seed)));
  uint h = q.x * 0x8da6b343u + q.y * 0xd8163841u + q.z * 0xcb1ab31fu;
  h ^= h >> 16; h *= 0x7feb352du;
  h ^= h >> 15; h *= 0x846ca68bu;
  h ^= h >> 16;
  return float(h) / 4294967295.0;
}

vec2 curve(vec2 c) {
  float r2 = dot(c, c);
  return c * (1.0 + uCurvature * r2 * 0.55);
}

// A band-limited line: 1 on the line, 0 off it, faded out as the lattice it
// belongs to approaches one cycle per pixel.
float gridLine(float v, float width) {
  float w = max(fwidth(v), 1e-5);
  float d = abs(fract(v) - 0.5);
  float fade = 1.0 - smoothstep(0.2, 0.45, w);
  return (1.0 - smoothstep(width, width + w * 1.5, 0.5 - d)) * fade;
}

float testcard(vec2 p, float aspect) {
  // Square cells measured against the height, centred so the lattice is
  // symmetric at any aspect.
  vec2 q = (p - 0.5) * vec2(aspect, 1.0);
  vec2 g = q * 12.0 + 0.5;
  float lattice = max(gridLine(g.x, 0.035), gridLine(g.y, 0.035));
  float v = 0.22 + lattice * 0.6;

  float r = length(q);
  float rw = max(fwidth(r), 1e-5);
  float inside = 1.0 - smoothstep(0.42 - rw, 0.42 + rw, r);
  if (inside > 0.0) {
    float u = clamp((q.x + 0.42) / 0.84, 0.0, 0.9999);
    float body;
    if (q.y > 0.2) {
      // Grey steps, black to white.
      body = floor(u * 6.0) / 5.0;
    } else if (q.y > 0.06) {
      // The colour bars' luma, as a monochrome set would show them.
      body = 0.95 - floor(u * 7.0) * 0.13;
    } else if (q.y > -0.06) {
      // Centre band: a crosshair on black.
      float cw = max(fwidth(q.x), 1e-5);
      body = (1.0 - smoothstep(0.0, cw * 1.5, abs(q.x))) * 0.9 + 0.04;
      body = max(body, 1.0 - smoothstep(0.004, 0.004 + cw, abs(q.y)));
    } else if (q.y > -0.22) {
      // Multiburst: gratings of rising frequency, each fading as it passes
      // Nyquist instead of beating against the pixel grid.
      float f = 14.0 * pow(1.7, floor(u * 5.0));
      float s = q.x * f;
      float fade = 1.0 - smoothstep(0.2, 0.45, fwidth(s));
      body = 0.5 + 0.5 * cos(s * TAU) * fade;
    } else {
      body = u;
    }
    v = mix(v, body, inside);
  }
  float ring = 1.0 - smoothstep(0.0, rw * 2.0, abs(r - 0.42));
  return max(v, ring);
}

float grid(vec2 p, float aspect) {
  vec2 q = (p - 0.5) * vec2(aspect, 1.0);
  vec2 g = q * 16.0 + 0.5;
  float lines = max(gridLine(g.x, 0.03), gridLine(g.y, 0.03));
  float r = length(q);
  float rw = max(fwidth(r), 1e-5);
  float ring = 1.0 - smoothstep(0.0, rw * 2.0, abs(r - 0.34));
  return max(lines * 0.7, ring) + 0.03;
}

vec3 bars(vec2 p) {
  float b = floor(clamp(p.x, 0.0, 0.9999) * 7.0);
  return
    b < 0.5 ? vec3(0.9) :
    b < 1.5 ? vec3(0.9, 0.9, 0.0) :
    b < 2.5 ? vec3(0.0, 0.9, 0.9) :
    b < 3.5 ? vec3(0.0, 0.9, 0.0) :
    b < 4.5 ? vec3(0.9, 0.0, 0.9) :
    b < 5.5 ? vec3(0.9, 0.0, 0.0) : vec3(0.0, 0.0, 0.9);
}

// What the phosphor is doing at p: the picture, weighted by how long ago the
// beam last crossed it.
vec3 lit(vec2 p, vec2 res, float lines) {
  float line = floor((1.0 - p.y) * lines);
  // Where this pixel sits in scan order, and how much of a frame has passed
  // since the beam was here. Exponential decay in that is phosphor decay.
  float s = (line + clamp(p.x, 0.0, 1.0)) / lines;
  float behind = fract(uPhase - s);
  float tau = 0.04 + uPersistence * uPersistence * 2.4;
  // Fresh phosphor overshoots before it settles, which is what makes the scan
  // front readable when the dot itself crosses a line faster than a frame.
  float flash = exp(-behind / 0.012) * 0.7;
  float decay = mix(exp(-behind / tau) + flash, 1.0, uSteady);

  float aspect = res.x / max(res.y, 1.0);
  vec3 img;
  if (uSignal < 0.5) {
    img = vec3(testcard(p, aspect)) * uPhosphor;
  } else if (uSignal < 1.5) {
    // The one signal that carries its own hue rather than borrowing the
    // phosphor's.
    img = bars(p);
  } else if (uSignal < 2.5) {
    img = vec3(grid(p, aspect)) * uPhosphor;
  } else {
    // A pixel shows the noise of the pass that last painted it, so the snow is
    // redrawn line by line behind the beam rather than all at once.
    float frame = uFrame - step(uPhase, s);
    vec2 cell = floor(vec2(p.x * res.x * 0.5, line));
    img = vec3(hash(cell, frame)) * uPhosphor;
  }
  return img * decay;
}

void main() {
  vec2 res = uResolution / uDpr;
  vec2 c = (gl_FragCoord.xy / uDpr - res * 0.5) / (res * 0.5);

  vec2 warped = curve(c);
  // Soft edge of the glass rather than a hard clip — a hard one aliases along
  // the whole rim, which is the one place the eye is guaranteed to look.
  vec2 edge = abs(warped);
  float glass = (1.0 - smoothstep(0.975, 1.0, edge.x)) * (1.0 - smoothstep(0.975, 1.0, edge.y));

  vec2 p = warped * 0.5 + 0.5;
  float lines = max(floor(res.y / max(uScanlineDensity, 0.5)), 8.0);

  // Convergence error: the guns land at slightly different places. Held in px
  // so the fringe reads the same at any size.
  float off = uChromaOffset / max(res.x, 1.0);
  vec3 sig = vec3(
    lit(p + vec2(off, 0.0), res, lines).r,
    lit(p, res, lines).g,
    lit(p - vec2(off, 0.0), res, lines).b
  );

  // Halation: four analytic taps of the lit picture rather than a blur pass.
  vec3 halo =
    lit(p + vec2(0.01, 0.0), res, lines) +
    lit(p - vec2(0.01, 0.0), res, lines) +
    lit(p + vec2(0.0, 0.016), res, lines) +
    lit(p - vec2(0.0, 0.016), res, lines);
  sig += halo * 0.25 * uBloom * 0.4;

  // The beam itself: a hot spot at its current position, and a wide glow.
  float scan = uPhase * lines;
  vec2 beam = vec2(fract(scan), 1.0 - (floor(scan) + 0.5) / lines);
  vec2 dpx = (p - beam) * res;
  float spot = exp(-dot(dpx, dpx) / 18.0);
  float glow = exp(-length(dpx) / 70.0) * 0.35;
  float live = 1.0 - uSteady;
  sig += (uPhosphor * 0.6 + 0.4) * spot * live;
  sig += uPhosphor * glow * uBloom * live;

  // Hum bar: a soft periodic band rolling up the face. A cosine rather than a
  // wrapped ramp, so there is no seam where it comes back round.
  float hum = pow(0.5 + 0.5 * cos((p.y + uRoll) * TAU), 12.0) * 0.07;
  sig += hum * uPhosphor;

  // Scanlines follow the raster, so they bend with the glass.
  float sy = (1.0 - p.y) * lines;
  float scanFade = 1.0 - smoothstep(0.25, 0.5, fwidth(sy));
  float scanDark = 0.5 + 0.5 * cos(sy * TAU);
  sig *= 1.0 - uScanlineDepth * scanDark * scanFade;

  float gx = gl_FragCoord.x / (3.0 * uDpr);
  float grilleFade = 1.0 - smoothstep(0.25, 0.5, fwidth(gx));
  sig *= 1.0 - uScanlineDepth * 0.3 * (0.5 + 0.5 * cos(gx * TAU)) * grilleFade;

  float vig = 1.0 - 0.3 * dot(c, c);

  fragColor = vec4(mix(uBg, sig * vig, glass), 1.0);
}`,f=(0,r.memo)(({signal:e="testcard",scanRate:f=.3,persistence:d=.55,scanlineDensity:p=3,scanlineDepth:m=.4,curvature:g=.18,bloom:v=.6,rollSpeed:b=.2,chromaOffset:w=.8,phosphorColor:x="#7ef0c0",backgroundColor:y="#050607",paused:C=!1,reducedMotion:R=!1,className:S})=>{let P=(0,r.useRef)(null),D=(0,r.useRef)(null),q=(0,r.useRef)(null),A=(0,r.useRef)(null),[F,k]=(0,r.useState)(!1),M=(0,s.useAnimationLoop)({target:P,halted:C||R,dpr:"auto",onResize:e=>q.current?.(e),onFrame:({dt:e})=>!!D.current&&D.current(e),gl:()=>A.current}),T=(0,r.useRef)({signal:e,scanRate:f,persistence:d,scanlineDensity:p,scanlineDepth:m,curvature:g,bloom:v,rollSpeed:b,chromaOffset:w,phosphorColor:x,backgroundColor:y,reducedMotion:R});return(T.current={signal:e,scanRate:f,persistence:d,scanlineDensity:p,scanlineDepth:m,curvature:g,bloom:v,rollSpeed:b,chromaOffset:w,phosphorColor:x,backgroundColor:y,reducedMotion:R},(0,r.useEffect)(()=>{(()=>{try{return!!document.createElement("canvas").getContext("webgl2")}catch{return!1}})()||k(!0)},[]),(0,r.useEffect)(()=>{let t=P.current;if(F||!t)return;let r=new a.Renderer({webgl:2,alpha:!1,antialias:!1,powerPreference:"high-performance",dpr:Math.min(window.devicePixelRatio||1,2)}),s=r.gl;A.current=s;let f=s.canvas;f.style.display="block",f.style.position="absolute",f.style.top="0",f.style.left="0",t.appendChild(f);let b=new l.Program(s,{vertex:c,fragment:h,uniforms:{uResolution:{value:new Float32Array([1,1])},uDpr:{value:1},uSignal:{value:i[e]??0},uPhase:{value:0},uFrame:{value:0},uSteady:{value:0},uRoll:{value:0},uScanlineDensity:{value:p},uScanlineDepth:{value:m},uCurvature:{value:g},uBloom:{value:v},uPersistence:{value:d},uChromaOffset:{value:w},uPhosphor:{value:new Float32Array(u(x))},uBg:{value:new Float32Array(u(y))}}}),C=new n.Mesh(s,{geometry:new o.Triangle(s),program:b}),R=b.uniforms,S={scan:.62,roll:0},k=()=>{let e=T.current;R.uPhase.value=S.scan%1,R.uFrame.value=Math.floor(S.scan),R.uSteady.value=+!!e.reducedMotion,R.uRoll.value=S.roll,R.uSignal.value=i[e.signal]??0,R.uScanlineDensity.value=e.scanlineDensity,R.uScanlineDepth.value=e.scanlineDepth,R.uCurvature.value=e.curvature,R.uBloom.value=e.bloom,R.uPersistence.value=e.persistence,R.uChromaOffset.value=e.chromaOffset,R.uPhosphor.value.set(u(e.phosphorColor)),R.uBg.value.set(u(e.backgroundColor))};return D.current=e=>{let t=T.current;S.scan=(S.scan+e*t.scanRate)%997,S.roll=(S.roll+e*t.rollSpeed*.12)%1,k(),r.render({scene:C})},q.current=({width:e,height:t,dpr:a})=>{r.dpr=a,r.setSize(Math.max(1,Math.floor(e)),Math.max(1,Math.floor(t)));let l=R.uResolution.value;l[0]=s.drawingBufferWidth,l[1]=s.drawingBufferHeight,R.uDpr.value=a,k(),r.render({scene:C})},M.resize(),M.start(),()=>{D.current=null,q.current=null,t.contains(f)&&t.removeChild(f)}},[F]),(0,r.useEffect)(()=>{M.paint()},[e,f,d,p,m,g,v,b,w,x,y,R,M]),F)?(0,t.jsx)("div",{className:S??"relative h-full w-full overflow-hidden",style:{backgroundColor:y,backgroundImage:`repeating-linear-gradient(0deg, ${x}22 0 1px, transparent 1px ${Math.max(p,1)}px)`}}):(0,t.jsx)("div",{ref:P,className:S??"relative h-full w-full overflow-hidden"})});f.displayName="Cathode",e.s(["default",0,function({values:e,reducedMotion:r,paused:a}){return(0,t.jsx)("div",{className:"relative h-full min-h-80 w-full",children:(0,t.jsx)(f,{signal:e.signal,scanRate:e.scanRate,persistence:e.persistence,scanlineDensity:e.scanlineDensity,scanlineDepth:e.scanlineDepth,curvature:e.curvature,bloom:e.bloom,rollSpeed:e.rollSpeed,chromaOffset:e.chromaOffset,phosphorColor:e.phosphorColor,backgroundColor:e.backgroundColor,paused:a,reducedMotion:r})})}],775890)},877154,function(e){e.n(e.i(775890))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let a=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{a.current=e});let l=(0,t.useRef)(null),n=(0,t.useRef)(null),o=(0,t.useRef)(!1),s=(0,t.useRef)(!1),i=(0,t.useRef)(0),u=(0,t.useRef)(0),c=(0,t.useRef)(0),h=(0,t.useCallback)(()=>{let e=a.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=a.current.dpr??"auto",l=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:l,bufferWidth:Math.max(1,Math.round(t.width*l)),bufferHeight:Math.max(1,Math.round(t.height*l))}},[]),f=(0,t.useCallback)(function e(t){if(s.current)return;0===i.current&&(i.current=t);let n=0===u.current?0:Math.min((t-u.current)/1e3,r);u.current=t;let h={now:t,dt:n,elapsed:(t-i.current)/1e3,frame:c.current++},f=a.current.onFrame?.(h);if(!s.current){if(!1===f||a.current.halted){o.current=!1,l.current=null;return}l.current=requestAnimationFrame(e)}},[]),d=(0,t.useCallback)(()=>{s.current||o.current||(o.current=!0,u.current=0,l.current=requestAnimationFrame(f))},[f]),p=(0,t.useCallback)(()=>{o.current=!1,null!==l.current&&(cancelAnimationFrame(l.current),l.current=null)},[]),m=(0,t.useCallback)(()=>d(),[d]),g=(0,t.useCallback)(()=>{let e=h();e&&(a.current.onResize?.(e),!1!==a.current.paintWhenHalted?m():a.current.halted||d())},[h,m,d]),v=e.deps??[];(0,t.useEffect)(()=>{s.current=!1;let e=a.current.target.current;if(!e)return;let t=()=>{s.current||g()},r=new ResizeObserver(()=>{let e=a.current.resizeDebounceMs??0;e<=0?t():(null!==n.current&&clearTimeout(n.current),n.current=setTimeout(()=>{n.current=null,t()},e))});return r.observe(e),g(),a.current.halted||d(),()=>{s.current=!0,o.current=!1,null!==l.current&&(cancelAnimationFrame(l.current),l.current=null),null!==n.current&&(clearTimeout(n.current),n.current=null),r.disconnect(),a.current.onDispose?.();let e=a.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),i.current=0,u.current=0,c.current=0}},v);let b=e.halted??!1;return(0,t.useEffect)(()=>{b||d()},[b,d]),(0,t.useMemo)(()=>({start:d,stop:p,paint:m,resize:g,get running(){return o.current}}),[d,p,m,g])}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);