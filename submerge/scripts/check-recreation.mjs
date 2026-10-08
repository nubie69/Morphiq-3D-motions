import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve('dist'),manifest=JSON.parse(await readFile('recreation-manifest.json','utf8'));
const problems=[];
const componentRoutes=manifest.pages.filter(p=>/^\/components\/[^/]+$/.test(p));
assert.equal(componentRoutes.length,137,'Component inventory');
const localFile=uri=>path.join(root,new URL(uri,'http://localhost').pathname);
for(const route of manifest.pages){
 const file=route==='/'?path.join(root,'index.html'):path.join(root,route+'.html');
 const html=await readFile(file,'utf8');
 assert(html.includes('type="module" src="/morphiq/app.js"'),`${route} missing Morphiq navigation`);
 assert(html.includes('<title>'),`${route} missing title`);
 for(const [,raw] of html.matchAll(/(?:src|href)="([^" ]+)"/g)){
   const uri=raw.replaceAll('&amp;','&');if(!uri.startsWith('/')||uri.startsWith('//'))continue;
   const pathname=new URL(uri,'http://localhost').pathname;
   if(pathname.startsWith('/_next/')||/\.(?:png|ico|js|css|woff2?|svg)$/.test(pathname)){
     if(pathname.startsWith('/_next/image'))continue;
     if(!await stat(localFile(uri)).then(s=>s.isFile()).catch(()=>false))problems.push(`${route}: missing ${pathname}`);
   }
 }
}
for(const asset of manifest.assets){
 assert((await stat(localFile(asset))).isFile(),asset);
 if(asset.endsWith('.js'))new vm.Script(await readFile(localFile(asset),'utf8'),{filename:asset});
 if(asset.endsWith('.css')){
   const css=await readFile(localFile(asset),'utf8');
   for(const [,url] of css.matchAll(/url\(["']?([^\)"']+)["']?\)/g)){
     if(url.startsWith('#')||url.startsWith('data:')||url.startsWith('http'))continue;
     const filename=path.resolve(path.dirname(localFile(asset)),url);
     assert((await stat(filename)).isFile(),`${asset} font missing: ${url}`);
   }
 }
}
const catalog=JSON.parse(await readFile(path.join(root,'morphiq/catalog.json'),'utf8'));
assert.equal(catalog.length,137,'Morphiq catalog inventory');
assert.equal(new Set(catalog.map(e=>e.slug)).size,137,'Unique component slugs');
const hashes=JSON.parse(await readFile('component-assets.sha256.json','utf8'));
assert.deepEqual(Object.keys(hashes).sort(),[...manifest.assets].sort(),'Demo hash inventory');
for(const asset of manifest.assets){
 assert.equal(createHash('sha256').update(await readFile(localFile(asset))).digest('hex'),hashes[asset],`${asset} demo changed`);
}
for(const entry of catalog){
 assert(componentRoutes.includes('/components/'+entry.slug),`${entry.slug} route missing`);
 const preview=await readFile(path.join(root,'previews',entry.slug+'.html'),'utf8');
 assert(preview.includes('/morphiq/preview-bridge.js'),`${entry.slug} bridge missing`);
 assert(preview.includes('/morphiq/preview.css'),`${entry.slug} preview style missing`);
 for(const [,uri] of preview.matchAll(/(?:src|href)="([^" ]+)"/g)){
  if(uri.startsWith('/_next/')&&!uri.startsWith('/_next/image'))assert((await stat(localFile(uri))).isFile(),`${entry.slug}: missing ${uri}`);
 }
 const files=JSON.parse(await readFile(path.join(root,'morphiq/source',entry.slug+'.json'),'utf8'));
 assert.equal(files.length,entry.sourceCount,`${entry.slug} source inventory`);
}
for(const file of ['morphiq/app.js','morphiq/preview-bridge.js','recreation-client.js']){
 const code=await readFile(path.join(root,file),'utf8');
 new vm.Script(file==='morphiq/app.js'?`(async()=>{${code}\n})`:code,{filename:file});
}
const css=await readFile(path.join(root,'morphiq/morphiq.css'),'utf8');
for(const [,uri] of css.matchAll(/url\(['"]?(\/[^)'"\s]+)['"]?\)/g))assert((await stat(localFile(uri))).isFile(),`Morphiq style asset missing: ${uri}`);
assert(Array.isArray(JSON.parse(await readFile(path.join(root,'morphiq/glossary.json'),'utf8'))),'Glossary inventory');
assert.equal(problems.length,0,problems.slice(0,30).join('\n'));
console.log(`Verified ${manifest.pages.length} pages, ${componentRoutes.length} component entries, ${manifest.assets.length} demo assets, fonts, and JavaScript syntax.`);
