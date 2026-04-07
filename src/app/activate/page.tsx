'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Key, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function ActivatePage() {
  const [email, setEmail] = useState('')
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim().toUpperCase(), email: email.trim().toLowerCase() })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao ativar')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/teacher')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Erro ao ativar acesso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <ThemeToggle />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Key className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ativar Acesso</h1>
          <p className="text-slate-600 mt-2">
            Digite a chave de acesso fornecida pelo administrator
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Acesso Ativado!</h2>
              <p className="text-slate-600">Redirecionando para o painel...</p>
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
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  placeholder="seu@email.com"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Chave de Acesso
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXXXXXX"
                  maxLength={12}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-center text-xl tracking-[0.3em] font-mono uppercase"
                />
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Chave de 12 caracteres
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || key.length !== 12 || !email.includes('@')}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ativando...
                  </>
                ) : (
                  'Ativar Acesso'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Não tem uma chave?{' '}
          <a
            href="https://wa.me/5513978266892?text=Olá!%20Gostaria%20de%20contratar%20o%20plano%20NSteacher"
            target="_blank"
            className="text-blue-600 hover:underline"
          >
            Fale conosco
          </a>
        </p>
      </div>
    </div>
  )
}
