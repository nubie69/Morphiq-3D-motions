/** Original, dependency-free recreation of a live HTML water surface. */
const defaults={depth:.45,flow:1.25,turbulence:.5,rippleForce:.8,rippleSpread:1,settle:1.6,edgeHold:.35,waterColor:'#bacffe',deepColor:'#d9e7f3'};
const settings={...defaults};
const ranges=[['depth',0,1,.05,''],['flow',0,2,.05,' ×'],['turbulence',0,2,.05,''],['rippleForce',0,2,.05,' ×'],['rippleSpread',.3,3,.05,' ×'],['settle',.4,5,.1,' s'],['edgeHold',0,1,.05,'']];
const surface=document.querySelector('#surface'),layer=document.querySelector('#submerged');
const image=document.querySelector('#displacement-image'),displacement=document.querySelector('#displacement');
const canvas=document.createElement('canvas');canvas.width=180;canvas.height=120;
const context=canvas.getContext('2d'),pixels=context.createImageData(canvas.width,canvas.height);
const overlay=document.querySelector('#highlights'),light=overlay.getContext('2d');
let paused=false,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,ripples=[],elapsed=0,last=0,lastPaint=0,raf=0,previousPointer=null;
let width=1,height=1,ratio=1;
const reduceInput=document.querySelector('#reduce');reduceInput.checked=reduced;
const smooth=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x)};
function updateControl(key){const input=document.getElementById(key),spec=ranges.find(x=>x[0]===key);input.value=settings[key];input.style.setProperty('--fill',`${100*(settings[key]-spec[1])/(spec[2]-spec[1])}%`);document.getElementById(`${key}-output`).value=settings[key].toFixed(key==='settle'?1:2)+spec[4];}
for(const [key,min,max,step,suffix] of ranges){const wrapper=document.createElement('div');wrapper.className='control';wrapper.innerHTML=`<label for="${key}">${key}<output id="${key}-output" for="${key}"></output></label><input id="${key}" type="range" min="${min}" max="${max}" step="${step}" aria-label="${key}">`;document.querySelector('#control-body').append(wrapper);updateControl(key);wrapper.querySelector('input').addEventListener('input',e=>{settings[key]=Number(e.target.value);updateControl(key);render();});}
function updateColors(){for(const key of ['waterColor','deepColor']){document.getElementById(key).value=settings[key];document.getElementById(`${key}-output`).value=settings[key].toUpperCase();}document.querySelector('#wash').style.background=settings.deepColor;}
for(const key of ['waterColor','deepColor'])document.getElementById(key).addEventListener('input',e=>{settings[key]=e.target.value;updateColors();render();});
function setStatus(){document.querySelector('#status').textContent=reduced?'REDUCED':paused?'PAUSED':'RUNNING';document.querySelector('#pause').textContent=paused?'Resume':'Pause';document.querySelector('#pause').setAttribute('aria-pressed',String(paused));layer.style.filter=reduced?'none':'url(#water)';}
document.querySelector('#pause').addEventListener('click',()=>{paused=!paused;setStatus();start();});
reduceInput.addEventListener('change',()=>{reduced=reduceInput.checked;ripples=[];setStatus();render();start();});
document.querySelector('#reset').addEventListener('click',()=>{Object.assign(settings,defaults);paused=false;elapsed=0;ripples=[];for(const [key] of ranges)updateControl(key);updateColors();setStatus();render();start();});
document.querySelector('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await surface.requestFullscreen();}catch{document.querySelector('#fullscreen').title='Full screen unavailable in this browser';}});
let feedbackTimer;document.querySelector('#press').addEventListener('click',()=>{const button=document.querySelector('#press');button.innerHTML='It works <span>✓</span>';clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>{button.innerHTML='Press me <span>+</span>';},1800);});
function addRipple(x,y,wake=false,dx=0,dy=0){if(paused||reduced)return;ripples.push({x,y,age:0,wake,dx,dy,life:settings.settle*(wake?.55:1)});if(ripples.length>18)ripples.shift();start();}
surface.addEventListener('pointerdown',e=>{const bounds=surface.getBoundingClientRect();addRipple((e.clientX-bounds.left)/width,(e.clientY-bounds.top)/height);});
surface.addEventListener('pointermove',e=>{const bounds=surface.getBoundingClientRect(),x=(e.clientX-bounds.left)/width,y=(e.clientY-bounds.top)/height;if(previousPointer){const dx=x-previousPointer.x,dy=y-previousPointer.y;if(Math.hypot(dx*width,dy*height)>18){addRipple(x,y,true,dx,dy);previousPointer={x,y};}}else previousPointer={x,y};});
surface.addEventListener('pointerleave',()=>{previousPointer=null;});surface.addEventListener('pointercancel',()=>{previousPointer=null;});
new ResizeObserver(()=>{const bounds=surface.getBoundingClientRect();width=bounds.width;height=bounds.height;ratio=width/height;const dpr=Math.min(devicePixelRatio||1,2);overlay.width=Math.round(width*dpr);overlay.height=Math.round(height*dpr);light.setTransform(dpr,0,0,dpr,0,0);render();}).observe(surface);
function render(){document.querySelector('#wash').style.opacity=String(settings.depth*.8);if(reduced){light.clearRect(0,0,width,height);return;}
 const w=canvas.width,h=canvas.height,data=pixels.data,t=elapsed*settings.flow;
 const active=ripples.map(r=>{const p=r.age/r.life;return{...r,radius:(.012+.37*(1-Math.exp(-3*p)))*settings.rippleSpread*(r.wake?.48:1),strength:Math.sin(Math.min(1,p*6)*Math.PI/2)*(1-p)**2*settings.rippleForce*(r.wake?.38:1)};});
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=x/(w-1),v=y/(h-1),nx=u*ratio;
 let vx=Math.sin(nx*9+Math.sin(v*8+t*.42)+t*.6)*.17+Math.sin(nx*19-v*11-t*.35)*.055;
 let vy=Math.cos(v*10+Math.sin(nx*7-t*.38)+t*.5)*.17+Math.cos(v*21+nx*13+t*.29)*.055;
 for(const r of active){const dx=(u-r.x)*ratio,dy=v-r.y,dist=Math.hypot(dx,dy);const band=(dist-r.radius)/.04;if(Math.abs(band)<2.6&&dist>.0001){let amp=Math.sin(band*3.2)*Math.exp(-band*band*1.4)*r.strength*.6;if(r.wake){const dot=(dx*r.dx+dy*r.dy)/(dist*Math.hypot(r.dx,r.dy)||1);amp*=.6-.4*dot;}vx+=dx/dist*amp;vy+=dy/dist*amp;}}
 const edge=Math.min(u*ratio,(1-u)*ratio,v,1-v);const taper=settings.edgeHold===0?1:smooth(edge/(settings.edgeHold*.48));const i=(y*w+x)*4;data[i]=Math.round(128+Math.max(-.48,Math.min(.48,vx*taper))*255);data[i+1]=Math.round(128+Math.max(-.48,Math.min(.48,vy*taper))*255);data[i+2]=128;data[i+3]=255;}
 context.putImageData(pixels,0,0);image.setAttribute('href',canvas.toDataURL());displacement.setAttribute('scale',String(55*settings.turbulence*(.55+settings.depth*.9)));
 light.clearRect(0,0,width,height);light.strokeStyle=settings.waterColor;
 for(const r of active){const radius=r.radius*height;if(radius<1)continue;light.globalAlpha=r.strength*.19;light.lineWidth=1.5;light.beginPath();light.arc(r.x*width,r.y*height,radius,0,Math.PI*2);light.stroke();light.globalAlpha=r.strength*.06;light.lineWidth=7;light.stroke();light.globalAlpha=r.strength*.09;light.lineWidth=1;light.beginPath();light.arc(r.x*width,r.y*height,Math.max(1,radius-8),0,Math.PI*2);light.stroke();}light.globalAlpha=1;
}
function frame(now){raf=0;const dt=last?Math.min((now-last)/1000,.07):0;last=now;if(!paused&&!reduced&&!document.hidden){elapsed+=dt;for(const r of ripples)r.age+=dt;ripples=ripples.filter(r=>r.age<r.life);if(now-lastPaint>1000/24){render();lastPaint=now;}raf=requestAnimationFrame(frame);}else last=0;}
function start(){if(!raf&&!paused&&!reduced&&!document.hidden){last=0;raf=requestAnimationFrame(frame);}}
document.addEventListener('visibilitychange',start);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{reduced=e.matches;reduceInput.checked=reduced;setStatus();render();start();});
updateColors();setStatus();render();start();
