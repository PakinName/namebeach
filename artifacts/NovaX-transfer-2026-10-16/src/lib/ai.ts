import { z } from 'zod';
import { requestOllama } from './ollama';

export type AIProvider = 'openai' | 'gemini' | 'ollama';
export type ChatTurn = { role: 'user' | 'assistant'; content: string };
export class AIError extends Error {
  constructor(public code: 'NOT_CONFIGURED' | 'RATE_LIMITED' | 'UPSTREAM_ERROR' | 'EMPTY_RESPONSE' | 'TIMEOUT' | 'SERVICE_BUSY' | 'INVALID_KEY' | 'MODEL_UNAVAILABLE' | 'INVALID_REQUEST' | 'QUOTA_EXHAUSTED' | 'OLLAMA_OFFLINE', public status = 502) { super(code); }
}
function usableKey(value?: string) { return !!value?.trim() && value.trim().length > 20 && !/your-|replace|example|changeme|\.\.\./i.test(value); }
export function configuredProviders() { return { ollama: true, openai: usableKey(process.env.OPENAI_API_KEY), gemini: usableKey(process.env.GEMINI_API_KEY) }; }
export function resolveProvider(provider: 'auto' | 'local' | AIProvider): 'local' | AIProvider {
  const configured = configuredProviders();
  if (provider === 'auto') return configured.gemini ? 'gemini' : configured.openai ? 'openai' : 'local';
  if (provider !== 'local' && !configured[provider]) throw new AIError('NOT_CONFIGURED', 503);
  return provider;
}
const openaiResponse = z.object({ output: z.array(z.object({ type: z.string(), content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional() })).optional() });
const geminiResponse = z.object({ candidates: z.array(z.object({ content: z.object({ parts: z.array(z.object({ text: z.string().optional(), thought: z.boolean().optional() })) }).optional() })).optional() });

export async function generateText({ provider, instructions, messages, signal, maxOutputTokens = 1600, document, json = false }: { provider: AIProvider; instructions: string; messages: ChatTurn[]; signal?: AbortSignal; maxOutputTokens?: number; document?: { mimeType: string; data: string }; json?: boolean }) {
  if (!configuredProviders()[provider]) throw new AIError('NOT_CONFIGURED', 503);
  const timeout = AbortSignal.timeout(provider === 'ollama' ? 180_000 : 30_000);
  const requestSignal = signal ? AbortSignal.any([timeout, signal]) : timeout;
  try {
    if (provider === 'ollama' && document) throw new AIError('INVALID_REQUEST', 400);
    const send = () => provider === 'ollama' ? requestOllama({ instructions, messages, signal: requestSignal, maxOutputTokens, json }) : provider === 'openai'
      ? fetch('https://api.openai.com/v1/responses', {
        method: 'POST', signal: requestSignal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', instructions, input: messages, max_output_tokens: maxOutputTokens, store: false }),
      })
      : fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_MODEL || 'gemini-3.8-flash')}:generateContent`, {
        method: 'POST', signal: requestSignal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY! },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: instructions }] }, contents: messages.map((turn, index) => ({ role: turn.role === 'assistant' ? 'model' : 'user', parts: [{ text: turn.content }, ...(document && index === messages.length - 1 ? [{ inlineData: document }] : [])] })), generationConfig: { maxOutputTokens, ...(json ? { responseMimeType: 'application/json' } : {}), ...((process.env.GEMINI_MODEL || 'gemini-3.8-flash').startsWith('gemini-3') ? { thinkingConfig: { thinkingLevel: 'low' } } : {}) } }),
      });
    let response = await send();
    // Retry only explicit temporary service failures, within the same timeout.
    for (let attempt = 0; provider !== 'ollama' && attempt < 2 && [500, 502, 503, 504].includes(response.status); attempt++) {
      await response.body?.cancel();
      await new Promise(resolve => setTimeout(resolve, 600 * (attempt + 1)));
      requestSignal.throwIfAborted();
      response = await send();
    }
    if (!response.ok) {
      // Never log provider payloads: they can include credentials or user content.
      console.warn('AI provider failure', { provider, status: response.status });
      if (response.status === 429) {
        const payload = await response.json().catch(() => null);
        const limit = z.object({ error: z.object({ message: z.string().optional(), details: z.array(z.object({ violations: z.array(z.object({ quotaId: z.string().optional(), quotaValue: z.string().optional() })).optional() })).optional() }).optional() }).safeParse(payload);
        const dailyQuota = limit.success && (limit.data.error?.details?.some(detail => detail.violations?.some(item => /PerDay/i.test(item.quotaId || '') || item.quotaValue === '0')) || /quota|billing|credits/i.test(limit.data.error?.message || ''));
        throw new AIError(dailyQuota ? 'QUOTA_EXHAUSTED' : 'RATE_LIMITED', 429);
      }
      if (response.status === 401 || response.status === 403) throw new AIError('INVALID_KEY', 502);
      if (response.status === 404) throw new AIError('MODEL_UNAVAILABLE', 502);
      if (response.status === 400) throw new AIError('INVALID_REQUEST', 502);
      if (response.status >= 500) throw new AIError('SERVICE_BUSY', 503);
      throw new AIError('UPSTREAM_ERROR');
    }
    const data: unknown = await response.json();
    let reply: string;
    if (provider === 'ollama') {
      reply = z.object({ message: z.object({ content: z.string() }) }).parse(data).message.content;
    } else if (provider === 'openai') {
      const parsed = openaiResponse.parse(data);
      reply = (parsed.output || []).filter(item => item.type === 'message').flatMap(item => item.content || []).filter(part => part.type === 'output_text').map(part => part.text || '').join('\n');
    } else {
      const parsed = geminiResponse.parse(data);
      reply = (parsed.candidates?.[0]?.content?.parts || []).filter(part => !part.thought).map(part => part.text || '').join('\n');
    }
    if (!reply.trim()) throw new AIError('EMPTY_RESPONSE');
    return reply.trim();
  } catch (error) {
    if (error instanceof AIError) throw error;
    if (requestSignal.aborted) throw new AIError('TIMEOUT', 504);
    throw new AIError(provider === 'ollama' ? 'OLLAMA_OFFLINE' : 'UPSTREAM_ERROR', 503);
  }
}

// Per-process protection. Use a shared limiter when deploying multiple instances.
const requests = new Map<string, { count: number; resetAt: number }>();
export function allowAIRequest(userId: string, now = Date.now()) {
  for (const [key, value] of requests) if (value.resetAt <= now) requests.delete(key);
  const entry = requests.get(userId);
  if (entry) { if (entry.count >= 30) return false; entry.count++; return true; }
  if (requests.size >= 5000) return false;
  requests.set(userId, { count: 1, resetAt: now + 10 * 60 * 1000 });
  return true;
}
