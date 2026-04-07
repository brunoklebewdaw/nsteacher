import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const APP_URL = process.env.APP_URL || 'http://localhost:5001';
const APP_URL_SITE = process.env.APP_URL?.replace(':5001', ':5000') || 'http://localhost:5000';

async function createSession(user: any) {
  const expires = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });
  const cookieStore = await cookies();
  cookieStore.set('session', session, { expires, httpOnly: true, sameSite: 'lax', path: '/' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: emailLower } });
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email já está em uso' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: emailLower,
        password: hashedPassword,
        role: 'teacher',
        paymentStatus: 'pending',
        active: false
      }
    });

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        paymentStatus: 'pending',
        active: false
      },
      pendingApproval: true,
      message: 'Conta criada! Aguarde a ativação pelo administrador.'
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
  }
}