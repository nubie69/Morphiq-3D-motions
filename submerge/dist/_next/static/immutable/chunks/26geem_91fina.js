(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,127816,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(221663),i=e.i(956850),s=e.i(80075),l=e.i(753604),o=e.i(562611),n=e.i(994964),u=e.i(647163),h=e.i(450922);function c(e){let t=e.replace("#","").trim();if(3===t.length&&(t=t.split("").map(e=>e+e).join("")),6!==t.length)return[.94,.66,.19];let r=parseInt(t,16);return Number.isNaN(r)?[.94,.66,.19]:[(r>>16&255)/255,(r>>8&255)/255,(255&r)/255]}let f={lotus:0,gem:1,flame:2},m=Math.PI/180,d=2*Math.PI,g=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = vec4(position, 0.0, 1.0);
}
`,p=`#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform vec3 uCamTarget;
uniform float uFocal;
uniform float uVOffset;
uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uAccent;
uniform float uSwirlPhase;
uniform float uTwist;
uniform float uTurb;
uniform float uCoreGlow;
uniform float uSmoke;
uniform float uBloom;
uniform float uCoreScale;
uniform float uStemLen;
uniform int uCore;
out vec4 fragColor;

const float PI = 3.14159265;
const float TWO_PI = 6.28318530718;
const vec3 CORE = vec3(0.0, 0.0, 0.0);
const float CORE_BOUND = 2.1;
const float BOUND = 8.3;       // swirling-medium ball radius; big enough to overfill
                                // the frame at default framing so its round limb never
                                // shows as a hard cut-off (dark corners come from the
                                // outer-shell falloff instead)

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
float vnoise3(vec3 p) {
	vec3 i = floor(p), f = fract(p);
	vec3 u = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(mix(hash31(i + vec3(0,0,0)), hash31(i + vec3(1,0,0)), u.x),
			mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), u.x), u.y),
		mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), u.x),
			mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), u.x), u.y),
		u.z);
}
float fbm3(vec3 p) {
	float s = 0.0, a = 0.5;
	for (int i = 0; i < 4; i++) {
		s += a * vnoise3(p);
		p = p * 2.02 + vec3(11.3, 17.1, 5.7);
		a *= 0.5;
	}
	return s;
}

vec2 raySphere(vec3 ro, vec3 rd, float rad) {
	float b = dot(ro, rd);
	float c = dot(ro, ro) - rad * rad;
	float h = b * b - c;
	if (h < 0.0) return vec2(1.0, -1.0);
	h = sqrt(h);
	return vec2(-b - h, -b + h);
}

float sdEllipsoid(vec3 p, vec3 r) {
	float k0 = length(p / r);
	float k1 = length(p / (r * r));
	return k0 * (k0 - 1.0) / max(k1, 1e-6);
}
float sdPetal(vec3 p, float tilt, float reach, float width) {
	float c = cos(tilt), s = sin(tilt);
	vec3 q = vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
	q.x -= reach;
	return sdEllipsoid(q, vec3(reach * 0.95, width * 0.34, width));
}
float sdLotus(vec3 p, float bloom, float stemLen) {
	float d = 1e5;
	float rad = length(p.xz);
	float a = atan(p.z, p.x);
	// Petals fold nearly vertical into a pointed bud at bloom=0, splay open at 1.
	float k1 = TWO_PI / 7.0;
	float a1 = mod(a + 0.5 * k1, k1) - 0.5 * k1;
	d = min(d, sdPetal(vec3(rad * cos(a1), p.y, rad * sin(a1)), mix(1.48, 0.55, bloom), 0.92, 0.5));
	float k2 = TWO_PI / 6.0;
	float a2 = mod(a + k2, k2) - 0.5 * k2;
	d = min(d, sdPetal(vec3(rad * cos(a2), p.y - 0.04, rad * sin(a2)), mix(1.52, 0.95, bloom), 0.62, 0.4));
	float k3 = TWO_PI / 5.0;
	float a3 = mod(a + 0.5 * k3, k3) - 0.5 * k3;
	d = min(d, sdPetal(vec3(rad * cos(a3), p.y - 0.02, rad * sin(a3)), mix(1.55, 1.35, bloom), 0.4, 0.32));
	d = min(d, sdEllipsoid(p - vec3(0.0, 0.14, 0.0), vec3(0.17, 0.24, 0.17)));
	// Tapered stalk hanging BELOW the flower. Local +y is world-down (the outer call
	// flips Y), so the stem lives at p.y in [0, stemLen], thick at the base → thin tip.
	if (stemLen > 0.01) {
		float sy = p.y;
		float tp = clamp(sy / stemLen, 0.0, 1.0);
		float sr = mix(0.20, 0.0, tp); // chunky trunk at the flower → tapers to a point at the tip
		// Sweep the stalk outward as it descends: a straight axial stem hides behind the
		// flower under the top-down camera, so curve it into view and let it droop.
		vec2 lean = vec2(0.32 * stemLen * tp * tp, 0.0);
		float stem = length(p.xz - lean) - sr;
		stem = max(stem, -sy);
		stem = max(stem, sy - stemLen);
		d = min(d, stem);
	}
	return d;
}
float sdIcosahedron(vec3 p, float r) {
	const float G = 0.5773502692;
	const float PHI = 1.618033989;
	vec3 n1 = normalize(vec3(PHI, 1.0, 0.0));
	vec3 n2 = normalize(vec3(0.0, PHI, 1.0));
	vec3 n3 = normalize(vec3(1.0, 0.0, PHI));
	p = abs(p);
	float d = dot(p, n1);
	d = max(d, dot(p, n2));
	d = max(d, dot(p, n3));
	d = max(d, dot(p, vec3(G)));
	return d - r;
}
float sdFlame(vec3 p) {
	// Bounded flicker time: two rates advect the turbulence upward so the plume
	// writhes organically instead of scrolling rigidly.
	float t1 = mod(uTime * 1.7, 240.0);
	float t2 = mod(uTime * 0.9, 240.0);
	// Tall teardrop: fat rounded base tapering to a sharp tip near y = +0.95.
	float prof = 0.42 * pow(clamp(1.0 - (p.y + 0.5) / 1.4, 0.0, 1.0), 0.75)
		* smoothstep(-0.55, -0.2, p.y);
	// Turbulence licks harder toward the tip → tongues peel off the top.
	vec3 q = p * vec3(2.6, 1.7, 2.6);
	float turb = fbm3(q + vec3(0.0, -t1 * 1.7, 0.0)) * 0.6
		+ fbm3(q * 2.1 + vec3(3.0, -t2 * 2.4, 1.0)) * 0.3;
	float lick = (turb - 0.42) * smoothstep(-0.4, 0.9, p.y) * 0.55;
	float body = length(p.xz) - (prof + lick);
	body = max(body, p.y - 0.95); // cap the tip
	body = max(body, -0.6 - p.y); // cap the base
	return body;
}
float sdCore(vec3 p) {
	float s = uCoreScale;
	if (uCore == 1) return sdIcosahedron(p / s, 0.62) * s;
	if (uCore == 2) return sdFlame(p / s) * s;
	// petals cup upward toward the viewer; stem hangs below
	return sdLotus(vec3(p.x, -p.y, p.z) / s, uBloom, uStemLen) * s;
}
vec3 coreTint() {
	if (uCore == 1) return mix(uAccent, vec3(0.72, 0.86, 1.0), 0.22);
	if (uCore == 2) return mix(uPrimary, uAccent, 0.42);
	return mix(uPrimary, uAccent, 0.62);
}

