import { z } from 'zod';

export function ollamaSettings() {
  return {
    url: (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''),
    model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
  };
}
export async function getOllamaStatus() {
  const { url, model } = ollamaSettings();
  try {
    const response = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(3000), cache: 'no-store' });
    if (!response.ok) return { ready: false, model, reason: 'OLLAMA_OFFLINE' as const };
    const data = z.object({ models: z.array(z.object({ name: z.string() })) }).parse(await response.json());
    const ready = data.models.some(item => item.name === model || item.name === `${model}:latest`);
    return { ready, model, reason: ready ? null : 'MODEL_UNAVAILABLE' as const };
  } catch { return { ready: false, model, reason: 'OLLAMA_OFFLINE' as const }; }
}

export async function requestOllama(options: { instructions: string; messages: { role: string; content: string }[]; signal: AbortSignal; maxOutputTokens: number; json: boolean }) {
  const { url, model } = ollamaSettings();
  return fetch(`${url}/api/chat`, {
    method: 'POST', signal: options.signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, stream: false, keep_alive: '10m',
      messages: [{ role: 'system', content: options.instructions }, ...options.messages],
      options: { num_ctx: 8192, num_predict: options.maxOutputTokens, temperature: 0.3 },
      ...(options.json ? { format: 'json' } : {}),
    }),
  });
}
