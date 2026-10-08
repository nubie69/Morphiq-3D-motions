/* Local navigation and service boundaries for the Motion Garden recreation. */
(()=>{
  'use strict';
  const upstream='https://motion-garden.vercel.app';
  const sameSite=host=>host===location.host||host==='motion-garden.vercel.app'||host==='shadow-garden-ui.vercel.app';
  // Keep the interactive compiled demos, but navigate between local HTML routes.
  // This avoids coupling the reconstruction to the original Next.js server.
  document.addEventListener('click',event=>{
    const anchor=event.target.closest?.('a[href]');
    if(!anchor||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||anchor.hasAttribute('download'))return;
    const url=new URL(anchor.href,location.href);
    if(!sameSite(url.host)||anchor.target==='_blank')return;
    if(url.pathname===location.pathname&&url.hash){return;}
    if(url.pathname.startsWith('/api/')){event.preventDefault();event.stopImmediatePropagation();showServiceNotice();return;}
    if(/\.(?:js|css|png|jpg|svg|ico|json|txt)$/.test(url.pathname))return;
    event.preventDefault();event.stopImmediatePropagation();location.assign(url.pathname+url.search+url.hash);
  },true);
  function showServiceNotice(){
    let notice=document.getElementById('recreation-service-notice');
    if(notice)return;
    notice=document.createElement('dialog');notice.id='recreation-service-notice';
    notice.style.cssText='max-width:440px;padding:28px;background:#14121b;color:#eee;border:1px solid #42384f;border-radius:12px;font:15px/1.6 system-ui';
    notice.innerHTML='<h2 style="margin-top:0;font-size:22px">Motion Garden services</h2><p>This recreation includes public pages and interactive demos. Accounts, purchases, and Pro source access are provided by the original site.</p><div style="display:flex;gap:20px;align-items:center"><a href="'+upstream+'/components" target="_blank" rel="noopener" style="color:#bd90ef">Visit Motion Garden</a><button style="background:#2c2638;color:white;border:0;padding:9px 14px;border-radius:6px;cursor:pointer">Close</button></div>';
    notice.querySelector('button').onclick=()=>{notice.close();notice.remove();};document.body.append(notice);notice.showModal();
  }
  const originalFetch=window.fetch.bind(window);
  window.fetch=(input,init)=>{
    const url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url,location.href);
    const method=(init?.method||(typeof input!=='string'&&input.method)||'GET').toUpperCase();
    if(url.pathname.startsWith('/api/')){
      if(method!=='GET'&&!/analytics|telemetry|track|stats/.test(url.pathname))showServiceNotice();
      if(url.pathname==='/api/billing')return Promise.resolve(new Response(JSON.stringify({pro:false,type:null,status:null,currentPeriodEnd:null,cancelAtPeriodEnd:false,hasSubscription:false}),{headers:{'Content-Type':'application/json'}}));
      if(/session|auth|user|entitlement|pro/.test(url.pathname))return Promise.resolve(new Response(JSON.stringify({user:null,session:null,pro:false,authenticated:false}),{headers:{'Content-Type':'application/json'}}));
      return Promise.resolve(new Response('{}',{status:method==='GET'?200:503,headers:{'Content-Type':'application/json'}}));
    }
    if(url.searchParams.has('_rsc'))return Promise.resolve(new Response('',{status:404}));
    // No third-party account, analytics, or write requests from this replica.
    if(url.origin!==location.origin&&method!=='GET')return Promise.resolve(new Response('{}',{status:503}));
    if(/analytics|telemetry|vercel-insights/.test(url.href))return Promise.resolve(new Response('{}',{headers:{'Content-Type':'application/json'}}));
    if(sameSite(url.host)&&url.origin!==location.origin){url.host=location.host;url.protocol=location.protocol;return originalFetch(url.href,init);}
    return originalFetch(input,init);
  };
  if(navigator.sendBeacon)navigator.sendBeacon=()=>false;
})();