// Dark obsidian sky with soft, drifting gold smoke — frames the swirl and fills
// every ray that misses the medium ball. Controlled by uSmoke.
vec3 smokyBG(vec3 rd, float cs, float sn) {
	// Swirl the backdrop with the vortex. Rotating by a mod-2π angle is seamless at
	// the wrap (cos/sin are periodic), so the smoke reads as the SAME swirling
	// medium — no flat plate to seam against the marched ball's limb.
	vec2 rxz = mat2(cs, -sn, sn, cs) * rd.xz;
	float a = atan(rxz.y, rxz.x);
	float e = rd.y;
	float s = fbm(vec2(a * 2.1 + e * 1.4, e * 2.3 + 1.0));
	s = smoothstep(0.32, 0.97, s);
	float s2 = fbm(vec2(a * 4.4 + 3.0, e * 3.4));
	s = max(s, smoothstep(0.5, 0.97, s2) * 0.5);
	vec3 base = uSecondary * 0.28;
	vec3 smoke = mix(uSecondary, uPrimary, 0.35) * 0.42;
	return base + smoke * s * uSmoke;
}

void main() {
	vec3 ro = uCamPos;
	vec3 fwd = normalize(uCamTarget - ro);
	vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
	vec3 up = cross(right, fwd);
	vec2 sp = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
	sp.y += uVOffset; // vertical framing offset — slides the whole scene in-frame
	vec3 rd = normalize(sp.x * right + sp.y * up + uFocal * fwd);

	// The swirl spin is a RIGID ROTATION of the sample field, not an additive phase
	// fed into (non-periodic) fbm. Rotating by a mod-2π angle is seamless at the
	// wrap — cos(2π)=cos(0), sin(2π)=sin(0) — so the loop never jumps, while the mod
	// keeps the argument bounded for float precision.
	float swirlPhase = uSwirlPhase;
	float cs = cos(swirlPhase), sn = sin(swirlPhase);

	vec2 tb = raySphere(ro, rd, BOUND);
	if (tb.y < 0.0 || tb.y <= tb.x) {
		fragColor = vec4(max(smokyBG(rd, cs, sn), 0.0), 1.0);
		return;
	}
	float t0 = max(tb.x, 0.0);
	float t1 = tb.y;

	int STEPS = 96;
	float dt = (t1 - t0) / float(STEPS);
	// Interleaved gradient noise breaks the raymarch banding without the sandy
	// clumping of a white-noise hash, and at half a step it barely reads at all.
	float dither = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
	float t = t0 + dt * dither * 0.5;

	vec3 col = vec3(0.0);
	float trans = 1.0;

	for (int i = 0; i < 96; i++) {
		if (i >= STEPS) break;
		vec3 P = ro + rd * t;
		t += dt;

		float r = length(P);
		// Rigid swirl rotation of the sample point about +Y — the whole ribbon field
		// spins with the flow, seamlessly (see swirlPhase note above).
		vec2 rxz = mat2(cs, -sn, sn, cs) * P.xz;
		float rc = length(rxz);
		float y = P.y;
		float ang = atan(rxz.y, rxz.x);

		// Whirlpool spiral: the arms wind tighter toward the eye. The winding term
		// is clamped in rc, so cos/sin/noise stay precise for any runtime.
		float wind = uTwist * (7.0 - min(rc, 7.0)) * 0.5;
		float spiral = ang - wind + y * 0.08;

		// Big sweeping arms (low freq) broken up by warped fine streaks, carved to
		// high contrast so obsidian lanes knife between the molten-gold bands.
		float w1 = fbm(vec2(spiral * 0.6, rc * 0.25 + y * 0.15));

		// Liquid ribbons: RIDGED noise sampled along the spiral gives sharp-edged
		// metal streaks that curl with the flow (the crease of a poured-gold sheet),
		// with a fine layer breaking them into wet detail. Ridge lines, not soft fog.
		float bandN = fbm(vec2(spiral * 3.4 + w1 * 2.6, rc * 0.6 + y * 0.25));
		float ridged = 1.0 - abs(2.0 * bandN - 1.0);
		ridged = pow(ridged, 4.5); // thinner crests → wider obsidian lanes between arms
		float micro = fbm(vec2(spiral * 7.0 + w1 * 2.0, rc * 1.4)); // lower freq → less sandy grain
		float flow = clamp(ridged * (0.6 + 0.45 * micro), 0.0, 1.0);
		// Thin specular cores — the wet, reflective glint riding the ribbon crests.
		float spec = pow(ridged, 6.0) * (0.6 + 0.2 * micro);

		// Outer shell fades the medium to obsidian toward the ball edge, so the
		// frame corners go dark WITHOUT ever seeing the ball's hard silhouette.
		float radial = smoothstep(BOUND, 1.5, r) * mix(1.0, exp(-y * y * 0.09), 0.55);
		float dens = radial * flow;

		// Carve hard obsidian between the ribbons: only high flow reads as molten
		// gold, everything below sinks to near-black so a big ball still keeps deep
		// darks instead of hazing to milk over the long sightline.
		float gold = smoothstep(0.14, 0.74, flow);
		vec3 emis = mix(uSecondary * 0.07, uPrimary, gold);             // obsidian → gold
		emis += (uPrimary * 0.55 + uAccent * 0.45) * spec * 1.6;        // liquid-metal specular
		emis *= mix(0.7, 1.35, smoothstep(10.0, 1.2, r));              // gentle inward lift
		float a = clamp(dens * dt * 1.05, 0.0, 1.0);
		col += trans * emis * a;
		trans *= 1.0 - a * 0.84;                                        // front-lit: near ribbons occlude the haze behind

		// Tight bright eye, gated to the flow so it never becomes a uniform sun.
		float cg = exp(-r * r * 2.8);
		col += trans * mix(uAccent, uPrimary, 0.25) * cg * uCoreGlow * (0.35 + 0.65 * flow) * dt * 0.6;

		// Core object (SDF, swappable by uCore), scaled by uCoreScale. The gate covers
		// the scaled flower sphere plus a thin column for the lotus stem below it.
		float s = uCoreScale;
		float coreReach = CORE_BOUND * s;
		bool inStem = (uCore == 0) && length(P.xz) < (0.3 + 0.36 * uStemLen) * s
			&& P.y < 0.1 * s && P.y > -(uStemLen + 0.2) * s;
		if (r < coreReach || inStem) {
			float cd = sdCore(P - CORE);
			if (uCore == 2) {
				// Volumetric flame: soft filled emission, NO hard rim (the rim read as a
				// triangle outline). A tighter falloff gives the plume a defined body; the
				// flicker varies with height AND angle so tongues lick instead of a uniform
				// blob. Hue stays in-palette — white-gold base → gold body → pale-accent tip.
				float glow = smoothstep(0.22 * s, -0.12 * s, cd);
				float h = clamp((P.y + 0.6 * s) / (1.55 * s), 0.0, 1.0);
				float fk = mod(uTime * 2.6, 180.0);
				float flick = 0.5 + 0.6 * fbm(vec2(atan(P.z, P.x) * 1.6 + P.y * 2.5 - fk, P.y * 3.0));
				vec3 fc = mix(mix(uPrimary, vec3(1.0), 0.4), uPrimary, smoothstep(0.0, 0.5, h));
				fc = mix(fc, uAccent, smoothstep(0.55, 1.0, h));
				col += trans * fc * glow * uCoreGlow * flick * (1.5 - 0.6 * h) * dt * 2.2;
				trans *= 1.0 - clamp(glow * 0.5, 0.0, 1.0);
			} else {
				// Solid cores (lotus, gem): rim + filled inside so the silhouette reads
				// through the bloom instead of flattening to a white mass.
				float rim = smoothstep(0.09, 0.0, abs(cd));
				float inside = smoothstep(0.03, -0.16, cd);
				// The lotus stem dissolves into the flow toward its tail — fade both emission
				// and absorption down the lower stalk so it ends in mist, not a hard cone cap.
				float fade = 1.0;
				if (uCore == 0 && uStemLen > 0.01) {
					float depth = -P.y / (uStemLen * s);
					fade = 1.0 - smoothstep(0.35, 1.0, depth);
				}
				vec3 cc = coreTint();
				float ce = (inside * 0.45 + rim * 1.3) * uCoreGlow * fade;
				col += trans * cc * ce * dt * 1.1;
				trans *= 1.0 - clamp(inside * 0.75 * fade, 0.0, 1.0);
			}
		}

		if (trans < 0.02) break;
	}

	// Whatever the swirl didn't cover shows the smoky obsidian sky — now swirl-
	// textured, so the transition across the ball limb carries no visible seam.
	col += trans * smokyBG(rd, cs, sn);

	if (any(isnan(col)) || any(isinf(col))) col = vec3(0.0);
	fragColor = vec4(max(col, 0.0), 1.0);
}
`,v=`#version 300 es
in vec4 aSeed;   // theta0, r0, spiralTurns, phase
in vec2 aJit;    // speedJitter, sizeJitter
uniform float uTime;
uniform vec3 uCamPos;
uniform vec3 uCamTarget;
uniform float uFocal;
uniform vec2 uRes;
uniform float uDpr;
uniform float uVOffset;
uniform float uParticleSpeed;
uniform float uCurlPhase;
uniform float uDrawCount;
uniform float uBaseSize;
out float vLife;
out float vAlpha;

