import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

async function createSession(user: any) {
  const expires = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });
  const cookieStore = await cookies();
  cookieStore.set('session', session, { expires, httpOnly: true, sameSite: 'lax', path: '/' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, email, newPassword } = body;

    if (!token || !email || !newPassword) {
      return NextResponse.json({ error: 'Token, email e nova senha são obrigatórios' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();

    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        email: emailLower,
        token: token,
        usedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    if (!resetRecord) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const user = await prisma.user.update({
      where: { email: emailLower },
      data: { password: hashedPassword }
    });

    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() }
    });

    await createSession({ 
      id: user.id, 
      role: user.role, 
      name: user.name, 
      email: user.email,
      hasAccess: true
    });

    return NextResponse.json({ 
      message: 'Senha redefinida com sucesso',
      redirectUrl: '/teacher'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Erro ao redefinir senha' }, { status: 500 });
  }
}
