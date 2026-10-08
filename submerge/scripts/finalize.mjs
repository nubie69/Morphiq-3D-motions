import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const manifest=JSON.parse(await fs.readFile('recreation-manifest.json','utf8'));
const contentPolicy="connect-src 'self' data: blob: https://images.unsplash.com";
for(const route of manifest.pages){
 const oldFile=route==='/'?path.join(root,'index.html'):path.join(root,route,'index.html');
 const newFile=route==='/'?oldFile:path.join(root,route+'.html');
 if(!oldFile.startsWith(root+path.sep)||!newFile.startsWith(root+path.sep))throw new Error('Invalid route');
 let html=await fs.readFile(oldFile,'utf8').catch(()=>fs.readFile(newFile,'utf8'));
 if(!html.includes('connect-src'))html=html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+contentPolicy+'">');
 html=html.replace(/(<link rel="canonical" href=")https:\/\/shadow-garden-ui\.vercel\.app/g,'$1https://submerge-motion-lab.zachzachgelacio.chatgpt.site').replace(/(<meta property="og:url" content=")https:\/\/shadow-garden-ui\.vercel\.app/g,'$1https://submerge-motion-lab.zachzachgelacio.chatgpt.site');
 await fs.writeFile(newFile,html);
 if(oldFile!==newFile)await fs.unlink(oldFile).catch(e=>{if(e.code!=='ENOENT')throw e;});
}
await fs.writeFile(path.join(root,'404.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page unavailable · Motion Garden recreation</title></head><body style="background:#08070c;color:#ddd;font:16px/1.7 system-ui;padding:48px;max-width:600px;margin:auto"><p style="color:#ad76df;letter-spacing:.15em;font-size:12px">MOTION GARDEN</p><h1>Page unavailable</h1><p>This route was not available from the public reference site. The catalog and its 137 component previews are available locally.</p><a href="/components" style="color:#c595f0">Browse components</a></body></html>');
console.log(`Prepared ${manifest.pages.length} pages for clean-URL static hosting.`);
