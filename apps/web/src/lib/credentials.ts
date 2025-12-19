import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export type StoredCredentials = {
  openRouterKey?: string;
  googleGeminiKey?: string;
};

export const CREDENTIALS_COOKIE_NAME = 'pmpro_creds';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const ENCRYPTION_SECRET_ENV = 'PMPRO_CREDENTIALS_SECRET';

function base64UrlEncode(data: Buffer | string): string {
  const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return buffer
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function base64UrlDecode(data: string): Buffer {
  const normalized = data.replaceAll('-', '+').replaceAll('_', '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, 'base64');
}

function getEncryptionKey(): Buffer | null {
  const secret = process.env[ENCRYPTION_SECRET_ENV];
  if (!secret || secret.trim() === '') return null;
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptPayload(payload: string, key: Buffer): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return base64UrlEncode(Buffer.concat([iv, tag, ciphertext]));
}

function decryptPayload(encoded: string, key: Buffer): string {
  const buffer = base64UrlDecode(encoded);
  if (buffer.length < 12 + 16) throw new Error('Invalid payload');
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const ciphertext = buffer.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

function serializePlain(creds: StoredCredentials): string {
  return `plain.${base64UrlEncode(JSON.stringify(creds))}`;
}

function serializeEncrypted(creds: StoredCredentials, key: Buffer): string {
  return `enc.${encryptPayload(JSON.stringify(creds), key)}`;
}

function parseSerialized(value: string): { mode: 'enc' | 'plain'; payload: string } | null {
  const dotIndex = value.indexOf('.');
  if (dotIndex <= 0) return null;
  const prefix = value.slice(0, dotIndex);
  const payload = value.slice(dotIndex + 1);
  if (prefix !== 'enc' && prefix !== 'plain') return null;
  if (!payload) return null;
  return { mode: prefix, payload };
}

export function readCredentials(request: NextRequest): StoredCredentials {
  const raw = request.cookies.get(CREDENTIALS_COOKIE_NAME)?.value;
  if (!raw) return {};

  try {
    const parsed = parseSerialized(raw);
    if (!parsed) return {};

    if (parsed.mode === 'plain') {
      const json = base64UrlDecode(parsed.payload).toString('utf8');
      const data = JSON.parse(json) as StoredCredentials;
      return {
        openRouterKey: typeof data.openRouterKey === 'string' ? data.openRouterKey : undefined,
        googleGeminiKey: typeof data.googleGeminiKey === 'string' ? data.googleGeminiKey : undefined,
      };
    }

    const key = getEncryptionKey();
    if (!key) return {};
    const json = decryptPayload(parsed.payload, key);
    const data = JSON.parse(json) as StoredCredentials;
    return {
      openRouterKey: typeof data.openRouterKey === 'string' ? data.openRouterKey : undefined,
      googleGeminiKey: typeof data.googleGeminiKey === 'string' ? data.googleGeminiKey : undefined,
    };
  } catch {
    return {};
  }
}

export function writeCredentials(
  response: NextResponse,
  creds: StoredCredentials
): void {
  const normalized: StoredCredentials = {
    openRouterKey: creds.openRouterKey?.trim() || undefined,
    googleGeminiKey: creds.googleGeminiKey?.trim() || undefined,
  };

  if (!normalized.openRouterKey && !normalized.googleGeminiKey) {
    response.cookies.delete(CREDENTIALS_COOKIE_NAME);
    return;
  }

  const encryptionKey = getEncryptionKey();
  const value = encryptionKey
    ? serializeEncrypted(normalized, encryptionKey)
    : serializePlain(normalized);

  response.cookies.set(CREDENTIALS_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export function getCredentialSource(request: NextRequest, type: keyof StoredCredentials): 'cookie' | 'env' | 'none' {
  const creds = readCredentials(request);
  if (type === 'openRouterKey') {
    if (creds.openRouterKey) return 'cookie';
    return process.env.OPENROUTER_API_KEY ? 'env' : 'none';
  }
  if (creds.googleGeminiKey) return 'cookie';
  return process.env.GOOGLE_GEMINI_API_KEY ? 'env' : 'none';
}

