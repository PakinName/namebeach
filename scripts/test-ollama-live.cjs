/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node smoke test */
const assert = require('node:assert/strict');
const root = process.env.LMS_TEST_URL || 'http://127.0.0.1:3000';
const cookies = new Map();
async function request(path, options = {}) {
  const response = await fetch(root + path, { ...options, headers: { ...options.headers, cookie: [...cookies].map(([key,value]) => key+'='+value).join('; ') } });
  for (const cookie of response.headers.getSetCookie()) { const [key,...value] = cookie.split(';')[0].split('='); cookies.set(key,value.join('=')); }
  return response;
}
(async () => {
  const csrf = await (await request('/api/auth/csrf')).json();
  await request('/api/auth/callback/credentials', { method:'POST', redirect:'manual', headers:{'content-type':'application/x-www-form-urlencoded'}, body:new URLSearchParams({csrfToken:csrf.csrfToken,email:'student@ailms.com',password:'password123',json:'true'}) });
  const status = await (await request('/api/ai/chat')).json();
  assert.equal(status.data.ollama.ready,true);
  const question = 'ตอบเป็นภาษาไทยสั้น ๆ หนึ่งประโยค: ตัวแปรคืออะไร';
  const start = Date.now();
  const response = await request('/api/ai/chat', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({message:question,provider:'auto',language:'th'}) });
  const result = await response.json();
  assert.equal(response.status,200, result.error); assert.equal(result.data.provider,'ollama'); assert.ok(result.data.reply.trim());
  console.log(JSON.stringify({model:status.data.ollama.model,provider:result.data.provider,seconds:Math.round((Date.now()-start)/1000),reply:result.data.reply}));
  const followup = await request('/api/ai/chat', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:'ขอตัวอย่างหนึ่งบรรทัด',provider:'ollama',language:'th',history:[{role:'user',content:question},{role:'assistant',content:result.data.reply}]})});
  const second = await followup.json(); assert.equal(followup.status,200,second.error); assert.equal(second.data.provider,'ollama');
  console.log(JSON.stringify({followup:true,reply:second.data.reply}));
})().catch(error => { console.error(error.message);process.exitCode=1; });
