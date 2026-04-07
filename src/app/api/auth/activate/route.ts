import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/session';
import { cookies } from 'next/headers';

async function updateSession(user: any) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });
  const cookieStore = await cookies();
  cookieStore.set('session', session, { expires, httpOnly: true, sameSite: 'lax', path: '/' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, email } = body;

    if (!key || key.length !== 12) {
      return NextResponse.json({ error: 'Chave inválida' }, { status: 400 });
    }

    let userId = null;
    
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (sessionCookie) {
      try {
        const { decrypt } = await import('@/lib/session');
        const sessionData = await decrypt(sessionCookie);
        if (sessionData?.user && sessionData.user.id !== 'admin') {
          userId = sessionData.user.id;
        }
      } catch (err) {}
    }

    if (!userId && email) {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (user) {
        userId = user.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name: email.split('@')[0],
            password: '',
            role: 'teacher',
            paymentStatus: 'pending',
            active: false,
            blocked: false
          }
        });
        userId = newUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const accessKey = await prisma.accessKey.findUnique({
      where: { key: key.toUpperCase() }
    });

    if (!accessKey) {
      return NextResponse.json({ error: 'Chave não encontrada' }, { status: 404 });
    }

    if (accessKey.status === 'used' || accessKey.status === 'cancelled') {
      return NextResponse.json({ error: 'Esta chave já foi utilizada ou está cancelada' }, { status: 400 });
    }

    if (new Date() > accessKey.expiresAt) {
      return NextResponse.json({ error: 'Esta chave expirou' }, { status: 400 });
    }

    if (accessKey.emailTarget && accessKey.emailTarget !== email?.toLowerCase()) {
      return NextResponse.json({ error: 'Email não corresponde a esta chave' }, { status: 400 });
    }

    if (accessKey.teacherId && accessKey.teacherId !== userId) {
      return NextResponse.json({ error: 'Esta chave já está vinculada a outro professor' }, { status: 400 });
    }

    await prisma.accessKey.update({
      where: { id: accessKey.id },
      data: { 
        teacherId: userId,
        status: 'used',
        usedAt: new Date()
      }
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { paymentStatus: 'active' }
    });

    await updateSession({ 
      id: userId, 
      role: 'teacher',
      name: user.name,
      email: user.email,
      paymentStatus: 'active',
      blocked: user.blocked,
      hasAccess: true
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Activate error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}