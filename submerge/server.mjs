import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const types={html:'text/html; charset=utf-8',css:'text/css',js:'text/javascript',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',avif:'image/avif',ico:'image/x-icon',woff2:'font/woff2',woff:'font/woff',json:'application/json',txt:'text/plain',mp3:'audio/mpeg',wav:'audio/wav',glb:'model/gltf-binary'};
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json'});res.end('{"error":"Original Motion Garden service unavailable in the local recreation"}');return;}
 let pathname=decodeURIComponent(url.pathname);
 if(pathname==='/_next/image'&&url.searchParams.has('url'))pathname=url.searchParams.get('url');
 let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep))throw Error();
 if(!path.extname(file)&&await stat(file+'.html').then(s=>s.isFile()).catch(()=>false))file+='.html';
 else if((await stat(file)).isDirectory())file=path.join(file,'index.html');
 const data=await readFile(file);res.setHeader('Content-Type',types[file.split('.').pop()]||'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method==='HEAD'){res.end();return;}
 res.end(data);
}catch{res.writeHead(404,{'Content-Type':'text/html'});res.end('<!doctype html><title>Page not found</title><body style="background:#0a090e;color:#eee;font:16px system-ui;padding:48px"><h1>Page not found</h1><a style="color:#bc8bf4" href="/components">Return to the catalog</a></body>');}}).listen(5173,'127.0.0.1',()=>console.log('Motion Garden: http://localhost:5173'));
