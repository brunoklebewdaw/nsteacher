'use client';

import { useState, useEffect } from 'react';
import { Shield, Bell, Key, Loader2, CheckCircle, AlertCircle, QrCode, X } from 'lucide-react';
import { get2FASetup, enable2FA, disable2FA, is2FAEnabled } from '@/actions/2fa';
import PushNotificationToggle from '@/components/teacher/PushNotificationToggle';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    check2FAStatus();
  }, []);

  async function check2FAStatus() {
    const enabled = await is2FAEnabled();
    setTwoFactorEnabled(enabled);
    setLoading(false);
  }

  async function handleStartSetup() {
    setLoading(true);
    setError('');
    const data = await get2FASetup();
    if (data) {
      setSetupData(data);
      setShowSetup(true);
    } else {
      setError('2FA já está habilitado');
    }
    setLoading(false);
  }

  async function handleVerifyAndEnable() {
    if (code.length !== 6) {
      setError('Código deve ter 6 dígitos');
      return;
    }

    setVerifying(true);
    setError('');

    const result = await enable2FA(code);
    if (result.success) {
      setSuccess('2FA habilitado com sucesso!');
      setTwoFactorEnabled(true);
      setShowSetup(false);
      setCode('');
    } else {
      setError(result.error || 'Erro ao habilitar 2FA');
    }

    setVerifying(false);
  }

  async function handleDisable() {
    if (code.length !== 6) {
      setError('Código deve ter 6 dígitos');
      return;
    }

    setVerifying(true);
    setError('');

    const result = await disable2FA(code);
    if (result.success) {
      setSuccess('2FA desabilitado com sucesso!');
      setTwoFactorEnabled(false);
      setCode('');
    } else {
      setError(result.error || 'Erro ao desabilitar 2FA');
    }

    setVerifying(false);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500">Gerencie segurança e notificações</p>
      </div>

      <div className="space-y-6">
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Autenticação em Dois Fatores (2FA)</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Adicione uma camada extra de segurança usando um aplicativo autenticador (Google Authenticator, Authy, etc.)
          </p>

          {twoFactorEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">2FA está habilitado</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digite o código para desabilitar
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleDisable}
                    disabled={verifying || code.length !== 6}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Desabilitar'}
                  </button>
                </div>
              </div>
            </div>
          ) : showSetup ? (
            <div className="space-y-4">
              {setupData && (
                <div className="flex flex-col items-center">
                  <img src={setupData.qrCode} alt="QR Code" className="w-48 h-48 mb-4" />
                  <p className="text-sm text-gray-600 text-center mb-2">
                    Escaneie o QR Code com seu aplicativo autenticador
                  </p>
                  <p className="text-xs text-gray-500">
                    Chave secreta: {setupData.secret}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digite o código de 6 dígitos
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleVerifyAndEnable}
                    disabled={verifying || code.length !== 6}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verificar'}
                  </button>
                  <button
                    onClick={() => { setShowSetup(false); setSetupData(null); }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Key className="w-4 h-4" />
              Configurar 2FA
            </button>
          )}

          {error && (
            <div className="flex items-center gap-2 mt-3 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notificações Push</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Receba notificações em tempo real sobre novos avisos, mensagens e alertas de risco dos alunos.
          </p>

          <PushNotificationToggle userId="" />
        </div>
      </div>
    </div>
  );
}
