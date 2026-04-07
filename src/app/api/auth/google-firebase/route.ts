import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/session';
import { cookies } from 'next/headers';

const APP_URL = process.env.APP_URL || 'http://localhost:5001';

async function createSession(user: any) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });
  const cookieStore = await cookies();
  cookieStore.set('session', session, { expires, httpOnly: true, sameSite: 'lax', path: '/' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 });
    }

    const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    const verifyData = await verifyRes.json();

    if (!verifyData.users || verifyData.users.length === 0) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const googleUser = verifyData.users[0];
    const email = googleUser.email;
    const name = googleUser.displayName || email.split('@')[0];

    if (!email) {
      return NextResponse.json({ error: 'Email não disponível' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const bcrypt = await import('bcryptjs');
      const tempPassword = await bcrypt.hash(googleUser.localId + Date.now(), 12);
      
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: tempPassword,
          role: 'teacher',
          paymentStatus: 'pending'
        }
      });

      return NextResponse.json({ 
        redirectToWhatsapp: true,
        user: { id: user.id, name: user.name, email: user.email }
      });
    }

    if (user.paymentStatus === 'inadimplente') {
      return NextResponse.json({ error: 'Seu acesso foi temporariamente suspenso por falta de pagamento' }, { status: 403 });
    }

    if (user.paymentStatus === 'pending') {
      return NextResponse.json({ error: 'Sua conta está aguardando aprovação. Entre em contato com o administrador.' }, { status: 403 });
    }

    const accessKey = await prisma.accessKey.findFirst({
      where: { 
        teacherId: user.id,
        status: 'used'
      }
    });

    const now = new Date();
    const hasAccess = accessKey && new Date(accessKey.expiresAt) > now;

    await createSession({ 
      id: user.id, 
      role: user.role, 
      name: user.name, 
      email: user.email,
      hasAccess
    });

    if (!hasAccess) {
      return NextResponse.json({
        redirectUrl: `${APP_URL}/activate`
      });
    }

    return NextResponse.json({
      redirectUrl: `${APP_URL}/teacher`
    });
  } catch (error) {
    console.error('Firebase Google auth error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
