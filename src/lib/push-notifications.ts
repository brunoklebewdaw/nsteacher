'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/actions/auth';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';

export async function getVapidPublicKey(): Promise<string> {
  return VAPID_PUBLIC_KEY;
}

export async function subscribeToPushNotifications(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;
  const endpoint = formData.get('endpoint') as string;
  const p256dh = formData.get('p256dh') as string;
  const auth = formData.get('auth') as string;

  if (!endpoint || !p256dh || !auth) {
    return { error: 'Dados da assinatura incompletos' };
  }

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId },
      create: { userId, endpoint, p256dh, auth }
    });

    return { success: true };
  } catch (err) {
    return { error: 'Erro ao salvar assinatura' };
  }
}

export async function unsubscribeFromPushNotifications(endpoint: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    await prisma.pushSubscription.delete({
      where: { endpoint }
    });
    return { success: true };
  } catch (err) {
    return { error: 'Erro ao remover assinatura' };
  }
}

export async function getUserPushSubscriptions() {
  const session = await getSession();
  if (!session?.user) {
    return [];
  }

  return prisma.pushSubscription.findMany({
    where: { userId: session.user.id }
  });
}

export async function sendPushNotification(userId: string, title: string, body: string, icon?: string) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId }
  });

  if (subscriptions.length === 0) return;

  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPrivateKey) {
    console.warn('VAPID private key not configured');
    return;
  }

  for (const sub of subscriptions) {
    try {
      await sendPush(sub, { title, body, icon });
    } catch (err) {
      console.error('Failed to send push:', err);
    }
  }
}

async function sendPush(subscription: any, payload: any) {
  const webPush = await import('web-push');
  
  webPush.setVapidDetails(
    'mailto:nsteacherbr@gmail.com',
    VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY || ''
  );

  await webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    },
    JSON.stringify(payload)
  );
}

export async function notifyNewMessage(userId: string, fromName: string) {
  await sendPushNotification(
    userId,
    'Nova Mensagem',
    `${fromName} enviou uma mensagem`,
    '/icon.svg'
  );
}

export async function notifyNewGrade(userId: string, studentName: string, subject: string, value: number) {
  await sendPushNotification(
    userId,
    'Nova Nota',
    `${studentName} tirou ${value} em ${subject}`,
    '/icon.svg'
  );
}

export async function notifyRiskAlert(userId: string, studentName: string, average: number) {
  await sendPushNotification(
    userId,
    'Alerta de Risco',
    `${studentName} está com média ${average.toFixed(1)}`,
    '/icon.svg'
  );
}
