import type { NextRequest } from 'next/server';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function nowMs(): number {
  return Date.now();
}

export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const reqAny = request as any;
  if (typeof reqAny.ip === 'string' && reqAny.ip) return reqAny.ip;
  return 'unknown';
}

export function checkRateLimit(key: string, limit: number, windowMs: number): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
} {
  const current = nowMs();
  const bucket = buckets.get(key);

  if (!bucket || current >= bucket.resetAt) {
    const resetAt = current + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - current) / 1000));
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt, retryAfterSeconds };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterSeconds: 0,
  };
}

