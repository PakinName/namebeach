import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import { AIError, allowAIRequest } from '@/lib/ai';
import { ollamaSettings } from '@/lib/ollama';
import { courseModel, generationInput, generateCourse, type GenerationEvent } from '@/lib/course-generation';
import { extractCourseReference } from '@/lib/course-reference';
export const runtime = 'nodejs';
export const maxDuration = 900;
let active = false;
export async function POST(request: Request) {
  const session = await getActiveSession();
  const fail = (error: string, status: number) => NextResponse.json({ success: false, error }, { status });
  if (!session || !['TEACHER','ADMIN'].includes(session.user.role)) return fail('FORBIDDEN',403);
  if (Number(request.headers.get('content-length')) > 6 * 1024 * 1024) return fail('FILE_TOO_LARGE',413);
  if (active) return fail('GENERATION_BUSY',409);
  let form: FormData;
  try { form = await request.formData(); } catch { return fail('INVALID_INPUT',400); }
  const parsed = generationInput.safeParse(Object.fromEntries(['title','description','syllabus','language'].map(key=>[key,form.get(key)||''])));
  if (!parsed.success) return fail('INVALID_INPUT',400);
  if (active) return fail('GENERATION_BUSY',409);
  active = true;
  let reference: { text: string; truncated: boolean };
  try {
    const tags = await fetch(ollamaSettings().url+'/api/tags',{signal:AbortSignal.timeout(5000)});
    const data = await tags.json();
    if (!data.models?.some((m: {name:string})=>m.name===courseModel())) { active=false; return fail('MODEL_UNAVAILABLE',503); }
  } catch { active=false; return fail('OLLAMA_OFFLINE',503); }
  try { const file=form.get('reference'); reference=await extractCourseReference(file instanceof File?file:null); }
  catch(error) { active=false; return fail(error instanceof Error?error.message:'INVALID_FILE',400); }
  if (!allowAIRequest(session.user.id)) { active=false; return fail('RATE_LIMITED',429); }
  const abort = new AbortController();
  const signal = AbortSignal.any([request.signal,abort.signal,AbortSignal.timeout(900000)]);
  const encoder = new TextEncoder(); let closed=false;
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: GenerationEvent) => { if(!closed) {try{controller.enqueue(encoder.encode(JSON.stringify(event)+'\n'));}catch{closed=true;abort.abort();}} };
      const heartbeat=setInterval(()=>emit({type:'heartbeat'}),5000);
      try { emit({type:'reference',truncated:reference.truncated}); await generateCourse(parsed.data,reference.text,signal,emit); }
      catch(error) { emit({type:'error',error:signal.aborted?'TIMEOUT':error instanceof AIError?(error.code==='EMPTY_RESPONSE'?'INVALID_DRAFT':error.code):'INVALID_DRAFT'}); }
      finally { clearInterval(heartbeat); active=false; if(!closed){closed=true;controller.close();} }
    },
    cancel(){closed=true;abort.abort();},
  });
  return new Response(stream,{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store','X-Accel-Buffering':'no'}});
}
