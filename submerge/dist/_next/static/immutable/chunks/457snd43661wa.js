(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,883091,e=>{"use strict";var t=e.i(843476),i=e.i(271645),n=e.i(174080),o=e.i(647163);let a={expressive:"cubic-bezier(0.22, 1, 0.36, 1)",standard:"cubic-bezier(0.4, 0, 0.2, 1)",linear:"linear"};function s({items:e=[],duration:r=380,easing:l="expressive",shareTitle:d=!0,exit:c="hold",radius:h=12,viewTransition:m=!0,announce:u=!0,accentColor:f="#a855f7",reducedMotion:p=!1,className:g}){var b;let x,y,w,v,$,k,j,N=`sg${(0,i.useId)().replace(/[^a-zA-Z0-9]/g,"")}`,[T,S]=(0,i.useState)(null),[z,A]=(0,i.useState)(null),[C,R]=(0,i.useState)(!1),[B,E]=(0,i.useState)(""),M=(0,i.useRef)(null),U=(0,i.useRef)(null),L=e.find(e=>e.id===T)??null;(0,i.useEffect)(()=>{let e=document.documentElement;return()=>e.removeAttribute("data-crossing")},[]);let O=(e,t,i)=>{E(i);let o=()=>S(e),a=document.documentElement;if(!m||p||"function"!=typeof document.startViewTransition){A(t),o();return}(0,n.flushSync)(()=>{A(t),R(!0)}),a.setAttribute("data-crossing",N);let s=document.startViewTransition(()=>{(0,n.flushSync)(o)}),r=()=>{a.removeAttribute("data-crossing"),R(!1)};s&&s.finished?s.finished.then(r,r):r()};(0,i.useEffect)(()=>{T?M.current?.focus({preventScroll:!0}):z&&U.current?.querySelector(`[data-card="${z}"]`)?.focus({preventScroll:!0})},[T,z]);let D=e=>z===e?`${N}-hero`:void 0,I=e=>d&&z===e?`${N}-title`:void 0;return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("style",{children:(b=a[l],x=`:root[data-crossing="${N}"]`,y=e=>`${x}::view-transition-group(${N}-${e})`,w=e=>`${x}::view-transition-old(${N}-${e})`,v=e=>`${x}::view-transition-new(${N}-${e})`,$=e=>`${Math.round(r*e)}ms`,k="hold"===c?`${w("hero")} { animation-name: none; opacity: 1; }`:"slide"===c?`${w("hero")} { animation-name: ${N}-slide; }`:`${w("hero")} { animation-name: ${N}-out; }`,j="fade"===c?[w("body"),v("body"),w("title"),v("title")]:[w("body"),v("body"),w("title"),v("title"),w("hero"),v("hero")],`
${x}::view-transition-old(root),
${x}::view-transition-new(root) { animation-duration: 0s; }

@keyframes ${N}-out { to { opacity: 0; } }
@keyframes ${N}-in { from { opacity: 0; transform: translateY(8px); } }
@keyframes ${N}-fade { from { opacity: 0; } }
@keyframes ${N}-slide { to { opacity: 0; transform: translateY(-12px); } }

${y("hero")}, ${y("title")}, ${y("body")} {
  animation-duration: ${r}ms;
  animation-timing-function: ${b};
  overflow: clip;
}

/* Both halves of every pair are pinned to the box their group is currently at.
   The UA default is a 100% inline size with an AUTO block size, which means a
   snapshot whose aspect ratio differs from its destination grows to whatever
   height that width implies — and the pseudo-elements live in the top layer,
   so nothing clips it. Measured: a 149x169 tile morphing to 470x124 drew its
   outgoing copy 532px tall, straight through the bottom of the panel and over
   the page beneath. Cover crops instead of overflowing; the title gets contain,
   because letterboxing text is the only way to keep it from being scaled to
   three times its size on the way across. */
${w("hero")}, ${v("hero")}, ${w("body")}, ${v("body")} {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}
${w("title")}, ${v("title")} {
  inline-size: 100%;
  block-size: 100%;
  object-fit: contain;
  object-position: left center;
}

/* The browser blends the two halves of every pair with plus-lighter, which
   ADDS them. That is exactly right for its own cross-fade, where the two
   opacities always sum to one, and exactly wrong for anything else: hold the
   outgoing tile at full opacity and fade the incoming one in over it and the
   sum climbs toward two, so the gradient washes out to pastel and snaps back to
   its real colour the instant the transition ends. It reads as a brightness
   flash on every crossing and there is nothing in the component's own CSS to
   blame for it. Any timing that is not a symmetric cross-fade has to opt out. */
${j.join(",\n")} {
  mix-blend-mode: normal;
}

${w("hero")}, ${v("hero")} {
  animation-duration: ${r}ms;
  animation-timing-function: ${b};
}
${k}

/* The body and the title hand over rather than cross-fade. Run both halves at
   once over the whole duration — the browser default — and every word of the
   outgoing view sits at half opacity on top of every word of the incoming one
   for the length of the transition: two headings, two paragraphs, three ghost
   tiles behind a title. Separating them in time costs nothing and the
   double-exposure is simply gone. The gap is where the tile does its work. */
${w("body")} {
  animation-name: ${N}-out;
  animation-duration: ${$(.4)};
  animation-timing-function: ease-out;
  animation-fill-mode: both;
}
${v("body")} {
  animation-name: ${N}-in;
  animation-duration: ${$(.55)};
  animation-delay: ${$(.45)};
  animation-timing-function: ${b};
  animation-fill-mode: both;
}
${w("title")} {
  animation-name: ${N}-out;
  animation-duration: ${$(.3)};
  animation-fill-mode: both;
}
${v("title")} {
  animation-name: ${N}-fade;
  animation-duration: ${$(.35)};
  animation-delay: ${$(.45)};
  animation-fill-mode: both;
}
`)}),(0,t.jsx)("div",{ref:U,className:(0,o.cn)("relative flex w-full flex-col overflow-hidden border border-hairline bg-panel p-5",g),style:{borderRadius:h},children:(0,t.jsxs)("div",{className:"flex min-h-0 flex-1 flex-col",style:{viewTransitionName:`${N}-body`},children:[(0,t.jsx)("div",{className:"mb-4 flex h-5 items-center",children:L?(0,t.jsxs)("button",{ref:M,type:"button",onClick:()=>O(null,L.id,"Back to the gallery"),className:"inline-flex items-center gap-1.5 font-display text-[10px] tracking-[0.18em] text-ink-dim uppercase transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2",style:{outlineColor:f},children:[(0,t.jsx)("svg",{viewBox:"0 0 24 24",className:"size-3",fill:"none",stroke:"currentColor",strokeWidth:3,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0,children:(0,t.jsx)("path",{d:"M15 5 8 12l7 7"})}),"Back"]}):(0,t.jsxs)("span",{className:"font-display text-[10px] tracking-[0.18em] text-ink-mute uppercase",children:[e.length," areas"]})}),L?(0,t.jsxs)("div",{className:"flex min-h-0 flex-1 flex-col",children:[(0,t.jsx)("div",{className:"mb-4 w-full flex-1",style:{background:L.tone,borderRadius:h-3,viewTransitionName:D(L.id)}}),(0,t.jsx)("h3",{className:"font-display text-[13px] tracking-[0.16em] text-ink uppercase",style:{viewTransitionName:I(L.id)},children:L.title}),(0,t.jsx)("p",{className:"mt-2 font-sans text-[13px] leading-relaxed text-ink-dim",children:L.body})]}):(0,t.jsx)("div",{className:"grid min-h-0 flex-1 grid-cols-3 gap-3",children:e.map(e=>(0,t.jsxs)("button",{type:"button","data-card":e.id,onClick:()=>O(e.id,e.id,`${e.title}, detail`),className:"group/card flex min-h-0 flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-2",style:{borderRadius:h-3,outlineColor:f},children:[(0,t.jsx)("div",{className:"w-full flex-1 transition-transform duration-200 group-hover/card:-translate-y-0.5",style:{background:e.tone,borderRadius:h-3,viewTransitionName:D(e.id),boxShadow:z!==e.id||C||T?void 0:`0 0 0 2px ${f}`}}),(0,t.jsx)("p",{className:"mt-2 font-display text-[10px] tracking-[0.14em] text-ink uppercase",style:{viewTransitionName:I(e.id)},children:e.title}),(0,t.jsx)("p",{className:"mt-0.5 font-sans text-[11px] text-ink-mute",children:e.meta})]},e.id))})]})}),u?(0,t.jsx)("span",{"aria-live":"polite",className:"sr-only",children:B}):null]})}let r=[{id:"north",title:"North Ridge",meta:"12 routes",tone:"linear-gradient(140deg, #7c3aed, #2563eb)",body:"A long approach and a short climb. Best in the two hours after sunrise, when the rock has warmed but the traverse is still in shade."},{id:"basin",title:"Low Basin",meta:"8 routes",tone:"linear-gradient(140deg, #db2777, #f97316)",body:"Sheltered, forgiving, and busy by mid-morning. The one place here that stays climbable in a headwind."},{id:"shelf",title:"East Shelf",meta:"5 routes",tone:"linear-gradient(140deg, #059669, #0891b2)",body:"Short walls with clean landings. Everything is graded a little generously, which is part of why people keep coming back."}];e.s(["default",0,function({values:e,reducedMotion:i}){return(0,t.jsx)("div",{className:"flex h-full w-full items-center justify-center p-8",children:(0,t.jsxs)("div",{className:"w-full max-w-lg",children:[(0,t.jsx)("p",{className:"mb-4 font-display text-[10px] tracking-[0.28em] text-ink-mute uppercase",children:"the tile is the same object in both views"}),(0,t.jsx)(s,{items:r,duration:e.duration,easing:e.easing,shareTitle:e.shareTitle,exit:e.exit,radius:e.radius,viewTransition:e.viewTransition,announce:e.announce,accentColor:e.accentColor,reducedMotion:i,className:"h-72"})]})})}],883091)},8985,function(e){e.n(e.i(883091))}]);