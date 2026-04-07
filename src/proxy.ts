import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/session';
import { prisma } from '@/lib/prisma';

const ALLOWED_HOSTS = process.env.ALLOWED_HOSTS 
  ? process.env.ALLOWED_HOSTS.split(',') 
  : ['localhost:5000', 'localhost:5001'];

const protectedRoutes = ['/admin', '/teacher'];
const publicRoutes = ['/login', '/', '/activate'];

async function checkUserAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { active: true, paymentStatus: true }
  });
  
  if (!user) return false;
  if (user.active !== true) return false;
  return user.paymentStatus === 'active';
}

async function checkUserBlocked(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { blocked: true }
  });
  return user?.blocked || false;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const host = request.headers.get('host') || '';
  const isApiRoute = path.startsWith('/api');

  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);
  const isActivateRoute = path === '/activate';

  const cookie = request.cookies.get('session')?.value;
  let session = null;
  
  if (cookie) {
    try {
      session = await decrypt(cookie);
    } catch (err) {
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
      }
    }
  }

  if (isProtectedRoute && !session?.user) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  if (session?.user && session.user.id !== 'admin' && session.user.role !== 'admin' && !isActivateRoute) {
    const isBlocked = await checkUserBlocked(session.user.id);
    
    if (isBlocked) {
      const response = NextResponse.redirect(new URL('/login?blocked=true', request.nextUrl));
      response.cookies.delete('session');
      return response;
    }
    
    const hasAccess = await checkUserAccess(session.user.id);
    if (!hasAccess && !isApiRoute) {
      return NextResponse.redirect(new URL('/activate', request.nextUrl));
    }
  }

  if (isPublicRoute && session?.user && !isActivateRoute) {
    if (session.user.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.nextUrl));
    } else {
      return NextResponse.redirect(new URL('/teacher', request.nextUrl));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
