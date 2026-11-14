// Tiny static server for dist/ that behaves like the Render static host:
// /dir and /dir/ serve /dir/index.html, unknown paths get 404 (with dist/404.html if present).
// Usage: node scripts/serve.js [port] [folder]
const http=require('http'),fs=require('fs'),path=require('path'),zlib=require('zlib');
const root=path.resolve(process.argv[3]||path.join(__dirname,'..','dist')),port=+process.argv[2]||8080;
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.xml':'application/xml','.txt':'text/plain','.ico':'image/x-icon','.woff2':'font/woff2','.json':'application/json'};
http.createServer((q,s)=>{
  let p=decodeURIComponent(q.url.split('?')[0]),f=path.join(root,p);
  if(!f.startsWith(root)){s.writeHead(400);return s.end();}
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory()) f=path.join(f,'index.html');
  let code=200; if(!fs.existsSync(f)){code=404; f=path.join(root,'404.html'); if(!fs.existsSync(f)){s.writeHead(404,{'content-type':'text/plain'});return s.end('Not Found');}}
  let b=fs.readFileSync(f); const h={'content-type':types[path.extname(f)]||'application/octet-stream'};
  if(/br/.test(q.headers['accept-encoding']||'')&&/text|xml|javascript|json|svg/.test(h['content-type'])){b=zlib.brotliCompressSync(b);h['content-encoding']='br';}
  s.writeHead(code,h); s.end(b);
}).listen(port,()=>console.log('serving dist on http://localhost:'+port));
