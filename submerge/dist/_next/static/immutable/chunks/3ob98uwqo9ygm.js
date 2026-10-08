(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,314879,e=>{"use strict";var t=e.i(843476),r=e.i(271645),i=e.i(221663),s=e.i(956850),a=e.i(80075),n=e.i(753604),l=e.i(994964),h=e.i(562611),u=e.i(450922);let o={"65k":256,"262k":512,"1M":1024},g={ring:0,scatter:1,disc:2},f=e=>{let t=e.replace("#",""),r=3===t.length?t.split("").map(e=>e+e).join(""):t,i=parseInt(r,16);return Number.isNaN(i)||6!==r.length?[1,1,1]:[(i>>16&255)/255,(i>>8&255)/255,(255&i)/255]},d=`#version 300 es
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
}`,p=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform float uSpawn;
uniform float uJitter;
${c}

void main() {
  float r1 = hash21(vUv * 313.7 + uJitter);
  float r2 = hash21(vUv * 71.3 + uJitter + 19.0);
  vec2 pos;
  float ang;

  if (uSpawn < 0.5) {
    // A ring facing inward. The population collides with itself at the centre
    // and has to resolve the jam, which is what produces the first branches.
    float t = r1 * 6.283185307179586;
    pos = 0.5 + vec2(cos(t), sin(t)) * (0.36 + (r2 - 0.5) * 0.03);
    ang = t + 3.141592653589793;
  } else if (uSpawn < 1.5) {
    pos = vec2(r1, r2);
    ang = hash21(vUv * 97.1 + uJitter + 41.0) * 6.283185307179586;
  } else {
    // sqrt on the radius, or the disc packs everything into the middle — area
    // grows with r\xb2, so a uniform radius is not a uniform disc.
    float t = r1 * 6.283185307179586;
    pos = 0.5 + vec2(cos(t), sin(t)) * (sqrt(r2) * 0.3);
    ang = t;
  }

  fragColor = vec4(pos, ang, 1.0);
}`,m=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uAgents;
uniform sampler2D uTrail;
uniform float uDt;
uniform float uSpeed;
uniform float uSensorDist;
uniform float uSensorAngle;
uniform float uTurn;
uniform float uWander;
uniform float uSeed;
${c}

float sense(vec2 pos, float ang, float dist) {
  return texture(uTrail, pos + vec2(cos(ang), sin(ang)) * dist).r;
}

void main() {
  vec4 a = texture(uAgents, vUv);
  vec2 pos = a.xy;
  float ang = a.z;

  float c = sense(pos, ang, uSensorDist);
  float l = sense(pos, ang + uSensorAngle, uSensorDist);
  float r = sense(pos, ang - uSensorAngle, uSensorDist);

  float turn = uTurn * uDt;

  if (c > l && c > r) {
    // Straight on. Doing nothing here is what makes a trail a trail.
  } else if (c < l && c < r) {
    // Both flanks beat the centre: the agent is straddling a ridge and there is
    // no correct answer. A deterministic tie-break would send every straddling
    // agent the same way and the field would grow a grain; a coin flip is the
    // only thing that keeps the network isotropic.
    ang += (hash21(vUv * 511.0 + uSeed) - 0.5) * 2.0 * turn;
  } else if (l > r) {
    ang += turn;
  } else if (r > l) {
    ang -= turn;
  }

  // Wander. Trail-following is pure positive feedback — a vein that wins takes
  // the agents that would have kept its rivals alive, so left alone the colony
  // converges onto two or three trunks and the rest of the field goes black.
  // That collapse is real slime-mould behaviour and it is also a dead
  // background, so the agents are given the noise a real one has: a small random
  // walk on the heading that constantly leaks explorers off the trunk roads into
  // empty space, where they seed the next generation of branches. Exploration
  // against exploitation, and it is the reason this never settles.
  ang += (hash21(vUv * 733.0 + uSeed * 1.7) - 0.5) * 2.0 * uWander * uDt;

  // No term here steers toward the pointer. The attractant is laid into the
  // trail map as food and the colony has to *find* it — sensors pick up the
  // gradient diffusion spreads out from it, and the veins thicken toward your
  // cursor over a few seconds the way they would toward an oat flake. A direct
  // heading force would be instantaneous and would make this a brush.

  // Headings integrate forever. Left unbounded the accumulated angle outgrows
  // float32's fraction and the turn quantises into visible steps after a few
  // minutes on screen — the drift is slow enough to look like a design choice.
  ang = mod(ang, 6.283185307179586);

  pos = fract(pos + vec2(cos(ang), sin(ang)) * uSpeed * uDt);

  fragColor = vec4(pos, ang, 1.0);
}`,E=`#version 300 es
precision highp float;
out vec4 fragColor;
void main() { fragColor = vec4(0.0, 0.0, 0.0, 1.0); }`,T=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTrail;
uniform vec2  uTexel;
uniform float uDecay;
uniform float uDiffuse;
uniform vec2  uPointer;
uniform float uFood;
uniform float uFoodRadius;

void main() {
  float sum = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      sum += texture(uTrail, vUv + vec2(float(x), float(y)) * uTexel).r;
    }
  }
  float here = texture(uTrail, vUv).r;

  // The food source, folded into the pass that already walks every cell rather
  // than costing a draw of its own. Shortest path across the seam, because the
  // field is a torus and a cell at the left edge is adjacent to the right one.
  float food = 0.0;
  if (uFood > 0.0) {
    vec2 d = vUv - uPointer;
    d -= round(d);
    food = uFood * (1.0 - smoothstep(0.0, uFoodRadius, length(d)));
  }
  // Saturating, not unbounded. Deposit is the only source and decay the only
  // sink, so a cell settles at deposit/(1 - decay) — which for any deposit worth
  // seeing is far above one. Unclamped, that number runs to the hundreds and
  // every tone map flattens the whole field to one colour. Clamped, the ratio
  // instead decides *where* the ceiling is reached: a vein carrying fifty agents
  // pins at 1 while open ground a few texels away sits near 0.05, and the
  // structure is legible because it is spatial rather than magnitudinal.
  fragColor = vec4(clamp(mix(here, sum / 9.0, uDiffuse) * uDecay + food, 0.0, 1.0), 0.0, 0.0, 1.0);
}`,v=`#version 300 es
in float aIndex;
uniform sampler2D uAgents;
uniform float uSide;

