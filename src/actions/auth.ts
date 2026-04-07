'use server';

import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { loginSchema, registerSchema } from '@/lib/schemas';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return headersList.get('x-forwarded-for')?.split(',')[0] || 
         headersList.get('x-real-ip') || 
         'unknown';
}

async function getUserAgent(): Promise<string> {
  const headersList = await headers();
  return headersList.get('user-agent') || 'unknown';
}

async function createSession(user: any, durationMs: number = SESSION_DURATION_MS) {
  const sessionId = `${Date.now()}:${Math.random().toString(36).substring(2)}`;
  const expires = new Date(Date.now() + durationMs);
  const session = await encrypt({ user: { ...user, sessionId }, expires });
  const cookieStore = await cookies();
  cookieStore.set('session', session, { expires, httpOnly: true, sameSite: 'lax', path: '/' });
  
  return sessionId;
}

async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (err) {
    return null;
  }
}

async function checkIpBlacklisted(ip: string): Promise<boolean> {
  const blocked = await prisma.ipBlacklist.findUnique({
    where: { ipAddress: ip }
  });
  
  if (!blocked) return false;
  if (!blocked.expiresAt) return true;
  return blocked.expiresAt > new Date();
}

async function checkLoginAttempts(email: string): Promise<{ blocked: boolean; remainingMinutes: number }> {
  const attemptKey = `login:${email.toLowerCase()}`;
  const now = new Date();
  
  const record = await prisma.rateLimitEntry.findUnique({
    where: { identifier: attemptKey }
  });
  
  if (!record) return { blocked: false, remainingMinutes: 0 };
  
  if (now < record.resetTime && record.count >= MAX_LOGIN_ATTEMPTS) {
    const remainingMs = record.resetTime.getTime() - now.getTime();
    return { blocked: true, remainingMinutes: Math.ceil(remainingMs / 60000) };
  }
  
  if (now > record.resetTime) {
    await prisma.rateLimitEntry.delete({ where: { identifier: attemptKey } }).catch(() => {});
    return { blocked: false, remainingMinutes: 0 };
  }
  
  return { blocked: false, remainingMinutes: 0 };
}

async function recordFailedAttempt(email: string, ip: string): Promise<void> {
  const attemptKey = `login:${email.toLowerCase()}`;
  const now = new Date();
  const resetTime = new Date(now.getTime() + LOCKOUT_DURATION_MS);
  
  const existing = await prisma.rateLimitEntry.findUnique({
    where: { identifier: attemptKey }
  });
  
  if (!existing) {
    await prisma.rateLimitEntry.create({
      data: {
        identifier: attemptKey,
        count: 1,
        resetTime,
        ipAddress: ip
      }
    });
  } else {
    await prisma.rateLimitEntry.update({
      where: { identifier: attemptKey },
      data: {
        count: existing.count + 1,
        resetTime: now > existing.resetTime ? resetTime : existing.resetTime
      }
    });
  }
}

async function clearLoginAttempts(email: string): Promise<void> {
  const attemptKey = `login:${email.toLowerCase()}`;
  await prisma.rateLimitEntry.delete({ where: { identifier: attemptKey } }).catch(() => {});
}

async function createLoginHistory(userId: string, ip: string, userAgent: string, success: boolean) {
  await prisma.loginHistory.create({
    data: {
      userId,
      ipAddress: ip,
      userAgent,
      success
    }
  });
}

async function createSecurityAlert(userId: string | null, type: string, title: string, message: string, severity: string = 'low') {
  await prisma.securityAlert.create({
    data: {
      userId,
      type,
      title,
      message,
      severity
    }
  });
}

function generateTOTP(secret: string, counter: number): string {
  const crypto = require('crypto');
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter));
  
  const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
  hmac.update(buffer);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0x0f;
  const code = (hash.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return code.toString().padStart(6, '0');
}

