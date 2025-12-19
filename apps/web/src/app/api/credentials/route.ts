import { NextRequest, NextResponse } from 'next/server';
import { readCredentials, writeCredentials, type StoredCredentials, getCredentialSource } from '@/lib/credentials';

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

function validateOpenRouterKey(key: string): string | null {
  const trimmed = key.trim();
  if (!trimmed.startsWith('sk-or-v1-')) {
    return 'Noto‘g‘ri OpenRouter API key formati. Key "sk-or-v1-" bilan boshlanishi kerak.';
  }
  if (trimmed.length < 20) {
    return 'OpenRouter API key juda qisqa. Iltimos, to‘g‘ri key kiriting.';
  }
  return null;
}

function validateGoogleGeminiKey(key: string): string | null {
  const trimmed = key.trim();
  if (!trimmed.startsWith('AIza')) {
    return 'Noto‘g‘ri Google Gemini API key formati. Key "AIza" bilan boshlanishi kerak.';
  }
  if (trimmed.length < 20) {
    return 'Google Gemini API key juda qisqa. Iltimos, to‘g‘ri key kiriting.';
  }
  return null;
}

export async function GET(request: NextRequest) {
  const creds = readCredentials(request);
  return NextResponse.json({
    hasOpenRouterKey: Boolean(creds.openRouterKey || process.env.OPENROUTER_API_KEY),
    hasGoogleGeminiKey: Boolean(creds.googleGeminiKey || process.env.GOOGLE_GEMINI_API_KEY),
    sources: {
      openRouter: getCredentialSource(request, 'openRouterKey'),
      googleGemini: getCredentialSource(request, 'googleGeminiKey'),
    },
  });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const updates: Partial<StoredCredentials> = {};

  if (Object.prototype.hasOwnProperty.call(body, 'openRouterKey')) {
    const raw = typeof body.openRouterKey === 'string' ? body.openRouterKey.trim() : '';
    if (raw === '') {
      updates.openRouterKey = undefined;
    } else {
      const error = validateOpenRouterKey(raw);
      if (error) return NextResponse.json({ error }, { status: 400 });
      updates.openRouterKey = raw;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'googleGeminiKey')) {
    const raw = typeof body.googleGeminiKey === 'string' ? body.googleGeminiKey.trim() : '';
    if (raw === '') {
      updates.googleGeminiKey = undefined;
    } else {
      const error = validateGoogleGeminiKey(raw);
      if (error) return NextResponse.json({ error }, { status: 400 });
      updates.googleGeminiKey = raw;
    }
  }

  const existing = readCredentials(request);
  const next: StoredCredentials = { ...existing, ...updates };

  const response = NextResponse.json({
    ok: true,
    hasOpenRouterKey: Boolean(next.openRouterKey || process.env.OPENROUTER_API_KEY),
    hasGoogleGeminiKey: Boolean(next.googleGeminiKey || process.env.GOOGLE_GEMINI_API_KEY),
  });
  writeCredentials(response, next);
  return response;
}