void main() {
  float y = floor(aIndex / uSide);
  vec2 uv = (vec2(aIndex - y * uSide, y) + 0.5) / uSide;
  gl_Position = vec4(texture(uAgents, uv).xy * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}`,R=`#version 300 es
precision highp float;
out vec4 fragColor;
uniform float uDeposit;
void main() {
  // Alpha stays at zero. The blend is additive on every channel, so a nonzero
  // alpha here would ramp the target's alpha toward infinity over a session for
  // a channel nothing ever reads.
  fragColor = vec4(uDeposit, 0.0, 0.0, 0.0);
}`,w=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTrail;
uniform vec2  uResolution;
uniform vec3  uInk;
uniform vec3  uBg;
uniform float uGlow;

void main() {
  float ar = uResolution.x / max(uResolution.y, 1.0);
  // Cover, not stretch. The field is square and the container is not; stretching
  // turns every strand into an ellipse and the anisotropy reads as a bug.
  vec2 k = ar > 1.0 ? vec2(1.0, 1.0 / ar) : vec2(ar, 1.0);
  float t = texture(uTrail, (vUv - 0.5) * k + 0.5).r;

  // The interesting range of a saturating field is its bottom: a fresh strand
  // sits near zero and a trunk sits near one, so a linear ramp spends most of
  // the palette on ground that is merely warm. The curve lifts the faint end
  // and leaves headroom at the top for the glow to mean something.
  float v = 1.0 - exp(-t * 3.4);

  vec3 col = mix(uBg, uInk, v);
  col += uInk * pow(v, 3.0) * uGlow;

  fragColor = vec4(col, 1.0);
}`,A=(0,r.memo)(({agentCount:e="1M",speed:c=55,sensorDistance:A=7,sensorAngle:x=24,turnSpeed:_=24,wander:D=13,decay:y=.97,diffuse:S=.35,deposit:F=.03,attract:b=.6,spawn:N="scatter",trailColor:U="#a855f7",background:P="#07060c",glow:C=.8,paused:M=!1,reducedMotion:B=!1,className:I})=>{let k=(0,r.useRef)(null),L=(0,r.useRef)(null),O=(0,r.useRef)(null),G=(0,r.useRef)(null),X=(0,r.useRef)(!0),H=(0,r.useRef)({x:.5,y:.5,on:!1}),[W,Y]=(0,r.useState)(!1),z=(0,u.useAnimationLoop)({target:k,halted:M||B,dpr:"auto",onResize:e=>O.current?.(e),onFrame:({dt:e})=>!!L.current&&L.current(e),gl:()=>G.current}),j=(0,r.useRef)({speed:c,sensorDistance:A,sensorAngle:x,turnSpeed:_,wander:D,decay:y,diffuse:S,deposit:F,attract:b,spawn:N,trailColor:U,background:P,glow:C});j.current={speed:c,sensorDistance:A,sensorAngle:x,turnSpeed:_,wander:D,decay:y,diffuse:S,deposit:F,attract:b,spawn:N,trailColor:U,background:P,glow:C};let q=(0,r.useRef)(null);(0,r.useEffect)(()=>{let t,r=k.current;if(W||!r)return;let u=o[e]??1024,b=u*u;try{if(!(t=new i.Renderer({webgl:2,alpha:!1,antialias:!1,powerPreference:"high-performance",dpr:Math.min(window.devicePixelRatio||1,2)})).gl.getExtension("EXT_color_buffer_float"))throw Error("Mycelium requires EXT_color_buffer_float")}catch{Y(!0);return}let M=t.gl;G.current=M;let B=M.canvas;B.style.display="block",B.style.position="absolute",B.style.top="0",B.style.left="0",r.appendChild(B);let I=()=>new h.RenderTarget(M,{width:1024,height:1024,depth:!1,type:M.HALF_FLOAT,format:M.RGBA,internalFormat:M.RGBA16F,minFilter:M.LINEAR,magFilter:M.LINEAR,wrapS:M.REPEAT,wrapT:M.REPEAT}),J=()=>new h.RenderTarget(M,{width:u,height:u,depth:!1,type:M.FLOAT,format:M.RGBA,internalFormat:M.RGBA32F,minFilter:M.NEAREST,magFilter:M.NEAREST,wrapS:M.CLAMP_TO_EDGE,wrapT:M.CLAMP_TO_EDGE}),$=I(),K=I(),V=J(),Q=J(),Z=new n.Triangle(M),ee=new Float32Array(b);for(let e=0;e<b;e++)ee[e]=e;let et=new l.Geometry(M,{aIndex:{size:1,data:ee}}),er=new s.Program(M,{vertex:d,fragment:p,depthTest:!1,depthWrite:!1,uniforms:{uSpawn:{value:g[N]??0},uJitter:{value:0}}}),ei=new s.Program(M,{vertex:d,fragment:m,depthTest:!1,depthWrite:!1,uniforms:{uAgents:{value:V.texture},uTrail:{value:$.texture},uDt:{value:0},uSpeed:{value:c/1024},uSensorDist:{value:A/1024},uSensorAngle:{value:x*Math.PI/180},uTurn:{value:_},uWander:{value:D},uSeed:{value:0}}}),es=new s.Program(M,{vertex:d,fragment:T,depthTest:!1,depthWrite:!1,uniforms:{uTrail:{value:$.texture},uTexel:{value:new Float32Array([9765625e-10,9765625e-10])},uDecay:{value:y},uDiffuse:{value:S},uPointer:{value:new Float32Array([.5,.5])},uFood:{value:0},uFoodRadius:{value:.055}}}),ea=new s.Program(M,{vertex:v,fragment:R,depthTest:!1,depthWrite:!1,transparent:!0,uniforms:{uAgents:{value:V.texture},uSide:{value:u},uDeposit:{value:F}}});ea.setBlendFunc(M.ONE,M.ONE);let en=new s.Program(M,{vertex:d,fragment:w,depthTest:!1,depthWrite:!1,uniforms:{uTrail:{value:$.texture},uResolution:{value:new Float32Array([1,1])},uInk:{value:new Float32Array(f(U))},uBg:{value:new Float32Array(f(P))},uGlow:{value:C}}}),el=new s.Program(M,{vertex:d,fragment:E,depthTest:!1,depthWrite:!1}),eh=new a.Mesh(M,{geometry:Z,program:el}),eu=new a.Mesh(M,{geometry:Z,program:er}),eo=new a.Mesh(M,{geometry:Z,program:ei}),eg=new a.Mesh(M,{geometry:Z,program:es}),ef=new a.Mesh(M,{geometry:Z,program:en}),ed=new a.Mesh(M,{geometry:et,program:ea,mode:M.POINTS,frustumCulled:!1}),ec=er.uniforms,ep=ei.uniforms,em=es.uniforms,eE=ea.uniforms,eT=en.uniforms,ev=0,eR=0,ew=()=>{ec.uSpawn.value=g[j.current.spawn]??0,ec.uJitter.value=ev,ev=(ev+17.13)%991,t.render({scene:eu,target:V}),t.render({scene:eu,target:Q}),t.render({scene:eh,target:$}),t.render({scene:eh,target:K})},eA=()=>{let e=j.current;eT.uTrail.value=$.texture,eT.uInk.value.set(f(e.trailColor)),eT.uBg.value.set(f(e.background)),eT.uGlow.value=e.glow,t.render({scene:ef})},ex=0,e_=1/60,eD=e=>{let r=j.current;ex++,eR=(eR+.6180339887)%1,ep.uAgents.value=V.texture,ep.uTrail.value=$.texture,ep.uDt.value=e,ep.uSpeed.value=r.speed/1024,ep.uSensorDist.value=r.sensorDistance/1024,ep.uSensorAngle.value=r.sensorAngle*Math.PI/180,ep.uTurn.value=r.turnSpeed,ep.uWander.value=r.wander,ep.uSeed.value=eR,t.render({scene:eo,target:Q});let i=V;V=Q,Q=i,em.uTrail.value=$.texture,em.uDecay.value=Math.pow(r.decay,60*e),em.uDiffuse.value=r.diffuse,em.uFood.value=H.current.on?.09*r.attract*e*60:0;let s=em.uPointer.value;s[0]=H.current.x,s[1]=H.current.y,t.render({scene:eg,target:K}),eE.uAgents.value=V.texture,eE.uDeposit.value=r.deposit*e*60,t.render({scene:ed,target:K,clear:!1}),i=$,$=K,K=i};return q.current=()=>{if(ex>=150)return;if(X.current&&(ew(),X.current=!1),e_>.05)return void eA();let e=performance.now()+300;for(;ex<150&&performance.now()<e;)eD(1/60);eA()},L.current=e=>{X.current&&(ew(),X.current=!1),e_=e>0?e:e_,eD(Math.min(e,1/30)),eA()},O.current=({width:e,height:r,dpr:i})=>{t.dpr=i,t.setSize(Math.max(1,Math.floor(e)),Math.max(1,Math.floor(r)));let s=eT.uResolution.value;s[0]=M.drawingBufferWidth,s[1]=M.drawingBufferHeight,eA()},z.resize(),z.start(),()=>{L.current=null,O.current=null,r.contains(B)&&r.removeChild(B)}},[W,e]),(0,r.useEffect)(()=>{(M||B)&&q.current?.()},[M,B]),(0,r.useEffect)(()=>{X.current=!0,z.paint()},[N,z]),(0,r.useEffect)(()=>{z.paint()},[U,P,C,z]);let J=()=>{H.current.on=!1};return W?(0,t.jsx)("div",{className:I??"relative h-full w-full overflow-hidden",style:{backgroundColor:P,backgroundImage:`radial-gradient(ellipse 40% 22% at 34% 42%, ${U}3a 0%, transparent 70%), radial-gradient(ellipse 30% 34% at 66% 58%, ${U}2e 0%, transparent 70%), radial-gradient(circle at 50% 50%, ${U}22 0%, transparent 62%)`}}):(0,t.jsx)("div",{ref:k,className:`[&_canvas]:touch-none ${I??"relative h-full w-full overflow-hidden"}`,onPointerMove:e=>{if(B)return;let t=e.currentTarget.getBoundingClientRect();if(0===t.width||0===t.height)return;let r=(e.clientX-t.left)/t.width,i=1-(e.clientY-t.top)/t.height,s=t.width/t.height;H.current.x=(r-.5)*(s>1?1:s)+.5,H.current.y=(i-.5)*(s>1?1/s:1)+.5,H.current.on=!0,z.start()},onPointerLeave:J,onPointerCancel:J})});A.displayName="Mycelium",e.s(["default",0,function({values:e,reducedMotion:r,paused:i}){return(0,t.jsx)(A,{agentCount:e.agentCount,speed:e.speed,sensorDistance:e.sensorDistance,sensorAngle:e.sensorAngle,turnSpeed:e.turnSpeed,wander:e.wander,decay:e.decay,diffuse:e.diffuse,deposit:e.deposit,attract:e.attract,spawn:e.spawn,trailColor:e.trailColor,background:e.background,glow:e.glow,paused:i,reducedMotion:r})}],314879)},875455,function(e){e.n(e.i(314879))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let i=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{i.current=e});let s=(0,t.useRef)(null),a=(0,t.useRef)(null),n=(0,t.useRef)(!1),l=(0,t.useRef)(!1),h=(0,t.useRef)(0),u=(0,t.useRef)(0),o=(0,t.useRef)(0),g=(0,t.useCallback)(()=>{let e=i.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=i.current.dpr??"auto",s=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:s,bufferWidth:Math.max(1,Math.round(t.width*s)),bufferHeight:Math.max(1,Math.round(t.height*s))}},[]),f=(0,t.useCallback)(function e(t){if(l.current)return;0===h.current&&(h.current=t);let a=0===u.current?0:Math.min((t-u.current)/1e3,r);u.current=t;let g={now:t,dt:a,elapsed:(t-h.current)/1e3,frame:o.current++},f=i.current.onFrame?.(g);if(!l.current){if(!1===f||i.current.halted){n.current=!1,s.current=null;return}s.current=requestAnimationFrame(e)}},[]),d=(0,t.useCallback)(()=>{l.current||n.current||(n.current=!0,u.current=0,s.current=requestAnimationFrame(f))},[f]),c=(0,t.useCallback)(()=>{n.current=!1,null!==s.current&&(cancelAnimationFrame(s.current),s.current=null)},[]),p=(0,t.useCallback)(()=>d(),[d]),m=(0,t.useCallback)(()=>{let e=g();e&&(i.current.onResize?.(e),!1!==i.current.paintWhenHalted?p():i.current.halted||d())},[g,p,d]),E=e.deps??[];(0,t.useEffect)(()=>{l.current=!1;let e=i.current.target.current;if(!e)return;let t=()=>{l.current||m()},r=new ResizeObserver(()=>{let e=i.current.resizeDebounceMs??0;e<=0?t():(null!==a.current&&clearTimeout(a.current),a.current=setTimeout(()=>{a.current=null,t()},e))});return r.observe(e),m(),i.current.halted||d(),()=>{l.current=!0,n.current=!1,null!==s.current&&(cancelAnimationFrame(s.current),s.current=null),null!==a.current&&(clearTimeout(a.current),a.current=null),r.disconnect(),i.current.onDispose?.();let e=i.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),h.current=0,u.current=0,o.current=0}},E);let T=e.halted??!1;return(0,t.useEffect)(()=>{T||d()},[T,d]),(0,t.useMemo)(()=>({start:d,stop:c,paint:p,resize:m,get running(){return n.current}}),[d,c,p,m])}])},562611,e=>{"use strict";var t=e.i(899925);e.s(["RenderTarget",0,class{constructor(e,{width:r=e.canvas.width,height:i=e.canvas.height,target:s=e.FRAMEBUFFER,color:a=1,depth:n=!0,stencil:l=!1,depthTexture:h=!1,wrapS:u=e.CLAMP_TO_EDGE,wrapT:o=e.CLAMP_TO_EDGE,wrapR:g=e.CLAMP_TO_EDGE,minFilter:f=e.LINEAR,magFilter:d=f,type:c=e.UNSIGNED_BYTE,format:p=e.RGBA,internalFormat:m=p,unpackAlignment:E,premultiplyAlpha:T}={}){this.gl=e,this.width=r,this.height=i,this.depth=n,this.stencil=l,this.buffer=this.gl.createFramebuffer(),this.target=s,this.gl.renderer.bindFramebuffer(this),this.textures=[];const v=[];for(let s=0;s<a;s++)this.textures.push(new t.Texture(e,{width:r,height:i,wrapS:u,wrapT:o,wrapR:g,minFilter:f,magFilter:d,type:c,format:p,internalFormat:m,unpackAlignment:E,premultiplyAlpha:T,flipY:!1,generateMipmaps:!1})),this.textures[s].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+s,this.gl.TEXTURE_2D,this.textures[s].texture,0),v.push(this.gl.COLOR_ATTACHMENT0+s);v.length>1&&this.gl.renderer.drawBuffers(v),this.texture=this.textures[0],h&&(this.gl.renderer.isWebgl2||this.gl.renderer.getExtension("WEBGL_depth_texture"))?(this.depthTexture=new t.Texture(e,{width:r,height:i,minFilter:this.gl.NEAREST,magFilter:this.gl.NEAREST,format:this.stencil?this.gl.DEPTH_STENCIL:this.gl.DEPTH_COMPONENT,internalFormat:e.renderer.isWebgl2?this.stencil?this.gl.DEPTH24_STENCIL8:this.gl.DEPTH_COMPONENT16:this.gl.DEPTH_COMPONENT,type:this.stencil?this.gl.UNSIGNED_INT_24_8:this.gl.UNSIGNED_INT}),this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.stencil?this.gl.DEPTH_STENCIL_ATTACHMENT:this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(n&&!l&&(this.depthBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.RENDERBUFFER,this.depthBuffer)),l&&!n&&(this.stencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.stencilBuffer)),n&&l&&(this.depthStencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.depthStencilBuffer))),this.gl.renderer.bindFramebuffer({target:this.target})}setSize(e,t){if(this.width!==e||this.height!==t){this.width=e,this.height=t,this.gl.renderer.bindFramebuffer(this);for(let r=0;r<this.textures.length;r++)this.textures[r].width=e,this.textures[r].height=t,this.textures[r].needsUpdate=!0,this.textures[r].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+r,this.gl.TEXTURE_2D,this.textures[r].texture,0);this.depthTexture?(this.depthTexture.width=e,this.depthTexture.height=t,this.depthTexture.needsUpdate=!0,this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(this.depthBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,e,t)),this.stencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,e,t)),this.depthStencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,e,t))),this.gl.renderer.bindFramebuffer({target:this.target})}}}])},899925,e=>{"use strict";let t=new Uint8Array(4),r=1;e.s(["Texture",0,class{constructor(e,{image:t,target:i=e.TEXTURE_2D,type:s=e.UNSIGNED_BYTE,format:a=e.RGBA,internalFormat:n=a,wrapS:l=e.CLAMP_TO_EDGE,wrapT:h=e.CLAMP_TO_EDGE,wrapR:u=e.CLAMP_TO_EDGE,generateMipmaps:o=i===(e.TEXTURE_2D||e.TEXTURE_CUBE_MAP),minFilter:g=o?e.NEAREST_MIPMAP_LINEAR:e.LINEAR,magFilter:f=e.LINEAR,premultiplyAlpha:d=!1,unpackAlignment:c=4,flipY:p=i==(e.TEXTURE_2D||e.TEXTURE_3D),anisotropy:m=0,level:E=0,width:T,height:v=T,length:R=1}={}){this.gl=e,this.id=r++,this.image=t,this.target=i,this.type=s,this.format=a,this.internalFormat=n,this.minFilter=g,this.magFilter=f,this.wrapS=l,this.wrapT=h,this.wrapR=u,this.generateMipmaps=o,this.premultiplyAlpha=d,this.unpackAlignment=c,this.flipY=p,this.anisotropy=Math.min(m,this.gl.renderer.parameters.maxAnisotropy),this.level=E,this.width=T,this.height=v,this.length=R,this.texture=this.gl.createTexture(),this.store={image:null},this.glState=this.gl.renderer.state,this.state={},this.state.minFilter=this.gl.NEAREST_MIPMAP_LINEAR,this.state.magFilter=this.gl.LINEAR,this.state.wrapS=this.gl.REPEAT,this.state.wrapT=this.gl.REPEAT,this.state.anisotropy=0}bind(){this.glState.textureUnits[this.glState.activeTextureUnit]!==this.id&&(this.gl.bindTexture(this.target,this.texture),this.glState.textureUnits[this.glState.activeTextureUnit]=this.id)}update(e=0){let r=!(this.image===this.store.image&&!this.needsUpdate);if((r||this.glState.textureUnits[e]!==this.id)&&(this.gl.renderer.activeTexture(e),this.bind()),r){if(this.needsUpdate=!1,this.flipY!==this.glState.flipY&&(this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL,this.flipY),this.glState.flipY=this.flipY),this.premultiplyAlpha!==this.glState.premultiplyAlpha&&(this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),this.glState.premultiplyAlpha=this.premultiplyAlpha),this.unpackAlignment!==this.glState.unpackAlignment&&(this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT,this.unpackAlignment),this.glState.unpackAlignment=this.unpackAlignment),this.minFilter!==this.state.minFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MIN_FILTER,this.minFilter),this.state.minFilter=this.minFilter),this.magFilter!==this.state.magFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MAG_FILTER,this.magFilter),this.state.magFilter=this.magFilter),this.wrapS!==this.state.wrapS&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_S,this.wrapS),this.state.wrapS=this.wrapS),this.wrapT!==this.state.wrapT&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_T,this.wrapT),this.state.wrapT=this.wrapT),this.wrapR!==this.state.wrapR&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_R,this.wrapR),this.state.wrapR=this.wrapR),this.anisotropy&&this.anisotropy!==this.state.anisotropy&&(this.gl.texParameterf(this.target,this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT,this.anisotropy),this.state.anisotropy=this.anisotropy),this.image){if(this.image.width&&(this.width=this.image.width,this.height=this.image.height),this.target===this.gl.TEXTURE_CUBE_MAP)for(let e=0;e<6;e++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+e,this.level,this.internalFormat,this.format,this.type,this.image[e]);else if(ArrayBuffer.isView(this.image))this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,this.image):(this.target===this.gl.TEXTURE_2D_ARRAY||this.target===this.gl.TEXTURE_3D)&&this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);else if(this.image.isCompressedTexture)for(let e=0;e<this.image.length;e++)this.gl.compressedTexImage2D(this.target,e,this.internalFormat,this.image[e].width,this.image[e].height,0,this.image[e].data);else this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.format,this.type,this.image):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);if(this.generateMipmaps){var i,s;this.gl.renderer.isWebgl2||((i=this.image.width)&i-1)==0&&((s=this.image.height)&s-1)==0?this.gl.generateMipmap(this.target):(this.generateMipmaps=!1,this.wrapS=this.wrapT=this.gl.CLAMP_TO_EDGE,this.minFilter=this.gl.LINEAR)}this.onUpdate&&this.onUpdate()}else if(this.target===this.gl.TEXTURE_CUBE_MAP)for(let e=0;e<6;e++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t);else this.width?this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,null):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,null):this.gl.texImage2D(this.target,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t);this.store.image=this.image}}}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);