function verifyTOTP(secret: string, token: string, window: number = 1): boolean {
  const counter = Math.floor(Date.now() / 30000);
  
  for (let i = -window; i <= window; i++) {
    const expectedToken = generateTOTP(secret, counter + i);
    if (expectedToken === token) {
      return true;
    }
  }
  
  return false;
}

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.toLowerCase().trim();
  const password = formData.get('password') as string;
  const clientIp = await getClientIp();
  const userAgent = await getUserAgent();

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return { error: 'Erro de configuração do sistema. Contate o administrador.' };
  }

  const isIpBlocked = await checkIpBlacklisted(clientIp);
  if (isIpBlocked) {
    return { error: 'Acesso bloqueado. Contate o administrador.' };
  }

  const attemptCheck = await checkLoginAttempts(email);
  if (attemptCheck.blocked) {
    return { error: `Conta bloqueada temporariamente. Tente novamente em ${attemptCheck.remainingMinutes} minuto(s).` };
  }

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const sessionId = await createSession({ id: 'admin', role: 'admin', name: 'Admin', email: ADMIN_EMAIL });
    await clearLoginAttempts(email);
    await createLoginHistory('admin', clientIp, userAgent, true);
    redirect('/admin');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== 'teacher') {
    await recordFailedAttempt(email, clientIp);
    return { error: 'Credenciais inválidas' };
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    await recordFailedAttempt(email, clientIp);
    await createLoginHistory(user.id, clientIp, userAgent, false);
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        failedLoginAttempts: { increment: 1 },
        lastFailedAttempt: new Date()
      }
    });
    
    if (user.failedLoginAttempts + 1 >= 3) {
      await createSecurityAlert(
        user.id,
        'failed_login',
        'Múltiplas tentativas de login falhas',
        `O usuário ${email} teve ${user.failedLoginAttempts + 1} tentativas de login falhas.`,
        'medium'
      );
    }
    
    return { error: 'Credenciais inválidas' };
  }

  if (user.twoFactorEnabled && user.twoFactorSecret) {
    const tempSessionId = `temp:${Date.now()}:${Math.random().toString(36).substring(2)}`;
    const cookieStore = await cookies();
    cookieStore.set('temp_2fa', tempSessionId, { 
      httpOnly: true, 
      sameSite: 'lax', 
      path: '/',
      maxAge: 300
    });
    
    return { 
      requires2FA: true, 
      tempSessionId,
      message: 'Código 2FA necessário' 
    };
  }

  return await completeLogin(user, clientIp, userAgent);
}

export async function verify2FALogin(formData: FormData) {
  const code = formData.get('code') as string;
  const cookieStore = await cookies();
  const tempSessionId = cookieStore.get('temp_2fa')?.value;
  const clientIp = await getClientIp();
  const userAgent = await getUserAgent();
  
  if (!tempSessionId || !code) {
    return { error: 'Sessão expirada. Tente login novamente.' };
  }

  const session = await getSession();
  if (!session?.user?.tempId) {
    return { error: 'Sessão expirada. Tente login novamente.' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.tempId }
  });

  if (!user || !user.twoFactorSecret) {
    cookieStore.delete('temp_2fa');
    return { error: 'Erro na verificação 2FA.' };
  }

  const isValid = verifyTOTP(user.twoFactorSecret, code);
  
  if (!isValid) {
    return { error: 'Código inválido' };
  }

  cookieStore.delete('temp_2fa');
  return await completeLogin(user, clientIp, userAgent);
}

async function completeLogin(user: any, clientIp: string, userAgent: string) {
  if (user.paymentStatus === 'inadimplente') {
    return { error: 'Seu acesso foi temporariamente suspenso por falta de pagamento' };
  }

  if (user.blocked === true) {
    return { error: 'Seu acesso foi bloqueado pelo administrador. Entre em contato para mais informações.' };
  }

  const accessKey = await prisma.accessKey.findFirst({
    where: { 
      teacherId: user.id,
      status: 'used'
    }
  });

  const nowDate = new Date();
  const hasAccess = accessKey && new Date(accessKey.expiresAt) > nowDate;

  const sessionId = await createSession({ 
    id: user.id, 
    role: user.role, 
    name: user.name, 
    email: user.email,
    hasAccess: hasAccess
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { 
      lastAccess: new Date(),
      currentSessionId: sessionId,
      failedLoginAttempts: 0
    }
  });

  await createLoginHistory(user.id, clientIp, userAgent, true);
  await clearLoginAttempts(user.email);
  
  if (!user.setupCompleted) {
    redirect('/teacher/setup');
  } else if (!hasAccess) {
    redirect('/activate');
  } else {
    redirect('/teacher');
  }
}

export async function logout() {
  const session = await getSession();
  if (session?.user?.id && session.user.id !== 'admin') {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { currentSessionId: null }
    }).catch(() => {});
  }
  await deleteSession();
  redirect('/login');
}

export async function register(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.toLowerCase().trim();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  const parsed = registerSchema.safeParse({ name, email, password, confirmPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: 'Já existe uma conta com este email' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'teacher',
        paymentStatus: 'active',
        lastPasswordChange: new Date()
      }
    });

    await createSession({ id: user.id, role: user.role, name: user.name, email: user.email });
    redirect('/teacher/setup');
  } catch (err) {
    return { error: 'Erro ao criar conta. Tente novamente.' };
  }
}
