(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,910869,e=>{"use strict";var t=e.i(843476),r=e.i(271645),i=e.i(221663),a=e.i(956850),s=e.i(80075),n=e.i(753604),l=e.i(562611),o=e.i(647163),u=e.i(450922);function h(e){let t=e.replace("#","").trim();if(3===t.length&&(t=t.split("").map(e=>e+e).join("")),6!==t.length)return[.66,.33,.97];let r=parseInt(t,16);return Number.isNaN(r)?[.66,.33,.97]:[(r>>16&255)/255,(r>>8&255)/255,(255&r)/255]}let c={off:0,steps:1,disk:2,"min-r":3,"escape-dir":4,redshift:5},f=Math.PI/180,g=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = vec4(position, 0.0, 1.0);
}
`,m=`#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform vec3 uCamTarget;
uniform float uFocal;
uniform float uSteps;
uniform float uDiskInner;
uniform float uDiskOuter;
uniform float uDiskBrightness;
uniform float uDoppler;
uniform float uStarBright;
uniform float uSkyFloor;
uniform float uRotSpeed;
uniform vec3 uTint;
uniform vec3 uRingColor;
uniform float uDebug;
out vec4 fragColor;

const float RS = 1.0;
const float PI = 3.14159265;
const float TWO_PI = 6.28318530718;

float hash21(vec2 p) {
	p = fract(p * vec2(123.34, 345.45));
	p += dot(p, p + 34.345);
	return fract(p.x * p.y);
}
float hash31(vec3 p) {
	p = fract(p * 0.3183099 + 0.1);
	p *= 17.0;
	return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float vnoise(vec2 p) {
	vec2 i = floor(p), f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	float a = hash21(i);
	float b = hash21(i + vec2(1.0, 0.0));
	float c = hash21(i + vec2(0.0, 1.0));
	float d = hash21(i + vec2(1.0, 1.0));
	return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
	float s = 0.0, a = 0.5;
	for (int i = 0; i < 5; i++) {
		s += a * vnoise(p);
		p = p * 2.03 + 11.3;
		a *= 0.5;
	}
	return s;
}

// 3D value noise + fbm — used for the nebula so it stays seamless on the sphere
// (sampling 2D fbm by a direction vector distorts badly toward the poles).
float vnoise3(vec3 p) {
	vec3 i = floor(p), f = fract(p);
	vec3 u = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(
			mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), u.x),
			mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), u.x),
			u.y),
		mix(
			mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), u.x),
			mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), u.x),
			u.y),
		u.z);
}
float fbm3(vec3 p) {
	float s = 0.0, a = 0.5;
	for (int i = 0; i < 5; i++) {
		s += a * vnoise3(p);
		p = p * 2.02 + vec3(11.3, 17.1, 5.7);
		a *= 0.5;
	}
	return s;
}

// Continuous pseudo-blackbody: dark red -> orange -> warm white -> pale blue-white.
vec3 blackbody(float t) {
	vec3 c = mix(vec3(0.55, 0.06, 0.01), vec3(1.0, 0.42, 0.10), smoothstep(0.0, 0.55, t));
	c = mix(c, vec3(1.0, 0.86, 0.55), smoothstep(0.50, 1.05, t));
	c = mix(c, vec3(0.85, 0.92, 1.25), smoothstep(1.05, 1.90, t));
	return c;
}

// One colored star per grid cell, tight core falloff. Hue leans blue-white with
// a warm minority (warmBias raises the share of amber/gold stars).
vec3 starLayer(vec3 dir, float scale, float thresh, float warmBias) {
	vec3 p = dir * scale;
	vec3 id = floor(p);
	float h = hash31(id);
	if (h < thresh) return vec3(0.0);
	vec3 f = fract(p) - 0.5;
	float core = smoothstep(0.5, 0.0, length(f));
	core *= core;
	float bright = (h - thresh) / (1.0 - thresh);
	float hue = hash31(id + 3.7);
	vec3 cool = vec3(0.72, 0.82, 1.0);
	vec3 warm = vec3(1.0, 0.82, 0.60);
	vec3 sc = mix(cool, warm, smoothstep(0.62, 1.0, hue) * warmBias);
	return sc * core * bright;
}

// Domain-warped, dust-carved nebula graded across blue/indigo/magenta/teal,
// concentrated toward the galactic plane and biased a touch to the brand tint.
vec3 nebula(vec3 dir) {
	vec3 q = dir * 2.2;
	vec2 w = vec2(fbm3(q), fbm3(q + 4.7));
	float base = fbm3(q + 1.8 * vec3(w, 0.0));
	vec3 n = normalize(vec3(0.22, 1.0, 0.16));
	float band = exp(-dot(dir, n) * dot(dir, n) * 5.0);
	float cloud = smoothstep(0.42, 0.95, base) * (0.35 + 0.75 * band);
	float dust = fbm3(dir * 4.5 + 12.0);
	cloud *= 0.35 + 0.65 * smoothstep(0.25, 0.75, dust);
	float zone = fbm3(q * 0.55 + 2.0);
	vec3 deepBlue = vec3(0.05, 0.09, 0.26);
	vec3 indigo = vec3(0.16, 0.10, 0.42);
	vec3 magenta = vec3(0.42, 0.14, 0.46);
	vec3 teal = vec3(0.06, 0.24, 0.34);
	vec3 c = mix(deepBlue, indigo, smoothstep(0.30, 0.75, zone));
	c = mix(c, magenta, smoothstep(0.55, 0.95, base) * 0.7);
	c = mix(c, teal, smoothstep(0.60, 0.90, w.y) * 0.30);
	c = mix(c, uTint, 0.15);
	return c * cloud * 1.4;
}

