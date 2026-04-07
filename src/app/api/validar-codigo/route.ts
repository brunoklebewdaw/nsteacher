import { NextResponse } from 'next/server';
import { otpStore } from '@/lib/otp-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: 'Email e código são obrigatórios' }, { status: 400 });
    }

    const record = otpStore.get(email);

    if (!record) {
      return NextResponse.json({ error: 'Nenhum código encontrado para este email. Solicite um novo.' }, { status: 404 });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return NextResponse.json({ error: 'O código expirou. Solicite um novo.' }, { status: 400 });
    }

    if (record.code !== code) {
      return NextResponse.json({ error: 'Código inválido. Tente novamente.' }, { status: 400 });
    }

    otpStore.delete(email);

    return NextResponse.json({ 
      message: 'Código validado com sucesso',
      success: true 
    }, { status: 200 });

  } catch (error) {
    console.error('Erro ao validar código:', error);
    return NextResponse.json({ error: 'Erro interno ao validar o código' }, { status: 500 });
  }
}
