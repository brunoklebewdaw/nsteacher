'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar solicitação')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <ThemeToggle />
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push('/login')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Login
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Esqueceu a Senha?</h1>
          <p className="text-slate-600 mt-2">
            Digite seu email e enviaremos um link para redefinir sua senha
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Email Enviado!</h2>
              <p className="text-slate-600 mb-4">
                Verifique sua caixa de email e siga as instruções para redefinir sua senha.
              </p>
              <p className="text-sm text-slate-500">
                Não recebeu o email? Verifique a pasta de spam ou tente novamente em alguns minutos.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
