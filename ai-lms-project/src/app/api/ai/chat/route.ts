import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// AI Chat endpoint — works with both Gemini and OpenAI
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { message, provider = 'gemini', context } = await request.json();

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const systemPrompt = `You are an AI learning assistant for an educational LMS platform. 
Help students understand course material, explain concepts, and guide their learning. 
Be encouraging, clear, and provide examples when possible.
${context ? `Context: ${context}` : ''}`;

    let reply = '';

    if (provider === 'openai' && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          max_tokens: 1000,
        }),
      });

      const data = await res.json();
      reply = data.choices?.[0]?.message?.content || 'No response from AI.';
    } else if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }] }],
            generationConfig: { maxOutputTokens: 1000 },
          }),
        }
      );

      const data = await res.json();
      reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.';
    } else {
      // Fallback demo response
      reply = `🤖 **AI Assistant** (Demo Mode)\n\nI received your question: "${message}"\n\nTo enable real AI responses, please configure your API keys in .env.local:\n- GEMINI_API_KEY\n- OPENAI_API_KEY\n\nIn the meantime, here are some learning tips:\n1. Break complex topics into smaller parts\n2. Practice with hands-on exercises\n3. Review and repeat for retention`;
    }

    return NextResponse.json({ success: true, data: { reply, provider } });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json({ success: false, error: 'AI service error' }, { status: 500 });
  }
}
