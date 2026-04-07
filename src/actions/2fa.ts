'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/actions/auth';
import * as QRCode from 'qrcode';
import crypto from 'crypto';

function generateSecret(): string {
  return crypto.randomBytes(20).toString('hex');
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

export async function get2FASetup(): Promise<{ secret: string; qrCode: string; otpauthUrl: string } | null> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) return null;

  if (user.twoFactorEnabled) {
    return null;
  }

  const secret = generateSecret();
  const otpauthUrl = `otpauth://totp/NSteacher:${user.email}?secret=${secret}&issuer=NSteacher`;

  const qrCode = await QRCode.toDataURL(otpauthUrl);

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret }
  });

  return { secret, qrCode, otpauthUrl };
}

export async function verify2FACode(code: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user || !user.twoFactorSecret) {
    return false;
  }

  return verifyTOTP(user.twoFactorSecret, code);
}

export async function enable2FA(code: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) {
    return { success: false, error: 'Usuário não encontrado' };
  }

  if (!user.twoFactorSecret) {
    return { success: false, error: 'Configure 2FA primeiro' };
  }

  const isValid = verifyTOTP(user.twoFactorSecret, code);

  if (!isValid) {
    return { success: false, error: 'Código inválido' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true }
  });

  return { success: true };
}

export async function disable2FA(code: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user || !user.twoFactorEnabled) {
    return { success: false, error: '2FA não está habilitado' };
  }

  const isValid = verifyTOTP(user.twoFactorSecret || '', code);

  if (!isValid) {
    return { success: false, error: 'Código inválido' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { 
      twoFactorEnabled: false,
      twoFactorSecret: null
    }
  });

  return { success: true };
}

export async function is2FAEnabled(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true }
  });

  return user?.twoFactorEnabled || false;
}

export async function send2FACodeByEmail(email: string): Promise<{ success: boolean; error?: string; message?: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    return { success: true, message: 'Se o email existir, você receberá o código' };
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.twoFactorCode.create({
    data: {
      userId: user.id,
      code,
      expiresAt
    }
  });

  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'NSteacher - Código de Verificação',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Código de Verificação - NSteacher</h2>
          <p>Seu código de verificação é:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; text-align: center; padding: 20px;">
            ${code}
          </div>
          <p style="color: #6b7280; font-size: 14px;">Este código expira em 5 minutos.</p>
          <p style="color: #6b7280; font-size: 14px;">Se você não solicitou este código, ignore este email.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Erro ao enviar email' };
  }

  return { success: true };
}

export async function verify2FACodeByEmail(userId: string, code: string): Promise<boolean> {
  const codeRecord = await prisma.twoFactorCode.findFirst({
    where: {
      userId,
      code,
      usedAt: null,
      expiresAt: { gt: new Date() }
    }
  });

  if (!codeRecord) {
    return false;
  }

  await prisma.twoFactorCode.update({
    where: { id: codeRecord.id },
    data: { usedAt: new Date() }
  });

  return true;
}
