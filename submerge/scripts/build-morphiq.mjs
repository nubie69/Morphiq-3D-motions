import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve('dist');
const manifest=JSON.parse(await fs.readFile('recreation-manifest.json','utf8'));
const decode=s=>s.replace(/<[^>]*>/g,'').replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#([0-9]+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#x27;|&#39;|&apos;/g,"'").replace(/&amp;/g,'&');
function balanced(text,start){let depth=0,quoted=false,escape=false;for(let i=start;i<text.length;i++){const c=text[i];if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;continue;}if(c==='"')quoted=true;else if(c==='{'||c==='[')depth++;else if(c==='}'||c===']'){depth--;if(!depth)return text.slice(start,i+1);}}throw Error('Incomplete JSON record');}
const flight=html=>[...html.matchAll(/self\.__next_f\.push\((\[1,"(?:[^"\\]|\\.)*"\])\)/g)].map(m=>JSON.parse(m[1])[1]).join('');
await fs.mkdir(path.join(root,'morphiq/source'),{recursive:true});await fs.mkdir(path.join(root,'previews'),{recursive:true});
let catalog;
try{catalog=JSON.parse(await fs.readFile(path.join(root,'morphiq/catalog.json'),'utf8'));}catch{
 catalog=[];
 for(const route of manifest.pages.filter(p=>/^\/components\/[^/]+$/.test(p))){
  const slug=route.split('/').pop(),html=await fs.readFile(path.join(root,route+'.html'),'utf8'),records=flight(html);
  const offset=records.indexOf('"entry":');if(offset<0)throw Error('Missing entry '+slug);
  const entry=JSON.parse(balanced(records,offset+8));delete entry.pro;
  const blocks=[...html.matchAll(/<pre\b[^>]*>[\s\S]*?<code\b[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/g)].map(m=>decode(m[1]));
  const sources=blocks.filter(c=>/^(?:"use client"|'use client'|import |export |\/\*)/.test(c.trim())&&c.includes('import '));
  const files=sources.map((code,i)=>({name:entry.variants?.[i]?.file?.split('/').pop()||`source-${i+1}.tsx`,code}));
  await fs.writeFile(path.join(root,'morphiq/source',slug+'.json'),JSON.stringify(files));
  entry.sourceCount=files.length;entry.displayName=entry.name.replace(/([a-z0-9])([A-Z])/g,'$1 $2');
  catalog.push(entry);
 }
 catalog.sort((a,b)=>['Backgrounds','Text Animations','Micro-interactions','Power-User Systems','Hero Templates'].indexOf(a.category)-['Backgrounds','Text Animations','Micro-interactions','Power-User Systems','Hero Templates'].indexOf(b.category));
 await fs.writeFile(path.join(root,'morphiq/catalog.json'),JSON.stringify(catalog));
}
for(const entry of catalog){
 const destination=path.join(root,'previews',entry.slug+'.html');
 if(await fs.stat(destination).catch(()=>false))continue;
 let html=await fs.readFile(path.join(root,'components',entry.slug,'full.html'),'utf8');
 // The public preview is retained verbatim. Only its local wrapper metadata
 // changes: no paid source is downloaded or revealed by this adaptation.
 html=html.replace(/self\.__next_f\.push\((\[1,"(?:[^"\\]|\\.)*"\])\)/g,(_,json)=>{const record=JSON.parse(json);record[1]=record[1].replace(/"pro":true/g,'"pro":false');return 'self.__next_f.push('+JSON.stringify(record)+')';});
 html=html.replace('<head>','<head><script src="/morphiq/preview-bridge.js"></script><link rel="stylesheet" href="/morphiq/preview.css">');
 html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+entry.displayName+' · Morphiq preview</title>');
 await fs.writeFile(destination,html);
}
const digests={};for(const asset of manifest.assets){const data=await fs.readFile(path.join(root,asset));digests[asset]=createHash('sha256').update(data).digest('hex');}
if(!await fs.stat('component-assets.sha256.json').catch(()=>false))await fs.writeFile('component-assets.sha256.json',JSON.stringify(digests,null,2));
const glossary=[];for(const asset of manifest.assets.filter(a=>a.endsWith('.js'))){const text=await fs.readFile(path.join(root,asset),'utf8');for(const m of text.matchAll(/term:("(?:[^"\\]|\\.)*"),description:("(?:[^"\\]|\\.)*")/g)){const term=JSON.parse(m[1]),description=JSON.parse(m[2]);if(!glossary.some(x=>x.term===term))glossary.push({term,description});}}
await fs.writeFile(path.join(root,'morphiq/glossary.json'),JSON.stringify(glossary));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function shell(title,description){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#17201c"><title>${escape(title)} · Morphiq</title><meta name="description" content="${escape(description)}"><meta property="og:title" content="${escape(title)} · Morphiq"><meta property="og:description" content="${escape(description)}"><link rel="icon" href="/morphiq/favicon.svg"><link rel="stylesheet" href="/morphiq/morphiq.css"><script type="module" src="/morphiq/app.js"></script></head><body><div id="app"><div class="boot"><span class="boot-mark">M</span><span>Morphiq</span></div></div><noscript>This library needs JavaScript for its interactive previews.</noscript></body></html>`;}
for(const route of manifest.pages){
 const entry=catalog.find(e=>route==='/components/'+e.slug||route==='/components/'+e.slug+'/full');
 const title=entry?entry.displayName:route==='/cookbook'?'Motion Cook Book':route==='/favorites'?'Favorites':route.startsWith('/collections')?'Collections':'Motion, made tangible';
 const html=shell(title,entry?.description||'Explore 137 interactive animation components. Tune, preview, and save your favorites. No subscription.');
 const file=route==='/'?path.join(root,'index.html'):path.join(root,route+'.html');await fs.writeFile(file,html);
}
await fs.writeFile(path.join(root,'404.html'),shell('Page not found','Explore the Morphiq component library.'));
console.log(JSON.stringify({components:catalog.length,sources:catalog.filter(c=>c.sourceCount>0).length,previews:catalog.length,glossary:glossary.length,unchangedAssets:Object.keys(digests).length}));
