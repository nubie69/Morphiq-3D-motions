import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';

// Reconstruct the publicly served frontend and its local asset graph.
// No authenticated endpoints, account data, or payment APIs are downloaded.
const origin='https://motion-garden.vercel.app';
const output=path.resolve('dist');
const sourceOrigin=/https:\/\/(?:motion-garden|shadow-garden-ui)\.vercel\.app/g;
const queue=[],seen=new Set(),failed=[],pages=new Set(),assets=new Set();
if(process.argv.includes('--extend')){const previous=JSON.parse(await readFile('recreation-manifest.json','utf8'));for(const p of previous.pages){seen.add(p);pages.add(p);}for(const p of previous.assets){seen.add(p);assets.add(p);}for(const p of previous.pages.filter(p=>p.startsWith('/components/')&&p.split('/').length===3))enqueue(p+'/full','page');for(const slug of ['noctis','imago','aphelion','ember-oak','obscura','voltline','signal','jinlong','vellum'])enqueue('/templates/'+slug,'page');}
let completed=0,active=0;
function enqueue(url,kind='asset'){
  try {const parsed=new URL(url.replaceAll('&amp;','&'),origin);
    if(!['motion-garden.vercel.app','shadow-garden-ui.vercel.app'].includes(parsed.hostname))return;
    if(parsed.pathname.startsWith('/api/')||parsed.pathname.startsWith('/_next/image'))return;
    parsed.hash='';parsed.search='';const key=parsed.pathname;
    if(seen.has(key)||key.includes('..')||key.endsWith('/')&&kind==='asset'||/\/opengraph-image/.test(key))return;
    seen.add(key);queue.push({url:origin+key,key,kind});
  } catch {}
}
function request(url,redirects=0){return new Promise((resolve,reject)=>{
  const req=https.get(url,{headers:{'User-Agent':'Mozilla/5.0 MotionGardenRecreation/1.0'},timeout:30000},res=>{
    if(res.statusCode>=300&&res.statusCode<400&&res.headers.location&&redirects<4){res.resume();resolve(request(new URL(res.headers.location,url).href,redirects+1));return;}
    const chunks=[];res.on('data',x=>chunks.push(x));res.on('end',()=>resolve({status:res.statusCode,type:res.headers['content-type']||'',body:Buffer.concat(chunks)}));
  });req.on('error',reject);req.on('timeout',()=>req.destroy(new Error('Timeout')));
});}
function discover(text,kind){
  for(const match of text.matchAll(/(?:src|href|poster)=["']([^"']+)["']/g)){
    const value=match[1];if(value.startsWith('data:')||value.startsWith('#'))continue;
    const pathname=new URL(value,origin).pathname;
    if(/\.(?:js|css|woff2?|ttf|otf|png|jpe?g|webp|avif|svg|ico|mp3|wav|ogg|mp4|webm|glb|gltf|bin|json)$/.test(pathname))enqueue(value);
    else if(kind==='page'&&/^\/(?:components(?:\/[^/]+(?:\/full)?)?|collections(?:\/[^/]+)?|cookbook|favorites|templates(?:\/[^/]+)?|pro|privacy|terms|about|changelog)$/.test(pathname))enqueue(value,'page');
  }
  for(const match of text.matchAll(/(?:\/_next\/|static\/immutable\/)(?:[A-Za-z0-9_./-]+)\.(?:js|css|woff2?|ttf|png|webp|jpg|svg)/g))enqueue(match[0].startsWith('/')?match[0]:'/_next/'+match[0]);
  if(kind==='script'){
    for(const match of text.matchAll(/["'](?:static\/immutable\/chunks\/)?([\w-]+\.(?:js|css))["']/g))enqueue('/_next/static/immutable/chunks/'+match[1]);
    for(const match of text.matchAll(/["'`](\/[^"'`\s{}]+\.(?:png|webp|avif|jpg|jpeg|svg|mp3|wav|ogg|mp4|webm|glb|gltf|woff2?))["'`]/g))enqueue(match[1]);
  }
  if(kind==='css')for(const match of text.matchAll(/url\(["']?([^\)"']+)["']?\)/g)){const value=match[1];if(value.startsWith('data:'))continue;enqueue(value.startsWith('/')?value:new URL(value,origin+'/_next/static/immutable/chunks/').href);}
}
async function processItem(item){
  let response;
  for(let attempt=0;attempt<3;attempt++){try {response=await request(item.url);if(response.status===200)break;}catch(error){if(attempt===2)throw error;}}
  if(!response||response.status!==200)throw new Error(`HTTP ${response?.status}`);
  if(item.kind==='asset'&&response.type.includes('text/html'))throw new Error('Asset resolved to HTML');
  let body=response.body;
  if(item.kind==='page'){
    let text=body.toString('utf8');discover(text,'page');
    // Keep canonical attribution, but direct same-site interactive links locally.
    text=text.replace(/(href|action)="https:\/\/(?:motion-garden|shadow-garden-ui)\.vercel\.app([^" ]*)"/g,'$1="$2"');
    text=text.replace('<head>','<head><script src="/recreation-client.js"></script>');
    body=Buffer.from(text);pages.add(item.key);
  }else if(item.key.endsWith('.js'))discover(body.toString('utf8'),'script');
  else if(item.key.endsWith('.css'))discover(body.toString('utf8'),'css');
  const file=item.kind==='page'?(item.key==='/'?path.join(output,'index.html'):path.join(output,item.key+'.html')):path.join(output,item.key);
  await mkdir(path.dirname(file),{recursive:true});await writeFile(file,body);
  if(item.kind==='asset')assets.add(item.key);
  completed++;if(completed%25===0)console.log(`${completed} files saved · ${pages.size} pages · ${queue.length} remaining`);
}
const sitemap=(await request(origin+'/sitemap.xml')).body.toString('utf8');
enqueue('/','page');enqueue('/favorites','page');
for(const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)){const url=new URL(match[1]);if(!/\/opengraph-image|\/llms|\/sitemap/.test(url.pathname))enqueue(url.pathname,'page');}
await mkdir(output,{recursive:true});
const seed=(await request(origin+'/components')).body.toString('utf8');discover(seed,'page');
// Workers pull newly discovered dependencies as earlier pages finish.
await new Promise(resolve=>{function pump(){while(active<8&&queue.length){const item=queue.shift();active++;processItem(item).catch(error=>{failed.push({...item,error:error.message});console.log(`Missing: ${item.key} (${error.message})`);}).finally(()=>{active--;pump();});}if(!active&&!queue.length)resolve();}pump();});
const manifest={origin,capturedAt:new Date().toISOString(),pages:[...pages].sort(),assets:[...assets].sort(),failed};
await writeFile('recreation-manifest.json',JSON.stringify(manifest,null,2));
await writeFile(path.join(output,'recreation-routes.json'),JSON.stringify([...pages].sort()));
console.log(JSON.stringify({pages:pages.size,components:[...pages].filter(p=>/^\/components\/[^/]+$/.test(p)).length,assets:assets.size,failures:failed.length}));
