import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const APP_URL = process.env.APP_URL || 'http://localhost:5001';

const loginAttempts = new Map<string, { count: number; firstAttempt: number; blockedUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

async function createSession(user: any) {
  const expires = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });
  const cookieStore = await cookies();
  cookieStore.set('session', session, { expires, httpOnly: true, sameSite: 'lax', path: '/' });
}

async function checkLoginAttempts(email: string): Promise<{ allowed: boolean; error?: string }> {
  const attemptKey = email.toLowerCase();
  const now = Date.now();
  
  let attempts = loginAttempts.get(attemptKey);
  if (attempts && now < attempts.blockedUntil) {
    const remainingMs = attempts.blockedUntil - now;
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return { allowed: false, error: `Conta bloqueada temporariamente. Tente novamente em ${remainingMinutes} minuto(s).` };
  }
  
  return { allowed: true };
}

function recordFailedAttempt(email: string): void {
  const attemptKey = email.toLowerCase();
  const now = Date.now();
  
  let attempts = loginAttempts.get(attemptKey);
  if (!attempts || now > attempts.blockedUntil) {
    attempts = { count: 0, firstAttempt: now, blockedUntil: 0 };
  }
  
  attempts.count++;
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.blockedUntil = now + LOCKOUT_DURATION_MS;
  }
  loginAttempts.set(attemptKey, attempts);
}

function clearFailedAttempts(email: string): void {
  loginAttempts.delete(email.toLowerCase());
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();
    const attemptCheck = await checkLoginAttempts(emailLower);
    if (!attemptCheck.allowed) {
      return NextResponse.json({ error: attemptCheck.error }, { status: 429 });
    }

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'edacostabruno@gmail.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';

    if (emailLower === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
      await createSession({ id: 'admin', role: 'admin', name: 'Bruno Eduardo', email: ADMIN_EMAIL });
      clearFailedAttempts(emailLower);
      return NextResponse.json({ 
        user: { id: 'admin', name: 'Bruno Eduardo', email: ADMIN_EMAIL, role: 'admin' },
        redirectUrl: '/admin'
      });
    }

    const user = await prisma.user.findUnique({ where: { email: emailLower } });
    
    if (!user || user.role !== 'teacher') {
      recordFailedAttempt(emailLower);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      recordFailedAttempt(emailLower);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    clearFailedAttempts(emailLower);

    if (user.active !== true) {
      return NextResponse.json({ error: 'Conta ainda não foi ativada pelo administrador. Aguarde a ativação para acessar o sistema.' }, { status: 403 });
    }

    if (user.blocked === true) {
      return NextResponse.json({ error: 'Seu acesso foi bloqueado pelo administrador. Entre em contato para mais informações.' }, { status: 403 });
    }

    if (user.paymentStatus === 'inadimplente') {
      return NextResponse.json({ error: 'Seu acesso foi temporariamente suspenso por falta de pagamento. Entre em contato com o administrador.' }, { status: 403 });
    }

    const accessKey = await prisma.accessKey.findFirst({
      where: { 
        teacherId: user.id,
        status: 'used'
      }
    });

    const nowDate = new Date();
    const hasAccess = accessKey && new Date(accessKey.expiresAt) > nowDate;

    if (!hasAccess) {
      return NextResponse.json({ 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role,
          paymentStatus: user.paymentStatus
        },
        redirectUrl: null,
        needsActivation: true
      });
    }

    await createSession({ 
      id: user.id, 
      role: user.role, 
      name: user.name, 
      email: user.email,
      paymentStatus: user.paymentStatus,
      blocked: user.blocked,
      hasAccess: true
    });

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        paymentStatus: user.paymentStatus
      },
      redirectUrl: `${APP_URL}/teacher`
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
