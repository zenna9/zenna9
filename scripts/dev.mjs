import http from 'node:http';
import fs from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
async function build(){ const module=await import('./build.mjs?version='+Date.now()); await module.build(); }
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await build();
let timer, queue=Promise.resolve();
const rebuild=()=>{clearTimeout(timer);timer=setTimeout(()=>{queue=queue.then(build).catch(console.error);},150);};
for(const item of ['content','public','scripts']) watch(path.join(root,item),{recursive:true},rebuild);
watch(root,(_event,file)=>{if(String(file)==='index.html')rebuild();});
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
http.createServer(async(req,res)=>{
 try{await queue;const url=new URL(req.url,'http://localhost');let target=path.resolve(root,'dist','.'+decodeURIComponent(url.pathname));if(!target.startsWith(path.join(root,'dist')+path.sep)&&target!==path.join(root,'dist'))throw Error();if((await fs.stat(target)).isDirectory())target=path.join(target,'index.html');const body=await fs.readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);}catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('페이지를 찾을 수 없습니다.');}
}).listen(3000,'127.0.0.1',()=>console.log('Local: http://localhost:3000'));
