/* eslint-disable @typescript-eslint/no-require-imports -- Local temporary sharing gateway */
const http=require('node:http');const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const statePath=path.join(process.cwd(),'.data/share/access.json');
const state=JSON.parse(fs.readFileSync(statePath,'utf8'));
const equals=(a,b)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y);};
const page=`<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NovaX · ลิงก์ทดลอง</title><style>body{margin:0;background:#eff6ff;color:#0f172a;font:16px system-ui;display:grid;min-height:100vh;place-items:center}main{width:min(380px,80vw);padding:32px;background:#ffffff;border-radius:20px}input,button{box-sizing:border-box;width:100%;padding:14px;margin:10px 0;border-radius:8px;border:1px solid #bfdbfe;font:inherit}button{background:#93c5fd;cursor:pointer}p{line-height:1.8;color:#475569}</style><main><h1>NovaX</h1><h2>เข้าชมเว็บทดลอง</h2><p>กรอกรหัสเข้าชมที่ได้รับจากเจ้าของโปรเจกต์<br>Enter the access code shared by the owner.</p><form method="post" action="/_share/access"><label for="code">รหัสเข้าชม / Access code</label><input id="code" type="password" name="code" required autocomplete="off"><button>เข้าสู่เว็บไซต์ / Continue</button></form></main></html>`;
const attempts=new Map();
const server=http.createServer((req,res)=>{
 const noCache={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(req.url==='/_share/access'&&req.method==='POST'){
  const ip=String(req.headers['cf-connecting-ip']||req.socket.remoteAddress);const now=Date.now();for(const[k,v]of attempts)if(v.until<now)attempts.delete(k);
  const attempt=attempts.get(ip)||{count:0,until:now+60000};if(++attempt.count>15){res.writeHead(429,noCache);return res.end('Please try again in one minute.');}attempts.set(ip,attempt);
  let body='';req.on('data',chunk=>{body+=chunk;if(body.length>2048)req.destroy();});req.on('end',()=>{if(equals(new URLSearchParams(body).get('code')||'',state.code)){res.writeHead(303,{...noCache,Location:'/', 'Set-Cookie':'lms_share='+state.cookie+'; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=43200'});res.end();}else{res.writeHead(401,{'Content-Type':'text/html; charset=utf-8',...noCache});res.end(page.replace('<h2>','<p>รหัสไม่ถูกต้อง / Incorrect code</p><h2>'));}});return;
 }
 const cookie=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('lms_share='))?.slice(10)||'';
 if(!equals(cookie,state.cookie)){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8',...noCache});return res.end(page);}
 const headers={...req.headers,'x-forwarded-proto':'https'};delete headers.authorization;
 const upstream=http.request({hostname:'127.0.0.1',port:3000,path:req.url,method:req.method,headers},incoming=>{res.writeHead(incoming.statusCode,incoming.headers);incoming.pipe(res);});
 upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502,noCache);res.end('Website is starting. Please try again shortly.');});req.on('aborted',()=>upstream.destroy());req.pipe(upstream);
});server.listen(3001,'127.0.0.1',()=>console.log('Share gateway ready on 127.0.0.1:3001'));
