import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const BLOCKED_USER_AGENTS = [
  /curl/i,
  /wget/i,
  /python/i,
  /scrapy/i,
  /bot/i,
  /spider/i,
  /crawler/i,
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /hydra/i,
  /burp/i,
  /zap/i,
];

const BLOCKED_PATHS = [
  /\/\.git\//,
  /\/\.env/,
  /\.env$/,
  /wp-admin/,
  /wp-login/,
  /phpinfo/,
  /\.php$/,
  /\.asp$/,
  /\.exe$/,
  /\.bak$/,
  /\.sql$/,
];

export async function wafMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const userAgent = request.headers.get('user-agent') || '';
  const path = request.nextUrl.pathname;
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

  for (const pattern of BLOCKED_USER_AGENTS) {
    if (pattern.test(userAgent)) {
      await logWafBlock('user_agent', clientIp, userAgent, `User-Agent bloqueado: ${userAgent}`);
      return new NextResponse('Acesso negado', { status: 403 });
    }
  }

  for (const pattern of BLOCKED_PATHS) {
    if (pattern.test(path)) {
      await logWafBlock('path', clientIp, userAgent, `Path bloqueado: ${path}`);
      return new NextResponse('Acesso negado', { status: 403 });
    }
  }

  const blockedIp = await prisma.ipBlacklist.findUnique({
    where: { ipAddress: clientIp }
  });
  
  if (blockedIp) {
    if (!blockedIp.expiresAt || blockedIp.expiresAt > new Date()) {
      await logWafBlock('ip_blacklist', clientIp, userAgent, 'IP na blacklist');
      return new NextResponse('Acesso bloqueado', { status: 403 });
    }
  }

  return null;
}

async function logWafBlock(type: string, ip: string, userAgent: string, reason: string) {
  try {
    await prisma.securityAlert.create({
      data: {
        type: `waf_${type}`,
        title: `Bloqueio WAF: ${type}`,
        message: `IP: ${ip}, User-Agent: ${userAgent}, Razão: ${reason}`,
        severity: 'medium',
        metadata: JSON.stringify({ type, ip, userAgent, reason })
      }
    });
  } catch (err) {
    console.error('Erro ao registrar bloqueio WAF:', err);
  }
}

export function isRateLimited(request: NextRequest): { limited: boolean; retryAfter?: number } {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 60;
  
  const key = `rate:${clientIp}`;
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { limited: false };
  }
  
  record.count++;
  
  if (record.count > maxRequests) {
    return { limited: true, retryAfter: Math.ceil((record.resetTime - now) / 1000) };
  }
  
  return { limited: false };
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
