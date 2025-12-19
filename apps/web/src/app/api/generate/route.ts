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

function buildPromptSystem(language: string): string {
  const lang = language || 'uz';
  return `Siz senior prompt injeneri va product designer sifatida javob berasiz.
Til: ${lang}.

Maqsad: foydalanuvchi vazifasiga mos, aniq va bajarilishi oson prompt yaratish.
Chiqish: faqat yakuniy prompt matni, salomlashuv yoki qo'shimcha sharhsiz.

Chiqish formati (majburiy):
1) Rol va vazifa: model nima qiladi.
2) Kontekst: muhim ma'lumotlar, chegaralar, noma'lum bo'lsa so'ramang.
3) Kirishlar: foydalanuvchi kiritishi kerak bo'lgan ma'lumotlar va format.
4) Chiqarish formati: tuzilma (punktlar, jadval, JSON yoki bo'limlar) va til.
5) Cheklovlar: uslub, uzunlik, ton, xavfsizlik va no-go bo'limlar.
6) Tekshiruv: model ishga tushishidan oldin tekshirishi kerak bo'lgan punktlar.
7) Agar ma'lumot yetishmasa, aniq 1–3 ta savol (aks holda savol bermang).

Qoidalar:
- Placeholder, kod bloklari, markup va maxsus tokenlarni o'zgartirmang.
- Keraksiz misollar, salam, izoh qo'shmang.
- Bo'limlarni qisqa va amaliy qiling.`;
}

async function callOpenRouter(apiKey: string, model: string, messages: any[], temperature: number, maxTokens: number, stream: boolean = false) {
  const openrouter = new OpenRouter({
    apiKey: apiKey,
  });

  try {
    if (stream) {
      // Streaming response
      const streamResponse = await openrouter.chat.send({
        model: model,
        messages: messages as any,
        temperature: temperature,
        maxTokens: maxTokens,
        stream: true,
      });

      let fullContent = '';
      for await (const chunk of streamResponse as any) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullContent += content;
        }
      }
      return { choices: [{ message: { content: fullContent } }] };
    } else {
      // Non-streaming response
      const response = await openrouter.chat.send({
        model: model,
        messages: messages as any,
        temperature: temperature,
        maxTokens: maxTokens,
        stream: false,
      });

      return response as any;
    }
  } catch (error: any) {
    const errorMessage = error.message || error.toString() || 'Noma\'lum xatolik';
    throw new Error(`OpenRouter API xatosi: ${errorMessage}`);
  }
}

