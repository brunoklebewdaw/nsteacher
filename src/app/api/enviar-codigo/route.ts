import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { otpStore } from '@/lib/otp-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(email, { code, expiresAt });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"NSteacher" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Seu código de acesso - NSteacher',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Verificação - NSteacher</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); max-width: 600px; width: 100%;">
                  <tr>
                    <td align="center" style="padding: 40px 0 30px 0; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);">
                      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">NSteacher</h1>
                      <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px; font-weight: 500;">Organização Pedagógica Simplificada</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 40px 20px 40px;">
                      <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #1e293b;">Verificação de Segurança</h2>
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #475569;">
                        Olá,<br><br>
                        Recebemos uma solicitação para acessar sua conta no <strong>NSteacher</strong>. Use o código de verificação abaixo para concluir seu login:
                      </p>
                      
                      <div style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 24px; text-align: center; margin-bottom: 24px;">
                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 44px; font-weight: 700; letter-spacing: 16px; color: #2563eb; display: block; margin-left: 16px;">${code}</span>
                      </div>

                      <p style="margin: 0 0 24px 0; font-size: 14px; color: #ef4444; font-weight: 600; text-align: center;">
                        ⏳ Este código expira em 5 minutos.
                      </p>

                      <p style="margin: 0; font-size: 15px; line-height: 24px; color: #475569;">
                        Se você não solicitou este código, por favor ignore este email. Sua conta continuará segura.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 24px 40px 40px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 20px;">
                        &copy; ${new Date().getFullYear()} NSteacher. Todos os direitos reservados.<br>
                        Transformando a gestão pedagógica em resultados reais.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ message: 'Código enviado com sucesso' }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao enviar código:', error);
    
    if (error.message && error.message.includes('Invalid login')) {
      return NextResponse.json({ 
        error: 'Erro de autenticação no servidor de email. Verifique a Senha de App do Google.' 
      }, { status: 500 });
    }

    return NextResponse.json({ error: 'Erro interno ao enviar o código' }, { status: 500 });
  }
}