const float TWO_PI = 6.28318530718;
// Dust always targets this fixed convergence point — INDEPENDENT of which core
// mesh renders, so swapping coreObject never breaks the flow-field targeting.
const float R_CORE = 0.3;
const float Y_TOP = 4.6;
const float Y_CORE = 0.0;

void main() {
	if (float(gl_VertexID) >= uDrawCount) { gl_Position = vec4(2.0); return; }

	float speed = uParticleSpeed * (0.55 + 0.9 * aJit.x);
	float lf = fract(uTime * speed * 0.16 + aSeed.w);
	float ei = lf * lf;
	float r = mix(aSeed.y, R_CORE, ei);
	float y = mix(Y_TOP, Y_CORE, lf);
	float ang = aSeed.x + aSeed.z * lf * TWO_PI + uCurlPhase;
	vec3 world = vec3(r * cos(ang), y, r * sin(ang));

	vAlpha = smoothstep(0.0, 0.07, lf) * (1.0 - smoothstep(0.72, 1.0, lf));
	vLife = lf;

	vec3 fwd = normalize(uCamTarget - uCamPos);
	vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
	vec3 up = cross(right, fwd);
	vec3 rel = world - uCamPos;
	float cz = dot(rel, fwd);
	float cx = dot(rel, right);
	float cy = dot(rel, up);
	float aspect = uRes.x / max(uRes.y, 1.0);
	vec2 ndc = vec2(uFocal * cx / cz * 2.0 / aspect, uFocal * cy / cz * 2.0);
	ndc.y -= uVOffset * 2.0; // match the fragment's vertical framing offset
	gl_Position = vec4(ndc, 0.0, 1.0);
	if (cz <= 0.05) gl_Position = vec4(2.0);
	gl_PointSize = clamp(uBaseSize * uDpr * uFocal / cz, 1.0, 48.0);
}
`,E=`#version 300 es
precision highp float;
in float vLife;
in float vAlpha;
uniform vec3 uPrimary;
uniform vec3 uAccent;
uniform float uBright;
out vec4 fragColor;
void main() {
	vec2 d = gl_PointCoord - 0.5;
	float m = 1.0 - smoothstep(0.3, 0.5, length(d));
	float a = vAlpha * m;
	if (a < 0.004) discard;
	vec3 c = mix(uPrimary, uAccent, vLife) * uBright;
	fragColor = vec4(c * a, a); // additive (ONE, ONE)
}
`,w=`#version 300 es
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
`,T=`#version 300 es
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
`,b=`#version 300 es
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
	// Radial RGB split, strong enough to read at the frame edges.
	float ca = uChroma * 0.06 * dot(dir, dir);
	vec3 scene;
	scene.r = texture(tScene, uv + dir * ca).r;
	scene.g = texture(tScene, uv).g;
	scene.b = texture(tScene, uv - dir * ca).b;
	vec3 bloom;
	bloom.r = texture(tBloom, uv + dir * ca).r;
	bloom.g = texture(tBloom, uv).g;
	bloom.b = texture(tBloom, uv - dir * ca).b;
	vec3 hdr = (scene + bloom * uBloomStrength) * 0.82; // pull exposure down to deepen the obsidian
	vec3 col = aces(hdr);
	float aspect = uRes.x / max(uRes.y, 1.0);
	float v = smoothstep(1.30, 0.30, length(dir * vec2(aspect, 1.0)) * 1.15);
	col *= mix(1.0, v, uVignette);
	float g = hash(gl_FragCoord.xy + fract(uTime * 13.7) * 97.0) - 0.5;
	col += g * uGrain * 0.6 * (1.0 - 0.5 * dot(col, vec3(0.333)));
	fragColor = vec4(col, 1.0);
}
`,x=({primary:e="#F0A830",secondary:x="#120E1A",accent:y="#FFE7A3",coreObject:R="lotus",coreScale:A=1.5,stemLength:P=1.4,vortexIntensity:S=7,glowIntensity:C=8,particleDensity:_=200,particleSpeed:F=0,smokeAmount:D=.6,cameraAutoRotate:M=!0,rotationSpeed:N=1,fov:B=60,verticalOffset:I=0,chromaticAberration:U=.15,vignette:k=.4,grain:L=.02,paused:O=!1,maxDpr:z=1.5,fallbackSrc:G,className:H})=>{let X=(0,r.useRef)(null),W=(0,r.useRef)(null),Y=(0,r.useRef)(null),V=(0,r.useRef)(null),j=(0,h.useAnimationLoop)({target:X,halted:!1,dpr:z,onResize:e=>Y.current?.(e),onFrame:({now:e})=>!!W.current&&W.current(e),gl:()=>V.current}),q=(0,r.useRef)({primary:e,secondary:x,accent:y,coreObject:R,coreScale:A,stemLength:P,vortexIntensity:S,glowIntensity:C,particleDensity:_,particleSpeed:F,smokeAmount:D,cameraAutoRotate:M,rotationSpeed:N,fov:B,verticalOffset:I,chromaticAberration:U,vignette:k,grain:L,paused:O});q.current={primary:e,secondary:x,accent:y,coreObject:R,coreScale:A,stemLength:P,vortexIntensity:S,glowIntensity:C,particleDensity:_,particleSpeed:F,smokeAmount:D,cameraAutoRotate:M,rotationSpeed:N,fov:B,verticalOffset:I,chromaticAberration:U,vignette:k,grain:L,paused:O};let K=(0,r.useRef)({r:11,inc:50,az:0,orbitAz:0,manualActive:!1,targetAz:0,targetInc:50,lastInteract:-1e9,spinDir:1}),[J,Q]=(0,r.useState)(!1);return((0,r.useEffect)(()=>{(!("u"<typeof navigator)&&(/iPhone|iPad|iPod/.test(navigator.userAgent)||"MacIntel"===navigator.platform&&navigator.maxTouchPoints>1)||!function(){if("u"<typeof document)return!1;try{return!!document.createElement("canvas").getContext("webgl2")}catch{return!1}}())&&Q(!0)},[]),(0,r.useEffect)(()=>{let t;if(J||!X.current)return;let r=X.current;try{let C=Math.min(window.devicePixelRatio||1,z),F=new a.Renderer({alpha:!1,antialias:!1,premultipliedAlpha:!0,powerPreference:"high-performance",dpr:C,webgl:2});if(t=F.gl,"u"<typeof WebGL2RenderingContext||!(t instanceof WebGL2RenderingContext))throw Error("VortexBloom requires a WebGL2 context");t.clearColor(0,0,0,1),t.canvas.style.position="absolute",t.canvas.style.top="0",t.canvas.style.left="0",r.appendChild(t.canvas);let M=F.gl,N=!!M.getExtension("EXT_color_buffer_float"),G=N?M.HALF_FLOAT:M.UNSIGNED_BYTE,H=N?M.RGBA16F:M.RGBA,X=(e,t)=>new o.RenderTarget(M,{width:Math.max(1,e),height:Math.max(1,t),depth:!1,type:G,format:M.RGBA,internalFormat:H,minFilter:M.LINEAR,magFilter:M.LINEAR}),J=t.canvas.width,Q=t.canvas.height,Z=Math.max(1,Math.round(.7*J)),$=Math.max(1,Math.round(.7*Q)),ee=Math.max(1,Z>>1),et=Math.max(1,$>>1),er=X(Z,$),ea=X(ee,et),ei=X(ee,et),es=new l.Triangle(t),el=1/Math.tan(.5*B*Math.PI/180),eo=new i.Program(t,{vertex:g,fragment:p,uniforms:{uRes:{value:new Float32Array([Z,$])},uTime:{value:0},uCamPos:{value:new Float32Array([0,7,5])},uCamTarget:{value:new Float32Array([0,0,0])},uFocal:{value:el},uVOffset:{value:I},uPrimary:{value:new Float32Array(c(e))},uSecondary:{value:new Float32Array(c(x))},uAccent:{value:new Float32Array(c(y))},uSwirlPhase:{value:0},uTwist:{value:.8},uTurb:{value:1},uCoreGlow:{value:3},uSmoke:{value:D},uBloom:{value:0},uCoreScale:{value:A},uStemLen:{value:P},uCore:{value:f[R]??0}}});if(!t.getProgramParameter(eo.program,t.LINK_STATUS))throw Error("VortexBloom vortex shader failed to link");let en=new Float32Array(2800),eu=new Float32Array(1400);for(let e=0;e<700;e++)en[4*e]=Math.random()*Math.PI*2,en[4*e+1]=1.6+1.1*Math.random(),en[4*e+2]=1.5+2.8*Math.random(),en[4*e+3]=Math.random(),eu[2*e]=Math.random(),eu[2*e+1]=Math.random();let eh=new n.Geometry(t,{aSeed:{size:4,data:en},aJit:{size:2,data:eu}}),ec=new i.Program(t,{vertex:v,fragment:E,transparent:!0,depthTest:!1,depthWrite:!1,uniforms:{uTime:{value:0},uCamPos:{value:new Float32Array([0,7,5])},uCamTarget:{value:new Float32Array([0,0,0])},uFocal:{value:el},uRes:{value:new Float32Array([Z,$])},uDpr:{value:.7*C},uVOffset:{value:I},uParticleSpeed:{value:1.4},uCurlPhase:{value:0},uDrawCount:{value:_},uBaseSize:{value:46},uPrimary:{value:new Float32Array(c(e))},uAccent:{value:new Float32Array(c(y))},uBright:{value:1.1}}});if(ec.setBlendFunc(t.ONE,t.ONE),!t.getProgramParameter(ec.program,t.LINK_STATUS))throw Error("VortexBloom particle shader failed to link");let ef=new i.Program(t,{vertex:g,fragment:w,uniforms:{tMap:{value:er.texture},uThreshold:{value:1}}}),em=new i.Program(t,{vertex:g,fragment:T,uniforms:{tMap:{value:ea.texture},uTexel:{value:new Float32Array([1/ee,1/et])},uDir:{value:new Float32Array([1,0])},uRadius:{value:1}}}),ed=new i.Program(t,{vertex:g,fragment:b,uniforms:{tScene:{value:er.texture},tBloom:{value:ea.texture},uRes:{value:new Float32Array([J,Q])},uTime:{value:0},uBloomStrength:{value:1.8},uVignette:{value:k},uGrain:{value:L},uChroma:{value:U}}}),eg=new s.Mesh(t,{geometry:es,program:eo}),ep=new s.Mesh(t,{geometry:eh,program:ec,mode:t.POINTS}),ev=new s.Mesh(t,{geometry:es,program:ef}),eE=new s.Mesh(t,{geometry:es,program:em}),ew=new s.Mesh(t,{geometry:es,program:ed});V.current=t,Y.current=({width:e,height:r,dpr:a})=>{if(0===e||0===r)return;F.dpr=a,F.setSize(e,r);let i=t.drawingBufferWidth,s=t.drawingBufferHeight,l=Math.max(1,Math.round(.7*i)),o=Math.max(1,Math.round(.7*s)),n=Math.max(1,l>>1),u=Math.max(1,o>>1);er.setSize(l,o),ea.setSize(n,u),ei.setSize(n,u),eo.uniforms.uRes.value[0]=l,eo.uniforms.uRes.value[1]=o,ec.uniforms.uRes.value[0]=l,ec.uniforms.uRes.value[1]=o,ed.uniforms.uRes.value[0]=i,ed.uniforms.uRes.value[1]=s,em.uniforms.uTexel.value[0]=1/n,em.uniforms.uTexel.value[1]=1/u};let eT=new Float32Array(3),eb=0,ex=-1,ey=+!O,eR=0,eA=f[q.current.coreObject]??0,eP=1,eS=0,eC=0,e_=!1,eF=0,eD=0,eM=0,eN=0,eB=0;W.current=function(e){let t,r,a=ex>=0?(e-ex)*.001:0;ex=e;let i=Math.min(a,.1),s=q.current,l=+!s.paused;ey+=(l-ey)*.05,eb+=i*ey;let o=.05+.04*s.vortexIntensity;eP+=(K.current.spinDir-eP)*Math.min(1,3*i),eS=(eS+i*ey*o*eP)%d,eC=(eC+i*ey*o*.6*eP)%d,eo.uniforms.uSwirlPhase.value=eS,ec.uniforms.uCurlPhase.value=eC;let n=f[s.coreObject]??0;n!==eA&&(eA=n,eR=0),eR=s.paused?2.4:Math.min(2.4,eR+i),function(){let e=q.current,t=e.vortexIntensity,r=e.glowIntensity,a=1/Math.tan(.5*e.fov*Math.PI/180),i=eo.uniforms;i.uTime.value=eb,i.uTwist.value=.35+.12*t,i.uTurb.value=.35+.1*t,i.uCoreGlow.value=.5+.32*r,i.uSmoke.value=e.smokeAmount,i.uFocal.value=a,i.uVOffset.value=e.verticalOffset,i.uCore.value=f[e.coreObject]??0,i.uCoreScale.value=e.coreScale,i.uStemLen.value=e.stemLength;let[s,l,o]=c(e.primary);i.uPrimary.value[0]=s,i.uPrimary.value[1]=l,i.uPrimary.value[2]=o;let[n,u,h]=c(e.secondary);i.uSecondary.value[0]=n,i.uSecondary.value[1]=u,i.uSecondary.value[2]=h;let[m,d,g]=c(e.accent);i.uAccent.value[0]=m,i.uAccent.value[1]=d,i.uAccent.value[2]=g;let p=ec.uniforms;p.uTime.value=eb,p.uFocal.value=a,p.uVOffset.value=e.verticalOffset,p.uParticleSpeed.value=.25+ +e.particleSpeed,p.uDrawCount.value=e.particleDensity,p.uBright.value=.3+.06*r,p.uPrimary.value[0]=s,p.uPrimary.value[1]=l,p.uPrimary.value[2]=o,p.uAccent.value[0]=m,p.uAccent.value[1]=d,p.uAccent.value[2]=g,ed.uniforms.uTime.value=eb,ed.uniforms.uVignette.value=e.vignette,ed.uniforms.uGrain.value=e.grain,ed.uniforms.uChroma.value=e.chromaticAberration}();let u=eR/2.4;eo.uniforms.uBloom.value=1-(1-u)*(1-u)*(1-u);let h=function(e,t){var r,a,i;let s,l,o,n,u,h=q.current,c=K.current;h.cameraAutoRotate&&c.manualActive&&!e_&&t-c.lastInteract>1e3&&(c.manualActive=!1),e_||c.manualActive?(s=c.targetInc,l=c.targetAz,c.orbitAz=c.az):h.cameraAutoRotate?(c.orbitAz+=e*ey*5*h.rotationSpeed*c.spinDir,s=c.inc,l=c.orbitAz):(s=c.inc,l=c.az,c.orbitAz=c.az);let f=Math.min(1,6*e);if(c.inc+=(s-c.inc)*f,c.az+=(l-c.az)*f,c.az>3600||c.az<-3600){let e=360*Math.floor(c.az/360);c.az-=e,c.orbitAz-=e,c.targetAz-=e}r=c.r,a=c.inc,i=c.az,o=a*m,n=i*m,u=Math.sin(o),eT[0]=r*u*Math.cos(n),eT[1]=r*Math.cos(o),eT[2]=r*u*Math.sin(n);let d=eo.uniforms.uCamPos.value,g=ec.uniforms.uCamPos.value;return d[0]=g[0]=eT[0],d[1]=g[1]=eT[1],d[2]=g[2]=eT[2],e_||Math.abs(s-c.inc)>.001||Math.abs(l-c.az)>.001}(i,e);if(t=q.current,F.render({scene:eg,target:er}),F.render({scene:ep,target:er,clear:!1}),(r=.14*t.glowIntensity)>.001?(ef.uniforms.tMap.value=er.texture,F.render({scene:ev,target:ea}),em.uniforms.tMap.value=ea.texture,em.uniforms.uDir.value[0]=1,em.uniforms.uDir.value[1]=0,F.render({scene:eE,target:ei}),em.uniforms.tMap.value=ei.texture,em.uniforms.uDir.value[0]=0,em.uniforms.uDir.value[1]=1,F.render({scene:eE,target:ea}),ed.uniforms.tBloom.value=ea.texture,ed.uniforms.uBloomStrength.value=r):(ed.uniforms.tBloom.value=er.texture,ed.uniforms.uBloomStrength.value=0),ed.uniforms.tScene.value=er.texture,F.render({scene:ew}),s.paused&&ey<.001&&!h)return!1},j.resize(),j.start();let eI=t.canvas;function u(e){if("mouse"===e.pointerType&&0!==e.button)return;e.preventDefault();let t=K.current;t.manualActive||(t.targetInc=t.inc,t.targetAz=t.az,t.manualActive=!0),e_=!0,eF=e.clientX,eD=e.clientY,eM=t.az,eN=t.inc,eB=t.az,t.lastInteract=performance.now();try{eI.setPointerCapture(e.pointerId)}catch{}j.start()}function h(e){if(!e_)return;let t=K.current,r=eM-(e.clientX-eF)*.4;Math.abs(r-eB)>.01&&(t.spinDir=Math.sign(r-eB)),eB=r,t.targetAz=r,t.targetInc=Math.min(176,Math.max(4,eN-(e.clientY-eD)*.3)),t.lastInteract=performance.now()}function S(e){if(e_){e_=!1,K.current.lastInteract=performance.now();try{eI.releasePointerCapture(e.pointerId)}catch{}}}return eI.addEventListener("pointerdown",u),window.addEventListener("pointermove",h),window.addEventListener("pointerup",S),window.addEventListener("pointercancel",S),()=>{W.current=null,Y.current=null,eI.removeEventListener("pointerdown",u),window.removeEventListener("pointermove",h),window.removeEventListener("pointerup",S),window.removeEventListener("pointercancel",S),r.contains(t.canvas)&&r.removeChild(t.canvas)}}catch(e){console.warn("VortexBloom: WebGL2 init failed, falling back to static image",e),t&&(r.contains(t.canvas)&&r.removeChild(t.canvas),t.getExtension("WEBGL_lose_context")?.loseContext()),Q(!0);return}},[J,z]),(0,r.useEffect)(()=>{O||j.start()},[O,j]),(0,r.useEffect)(()=>{j.paint()},[j,e,x,y,R,A,P,S,C,_,F,D,B,I,U,k,L]),(0,r.useEffect)(()=>{M&&(K.current.manualActive=!1)},[M]),J)?(0,t.jsx)("div",{className:(0,u.cn)("relative h-full w-full",H),children:G?(0,t.jsx)("img",{src:G,alt:"","aria-hidden":!0,className:"absolute inset-0 h-full w-full object-cover"}):(0,t.jsx)("div",{"aria-hidden":!0,className:"absolute inset-0",style:{background:"radial-gradient(circle at 50% 48%, rgba(255,231,163,0.24) 0%, rgba(240,168,48,0.16) 16%, rgba(20,14,26,1) 55%, rgba(8,6,10,1) 100%)"}})}):(0,t.jsx)("div",{ref:X,className:(0,u.cn)("relative h-full w-full [&_canvas]:cursor-grab [&_canvas]:touch-none [&_canvas:active]:cursor-grabbing",H)})};e.s(["default",0,function({values:e,reducedMotion:r,paused:a}){return(0,t.jsx)("div",{className:"relative h-full min-h-80 w-full",children:(0,t.jsx)(x,{primary:e.primary,secondary:e.secondary,accent:e.accent,coreObject:e.coreObject,coreScale:e.coreScale,stemLength:e.stemLength,vortexIntensity:e.vortexIntensity,glowIntensity:e.glowIntensity,particleDensity:e.particleDensity,particleSpeed:e.particleSpeed,smokeAmount:e.smokeAmount,cameraAutoRotate:!r&&e.cameraAutoRotate,rotationSpeed:e.rotationSpeed,fov:e.fov,verticalOffset:e.verticalOffset,chromaticAberration:e.chromaticAberration,vignette:e.vignette,grain:e.grain,paused:a||r})})}],127816)},912590,function(e){e.n(e.i(127816))},450922,e=>{"use strict";var t=e.i(271645);let r=1/15;e.s(["useAnimationLoop",0,function(e){let a=(0,t.useRef)(e);(0,t.useLayoutEffect)(()=>{a.current=e});let i=(0,t.useRef)(null),s=(0,t.useRef)(null),l=(0,t.useRef)(!1),o=(0,t.useRef)(!1),n=(0,t.useRef)(0),u=(0,t.useRef)(0),h=(0,t.useRef)(0),c=(0,t.useCallback)(()=>{let e=a.current.target.current;if(!e)return null;let t=e.getBoundingClientRect(),r=a.current.dpr??"auto",i=Math.min(window.devicePixelRatio||1,"auto"===r?2:r);return{width:t.width,height:t.height,dpr:i,bufferWidth:Math.max(1,Math.round(t.width*i)),bufferHeight:Math.max(1,Math.round(t.height*i))}},[]),f=(0,t.useCallback)(function e(t){if(o.current)return;0===n.current&&(n.current=t);let s=0===u.current?0:Math.min((t-u.current)/1e3,r);u.current=t;let c={now:t,dt:s,elapsed:(t-n.current)/1e3,frame:h.current++},f=a.current.onFrame?.(c);if(!o.current){if(!1===f||a.current.halted){l.current=!1,i.current=null;return}i.current=requestAnimationFrame(e)}},[]),m=(0,t.useCallback)(()=>{o.current||l.current||(l.current=!0,u.current=0,i.current=requestAnimationFrame(f))},[f]),d=(0,t.useCallback)(()=>{l.current=!1,null!==i.current&&(cancelAnimationFrame(i.current),i.current=null)},[]),g=(0,t.useCallback)(()=>m(),[m]),p=(0,t.useCallback)(()=>{let e=c();e&&(a.current.onResize?.(e),!1!==a.current.paintWhenHalted?g():a.current.halted||m())},[c,g,m]),v=e.deps??[];(0,t.useEffect)(()=>{o.current=!1;let e=a.current.target.current;if(!e)return;let t=()=>{o.current||p()},r=new ResizeObserver(()=>{let e=a.current.resizeDebounceMs??0;e<=0?t():(null!==s.current&&clearTimeout(s.current),s.current=setTimeout(()=>{s.current=null,t()},e))});return r.observe(e),p(),a.current.halted||m(),()=>{o.current=!0,l.current=!1,null!==i.current&&(cancelAnimationFrame(i.current),i.current=null),null!==s.current&&(clearTimeout(s.current),s.current=null),r.disconnect(),a.current.onDispose?.();let e=a.current.gl?.();e?.getExtension("WEBGL_lose_context")?.loseContext(),n.current=0,u.current=0,h.current=0}},v);let E=e.halted??!1;return(0,t.useEffect)(()=>{E||m()},[E,m]),(0,t.useMemo)(()=>({start:m,stop:d,paint:g,resize:p,get running(){return l.current}}),[m,d,g,p])}])},562611,e=>{"use strict";var t=e.i(899925);e.s(["RenderTarget",0,class{constructor(e,{width:r=e.canvas.width,height:a=e.canvas.height,target:i=e.FRAMEBUFFER,color:s=1,depth:l=!0,stencil:o=!1,depthTexture:n=!1,wrapS:u=e.CLAMP_TO_EDGE,wrapT:h=e.CLAMP_TO_EDGE,wrapR:c=e.CLAMP_TO_EDGE,minFilter:f=e.LINEAR,magFilter:m=f,type:d=e.UNSIGNED_BYTE,format:g=e.RGBA,internalFormat:p=g,unpackAlignment:v,premultiplyAlpha:E}={}){this.gl=e,this.width=r,this.height=a,this.depth=l,this.stencil=o,this.buffer=this.gl.createFramebuffer(),this.target=i,this.gl.renderer.bindFramebuffer(this),this.textures=[];const w=[];for(let i=0;i<s;i++)this.textures.push(new t.Texture(e,{width:r,height:a,wrapS:u,wrapT:h,wrapR:c,minFilter:f,magFilter:m,type:d,format:g,internalFormat:p,unpackAlignment:v,premultiplyAlpha:E,flipY:!1,generateMipmaps:!1})),this.textures[i].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+i,this.gl.TEXTURE_2D,this.textures[i].texture,0),w.push(this.gl.COLOR_ATTACHMENT0+i);w.length>1&&this.gl.renderer.drawBuffers(w),this.texture=this.textures[0],n&&(this.gl.renderer.isWebgl2||this.gl.renderer.getExtension("WEBGL_depth_texture"))?(this.depthTexture=new t.Texture(e,{width:r,height:a,minFilter:this.gl.NEAREST,magFilter:this.gl.NEAREST,format:this.stencil?this.gl.DEPTH_STENCIL:this.gl.DEPTH_COMPONENT,internalFormat:e.renderer.isWebgl2?this.stencil?this.gl.DEPTH24_STENCIL8:this.gl.DEPTH_COMPONENT16:this.gl.DEPTH_COMPONENT,type:this.stencil?this.gl.UNSIGNED_INT_24_8:this.gl.UNSIGNED_INT}),this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.stencil?this.gl.DEPTH_STENCIL_ATTACHMENT:this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(l&&!o&&(this.depthBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,r,a),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.RENDERBUFFER,this.depthBuffer)),o&&!l&&(this.stencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,r,a),this.gl.framebufferRenderbuffer(this.target,this.gl.STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.stencilBuffer)),l&&o&&(this.depthStencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,r,a),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.depthStencilBuffer))),this.gl.renderer.bindFramebuffer({target:this.target})}setSize(e,t){if(this.width!==e||this.height!==t){this.width=e,this.height=t,this.gl.renderer.bindFramebuffer(this);for(let r=0;r<this.textures.length;r++)this.textures[r].width=e,this.textures[r].height=t,this.textures[r].needsUpdate=!0,this.textures[r].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+r,this.gl.TEXTURE_2D,this.textures[r].texture,0);this.depthTexture?(this.depthTexture.width=e,this.depthTexture.height=t,this.depthTexture.needsUpdate=!0,this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(this.depthBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,e,t)),this.stencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,e,t)),this.depthStencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,e,t))),this.gl.renderer.bindFramebuffer({target:this.target})}}}])},899925,e=>{"use strict";let t=new Uint8Array(4),r=1;e.s(["Texture",0,class{constructor(e,{image:t,target:a=e.TEXTURE_2D,type:i=e.UNSIGNED_BYTE,format:s=e.RGBA,internalFormat:l=s,wrapS:o=e.CLAMP_TO_EDGE,wrapT:n=e.CLAMP_TO_EDGE,wrapR:u=e.CLAMP_TO_EDGE,generateMipmaps:h=a===(e.TEXTURE_2D||e.TEXTURE_CUBE_MAP),minFilter:c=h?e.NEAREST_MIPMAP_LINEAR:e.LINEAR,magFilter:f=e.LINEAR,premultiplyAlpha:m=!1,unpackAlignment:d=4,flipY:g=a==(e.TEXTURE_2D||e.TEXTURE_3D),anisotropy:p=0,level:v=0,width:E,height:w=E,length:T=1}={}){this.gl=e,this.id=r++,this.image=t,this.target=a,this.type=i,this.format=s,this.internalFormat=l,this.minFilter=c,this.magFilter=f,this.wrapS=o,this.wrapT=n,this.wrapR=u,this.generateMipmaps=h,this.premultiplyAlpha=m,this.unpackAlignment=d,this.flipY=g,this.anisotropy=Math.min(p,this.gl.renderer.parameters.maxAnisotropy),this.level=v,this.width=E,this.height=w,this.length=T,this.texture=this.gl.createTexture(),this.store={image:null},this.glState=this.gl.renderer.state,this.state={},this.state.minFilter=this.gl.NEAREST_MIPMAP_LINEAR,this.state.magFilter=this.gl.LINEAR,this.state.wrapS=this.gl.REPEAT,this.state.wrapT=this.gl.REPEAT,this.state.anisotropy=0}bind(){this.glState.textureUnits[this.glState.activeTextureUnit]!==this.id&&(this.gl.bindTexture(this.target,this.texture),this.glState.textureUnits[this.glState.activeTextureUnit]=this.id)}update(e=0){let r=!(this.image===this.store.image&&!this.needsUpdate);if((r||this.glState.textureUnits[e]!==this.id)&&(this.gl.renderer.activeTexture(e),this.bind()),r){if(this.needsUpdate=!1,this.flipY!==this.glState.flipY&&(this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL,this.flipY),this.glState.flipY=this.flipY),this.premultiplyAlpha!==this.glState.premultiplyAlpha&&(this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),this.glState.premultiplyAlpha=this.premultiplyAlpha),this.unpackAlignment!==this.glState.unpackAlignment&&(this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT,this.unpackAlignment),this.glState.unpackAlignment=this.unpackAlignment),this.minFilter!==this.state.minFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MIN_FILTER,this.minFilter),this.state.minFilter=this.minFilter),this.magFilter!==this.state.magFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MAG_FILTER,this.magFilter),this.state.magFilter=this.magFilter),this.wrapS!==this.state.wrapS&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_S,this.wrapS),this.state.wrapS=this.wrapS),this.wrapT!==this.state.wrapT&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_T,this.wrapT),this.state.wrapT=this.wrapT),this.wrapR!==this.state.wrapR&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_R,this.wrapR),this.state.wrapR=this.wrapR),this.anisotropy&&this.anisotropy!==this.state.anisotropy&&(this.gl.texParameterf(this.target,this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT,this.anisotropy),this.state.anisotropy=this.anisotropy),this.image){if(this.image.width&&(this.width=this.image.width,this.height=this.image.height),this.target===this.gl.TEXTURE_CUBE_MAP)for(let e=0;e<6;e++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+e,this.level,this.internalFormat,this.format,this.type,this.image[e]);else if(ArrayBuffer.isView(this.image))this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,this.image):(this.target===this.gl.TEXTURE_2D_ARRAY||this.target===this.gl.TEXTURE_3D)&&this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);else if(this.image.isCompressedTexture)for(let e=0;e<this.image.length;e++)this.gl.compressedTexImage2D(this.target,e,this.internalFormat,this.image[e].width,this.image[e].height,0,this.image[e].data);else this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.format,this.type,this.image):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);if(this.generateMipmaps){var a,i;this.gl.renderer.isWebgl2||((a=this.image.width)&a-1)==0&&((i=this.image.height)&i-1)==0?this.gl.generateMipmap(this.target):(this.generateMipmaps=!1,this.wrapS=this.wrapT=this.gl.CLAMP_TO_EDGE,this.minFilter=this.gl.LINEAR)}this.onUpdate&&this.onUpdate()}else if(this.target===this.gl.TEXTURE_CUBE_MAP)for(let e=0;e<6;e++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t);else this.width?this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,null):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,null):this.gl.texImage2D(this.target,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t);this.store.image=this.image}}}])},753604,e=>{"use strict";var t=e.i(994964);class r extends t.Geometry{constructor(e,{attributes:t={}}={}){Object.assign(t,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,t)}}e.s(["Triangle",0,r])}]);