async function callGoogleGemini(apiKey: string, model: string, prompt: string, temperature: number, maxTokens: number) {
  // Initialize Google Generative AI client
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Map model names from our format to Google API format (2025 models)
  // Using actual model names from https://ai.google.dev/gemini-api/docs/models
  const modelNameMap: Record<string, string[]> = {
    'google/gemini-2.5-flash': [
      'gemini-2.5-flash', // Best price-performance (FREE tier available)
    ],
    'google/gemini-2.5-flash-lite': [
      'gemini-2.5-flash-lite', // Fastest and most cost-efficient (FREE tier available)
    ],
    'google/gemini-2.0-flash': [
      'gemini-2.0-flash', // 1M context window
      'gemini-2.5-flash', // Fallback to newer version
    ],
    'google/gemini-2.5-pro': [
      'gemini-2.5-pro', // State-of-the-art reasoning (billing required)
      'gemini-2.5-flash', // Fallback to free tier
    ],
    'google/gemini-3-pro-preview': [
      'gemini-3-pro-preview', // Best multimodal (billing required)
      'gemini-2.5-flash', // Fallback to free tier
    ],
    // Legacy model mappings (auto-upgrade to new models)
    'google/gemini-1.5-flash': [
      'gemini-2.5-flash', // Upgrade to new generation
    ],
    'google/gemini-1.5-pro': [
      'gemini-2.5-pro', // Upgrade to new generation
      'gemini-2.5-flash', // Fallback to free tier
    ],
    'google/gemini-2.0-flash-exp': [
      'gemini-2.0-flash', // Stable version
      'gemini-2.5-flash', // Fallback to newer version
    ],
  };

  const modelNames = modelNameMap[model] || ['gemini-2.5-flash'];
  let lastError: any = null;
  
  // Try each model name until one works
  for (const modelName of modelNames) {
    try {
      console.log(`Attempting to use Gemini model: ${modelName}`);
      const genModel = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: Math.min(Math.max(temperature, 0), 2),
          maxOutputTokens: Math.min(Math.max(maxTokens, 1), 8192),
        },
      });

      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log(`Successfully used Gemini model: ${modelName}`);
      
      if (!text || text.trim() === '') {
        throw new Error('Javob bo\'sh. Iltimos, qayta urinib ko\'ring.');
      }
      
      return text;
    } catch (error: any) {
      lastError = error;

      // Check error type
      const errorMessage = error.message || error.toString() || '';
      const isQuotaError = errorMessage.includes('quota') ||
                          errorMessage.includes('Quota exceeded') ||
                          errorMessage.includes('free_tier') ||
                          errorMessage.includes('RESOURCE_EXHAUSTED');

      const isNotFoundError = errorMessage.includes('not found') ||
                             errorMessage.includes('NOT_FOUND') ||
                             errorMessage.includes('404');

      console.log(`Error with model ${modelName}: ${errorMessage}`);

      // If it's a quota or not found error and we have more models to try, continue
      if ((isQuotaError || isNotFoundError) && modelNames.indexOf(modelName) < modelNames.length - 1) {
        console.log(`Trying next model...`);
        continue;
      }

      // If it's the last model or a different error, throw
      if (!isQuotaError && !isNotFoundError) {
        throw error;
      }
    }
  }
  
  // If all models failed, provide helpful error message
  if (lastError) {
    const errorMessage = lastError.message || lastError.toString() || '';
    const isQuotaError = errorMessage.includes('quota') || 
                        errorMessage.includes('Quota exceeded') ||
                        errorMessage.includes('free_tier') ||
                        errorMessage.includes('RESOURCE_EXHAUSTED');
    
    if (isQuotaError) {
      const retryMatch = errorMessage.match(/retry in ([\d.]+)s/);
      const retryTime = retryMatch ? `${Math.ceil(parseFloat(retryMatch[1]))} soniyadan keyin qayta urinib ko'ring` : 'bir necha soniyadan keyin qayta urinib ko\'ring';
      
      if (model === 'google/gemini-2.0-flash-exp') {
        throw new Error(`⚠️ Gemini 2.0 Flash (Experimental) billing talab qiladi.\n\n✅ Yechim: Settings sahifasida modelni "Gemini 1.5 Flash (Free)" ga o'zgartiring.\n\nYoki:\n1. Billing yoqing: https://ai.google.dev/pricing\n2. ${retryTime}`);
      }
      
      throw new Error(`Google Gemini API quota tugadi.\n\n✅ Yechimlar:\n1. Settings sahifasida "Gemini 1.5 Flash (Free)" modelini tanlang\n2. Billing yoqing: https://ai.google.dev/pricing\n3. ${retryTime}`);
    }
    
    if (errorMessage.includes('not found') || errorMessage.includes('NOT_FOUND') || errorMessage.includes('404')) {
      // Extract the model name from error message for better debugging
      const modelMatch = errorMessage.match(/models\/([^:]+)/);
      const failedModel = modelMatch ? modelMatch[1] : modelNames[0];
      
      throw new Error(`Google Gemini API xatosi: Model "${failedModel}" topilmadi yoki qo'llab-quvvatlanmaydi.\n\n✅ Yechimlar:\n1. API key to'g'ri va faol ekanligini tekshiring: https://aistudio.google.com/app/apikey\n2. Settings sahifasida "Gemini 1.5 Flash (Free)" modelini tanlang\n3. Mavjud modellarni ko'rish: https://ai.google.dev/gemini-api/docs/models\n\nXato: ${errorMessage.split('\n')[0]}`);
    }
    
    throw new Error(`Google Gemini API xatosi: ${errorMessage}`);
  }
  
  throw new Error('Google Gemini API xatosi: Barcha modellar muvaffaqiyatsiz.');
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
    const rate = checkRateLimit(`generate:${ip}`, limit, windowMs);
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
    const { input, model, temperature, maxTokens, language } = body;

    if (!input || !model) {
      return NextResponse.json(
        { error: 'Input va model talab qilinadi' },
        { status: 400 }
      );
    }

    // Check if using Google Gemini directly
    const isGoogleGemini = model.startsWith('google/');
    
    const creds = readCredentials(request);

    const rawTemperature = typeof temperature === 'number' ? temperature : Number(temperature);
    const rawMaxTokens = typeof maxTokens === 'number' ? maxTokens : Number(maxTokens);

    // Smart default: 2000 or input-based length if input is long (e.g. for translation/summarization of long text)
    // We estimate 1 token ~= 4 chars, and give some buffer.
    const inputBasedTokens = Math.ceil(input.length / 2.5); 
    const defaultMaxTokens = Math.max(2000, Math.min(8192, inputBasedTokens));

    const safeTemperature = Number.isFinite(rawTemperature) ? Math.min(Math.max(rawTemperature, 0), 2) : 0.7;
    const safeMaxTokens = Number.isFinite(rawMaxTokens) ? Math.min(Math.max(Math.floor(rawMaxTokens), 1), 8192) : defaultMaxTokens;
    
    // For Google Gemini, check for Google API key
    if (isGoogleGemini) {
      const googleApiKey = creds.googleGeminiKey || process.env.GOOGLE_GEMINI_API_KEY || '';
      
      if (!googleApiKey || googleApiKey.trim() === '') {
        return NextResponse.json(
          { error: 'Google Gemini API key topilmadi. Iltimos, Settings sahifasida Google Gemini API key kiriting va saqlang.\n\nAPI key olish: https://aistudio.google.com/app/apikey' },
          { status: 500 }
        );
      }

      // Validate API key format
      if (!googleApiKey.trim().startsWith('AIza')) {
        return NextResponse.json(
          { error: 'Noto\'g\'ri Google Gemini API key formati. Key "AIza" bilan boshlanishi kerak.\n\nIltimos, to\'g\'ri API key kiriting: https://aistudio.google.com/app/apikey' },
          { status: 400 }
        );
      }

      const systemPrompt = buildPromptSystem(language);
      const fullPrompt = `${systemPrompt}\n\nFoydalanuvchi so'rovi:\n${input}`;

      try {
        const output = await callGoogleGemini(googleApiKey, model, fullPrompt, safeTemperature, safeMaxTokens);
        return NextResponse.json({ output });
      } catch (error: any) {
        // Return user-friendly error message
        return NextResponse.json(
          { error: error.message || 'Google Gemini API xatosi' },
          { status: 500 }
        );
      }
    }

    // Use OpenRouter for other models
    const openRouterApiKey = creds.openRouterKey || process.env.OPENROUTER_API_KEY || '';
    if (!openRouterApiKey) {
      return NextResponse.json(
        { error: 'API key topilmadi. Iltimos, Settings sahifasida OpenRouter API key kiriting.' },
        { status: 500 }
      );
    }

    const systemPrompt = buildPromptSystem(language);

    const data = await callOpenRouter(
      openRouterApiKey, 
      model, 
      [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: input,
        },
      ],
      safeTemperature, 
      safeMaxTokens,
      false // streaming disabled for now
    );

    const output = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ output });
  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error.message || 'Xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
