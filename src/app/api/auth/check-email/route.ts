import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email já está em uso', exists: true }, { status: 400 });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
