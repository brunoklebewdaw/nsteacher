import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encrypt, decrypt } from '@/lib/session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ user: null });
    }
    
    const sessionData = await decrypt(sessionCookie);
    
    if (!sessionData?.user) {
      return NextResponse.json({ user: null });
    }
    
    return NextResponse.json({ user: sessionData.user });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ user: null });
  }
}
