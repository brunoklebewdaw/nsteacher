'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Check, Loader2, AlertCircle } from 'lucide-react';

interface PushNotificationToggleProps {
  userId: string;
}

export default function PushNotificationToggle({ userId }: PushNotificationToggleProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    if (!isSupported) return;
    
    setIsSubscribing(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Permissão de notificação negada');
        setIsSubscribing(false);
        return;
      }

      const publicKeyResponse = await fetch('/api/push/subscription');
      const { publicKey } = await publicKeyResponse.json();

      if (!publicKey) {
        setError('Chave pública não disponível. Configure VAPID keys no servidor.');
        setIsSubscribing(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      await fetch('/api/push/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON())
      });

      setIsSubscribed(true);
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Erro ao ativar notificações');
    } finally {
      setIsSubscribing(false);
    }
  };

  const unsubscribe = async () => {
    setIsSubscribing(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await fetch(`/api/push/subscription?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
          method: 'DELETE'
        });
        await subscription.unsubscribe();
      }
      
      setIsSubscribed(false);
    } catch (err: any) {
      console.error('Unsubscription error:', err);
      setError(err.message || 'Erro ao desativar notificações');
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <BellOff className="w-4 h-4" />
        <span>Notificações não suportadas neste navegador</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Verificando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSubscribed ? (
            <Bell className="w-5 h-5 text-green-600" />
          ) : (
            <BellOff className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isSubscribed ? 'Notificações Ativas' : 'Notificações Inativas'}
            </p>
            <p className="text-xs text-gray-500">
              {isSubscribed 
                ? 'Você receberá alertas sobre novos avisos e mensagens' 
                : 'Ative para receber alertas em tempo real'}
            </p>
          </div>
        </div>
        
        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={isSubscribing}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isSubscribed 
              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubscribing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSubscribed ? (
            'Desativar'
          ) : (
            'Ativar'
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
