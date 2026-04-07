import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function getRateLimitKey(request: NextRequest, identifier: string): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  return `${identifier}:${ip}`;
}

export async function checkRateLimit(request: NextRequest, identifier: string): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const key = getRateLimitKey(request, identifier);
  const now = new Date();
  const resetTime = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS);
  
  let record = await prisma.rateLimitEntry.findUnique({
    where: { identifier: key }
  });
  
  if (!record || now > record.resetTime) {
    await prisma.rateLimitEntry.upsert({
      where: { identifier: key },
      create: {
        identifier: key,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        count: 1,
        resetTime
      },
      update: {
        count: 1,
        resetTime
      }
    });
    
    return {
      allowed: true,
      remaining: MAX_ATTEMPTS - 1,
      resetIn: RATE_LIMIT_WINDOW_MS
    };
  }
  
  const newCount = record.count + 1;
  await prisma.rateLimitEntry.update({
    where: { identifier: key },
    data: { count: newCount }
  });
  
  const resetIn = Math.max(0, record.resetTime.getTime() - now.getTime());
  
  return {
    allowed: newCount <= MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - newCount),
    resetIn
  };
}

export async function clearRateLimit(request: NextRequest, identifier: string): Promise<void> {
  const key = getRateLimitKey(request, identifier);
  await prisma.rateLimitEntry.delete({
    where: { identifier: key }
  }).catch(() => {});
}

export async function createRateLimitResponse(request: NextRequest, identifier: string): Promise<NextResponse | null> {
  const { allowed, remaining, resetIn } = await checkRateLimit(request, identifier);
  
  if (!allowed) {
    const response = NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      { status: 429 }
    );
    
    response.headers.set('Retry-After', String(Math.ceil(resetIn / 1000)));
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', String(resetIn));
    
    return response;
  }
  
  return null;
}

export async function cleanupExpiredRateLimits(): Promise<void> {
  const now = new Date();
  await prisma.rateLimitEntry.deleteMany({
    where: {
      resetTime: { lt: now }
    }
  });
}
