(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,357907,a=>{"use strict";var t=a.i(843476),e=a.i(271645),r=a.i(647163);function n({text:a="METALLIC",sweepSpeed:i=3.2,sweepWidth:o=.28,sweepAngle:l=18,contrast:m=.7,specular:s=.85,lag:c=.35,sweep:d="alternate",grain:p=.12,baseColor:g="#8f94a3",highlightColor:b="#ffffff",accentColor:u="#a855f7",paused:k=!1,reducedMotion:x=!1,className:v}){let h=`sg${(0,e.useId)().replace(/[^a-zA-Z0-9]/g,"")}`,$=100*Math.max(.02,o)/6,f=Math.min(26,2.6*$);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("style",{children:`
.${h} {
  display: inline-block;
  color: var(--mt-base);
}

.${h} > .${h}-core {
  display: block;
  color: inherit;
}

@supports ((background-clip: text) or (-webkit-background-clip: text)) {
  .${h},
  .${h} > .${h}-core {
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    animation-duration: var(--mt-dur);
    animation-iteration-count: infinite;
    animation-direction: var(--mt-dir);
    animation-play-state: var(--mt-play);
  }

  .${h} {
    background-image:
      linear-gradient(
        var(--mt-angle),
        transparent 0 var(--mt-w0),
        color-mix(in srgb, var(--mt-accent) var(--mt-halo), transparent) 50%,
        transparent var(--mt-w2) 100%
      ),
      repeating-linear-gradient(
        var(--mt-angle),
        rgb(255 255 255 / var(--mt-grain)) 0 1px,
        rgb(0 0 0 / var(--mt-grain)) 1px 2px,
        transparent 2px 4px
      ),
      linear-gradient(
        180deg,
        color-mix(in oklab, var(--mt-base) var(--mt-dark), black) 0%,
        color-mix(in oklab, var(--mt-base) var(--mt-lite), var(--mt-hi)) 26%,
        var(--mt-base) 44%,
        color-mix(in oklab, var(--mt-base) var(--mt-dark), black) 56%,
        color-mix(in oklab, var(--mt-base) var(--mt-lite), var(--mt-hi)) 80%,
        color-mix(in oklab, var(--mt-base) 88%, black) 100%
      );
    background-size: 300% 300%, auto, 100% 100%;
    background-position: var(--mt-park) 50%, 0 0, 0 0;
    background-repeat: no-repeat, repeat, no-repeat;
    background-blend-mode: screen, overlay, normal;
    animation-name: ${h}-wake;
    animation-timing-function: var(--mt-ease-wake);
    animation-delay: var(--mt-delay);
    animation-fill-mode: backwards;
  }

  .${h} > .${h}-core {
    background-image: linear-gradient(
      var(--mt-angle),
      transparent 0 var(--mt-s0),
      color-mix(in srgb, var(--mt-hi) var(--mt-spec), transparent) 50%,
      transparent var(--mt-s2) 100%
    );
    background-size: 300% 300%;
    background-position: var(--mt-park) 50%;
    background-repeat: no-repeat;
    animation-name: ${h}-core;
    animation-timing-function: var(--mt-ease-core);
  }
}

.${h}.${h}-still,
.${h}.${h}-still > .${h}-core {
  animation-name: none;
}

@keyframes ${h}-core {
  from { background-position: 100% 50%; }
  to { background-position: 0% 50%; }
}

@keyframes ${h}-wake {
  from { background-position: 100% 50%, 0 0, 0 0; }
  to { background-position: 0% 50%, 0 0, 0 0; }
}
`}),(0,t.jsx)("span",{className:(0,r.cn)(h,x&&`${h}-still`,v),style:{"--mt-base":g,"--mt-hi":b,"--mt-accent":u,"--mt-angle":`${90+l}deg`,"--mt-dur":`${i}s`,"--mt-delay":`${(.3*c*i).toFixed(3)}s`,"--mt-dir":"alternate"===d?"alternate":"normal","--mt-play":k?"paused":"running","--mt-park":"62%","--mt-grain":`${p}`,"--mt-dark":`${Math.max(20,100-45*m).toFixed(1)}%`,"--mt-lite":`${Math.max(15,100-55*m).toFixed(1)}%`,"--mt-spec":`${Math.round(100*Math.min(1,s))}%`,"--mt-halo":`${Math.round(100*Math.min(.6,.4*s))}%`,"--mt-s0":`${(50-$).toFixed(2)}%`,"--mt-s2":`${(50+$).toFixed(2)}%`,"--mt-w0":`${(50-f).toFixed(2)}%`,"--mt-w2":`${(50+f).toFixed(2)}%`,"--mt-ease-core":"cubic-bezier(0.45, 0, 0.55, 1)","--mt-ease-wake":"cubic-bezier(0.34, 1.56, 0.64, 1)"},children:(0,t.jsx)("span",{className:`${h}-core`,children:a})})]})}a.s(["default",0,function({values:a,reducedMotion:e,paused:r}){return(0,t.jsxs)("div",{className:"flex h-full w-full flex-col items-center justify-center gap-5 p-6",children:[(0,t.jsx)(n,{text:"METALLIC TEXT",className:"font-display text-[clamp(2rem,9vw,4.5rem)] leading-none font-extrabold tracking-[0.06em]",sweepSpeed:a.sweepSpeed,sweepWidth:a.sweepWidth,sweepAngle:a.sweepAngle,contrast:a.contrast,specular:a.specular,lag:a.lag,sweep:a.sweep,grain:a.grain,baseColor:a.baseColor,highlightColor:a.highlightColor,accentColor:a.accentColor,paused:r,reducedMotion:e}),(0,t.jsx)("p",{className:"font-display text-[9px] tracking-[0.28em] text-ink-mute uppercase",children:"select it — the words are still there"})]})}],357907)},277664,function(a){a.n(a.i(357907))}]);