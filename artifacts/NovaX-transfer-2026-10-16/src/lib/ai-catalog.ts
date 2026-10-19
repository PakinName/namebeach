import { z } from 'zod';
export const providers=['ollama','gemini','openai','groq','openrouter','huggingface','compatible'] as const;
export type Provider=typeof providers[number];
export type CatalogItem={provider:Provider;models:{id:string;free:boolean}[];status:string};
export function configuration(provider:Provider){
  const configs={ollama:{base:process.env.OLLAMA_BASE_URL||'http://127.0.0.1:11434',key:''},gemini:{base:'https://generativelanguage.googleapis.com/v1beta',key:process.env.GEMINI_API_KEY},openai:{base:'https://api.openai.com/v1',key:process.env.OPENAI_API_KEY},groq:{base:'https://api.groq.com/openai/v1',key:process.env.GROQ_API_KEY},openrouter:{base:'https://openrouter.ai/api/v1',key:process.env.OPENROUTER_API_KEY},huggingface:{base:'https://router.huggingface.co/v1',key:process.env.HUGGINGFACE_API_KEY},compatible:{base:process.env.AI_COMPATIBLE_BASE_URL||'',key:process.env.AI_COMPATIBLE_API_KEY}};
  return configs[provider];
}
let cache:{expires:number;items:CatalogItem[]}|undefined;
export async function modelCatalog():Promise<CatalogItem[]>{
  if(cache&&cache.expires>Date.now())return cache.items;
  const items=await Promise.all((['ollama','gemini'] as const).map(async(provider):Promise<CatalogItem>=>{
    const{base,key}=configuration(provider);
    if(!base||(provider!=='ollama'&&(!key||/your-|replace|changeme|\.\.\./i.test(key))))return{provider,models:[],status:'NOT_CONFIGURED'};
    try{
      const response=await fetch(base.replace(/\/$/,'')+(provider==='ollama'?'/api/tags':'/models'),{headers:provider==='gemini'?{'x-goog-api-key':key!}:key?{Authorization:`Bearer ${key}`}:{},signal:AbortSignal.timeout(5000),cache:'no-store'});
      if(!response.ok)return{provider,models:[],status:response.status===401||response.status===403?'INVALID_KEY':response.status===429?'QUOTA_LIMIT':'UNAVAILABLE'};
      const payload=await response.json();
      let models:{id:string;free:boolean}[]=[];
      if(provider==='ollama')models=z.object({models:z.array(z.object({name:z.string()}))}).parse(payload).models.map(m=>({id:m.name,free:true}));
      else if(provider==='gemini')models=z.object({models:z.array(z.object({name:z.string(),supportedGenerationMethods:z.array(z.string()).optional()}))}).parse(payload).models.filter(m=>m.supportedGenerationMethods?.includes('generateContent') && /^models\/gemini-/.test(m.name) && !/(image|tts|transcribe|audio|robotics|computer-use|customtools|deep-research|omni)/i.test(m.name)).map(m=>({id:m.name.replace(/^models\//,''),free:false}));
      else models=z.object({data:z.array(z.object({id:z.string(),pricing:z.object({prompt:z.string().optional(),completion:z.string().optional()}).optional()}))}).parse(payload).data.filter(m=>!/(whisper|tts|embed|moderation|audio|realtime|image|dall-e|transcribe|search|codex|deep-research)/i.test(m.id)).filter(m=>provider!=='openai'||/^gpt-|^o[134]-/.test(m.id)).map(m=>({id:m.id,free:provider==='openrouter'&&m.pricing?.prompt==='0'&&m.pricing?.completion==='0'}));
      // Server administrators may restrict models further. No arbitrary model or URL from the browser.
      const allow=(process.env[provider.toUpperCase()+'_MODELS'] || (provider==='gemini'?'gemini-3.1-flash-lite':'llama3.2:3b,qwen3:8b')).split(',').map(s=>s.trim());
      if(allow?.length)models=models.filter(m=>allow.includes(m.id));
      const preferred=process.env[provider.toUpperCase()+'_MODEL'];
      models.sort((a,b)=>Number(b.id===preferred)-Number(a.id===preferred)||Number(b.free)-Number(a.free)||a.id.localeCompare(b.id));
      return{provider,models:models.slice(0,100),status:models.length?'AVAILABLE':'NO_MODELS'};
    }catch{return{provider,models:[],status:'UNAVAILABLE'};}
  }));
  cache={expires:Date.now()+30000,items};return items;
}

export async function* streamAnswer(provider:Provider,model:string,messages:{role:string;content:string}[],instructions:string,signal:AbortSignal){
  const{base,key}=configuration(provider);let url=base.replace(/\/$/,'');let body:object;
  if(provider==='ollama'){url+='/api/chat';body={model,stream:true,think:false,messages:[{role:'system',content:instructions},...messages],options:{num_predict:1200,num_ctx:8192}};}
  else if(provider==='gemini'){url+=`/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;body={systemInstruction:{parts:[{text:instructions}]},contents:messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),generationConfig:{maxOutputTokens:1400,...(model.startsWith('gemini-3')?{thinkingConfig:{thinkingLevel:'low'}}:{})}};}
  else{url+='/chat/completions';body={model,stream:true,messages:[{role:'system',content:instructions},...messages],...(provider==='openai'?{max_completion_tokens:1400,store:false}:{max_tokens:1400})};}
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(provider==='gemini'?{'x-goog-api-key':key!}:key?{Authorization:`Bearer ${key}`}:{})},body:JSON.stringify(body),signal});
  if(!response.ok)throw new Error(response.status===429?'QUOTA_LIMIT':response.status===401||response.status===403?'INVALID_KEY':response.status===404?'MODEL_UNAVAILABLE':response.status===503?'PROVIDER_BUSY':'PROVIDER_ERROR');
  if(!response.body)throw new Error('EMPTY_RESPONSE');
  const reader=response.body.getReader(),decoder=new TextDecoder();let pending='',ended=false;
  function parse(line:string){const raw=provider==='ollama'?line:line.startsWith('data:')?line.slice(5).trim():'';if(!raw)return null;if(raw==='[DONE]'){ended=true;return null;}const data=JSON.parse(raw);if(data.error)throw new Error('PROVIDER_ERROR');if(provider==='ollama'){if(data.done)ended=true;return data.message?.content as string|undefined;}if(provider==='gemini'){if(data.candidates?.[0]?.finishReason)ended=true;return(data.candidates?.[0]?.content?.parts||[]).filter((p:{thought?:boolean})=>!p.thought).map((p:{text?:string})=>p.text||'').join('') as string;}if(data.choices?.[0]?.finish_reason)ended=true;return data.choices?.[0]?.delta?.content as string|undefined;}
  try{while(true){const part=await reader.read();pending+=decoder.decode(part.value,{stream:!part.done});const lines=pending.split('\n');pending=lines.pop()||'';for(const line of lines){const text=parse(line.trim());if(typeof text==='string'&&text)yield text;}if(part.done)break;}if(pending.trim()){const text=parse(pending.trim());if(text)yield text;}if(!ended)throw new Error('INCOMPLETE_RESPONSE');}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
