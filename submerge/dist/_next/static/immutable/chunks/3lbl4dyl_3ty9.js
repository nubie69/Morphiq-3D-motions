(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,457435,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(450922),n=e.i(994964),i=e.i(80075),l=e.i(956850),s=e.i(221663);let o=`
attribute vec2 aHome;
attribute float aTint;
attribute vec4 aRand;
attribute vec4 aRand2;
attribute vec2 aEdge;

uniform float uTime;
uniform float uFrontStart;
uniform float uFrontSpeed;
uniform vec2 uResolution;
uniform float uDpr;
uniform float uWind;
uniform float uBuoy;
uniform float uTurb;
uniform float uGrainSize;
uniform vec3 uInk;
uniform vec3 uAccent;

const float GRAIN_IN = 0.100;
const float PEEL_FLOOR = 0.120;

varying vec3 vColor;
varying float vAlpha;
varying float vSoft;

// Cheap per-grain hash off the home position — granulation order needs its own
// randomness and every aRand channel is already spoken for.
float hash12(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Stream function, domain-warped (sin inside sin) so the field never reads as
// the periodic sine sum it actually is. The domain scrolls downstream with the
// wind: eddies travel along with the plume rather than standing still in screen
// space, which is the actual signature of smoke.
float psiQ(vec2 q, float t) {
  float s  =        sin(q.x       + 1.7 * sin(q.y * 0.9 + t * 0.35));
  s       += 0.55 * sin(q.y * 2.1 - 1.3 * sin(q.x * 1.7 - t * 0.50));
  s       += 0.26 * sin((q.x + q.y) * 3.9 + t * 0.95);
  return s;
}

// Curl of psi — divergence-free, so the cloud swirls instead of pumping (a
// plain gradient field has sources and sinks: grains pile up and thin out in
// fixed spots, which reads as jitter). Differenced in normalized q space so the
// result is O(1) and the caller's amplitude stays in readable pixels.
vec2 curl(vec2 p, float t) {
  const float e = 0.06;
  vec2 q = p * 0.0055 - vec2(t * 0.62, 0.0);
  float dy = psiQ(q + vec2(0.0, e), t) - psiQ(q - vec2(0.0, e), t);
  float dx = psiQ(q + vec2(e, 0.0), t) - psiQ(q - vec2(e, 0.0), t);
  return vec2(dy, -dx) / (2.0 * e);
}

void main() {
  // A char starts granulating when the front touches its right edge, but its
  // grains do not all arrive at once — each waits out its own slice of the
  // GRAIN_IN window, so the letter crackles into dust instead of switching
  // over in one frame. The DOM glyph is still solid underneath for the whole
  // window, hiding the ramp entirely. No mask, no wipe line.
  float granT = (uFrontStart - aEdge.x) / uFrontSpeed;
  float visibleT = granT + GRAIN_IN * hash12(aHome);
  // A grain leaves once the front passes its own x (plus positive jitter so
  // dust lifts off the still-held face) — right-to-left, ragged, per-grain.
  float key = aHome.x + aRand2.z * 40.0;
  float releaseT = max((uFrontStart - key) / uFrontSpeed, visibleT);
  // Back-loaded peel: grains hold at home after release so the silhouette
  // stays anchored — but the window is tight (~2 chars of front travel), so
  // a char is mostly gone before the front reaches its second neighbor. The
  // crown of a glyph goes first (aEdge.y = 0 at the top): wind takes the
  // exposed top of a letter before it gets under the base. The floor is the
  // handoff guarantee — see PEEL_FLOOR.
  float peel = PEEL_FLOOR
    + 0.30 * pow(aRand.x, 0.7) * mix(0.55, 1.0, clamp(aEdge.y, 0.0, 1.0));
  float life = mix(1.0, 1.9, aRand2.x);
  float tf = clamp(uTime - releaseT - peel, 0.0, life);
  float lifeFrac = tf / life;

  // Drag-limited surge: v(t) = vterm * (1 - exp(-t/tau)) integrated — gentle
  // lift-off into a fast wash. sqrt bias favors screamers.
  float tau = 0.22;
  // Rank kept separate from the tuned speed: the motion-blur ghost below keys
  // off how fast this grain is *relative to its peers*, which is a property of
  // the grain. Fold uWind into it and turning the wind down would un-ghost the
  // whole field instead of just slowing it.
  float vrank = mix(150.0, 460.0, sqrt(aRand.y));
  float vterm = vrank * uWind;
  float base = vterm * (tf - tau * (1.0 - exp(-tf / tau)));

  // Buoyancy, accelerating — dust lifts as it loosens. Screen y is down.
  float rise = (mix(26.0, 88.0, aRand.w) * tf + 16.0) * tf * uBuoy;
  // Wind shear: the higher a grain climbs the faster the wind carries it, so
  // the plume rakes up-and-right in a curve instead of shooting flat.
  float dx = base * (1.0 + rise * 0.0016);
  // Fan spread: quadratic center-bias — soft tails peel off above and below.
  float fan = aRand.z * 2.0 - 1.0;
  float dy = fan * abs(fan) * 90.0 * tf - rise;

  vec2 ballistic = aHome + vec2(dx, dy);
  // Amplitude grows super-linearly with flight time: the diffusion-like spread
  // that frays the plume into wisps, without integrating any state.
  float turbAmp = mix(0.7, 1.5, aRand2.w) * 78.0 * pow(tf, 1.3) * uTurb;
  // The held face breathes before it lets go — a heat-haze shimmer that reads
  // as the letter loosening rather than waiting. Squared ramp from zero at the
  // grain's own arrival, so it is still sub-pixel while the DOM glyph is up.
  float held = clamp((uTime - visibleT) / 0.35, 0.0, 1.0);
  // Sampled at the travelling position, never at aHome — a grain has to enter
  // new eddies as it flies or the whole cloud just shimmers in place.
  vec2 pos = ballistic + curl(ballistic, uTime) * (turbAmp + 2.5 * held * held);

  // Arrival is a brief per-grain fade rather than a step — with the hash
  // stagger above, the char stipples in. Then opaque through most of the
  // travel and a long tail. Fast grains slightly ghosted — motion blur.
  float lifeK = 1.0 - lifeFrac;
  float alpha = clamp((uTime - visibleT) / 0.05, 0.0, 1.0) * pow(lifeK, 1.7);
  alpha *= mix(1.0, 0.62, (vrank / 460.0) * step(0.001, tf));
  vAlpha = alpha;
  vColor = mix(uInk, uAccent, aTint);
  // Drives the sprite profile: solid ink at rest, haze in flight.
  vSoft = pow(lifeFrac, 0.6);

  // Base size covers the sampling stride so the swap reads near-solid; the
  // 2.7x growth is dispersal — alpha falls faster than area grows, so total
  // ink still drops while each grain thins into haze.
  gl_PointSize =
    mix(2.6, 3.6, aRand2.y) * mix(1.0, 2.7, pow(lifeFrac, 0.75)) * uDpr * uGrainSize;
  gl_Position = vec4(
    pos.x / uResolution.x * 2.0 - 1.0,
    1.0 - pos.y / uResolution.y * 2.0,
    0.0,
    1.0
  );
  // Cull invisible points entirely — zero fragment cost.
  if (vAlpha < 0.004) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
`,u=`
precision mediump float;

varying vec3 vColor;
varying float vAlpha;
varying float vSoft;

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  // At rest the sprite is a plateau disc with a soft rim. This is what makes
  // the granulated glyph match solid ink: a gaussian's coverage collapses to
  // roughly half the sprite, so a field of them reads visibly lighter and
  // greyer than the DOM text it replaces — the letter appears to dim as it
  // cracks. In flight it morphs to a gaussian, where the soft falloff is
  // exactly what turns overlapping grains into haze instead of sand.
  float disc = 1.0 - smoothstep(0.34, 0.5, r);
  float haze = max(exp(-r * r * 11.0) - 0.064, 0.0) * 1.068;
  float m = mix(disc, haze, vSoft);
  float a = vAlpha * m;
  gl_FragColor = vec4(vColor * a, a); // premultiplied
}
`;function c(e){let t=e.trim().replace("#","");return(3===t.length&&(t=t[0]+t[0]+t[1]+t[1]+t[2]+t[2]),6===t.length&&/^[0-9a-f]{6}$/i.test(t))?[parseInt(t.slice(0,2),16)/255,parseInt(t.slice(2,4),16)/255,parseInt(t.slice(4,6),16)/255]:[1,1,1]}function d(e,t,r,a){let n=[],i=[],l=[],s=[],o=[];for(let u=0;u<e.length;u++){let c=e[u];if(!c)continue;let d=c.getBoundingClientRect(),h=c.textContent;if(!h||d.width<1||d.height<1)continue;let f={left:d.left-t.left,top:d.top-t.top,right:d.right-t.left,width:d.width,height:d.height},p=getComputedStyle(c),m=parseFloat(p.fontSize),g=Math.ceil(f.width)+8,v=Math.ceil(f.height)+8,y=document.createElement("canvas");y.width=g,y.height=v;let x=y.getContext("2d",{willReadFrequently:!0});if(!x)continue;x.font=`${p.fontStyle} ${p.fontWeight} ${m}px ${p.fontFamily}`,x.textAlign="center",x.fillStyle="#ffffff";let w=f.top+f.height/2-v/2,b=x.measureText(h),R=b.fontBoundingBoxAscent,k=b.fontBoundingBoxDescent;if(Number.isFinite(R)&&Number.isFinite(k)&&R+k>0){let e=(f.height-(R+k))/2,t=f.top+e+R;x.textBaseline="alphabetic",x.fillText(h,g/2,t-w)}else x.textBaseline="middle",x.fillText(h,g/2,v/2);let S=Math.max(2,Math.ceil(Math.sqrt(f.width*m*.45/r))),T=x.getImageData(0,0,g,v).data,C=f.left+f.width/2-g/2,F=u<a?0:1;for(let e=0;e<v;e+=S)for(let t=0;t<g;t+=S)if(T[(e*g+t)*4+3]>128){let r=w+e+(Math.random()-.5)*S;n.push(C+t+(Math.random()-.5)*S,r),i.push(F),l.push(Math.random(),Math.random(),Math.random(),Math.random()),s.push(Math.random(),Math.random(),Math.random(),Math.random()),o.push(f.right,(r-f.top)/f.height)}}return{count:n.length/2,home:new Float32Array(n),tint:new Float32Array(i),rand:new Float32Array(l),rand2:new Float32Array(s),edge:new Float32Array(o)}}let h=e=>e<0?0:e>1?1:e,f=(0,r.memo)(({text:e="MOTIONGARDEN",sweepDuration:f=1.9,grainDensity:p=2500,windSpeed:m=1,buoyancy:g=1,turbulence:v=1,grainSize:y=1,splitIndex:x=6,reveal:w="split",autoplay:b=!0,replayDelay:R=1.2,inkColor:k="#e9e7ef",accentColor:S="#a855f7",backgroundColor:T="#08050e",onDone:C,paused:F=!1,reducedMotion:A=!1,className:z})=>{let M=(0,r.useRef)(null),N=(0,r.useRef)(null),j=(0,r.useRef)(null),E=(0,r.useRef)([]),D=(0,r.useRef)(null),I=(0,r.useRef)(null),q=(0,r.useRef)(null),B=(0,r.useMemo)(()=>[...e],[e]),O=(0,r.useRef)({sweepDuration:f,reveal:w,autoplay:b,replayDelay:R});O.current={sweepDuration:f,reveal:w,autoplay:b,replayDelay:R};let P=(0,r.useRef)(null),L=(0,r.useRef)({wind:m,buoyancy:g,turbulence:v,grainSize:y,ink:c(k),accent:c(S)});L.current={wind:m,buoyancy:g,turbulence:v,grainSize:y,ink:c(k),accent:c(S)};let G=(0,r.useRef)(C);G.current=C;let _=(0,a.useAnimationLoop)({target:M,halted:F||A,dpr:"auto",resizeDebounceMs:120,onResize:e=>I.current?.(e),onFrame:({dt:e})=>!!D.current&&D.current(e),gl:()=>q.current});(0,r.useEffect)(()=>{let e=M.current;if(!e)return;if(E.current.length=B.length,A){for(let e of E.current)e&&(e.style.visibility="visible");let e=setTimeout(()=>G.current?.(),900);return()=>clearTimeout(e)}let t=!1,r=null,a=null,c=0,f=!1,m=!1,g=!1,v=()=>{for(let e of(c=0,f=!1,E.current))e&&(e.style.visibility="visible");N.current&&(N.current.style.transform="translateY(0%)",N.current.style.opacity="1"),j.current&&(j.current.style.transform="translateY(0%)",j.current.style.opacity="1"),r&&(r.canvas.style.opacity="1")};P.current=v;let y=()=>{if(!m)return!1;let t=e.getBoundingClientRect();if(t.width<1||t.height<1)return!1;let c=(()=>{let t=e.getBoundingClientRect(),r=[],a=1/0,n=-1/0;for(let e of E.current){if(!e){r.push(-1/0);continue}let i=e.getBoundingClientRect();r.push(i.right-t.left),i.width<=0||(a=Math.min(a,i.left-t.left),n=Math.max(n,i.right-t.left))}return Number.isFinite(a)&&Number.isFinite(n)?{frontStart:n+40,wordLeft:a,rights:r}:null})();if(!c)return!1;if(a=c,r||g)return!0;try{let c=d(E.current,t,p,x);if(0===c.count)return!0;q.current=(r=function(e,t,r){if(!function(){try{let e=document.createElement("canvas");return!!(e.getContext("webgl2")||e.getContext("webgl")||e.getContext("experimental-webgl"))}catch{return!1}}())throw Error("WebGL unavailable");if(!(r.frontSpeed>0))throw Error("frontSpeed must be > 0");let a=new s.Renderer({width:r.width,height:r.height,dpr:r.dpr,alpha:!0,premultipliedAlpha:!0,depth:!1,antialias:!1,powerPreference:"high-performance"}),c=a.gl;if(c.isContextLost())throw Error("context lost at init");c.clearColor(0,0,0,0);let d=c.canvas;d.style.display="block",d.style.position="absolute",d.style.top="0",d.style.left="0",d.style.pointerEvents="none",e.appendChild(d);let h=e=>new n.Geometry(c,{aHome:{size:2,data:e.home},aTint:{size:1,data:e.tint},aRand:{size:4,data:e.rand},aRand2:{size:4,data:e.rand2},aEdge:{size:2,data:e.edge}}),f={uTime:{value:0},uFrontStart:{value:r.frontStart},uFrontSpeed:{value:r.frontSpeed},uResolution:{value:new Float32Array([r.width,r.height])},uDpr:{value:r.dpr},uWind:{value:r.params.wind},uBuoy:{value:r.params.buoyancy},uTurb:{value:r.params.turbulence},uGrainSize:{value:r.params.grainSize},uInk:{value:new Float32Array(r.params.ink)},uAccent:{value:new Float32Array(r.params.accent)}},p=new l.Program(c,{vertex:o,fragment:u,uniforms:f,transparent:!0,depthTest:!1,depthWrite:!1});if(!c.getProgramParameter(p.program,c.LINK_STATUS))throw Error("dust shader failed to link");let m=h(t),g=new i.Mesh(c,{geometry:m,program:p,mode:c.POINTS}),v=!1;return{gl:c,canvas:d,setSize(e,t,r){v||(a.dpr=r,a.setSize(e,t),f.uResolution.value[0]=e,f.uResolution.value[1]=t,f.uDpr.value=r)},setGrains(e){if(v||0===e.count)return;let t=m;m=h(e),g=new i.Mesh(c,{geometry:m,program:p,mode:c.POINTS}),t.remove()},setFront(e,t){!v&&t>0&&(f.uFrontStart.value=e,f.uFrontSpeed.value=t)},setParams(e){v||(f.uWind.value=e.wind,f.uBuoy.value=e.buoyancy,f.uTurb.value=e.turbulence,f.uGrainSize.value=e.grainSize,f.uInk.value.set(e.ink),f.uAccent.value.set(e.accent))},render(e){v||(f.uTime.value=e,a.render({scene:g}))},dispose(){v||(v=!0,m.remove(),d.remove(),c.getExtension("WEBGL_lose_context")?.loseContext())}}}(e,c,{width:t.width,height:t.height,dpr:Math.min(2,window.devicePixelRatio||1),frontStart:a.frontStart,frontSpeed:(a.frontStart-(a.wordLeft-30))/Math.max(.1,O.current.sweepDuration),params:L.current})).gl,r.render(0)}catch{g=!0,r=null}return!0};return I.current=t=>{let a=null!==r;if(y()&&(r?.setSize(t.width,t.height,t.dpr),a)){let t=e.getBoundingClientRect();r?.setGrains(d(E.current,t,p,x))}},D.current=e=>{if(!a&&!y()||!a)return!1;let{sweepDuration:t,reveal:n,autoplay:i,replayDelay:l}=O.current,s=c+=e,o=Math.max(.1,t),u=(a.frontStart-(a.wordLeft-30))/o;r?.setFront(a.frontStart,u),r?.setParams(L.current);let d=.937*o,p=d+1.17,m=p+.95,g=.1*u,x=a.frontStart-u*s;for(let e=0;e<E.current.length;e++){let t=E.current[e];t&&x<a.rights[e]-g&&"hidden"!==t.style.visibility&&(t.style.visibility="hidden")}if("none"!==n){let e,t=(e=h((s-d)/.9))<.5?2*e*e:1-(-2*e+2)*(-2*e+2)/2,r=N.current,a=j.current;if(r&&a){let e="split"===n?100*t:0,i="split"===n?"1":String(1-t);r.style.transform=`translateY(${-e}%)`,a.style.transform=`translateY(${e}%)`,r.style.opacity=i,a.style.opacity=i}}let w=h((s-p)/.85);if(r&&(r.canvas.style.opacity=String(1-w*w)),r?.render(s),s>=m){if(f||(f=!0,G.current?.()),!i||l<=0)return!1;s>=m+l&&v()}},(async()=>{try{await document.fonts.ready}catch{}t||(m=!0,y(),_.resize(),_.start())})(),()=>{t=!0,D.current=null,I.current=null,P.current=null,q.current=null,r?.dispose(),r=null}},[B,p,x,A,_]),(0,r.useEffect)(()=>{b&&(P.current?.(),_.start())},[b,_]),(0,r.useEffect)(()=>{_.paint()},[m,g,v,y,k,S,w,_]);let W="none"===w?null:(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("div",{ref:N,"aria-hidden":!0,className:"absolute inset-x-0 top-0",style:{height:"calc(50% + 1px)",background:T}}),(0,t.jsx)("div",{ref:j,"aria-hidden":!0,className:"absolute inset-x-0 bottom-0 h-1/2",style:{background:T}})]});return(0,t.jsxs)("div",{ref:M,role:"img","aria-label":e,className:["@container relative size-full overflow-hidden",z??""].join(" "),children:[W,(0,t.jsx)("div",{"aria-hidden":!0,className:"absolute inset-0 flex items-center justify-center",children:(0,t.jsx)("span",{className:"font-sans font-bold whitespace-pre tracking-[0.02em]",style:{fontSize:`clamp(0.75rem, ${(120/Math.max(1,B.length)).toFixed(2)}cqw, 7rem)`},children:B.map((e,r)=>(0,t.jsx)("span",{ref:e=>{E.current[r]=e},style:{color:r<x?k:S},children:e},r))})}),b||A?null:(0,t.jsx)("button",{type:"button",onClick:()=>{P.current?.(),_.start()},className:"absolute right-4 bottom-4 z-10 cursor-pointer rounded-full border px-4 py-1.5 text-[10px] tracking-[0.2em] uppercase opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2",style:{color:k,borderColor:`${k}33`,outlineColor:S},children:"Replay"})]})});function p(){return(0,t.jsxs)("div",{className:"absolute inset-0 flex flex-col justify-between overflow-hidden bg-surface p-6",children:[(0,t.jsx)("div",{"aria-hidden":!0,className:"absolute inset-0 opacity-[0.07]",style:{backgroundImage:"linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",backgroundSize:"48px 48px"}}),(0,t.jsxs)("div",{className:"relative flex items-center justify-between",children:[(0,t.jsx)("span",{className:"font-display text-[10px] tracking-[0.3em] text-ink uppercase",children:"Motion Garden"}),(0,t.jsx)("span",{className:"font-display text-[10px] tracking-[0.3em] text-ink-mute uppercase",children:"Work · Studio · Contact"})]}),(0,t.jsxs)("div",{className:"relative max-w-[34ch]",children:[(0,t.jsx)("p",{className:"font-display text-[10px] tracking-[0.3em] text-accent uppercase",children:"Est. in the shadows"}),(0,t.jsx)("h2",{className:"mt-3 text-3xl leading-[1.05] font-semibold text-balance text-ink sm:text-4xl",children:"The ones who move unseen."}),(0,t.jsx)("p",{className:"mt-3 text-sm text-ink-dim",children:"An interface should arrive the way a good entrance does — decided before anyone noticed it starting."}),(0,t.jsxs)("div",{className:"mt-5 flex gap-2",children:[(0,t.jsx)("span",{className:"rounded-full bg-accent px-4 py-1.5 font-display text-[10px] tracking-[0.2em] text-on-accent uppercase",children:"Enter"}),(0,t.jsx)("span",{className:"rounded-full border border-hairline px-4 py-1.5 font-display text-[10px] tracking-[0.2em] text-ink-dim uppercase",children:"Read on"})]})]}),(0,t.jsxs)("div",{className:"relative flex justify-between font-display text-[9px] tracking-[0.28em] text-ink-mute uppercase",children:[(0,t.jsx)("span",{children:"01 — Arrival"}),(0,t.jsx)("span",{children:"Scroll"})]})]})}f.displayName="IntroAnimation",e.s(["default",0,function({values:e,reducedMotion:r,paused:a}){return(0,t.jsxs)("div",{className:"relative h-full w-full overflow-hidden",children:[(0,t.jsx)(p,{}),(0,t.jsx)("div",{className:"absolute inset-0",children:(0,t.jsx)(f,{text:"MOTIONGARDEN",sweepDuration:e.sweepDuration,grainDensity:e.grainDensity,windSpeed:e.windSpeed,buoyancy:e.buoyancy,turbulence:e.turbulence,grainSize:e.grainSize,splitIndex:e.splitIndex,reveal:e.reveal,autoplay:e.autoplay,replayDelay:e.replayDelay,inkColor:e.inkColor,accentColor:e.accentColor,backgroundColor:e.backgroundColor,paused:a,reducedMotion:r})})]})}],457435)},507148,function(e){e.n(e.i(457435))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let a=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{a.current=e});let n=(0,t.useRef)(null),i=(0,t.useRef)(null),l=(0,t.useRef)(!1),s=(0,t.useRef)(!1),o=(0,t.useRef)(0),u=(0,t.useRef)(0),c=(0,t.useRef)(0),d=(0,t.useCallback)(()=>{let e=a.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=a.current.dpr??"auto",n=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:n,bufferWidth:Math.max(1,Math.round(t.width*n)),bufferHeight:Math.max(1,Math.round(t.height*n))}},[]),h=(0,t.useCallback)(function e(t){if(s.current)return;0===o.current&&(o.current=t);let i=0===u.current?0:Math.min((t-u.current)/1e3,r);u.current=t;let d={now:t,dt:i,elapsed:(t-o.current)/1e3,frame:c.current++},h=a.current.onFrame?.(d);if(!s.current){if(!1===h||a.current.halted){l.current=!1,n.current=null;return}n.current=requestAnimationFrame(e)}},[]),f=(0,t.useCallback)(()=>{s.current||l.current||(l.current=!0,u.current=0,n.current=requestAnimationFrame(h))},[h]),p=(0,t.useCallback)(()=>{l.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null)},[]),m=(0,t.useCallback)(()=>f(),[f]),g=(0,t.useCallback)(()=>{let e=d();e&&(a.current.onResize?.(e),!1!==a.current.paintWhenHalted?m():a.current.halted||f())},[d,m,f]),v=e.deps??[];(0,t.useEffect)(()=>{s.current=!1;let e=a.current.target.current;if(!e)return;let t=()=>{s.current||g()},r=new ResizeObserver(()=>{let e=a.current.resizeDebounceMs??0;e<=0?t():(null!==i.current&&clearTimeout(i.current),i.current=setTimeout(()=>{i.current=null,t()},e))});return r.observe(e),g(),a.current.halted||f(),()=>{s.current=!0,l.current=!1,null!==n.current&&(cancelAnimationFrame(n.current),n.current=null),null!==i.current&&(clearTimeout(i.current),i.current=null),r.disconnect(),a.current.onDispose?.();let e=a.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),o.current=0,u.current=0,c.current=0}},v);let y=e.halted??!1;return(0,t.useEffect)(()=>{y||f()},[y,f]),(0,t.useMemo)(()=>({start:f,stop:p,paint:m,resize:g,get running(){return l.current}}),[f,p,m,g])}])}]);