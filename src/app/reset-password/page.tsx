'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Key, Loader2, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    if (!token || !email) {
      router.push('/forgot-password')
    }
  }, [token, email, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          email, 
          newPassword: password 
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/teacher')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha')
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return null
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
            <Key className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Nova Senha</h1>
          <p className="text-slate-600 mt-2">
            Crie uma nova senha segura para sua conta
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Senha Redefinida!</h2>
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
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir Senha'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <ThemeToggle />
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
