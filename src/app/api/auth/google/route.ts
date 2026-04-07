import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || 'http://localhost:5001';

async function createSession(user: any) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });
  const cookieStore = await cookies();
  cookieStore.set('session', session, { expires, httpOnly: true, sameSite: 'lax', path: '/' });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${APP_URL}?error=${error}`);
  }

  if (!code) {
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID || '');
    googleAuthUrl.searchParams.set('redirect_uri', `${APP_URL}/api/auth/google/callback`);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');
    
    return NextResponse.redirect(googleAuthUrl);
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID || '',
        client_secret: GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return NextResponse.redirect(`${APP_URL}?error=token_error`);
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userResponse.json();

    if (!googleUser.email) {
      return NextResponse.redirect(`${APP_URL}?error=no_email`);
    }

    let user = await prisma.user.findUnique({ where: { email: googleUser.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: googleUser.name || googleUser.email.split('@')[0],
          email: googleUser.email,
          password: await bcrypt.hash(googleUser.sub + Date.now(), 12),
          role: 'teacher',
          paymentStatus: 'pending'
        }
      });

      return NextResponse.redirect(`${APP_URL}/activate`);
    }

    if (user.paymentStatus === 'inadimplente') {
      return NextResponse.redirect(`${APP_URL}?error=payment_suspended`);
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
      return NextResponse.redirect(`${APP_URL}/activate`);
    }

    return NextResponse.redirect(`${APP_URL}/teacher`);
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.redirect(`${APP_URL}?error=auth_error`);
  }
}
