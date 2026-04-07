import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const APP_URL = process.env.APP_URL || 'http://localhost:5001';
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000;

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
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: emailLower } });

    if (!user) {
      return NextResponse.json({ message: 'Se o email existir, você receberá um link para redefinir a senha.' });
    }

    const existingReset = await prisma.passwordReset.findFirst({
      where: { 
        email: emailLower,
        usedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    if (existingReset) {
      return NextResponse.json({ message: 'Se o email existir, você receberá um link para redefinir a senha.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY);

    await prisma.passwordReset.create({
      data: {
        email: emailLower,
        token: resetToken,
        expiresAt
      }
    });

    const resetLink = `${APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(emailLower)}`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: emailLower,
        subject: 'NSteacher - Recuperação de Senha',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Recuperação de Senha - NSteacher</h2>
            <p>Olá ${user.name},</p>
            <p>Você solicitou a recuperação de sua senha no NSteacher.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <a href="${resetLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Redefinir Senha</a>
            <p style="color: #6b7280; font-size: 14px;">Este link expira em 1 hora.</p>
            <p style="color: #6b7280; font-size: 14px;">Se você não solicitou esta recuperação, ignore este email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px;">NSteacher - Portal do Professor</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return NextResponse.json({ message: 'Se o email existir, você receberá um link para redefinir a senha.' });
    }

    return NextResponse.json({ message: 'Se o email existir, você receberá um link para redefinir a senha.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'Se o email existir, você receberá um link para redefinir a senha.' });
  }
}