vec3 starfield(vec3 dir) {
	vec3 col = nebula(dir);
	col += starLayer(dir, 55.0, 0.955, 0.5);
	col += starLayer(dir.zxy, 95.0, 0.958, 0.5) * 0.85;
	col += starLayer(dir.yzx, 150.0, 0.962, 0.4) * 0.7;
	col += starLayer(dir.xzy, 240.0, 0.972, 0.35) * 0.55;
	// rare hero stars with a soft bloom-ready glow
	vec3 hp = dir * 42.0;
	vec3 hid = floor(hp);
	if (hash31(hid + 7.3) > 0.9975) {
		float hd = length(fract(hp) - 0.5);
		float glow = smoothstep(0.5, 0.0, hd);
		vec3 hc = mix(vec3(0.70, 0.85, 1.0), vec3(1.0, 0.80, 0.60), hash31(hid + 1.1));
		col += hc * (glow * glow * 2.2 + smoothstep(0.35, 0.0, hd) * 0.6);
	}
	return col;
}

void main() {
	vec3 ro = uCamPos;
	vec3 fwd = normalize(uCamTarget - ro);
	vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
	vec3 up = cross(right, fwd);
	vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
	vec3 rd = normalize(p.x * right + p.y * up + uFocal * fwd);

	vec3 pos = ro;
	vec3 vel = rd;
	vec3 hvec = cross(pos, vel);
	float h2 = dot(hvec, hvec);

	vec3 col = vec3(0.0);
	float trans = 1.0;
	float minR = 1e5;
	float lastR = length(ro);
	float stepsUsed = 0.0;
	float lastG = 0.0;
	bool captured = false;

	for (int i = 0; i < 600; i++) {
		if (float(i) >= uSteps) break;
		stepsUsed += 1.0;
		float r = length(pos);
		r = max(r, 1e-4);
		minR = min(minR, r);
		if (r < 1.03 * RS) { captured = true; trans = 0.0; break; }
		if (r > 45.0 && dot(pos, vel) > 0.0) break;

		float r2 = r * r;
		vec3 acc = -1.5 * RS * h2 / (r2 * r2 * r) * pos;
		float dt = max(0.012, r * mix(0.02, 0.06, smoothstep(6.0, 20.0, r)));
		vec3 nvel = normalize(vel + acc * dt);
		vec3 npos = pos + nvel * dt;

		// Disk crossing (equatorial plane y = 0), analytically interpolated.
		if (pos.y * npos.y <= 0.0 && trans > 0.02) {
			float tt = abs(pos.y) / (abs(pos.y) + abs(npos.y) + 1e-5);
			vec3 X = mix(pos, npos, tt);
			float rc = length(X.xz);
			if (rc > uDiskInner && rc < uDiskOuter) {
				float ang = atan(X.z, X.x);
				float x = max(rc, 3.001);
				float flux = pow(x / 3.0, -3.0) * (1.0 - sqrt(3.0 / x));
				flux = max(flux, 0.0);
				float temp = pow(flux * 10.0, 0.25);

				// Differential Keplerian swirl drives the disk texture — but omega climbs
				// steeply toward the hole, so a raw (ang - uTime*omega) shears the noise a
				// little more every second, winding it into ever-finer radial structure that
				// aliases into a concentric moire. So: spin the texture at a rigid mid-radius
				// BULK rate and add the differential shear only through a saturating cap —
				// the first ~7s (at speed 1) of shear bakes in for the sheared-streak look,
				// then freezes. The mod on the bulk term + the exp cap keep ph bounded, so
				// cos/sin/noise stay precise for any runtime. Doppler & brightness below
				// still use the true ang/rc, so the orbital physics is unchanged.
				float omega = uRotSpeed * 1.1 * pow(3.0 / rc, 1.5);
				float omegaBulk = uRotSpeed * 1.1 * 0.35355339; // pow(3/6, 1.5) — rigid ref @ rc=6
				float tShear = 7.0 / max(uRotSpeed, 0.15);       // speed-independent baked shear
				float shear = (omega - omegaBulk) * tShear * (1.0 - exp(-uTime / tShear));
				float ph = ang - mod(uTime * omegaBulk, TWO_PI) - shear;
				vec2 qp = vec2(cos(ph), sin(ph)) * rc;
				float warp = fbm(qp * 0.35 + uTime * 0.05);
				float turb = fbm(qp * 0.8 + warp * 1.5);
				// Fine angular striations. ph is bounded by the capped shear above, so the
				// linear sampling can no longer grow into the precision moire.
				float streak = fbm(vec2(ph * 22.0, rc * 0.5));
				float laneMask = smoothstep(0.15, 0.6, turb);
				float detail = mix(1.0, turb, smoothstep(18.0, 4.0, rc));
				float I = flux * 11.0 * mix(0.6, 1.4, turb) * mix(0.7, 1.2, streak) * mix(0.6, 1.0, laneMask) * detail;
				float ig = (rc - 3.1) * 3.0;
				I += exp(-ig * ig) * 2.8;
				I *= smoothstep(uDiskOuter, uDiskOuter - 6.0, rc);

				// Relativity: Doppler beaming + gravitational redshift.
				float beta = min(sqrt(0.5 / rc), 0.95);
				float gamma = 1.0 / sqrt(1.0 - beta * beta);
				vec3 tdir = normalize(vec3(-sin(ang), 0.0, cos(ang)));
				vec3 rayDir = normalize(nvel);
				float D = 1.0 / max(gamma * (1.0 - dot(tdir * beta, rayDir)), 1e-3);
				D = clamp(D, 0.5, 2.2);
				float g = sqrt(max(1.0 - RS / rc, 1e-3));
				lastG = g;
				float shift = mix(1.0, D * g, uDoppler);
				float beam = mix(1.0, D * D * D * g, uDoppler);
				// Luminance-normalized ring tint: white is a no-op (keeps the
				// physical blackbody gradient + Doppler shift), any other hue
				// recolors the disk without dimming it.
				vec3 rc3 = uRingColor / max(dot(uRingColor, vec3(0.2126, 0.7152, 0.0722)), 1e-3);
				vec3 dcol = blackbody(temp * shift) * rc3 * I * beam;

				float op = mix(0.80, 0.90, smoothstep(13.0, 4.0, rc));
				op *= smoothstep(uDiskOuter, uDiskOuter - 6.0, rc);
				col += trans * dcol * uDiskBrightness;
				trans *= 1.0 - clamp(op, 0.0, 1.0);
			}
		}

		pos = npos;
		vel = nvel;
		lastR = r;
		if (trans < 0.02) break;
	}

	if (!captured) {
		vec3 bg = starfield(normalize(vel)) * uStarBright;
		bg += uSkyFloor * mix(vec3(0.10, 0.13, 0.28), uTint, 0.4);
		float dim = clamp((lastR - 1.03) * 0.45, 0.45, 1.0);
		col += trans * bg * dim;
	}

	int dbg = int(uDebug + 0.5);
	if (dbg == 1) col = vec3(stepsUsed / max(uSteps, 1.0));
	else if (dbg == 2) col = vec3(1.0 - trans);
	else if (dbg == 3) col = vec3(minR / 12.0);
	else if (dbg == 4) col = 0.5 + 0.5 * normalize(vel);
	else if (dbg == 5) col = vec3(lastG);

	if (any(isnan(col)) || any(isinf(col))) col = vec3(0.0);
	fragColor = vec4(max(col, 0.0), 1.0);
}
`,p=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D tMap;
uniform float uThreshold;
out vec4 fragColor;
void main() {
	vec3 c = texture(tMap, vUv).rgb;
	float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
	float w = smoothstep(uThreshold, uThreshold + 0.5, l);
	fragColor = vec4(c * w, 1.0);
}
`,d=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D tMap;
uniform vec2 uTexel;
uniform vec2 uDir;
uniform float uRadius;
out vec4 fragColor;
void main() {
	vec2 d = uTexel * uDir * uRadius;
	vec3 s = texture(tMap, vUv).rgb * 0.227027;
	s += texture(tMap, vUv + d * 1.3846).rgb * 0.316216;
	s += texture(tMap, vUv - d * 1.3846).rgb * 0.316216;
	s += texture(tMap, vUv + d * 3.2307).rgb * 0.070270;
	s += texture(tMap, vUv - d * 3.2307).rgb * 0.070270;
	fragColor = vec4(s, 1.0);
}
`,v=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform vec2 uRes;
uniform float uTime;
uniform float uBloomStrength;
uniform float uVignette;
uniform float uGrain;
uniform float uChroma;
out vec4 fragColor;

vec3 aces(vec3 x) {
	return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
float hash(vec2 p) {
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
	vec2 uv = vUv;
	vec2 dir = uv - 0.5;
	float ca = uChroma * 0.01 * dot(dir, dir);
	vec3 scene;
	scene.r = texture(tScene, uv + dir * ca).r;
	scene.g = texture(tScene, uv).g;
	scene.b = texture(tScene, uv - dir * ca).b;
	vec3 bloom = texture(tBloom, uv).rgb;
	vec3 hdr = (scene + bloom * uBloomStrength) * 0.95;
	vec3 col = aces(hdr);
	float aspect = uRes.x / max(uRes.y, 1.0);
	float v = smoothstep(1.30, 0.30, length(dir * vec2(aspect, 1.0)) * 1.15);
	col *= mix(1.0, v, uVignette);
	float g = hash(gl_FragCoord.xy + fract(uTime * 13.7) * 97.0) - 0.5;
	col += g * uGrain * (1.0 - 0.5 * dot(col, vec3(0.333)));
	fragColor = vec4(col, 1.0);
}
`,E=({steps:e=300,diskInner:E=3,diskOuter:T=12,diskBrightness:b=1,dopplerMax:x=1,starBrightness:R=1,skyFloor:w=.02,rotationSpeed:A=1,fov:D=85,bloomStrength:_=1,bloomRadius:S=1,vignette:y=.4,grain:F=.06,chromaticAberration:B=.15,autoOrbit:M=!0,debug:C="off",tint:N="#a855f7",ringColor:U="#ff9e38",paused:P=!1,maxDpr:I=1.5,fallbackSrc:k,className:L})=>{let z=(0,r.useRef)(null),O=(0,r.useRef)(null),G=(0,r.useRef)(null),X=(0,r.useRef)(null),H=(0,u.useAnimationLoop)({target:z,halted:!1,dpr:I,onResize:e=>G.current?.(e),onFrame:({now:e})=>!!O.current&&O.current(e),gl:()=>X.current}),W=(0,r.useRef)({steps:e,diskInner:E,diskOuter:T,diskBrightness:b,dopplerMax:x,starBrightness:R,skyFloor:w,rotationSpeed:A,fov:D,bloomStrength:_,bloomRadius:S,vignette:y,grain:F,chromaticAberration:B,autoOrbit:M,debug:C,tint:N,ringColor:U,paused:P});W.current={steps:e,diskInner:E,diskOuter:T,diskBrightness:b,dopplerMax:x,starBrightness:R,skyFloor:w,rotationSpeed:A,fov:D,bloomStrength:_,bloomRadius:S,vignette:y,grain:F,chromaticAberration:B,autoOrbit:M,debug:C,tint:N,ringColor:U,paused:P};let Y=(0,r.useRef)({r:16,inc:82,az:0,orbitAz:0,manualActive:!1,manualR:16,targetAz:0,targetInc:82,lastInteract:-1e9,spinDir:1}),[q,j]=(0,r.useState)(!1);return((0,r.useEffect)(()=>{(!("u"<typeof navigator)&&(/iPhone|iPad|iPod/.test(navigator.userAgent)||"MacIntel"===navigator.platform&&navigator.maxTouchPoints>1)||!function(){if("u"<typeof document)return!1;try{return!!document.createElement("canvas").getContext("webgl2")}catch{return!1}}())&&j(!0)},[]),(0,r.useEffect)(()=>{let t;if(q||!z.current)return;let r=z.current;try{let k=new i.Renderer({alpha:!1,antialias:!1,premultipliedAlpha:!0,powerPreference:"high-performance",dpr:Math.min(window.devicePixelRatio||1,I),webgl:2});if(t=k.gl,"u"<typeof WebGL2RenderingContext||!(t instanceof WebGL2RenderingContext))throw Error("BlackHole requires a WebGL2 context");t.clearColor(0,0,0,1),t.canvas.style.position="absolute",t.canvas.style.top="0",t.canvas.style.left="0",r.appendChild(t.canvas);let L=k.gl,z=!!L.getExtension("EXT_color_buffer_float"),q=z?L.HALF_FLOAT:L.UNSIGNED_BYTE,j=z?L.RGBA16F:L.RGBA,K=(e,t)=>new l.RenderTarget(L,{width:Math.max(1,e),height:Math.max(1,t),depth:!1,type:q,format:L.RGBA,internalFormat:j,minFilter:L.LINEAR,magFilter:L.LINEAR}),V=t.canvas.width,J=t.canvas.height,Q=K(V,J),Z=K(V>>1,J>>1),$=K(V>>1,J>>1),ee=new n.Triangle(t),et=new a.Program(t,{vertex:g,fragment:m,uniforms:{uRes:{value:new Float32Array([V,J])},uTime:{value:0},uCamPos:{value:new Float32Array([0,2,25])},uCamTarget:{value:new Float32Array([0,0,0])},uFocal:{value:1/Math.tan(.5*D*Math.PI/180)},uSteps:{value:e},uDiskInner:{value:E},uDiskOuter:{value:T},uDiskBrightness:{value:b},uDoppler:{value:x},uStarBright:{value:R},uSkyFloor:{value:w},uRotSpeed:{value:A},uTint:{value:new Float32Array(h(N))},uRingColor:{value:new Float32Array(h(U))},uDebug:{value:c[C]??0}}});if(!t.getProgramParameter(et.program,t.LINK_STATUS))throw Error("BlackHole raytracer shader failed to link");let er=new a.Program(t,{vertex:g,fragment:p,uniforms:{tMap:{value:Q.texture},uThreshold:{value:.7}}}),ei=new a.Program(t,{vertex:g,fragment:d,uniforms:{tMap:{value:Z.texture},uTexel:{value:new Float32Array([1/(V>>1),1/(J>>1)])},uDir:{value:new Float32Array([1,0])},uRadius:{value:S}}}),ea=new a.Program(t,{vertex:g,fragment:v,uniforms:{tScene:{value:Q.texture},tBloom:{value:Z.texture},uRes:{value:new Float32Array([V,J])},uTime:{value:0},uBloomStrength:{value:_},uVignette:{value:y},uGrain:{value:F},uChroma:{value:B}}}),es=new s.Mesh(t,{geometry:ee,program:et}),en=new s.Mesh(t,{geometry:ee,program:er}),el=new s.Mesh(t,{geometry:ee,program:ei}),eo=new s.Mesh(t,{geometry:ee,program:ea});X.current=t,G.current=({width:e,height:r,dpr:i})=>{if(0===e||0===r)return;k.dpr=i,k.setSize(e,r);let a=t.drawingBufferWidth,s=t.drawingBufferHeight,n=Math.max(1,a>>1),l=Math.max(1,s>>1);Q.setSize(a,s),Z.setSize(n,l),$.setSize(n,l),et.uniforms.uRes.value[0]=a,et.uniforms.uRes.value[1]=s,ea.uniforms.uRes.value[0]=a,ea.uniforms.uRes.value[1]=s,ei.uniforms.uTexel.value[0]=1/n,ei.uniforms.uTexel.value[1]=1/l};let eu=new Float32Array(3),eh=0,ec=-1,ef=+!P,eg=!1,em=0,ep=0,ed=0,ev=0,eE=0;O.current=function(e){let t,r=ec>=0?(e-ec)*.001:0;ec=e;let i=Math.min(r,.1),a=W.current,s=+!a.paused;ef+=(s-ef)*.05,eh+=i*ef,function(){let e=W.current;et.uniforms.uTime.value=eh,et.uniforms.uSteps.value=e.steps,et.uniforms.uDiskInner.value=e.diskInner,et.uniforms.uDiskOuter.value=e.diskOuter,et.uniforms.uDiskBrightness.value=e.diskBrightness,et.uniforms.uDoppler.value=e.dopplerMax,et.uniforms.uStarBright.value=e.starBrightness,et.uniforms.uSkyFloor.value=e.skyFloor,et.uniforms.uRotSpeed.value=e.rotationSpeed,et.uniforms.uFocal.value=1/Math.tan(.5*e.fov*Math.PI/180),et.uniforms.uDebug.value=c[e.debug]??0;let[t,r,i]=h(e.tint);et.uniforms.uTint.value[0]=t,et.uniforms.uTint.value[1]=r,et.uniforms.uTint.value[2]=i;let[a,s,n]=h(e.ringColor);et.uniforms.uRingColor.value[0]=a,et.uniforms.uRingColor.value[1]=s,et.uniforms.uRingColor.value[2]=n,ea.uniforms.uTime.value=eh,ea.uniforms.uVignette.value=e.vignette,ea.uniforms.uGrain.value=e.grain,ea.uniforms.uChroma.value=e.chromaticAberration}();let n=function(e,t){var r,i,a;let s,n,l,o,u,h,c=W.current,g=Y.current;c.autoOrbit&&g.manualActive&&!eg&&t-g.lastInteract>1e3&&(g.manualActive=!1),eg||g.manualActive?(s=g.manualR,n=g.targetInc,l=g.targetAz,g.orbitAz=g.az):c.autoOrbit?(g.orbitAz+=e*ef*9*c.rotationSpeed*g.spinDir,s=g.r,n=g.inc,l=g.orbitAz):(s=g.r,n=g.inc,l=g.az,g.orbitAz=g.az);let m=Math.min(1,6*e);if(g.r+=(s-g.r)*m,g.inc+=(n-g.inc)*m,g.az+=(l-g.az)*m,g.az>3600||g.az<-3600){let e=360*Math.floor(g.az/360);g.az-=e,g.orbitAz-=e,g.targetAz-=e}return r=g.r,i=g.inc,a=g.az,o=i*f,u=a*f,h=Math.sin(o),eu[0]=r*h*Math.cos(u),eu[1]=r*Math.cos(o),eu[2]=r*h*Math.sin(u),et.uniforms.uCamPos.value[0]=eu[0],et.uniforms.uCamPos.value[1]=eu[1],et.uniforms.uCamPos.value[2]=eu[2],eg||Math.abs(s-g.r)>.001||Math.abs(n-g.inc)>.001||Math.abs(l-g.az)>.001}(i,e);if(t=W.current,k.render({scene:es,target:Q}),t.bloomStrength>0?(er.uniforms.tMap.value=Q.texture,k.render({scene:en,target:Z}),ei.uniforms.tMap.value=Z.texture,ei.uniforms.uDir.value[0]=1,ei.uniforms.uDir.value[1]=0,ei.uniforms.uRadius.value=t.bloomRadius,k.render({scene:el,target:$}),ei.uniforms.tMap.value=$.texture,ei.uniforms.uDir.value[0]=0,ei.uniforms.uDir.value[1]=1,k.render({scene:el,target:Z}),ea.uniforms.tBloom.value=Z.texture,ea.uniforms.uBloomStrength.value=t.bloomStrength):(ea.uniforms.tBloom.value=Q.texture,ea.uniforms.uBloomStrength.value=0),ea.uniforms.tScene.value=Q.texture,k.render({scene:eo}),a.paused&&ef<.001&&!n)return!1},H.resize(),H.start();let eT=t.canvas;function o(e){if("mouse"===e.pointerType&&0!==e.button)return;e.preventDefault();let t=Y.current;t.manualActive||(t.manualR=t.r,t.targetInc=t.inc,t.targetAz=t.az,t.manualActive=!0),eg=!0,em=e.clientX,ep=e.clientY,ed=t.az,ev=t.inc,eE=t.az,t.lastInteract=performance.now();try{eT.setPointerCapture(e.pointerId)}catch{}H.start()}function u(e){if(!eg)return;let t=Y.current,r=ed-(e.clientX-em)*.4;Math.abs(r-eE)>.01&&(t.spinDir=Math.sign(r-eE)),eE=r,t.targetAz=r,t.targetInc=Math.min(168,Math.max(12,ev-(e.clientY-ep)*.3)),t.lastInteract=performance.now()}function M(e){if(eg){eg=!1,Y.current.lastInteract=performance.now();try{eT.releasePointerCapture(e.pointerId)}catch{}}}return eT.addEventListener("pointerdown",o),window.addEventListener("pointermove",u),window.addEventListener("pointerup",M),window.addEventListener("pointercancel",M),()=>{O.current=null,G.current=null,eT.removeEventListener("pointerdown",o),window.removeEventListener("pointermove",u),window.removeEventListener("pointerup",M),window.removeEventListener("pointercancel",M),r.contains(t.canvas)&&r.removeChild(t.canvas)}}catch(e){console.warn("BlackHole: WebGL2 init failed, falling back to static image",e),t&&(r.contains(t.canvas)&&r.removeChild(t.canvas),t.getExtension("WEBGL_lose_context")?.loseContext()),j(!0);return}},[q,I]),(0,r.useEffect)(()=>{P||H.start()},[P,H]),(0,r.useEffect)(()=>{M&&(Y.current.manualActive=!1)},[M]),q)?k?(0,t.jsx)("div",{className:L??"relative h-full w-full",children:(0,t.jsx)("img",{src:k,alt:"","aria-hidden":!0,className:"absolute inset-0 h-full w-full object-cover"})}):(0,t.jsx)("div",{"aria-hidden":!0,className:L??"relative h-full w-full",style:{background:"radial-gradient(circle at 50% 48%, rgba(0,0,0,1) 22%, rgba(168,85,247,0.14) 26%, rgba(255,176,84,0.10) 30%, rgba(8,7,12,1) 55%)"}}):(0,t.jsx)("div",{ref:z,className:(0,o.cn)("relative h-full w-full [&_canvas]:cursor-grab [&_canvas]:touch-none [&_canvas:active]:cursor-grabbing",L)})};e.s(["default",0,function({values:e,reducedMotion:r,paused:i}){return(0,t.jsx)("div",{className:"relative h-full min-h-80 w-full",children:(0,t.jsx)(E,{steps:e.steps,diskInner:e.diskInner,diskOuter:e.diskOuter,diskBrightness:e.diskBrightness,dopplerMax:e.dopplerMax,starBrightness:e.starBrightness,skyFloor:e.skyFloor,rotationSpeed:e.rotationSpeed,fov:e.fov,bloomStrength:e.bloomStrength,bloomRadius:e.bloomRadius,vignette:e.vignette,grain:e.grain,chromaticAberration:e.chromaticAberration,autoOrbit:!r&&e.autoOrbit,debug:e.debug,tint:e.tint,ringColor:e.ringColor,paused:i||r})})}],910869)},55171,function(e){e.n(e.i(910869))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let i=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{i.current=e});let a=(0,t.useRef)(null),s=(0,t.useRef)(null),n=(0,t.useRef)(!1),l=(0,t.useRef)(!1),o=(0,t.useRef)(0),u=(0,t.useRef)(0),h=(0,t.useRef)(0),c=(0,t.useCallback)(()=>{let e=i.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=i.current.dpr??"auto",a=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:a,bufferWidth:Math.max(1,Math.round(t.width*a)),bufferHeight:Math.max(1,Math.round(t.height*a))}},[]),f=(0,t.useCallback)(function e(t){if(l.current)return;0===o.current&&(o.current=t);let s=0===u.current?0:Math.min((t-u.current)/1e3,r);u.current=t;let c={now:t,dt:s,elapsed:(t-o.current)/1e3,frame:h.current++},f=i.current.onFrame?.(c);if(!l.current){if(!1===f||i.current.halted){n.current=!1,a.current=null;return}a.current=requestAnimationFrame(e)}},[]),g=(0,t.useCallback)(()=>{l.current||n.current||(n.current=!0,u.current=0,a.current=requestAnimationFrame(f))},[f]),m=(0,t.useCallback)(()=>{n.current=!1,null!==a.current&&(cancelAnimationFrame(a.current),a.current=null)},[]),p=(0,t.useCallback)(()=>g(),[g]),d=(0,t.useCallback)(()=>{let e=c();e&&(i.current.onResize?.(e),!1!==i.current.paintWhenHalted?p():i.current.halted||g())},[c,p,g]),v=e.deps??[];(0,t.useEffect)(()=>{l.current=!1;let e=i.current.target.current;if(!e)return;let t=()=>{l.current||d()},r=new ResizeObserver(()=>{let e=i.current.resizeDebounceMs??0;e<=0?t():(null!==s.current&&clearTimeout(s.current),s.current=setTimeout(()=>{s.current=null,t()},e))});return r.observe(e),d(),i.current.halted||g(),()=>{l.current=!0,n.current=!1,null!==a.current&&(cancelAnimationFrame(a.current),a.current=null),null!==s.current&&(clearTimeout(s.current),s.current=null),r.disconnect(),i.current.onDispose?.();let e=i.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),o.current=0,u.current=0,h.current=0}},v);let E=e.halted??!1;return(0,t.useEffect)(()=>{E||g()},[E,g]),(0,t.useMemo)(()=>({start:g,stop:m,paint:p,resize:d,get running(){return n.current}}),[g,m,p,d])}])},562611,e=>{"use strict";var t=e.i(899925);e.s(["RenderTarget",0,class{constructor(e,{width:r=e.canvas.width,height:i=e.canvas.height,target:a=e.FRAMEBUFFER,color:s=1,depth:n=!0,stencil:l=!1,depthTexture:o=!1,wrapS:u=e.CLAMP_TO_EDGE,wrapT:h=e.CLAMP_TO_EDGE,wrapR:c=e.CLAMP_TO_EDGE,minFilter:f=e.LINEAR,magFilter:g=f,type:m=e.UNSIGNED_BYTE,format:p=e.RGBA,internalFormat:d=p,unpackAlignment:v,premultiplyAlpha:E}={}){this.gl=e,this.width=r,this.height=i,this.depth=n,this.stencil=l,this.buffer=this.gl.createFramebuffer(),this.target=a,this.gl.renderer.bindFramebuffer(this),this.textures=[];const T=[];for(let a=0;a<s;a++)this.textures.push(new t.Texture(e,{width:r,height:i,wrapS:u,wrapT:h,wrapR:c,minFilter:f,magFilter:g,type:m,format:p,internalFormat:d,unpackAlignment:v,premultiplyAlpha:E,flipY:!1,generateMipmaps:!1})),this.textures[a].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+a,this.gl.TEXTURE_2D,this.textures[a].texture,0),T.push(this.gl.COLOR_ATTACHMENT0+a);T.length>1&&this.gl.renderer.drawBuffers(T),this.texture=this.textures[0],o&&(this.gl.renderer.isWebgl2||this.gl.renderer.getExtension("WEBGL_depth_texture"))?(this.depthTexture=new t.Texture(e,{width:r,height:i,minFilter:this.gl.NEAREST,magFilter:this.gl.NEAREST,format:this.stencil?this.gl.DEPTH_STENCIL:this.gl.DEPTH_COMPONENT,internalFormat:e.renderer.isWebgl2?this.stencil?this.gl.DEPTH24_STENCIL8:this.gl.DEPTH_COMPONENT16:this.gl.DEPTH_COMPONENT,type:this.stencil?this.gl.UNSIGNED_INT_24_8:this.gl.UNSIGNED_INT}),this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.stencil?this.gl.DEPTH_STENCIL_ATTACHMENT:this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(n&&!l&&(this.depthBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.RENDERBUFFER,this.depthBuffer)),l&&!n&&(this.stencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.stencilBuffer)),n&&l&&(this.depthStencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.depthStencilBuffer))),this.gl.renderer.bindFramebuffer({target:this.target})}setSize(e,t){if(this.width!==e||this.height!==t){this.width=e,this.height=t,this.gl.renderer.bindFramebuffer(this);for(let r=0;r<this.textures.length;r++)this.textures[r].width=e,this.textures[r].height=t,this.textures[r].needsUpdate=!0,this.textures[r].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+r,this.gl.TEXTURE_2D,this.textures[r].texture,0);this.depthTexture?(this.depthTexture.width=e,this.depthTexture.height=t,this.depthTexture.needsUpdate=!0,this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(this.depthBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,e,t)),this.stencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,e,t)),this.depthStencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,e,t))),this.gl.renderer.bindFramebuffer({target:this.target})}}}])},899925,e=>{"use strict";let t=new Uint8Array(4),r=1;e.s(["Texture",0,class{constructor(e,{image:t,target:i=e.TEXTURE_2D,type:a=e.UNSIGNED_BYTE,format:s=e.RGBA,internalFormat:n=s,wrapS:l=e.CLAMP_TO_EDGE,wrapT:o=e.CLAMP_TO_EDGE,wrapR:u=e.CLAMP_TO_EDGE,generateMipmaps:h=i===(e.TEXTURE_2D||e.TEXTURE_CUBE_MAP),minFilter:c=h?e.NEAREST_MIPMAP_LINEAR:e.LINEAR,magFilter:f=e.LINEAR,premultiplyAlpha:g=!1,unpackAlignment:m=4,flipY:p=i==(e.TEXTURE_2D||e.TEXTURE_3D),anisotropy:d=0,level:v=0,width:E,height:T=E,length:b=1}={}){this.gl=e,this.id=r++,this.image=t,this.target=i,this.type=a,this.format=s,this.internalFormat=n,this.minFilter=c,this.magFilter=f,this.wrapS=l,this.wrapT=o,this.wrapR=u,this.generateMipmaps=h,this.premultiplyAlpha=g,this.unpackAlignment=m,this.flipY=p,this.anisotropy=Math.min(d,this.gl.renderer.parameters.maxAnisotropy),this.level=v,this.width=E,this.height=T,this.length=b,this.texture=this.gl.createTexture(),this.store={image:null},this.glState=this.gl.renderer.state,this.state={},this.state.minFilter=this.gl.NEAREST_MIPMAP_LINEAR,this.state.magFilter=this.gl.LINEAR,this.state.wrapS=this.gl.REPEAT,this.state.wrapT=this.gl.REPEAT,this.state.anisotropy=0}bind(){this.glState.textureUnits[this.glState.activeTextureUnit]!==this.id&&(this.gl.bindTexture(this.target,this.texture),this.glState.textureUnits[this.glState.activeTextureUnit]=this.id)}update(e=0){let r=!(this.image===this.store.image&&!this.needsUpdate);if((r||this.glState.textureUnits[e]!==this.id)&&(this.gl.renderer.activeTexture(e),this.bind()),r){if(this.needsUpdate=!1,this.flipY!==this.glState.flipY&&(this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL,this.flipY),this.glState.flipY=this.flipY),this.premultiplyAlpha!==this.glState.premultiplyAlpha&&(this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),this.glState.premultiplyAlpha=this.premultiplyAlpha),this.unpackAlignment!==this.glState.unpackAlignment&&(this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT,this.unpackAlignment),this.glState.unpackAlignment=this.unpackAlignment),this.minFilter!==this.state.minFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MIN_FILTER,this.minFilter),this.state.minFilter=this.minFilter),this.magFilter!==this.state.magFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MAG_FILTER,this.magFilter),this.state.magFilter=this.magFilter),this.wrapS!==this.state.wrapS&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_S,this.wrapS),this.state.wrapS=this.wrapS),this.wrapT!==this.state.wrapT&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_T,this.wrapT),this.state.wrapT=this.wrapT),this.wrapR!==this.state.wrapR&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_R,this.wrapR),this.state.wrapR=this.wrapR),this.anisotropy&&this.anisotropy!==this.state.anisotropy&&(this.gl.texParameterf(this.target,this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT,this.anisotropy),this.state.anisotropy=this.anisotropy),this.image){if(this.image.width&&(this.width=this.image.width,this.height=this.image.height),this.target===this.gl.TEXTURE_CUBE_MAP)for(let e=0;e<6;e++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+e,this.level,this.internalFormat,this.format,this.type,this.image[e]);else if(ArrayBuffer.isView(this.image))this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,this.image):(this.target===this.gl.TEXTURE_2D_ARRAY||this.target===this.gl.TEXTURE_3D)&&this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);else if(this.image.isCompressedTexture)for(let e=0;e<this.image.length;e++)this.gl.compressedTexImage2D(this.target,e,this.internalFormat,this.image[e].width,this.image[e].height,0,this.image[e].data);else this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.format,this.type,this.image):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);if(this.generateMipmaps){var i,a;this.gl.renderer.isWebgl2||((i=this.image.width)&i-1)==0&&((a=this.image.height)&a-1)==0?this.gl.generateMipmap(this.target):(this.generateMipmaps=!1,this.wrapS=this.wrapT=this.gl.CLAMP_TO_EDGE,this.minFilter=this.gl.LINEAR)}this.onUpdate&&this.onUpdate()}else if(this.target===this.gl.TEXTURE_CUBE_MAP)for(let e=0;e<6;e++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t);else this.width?this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,null):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,null):this.gl.texImage2D(this.target,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t);this.store.image=this.image}}}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);