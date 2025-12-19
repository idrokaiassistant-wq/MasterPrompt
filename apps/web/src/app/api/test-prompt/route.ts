import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenRouter } from '@openrouter/sdk';
import { readCredentials } from '@/lib/credentials';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const runtime = 'nodejs';

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const configuredLimit = Number.parseInt(process.env.PMPRO_RATE_LIMIT_MAX || '20', 10);
    const configuredWindowMs = Number.parseInt(process.env.PMPRO_RATE_LIMIT_WINDOW_MS || '60000', 10);
    const limit = Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 20;
    const windowMs = Number.isFinite(configuredWindowMs) && configuredWindowMs > 0 ? configuredWindowMs : 60000;
    const ip = getClientIp(request);
    const rate = checkRateLimit(`test:${ip}`, limit, windowMs);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Juda ko‘p so‘rov yuborildi. Iltimos, birozdan keyin qayta urinib ko‘ring.' },
        {
          status: 429,
          headers: {
            'Retry-After': rate.retryAfterSeconds.toString(),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(rate.resetAt / 1000)),
          },
        }
      );
    }

    const body = await request.json();
    const { prompt, input, model, temperature, maxTokens } = body;

    if (!prompt || !input || !model) {
      return NextResponse.json({ error: 'prompt, input va model talab qilinadi' }, { status: 400 });
    }

    const promptStr = String(prompt);
    const inputStr = String(input);

    if (!promptStr.trim() || !inputStr.trim()) {
      return NextResponse.json({ error: 'prompt va input bo\'sh bo\'lishi mumkin emas' }, { status: 400 });
    }

    const MAX_LEN = 8000;
    if (promptStr.length > MAX_LEN || inputStr.length > MAX_LEN) {
      return NextResponse.json(
        { error: `prompt yoki input juda uzun (>${MAX_LEN} belgi). Iltimos, qisqartiring.` },
        { status: 400 }
      );
    }

    const rawTemperature = typeof temperature === 'number' ? temperature : Number(temperature);
    const rawMaxTokens = typeof maxTokens === 'number' ? maxTokens : Number(maxTokens);
    const safeTemperature = Number.isFinite(rawTemperature) ? Math.min(Math.max(rawTemperature, 0), 2) : 0.7;
    const safeMaxTokens = Number.isFinite(rawMaxTokens) ? Math.min(Math.max(Math.floor(rawMaxTokens), 1), 8192) : 512;

    const creds = readCredentials(request);
    const isGoogleGemini = String(model).startsWith('google/');

    if (isGoogleGemini) {
      const googleApiKey = creds.googleGeminiKey || process.env.GOOGLE_GEMINI_API_KEY || '';
      if (!googleApiKey) {
        return NextResponse.json(
          { error: 'Google Gemini API key topilmadi. Settings sahifasida key kiriting.' },
          { status: 500 }
        );
      }

      const genAI = new GoogleGenerativeAI(googleApiKey);
      const modelName = String(model).replace(/^google\//, '');
      const genModel = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: safeTemperature,
          maxOutputTokens: safeMaxTokens,
        },
      });

      const fullPrompt = `${prompt}\n\n---\nFoydalanuvchi so'rovi:\n${input}`;
      const result = await genModel.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim() === '') {
        return NextResponse.json({ error: 'Model bo\'sh javob qaytardi' }, { status: 500 });
      }

      return NextResponse.json({ output: text });
    }

    const openRouterApiKey = creds.openRouterKey || process.env.OPENROUTER_API_KEY || '';
    if (!openRouterApiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key topilmadi. Settings sahifasida key kiriting.' },
        { status: 500 }
      );
    }

    const openrouter = new OpenRouter({
      apiKey: openRouterApiKey,
    });

    const response = await openrouter.chat.send({
      model: String(model),
      messages: [
        { role: 'system', content: String(prompt) } as any,
        { role: 'user', content: String(input) } as any,
      ],
      temperature: safeTemperature,
      maxTokens: safeMaxTokens,
      stream: false,
    });

    const output = (response as any).choices?.[0]?.message?.content || '';
    if (!output || output.trim() === '') {
      return NextResponse.json({ error: 'Model bo\'sh javob qaytardi' }, { status: 500 });
    }
    return NextResponse.json({ output });
  } catch (error: any) {
    const message = error?.message || 'Xatolik yuz berdi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
