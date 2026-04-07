import { prisma } from '@/lib/prisma';

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /eval\s*\(/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /data:/gi,
];

const DANGEROUS_SQL_PATTERNS = [
  /(\bunion\b.*\bselect\b)/i,
  /(\bselect\b.*\bfrom\b)/i,
  /(\binsert\b.*\binto\b)/i,
  /(\bdelete\b.*\bfrom\b)/i,
  /(\bdrop\b.*\btable\b)/i,
  /(\bupdate\b.*\bset\b)/i,
  /(--|\#|\/\*|\*\/)/,
  /(\bor\b.*=.*\bor\b)/i,
  /(\band\b.*=.*\band\b)/i,
];

export function sanitizeInput(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input.trim();
  
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  return sanitized;
}

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input.trim();
  
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a'];
  const tagRegex = /<(\/?)([\w]+)([^>]*)>/g;
  
  sanitized = sanitized.replace(tagRegex, (match, close, tag, attrs) => {
    const lowerTag = tag.toLowerCase();
    if (!allowedTags.includes(lowerTag)) {
      return '';
    }
    
    if (lowerTag === 'a') {
      const hrefMatch = attrs.match(/href=["']([^"']*)["']/);
      if (hrefMatch && (hrefMatch[1].startsWith('http') || hrefMatch[1].startsWith('/'))) {
        return match;
      }
      return '';
    }
    
    return match;
  });
  
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  return sanitized;
}

export function validateSqlInput(input: string | null | undefined): boolean {
  if (!input || typeof input !== 'string') return true;
  
  for (const pattern of DANGEROUS_SQL_PATTERNS) {
    if (pattern.test(input)) {
      return false;
    }
  }
  
  return true;
}

export async function checkSuspiciousIp(ip: string): Promise<{ suspicious: boolean; reason?: string }> {
  if (!ip || ip === 'unknown') {
    return { suspicious: false };
  }
  
  const blocked = await prisma.ipBlacklist.findUnique({
    where: { ipAddress: ip }
  });
  
  if (blocked) {
    if (blocked.expiresAt && blocked.expiresAt < new Date()) {
      await prisma.ipBlacklist.delete({ where: { ipAddress: ip } });
      return { suspicious: false };
    }
    return { suspicious: true, reason: blocked.reason || 'IP bloqueado' };
  }
  
  const recentFailedLogins = await prisma.loginHistory.count({
    where: {
      ipAddress: ip,
      success: false,
      createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }
    }
  });
  
  if (recentFailedLogins >= 10) {
    return { suspicious: true, reason: 'Múltiplas tentativas de login falhas detectadas' };
  }
  
  return { suspicious: false };
}

export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    token += chars[randomValues[i] % chars.length];
  }
  
  return token;
}

export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (!data || data.length <= visibleChars) return '***';
  return '*'.repeat(data.length - visibleChars) + data.slice(-visibleChars);
}
