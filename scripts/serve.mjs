// Local development only. No gameplay service, telemetry, or persistent process.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve,extname,sep } from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(path==='/mosaico-nomada'){res.writeHead(302,{Location:'/mosaico-nomada/'});res.end();return;}
  if(!path.startsWith('/mosaico-nomada/'))throw Error('Not found');
  const file=resolve(root,path.slice('/mosaico-nomada/'.length)||'index.html');
  if(!file.startsWith(root+sep))throw Error('Forbidden');
  const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('No encontrado');}
}).listen(8765,'127.0.0.1',()=>console.log('Mosaico Nómada: http://127.0.0.1:8765/mosaico-nomada/'));
