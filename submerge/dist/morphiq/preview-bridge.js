(()=>{
 'use strict';
 try{sessionStorage.setItem('sg-intro-v1','1');localStorage.setItem('sg-rename-v1','new');localStorage.setItem('theme','dark');}catch{}
 const thumbnail=new URLSearchParams(location.search).has('thumbnail');
 if(thumbnail)document.documentElement.setAttribute('data-morphiq-thumbnail','');
 let stage,opened=false,ready=false,observer;
 function findStage(){
  stage=document.querySelector('[dir="ltr"].h-dvh')||document.querySelector('[data-preview-stage]');
  if(!stage)return;
  stage.setAttribute('data-morphiq-stage','');
  const controls=document.querySelector('button[aria-controls="sg-fullscreen-controls"]');
  if(controls&&!opened){opened=true;controls.click();}
  if(!ready&&document.querySelector('#sg-fullscreen-controls')){ready=true;parent.postMessage({type:'morphiq:ready'},location.origin);}
  if(thumbnail&&stage.querySelector('canvas,svg,button,h1,h2,h3'))parent.postMessage({type:'morphiq:painted'},location.origin);
 }
 function setValue(name,value){
  const input=document.getElementById('ctl-'+name);
  if(!input)return false;
  const proto=input.tagName==='SELECT'?HTMLSelectElement.prototype:input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const key=input.type==='checkbox'?'checked':'value';
  Object.getOwnPropertyDescriptor(proto,key).set.call(input,value);
  input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));return true;
 }
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==parent)return;
  const data=event.data;if(data?.type==='morphiq:values'){
   const missing=[];for(const [key,value] of Object.entries(data.values||{}))if(!setValue(key,value))missing.push(key);
   parent.postMessage({type:'morphiq:applied',missing,values:data.values},location.origin);
  }else if(data?.type==='morphiq:pause'){
   const panel=document.querySelector('#sg-fullscreen-controls');const button=[...(panel?.querySelectorAll('button')||[])].find(b=>/^(pause|resume)$/i.test(b.textContent.trim()));if(button){const isPaused=/resume/i.test(button.textContent);if(isPaused!==data.paused)button.click();}
  }else if(data?.type==='morphiq:reset'){
   const panel=document.querySelector('#sg-fullscreen-controls');[...(panel?.querySelectorAll('button')||[])].find(b=>/^reset$/i.test(b.textContent.trim()))?.click();
  }
 });
 document.addEventListener('DOMContentLoaded',()=>{findStage();observer=new MutationObserver(()=>{findStage();});observer.observe(document.body,{childList:true,subtree:true});});
})();
