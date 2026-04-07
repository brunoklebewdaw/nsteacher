import { NextResponse } from 'next/server';
import { subscribeToPushNotifications, getVapidPublicKey } from '@/lib/push-notifications';

export async function GET() {
  const publicKey = await getVapidPublicKey();
  return NextResponse.json({ publicKey });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, p256dh, auth } = body;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const formData = new FormData();
    formData.append('endpoint', endpoint);
    formData.append('p256dh', p256dh);
    formData.append('auth', auth);

    const result = await subscribeToPushNotifications(formData);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json({ error: 'Erro ao criar assinatura' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint é obrigatório' }, { status: 400 });
    }

    const { unsubscribeFromPushNotifications } = await import('@/lib/push-notifications');
    const result = await unsubscribeFromPushNotifications(endpoint);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push unsubscription error:', error);
    return NextResponse.json({ error: 'Erro ao remover assinatura' }, { status: 500 });
  }
}
