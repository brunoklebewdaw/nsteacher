'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

function LoginForm() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const blocked = searchParams.get('blocked')
    if (blocked === 'true') {
      setError('Seu acesso foi bloqueado pelo administrador. Entre em contato para mais informações.')
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password')
        }),
        credentials: 'include'
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login')
        setLoading(false)
        return
      }

      if (data.needsActivation) {
        window.location.href = '/activate'
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      }
    } catch (err) {
      setError('Erro ao fazer login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <ThemeToggle />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">NSteacher</h1>
          <p className="text-slate-600 mt-2">Portal do Professor</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  required
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Senha</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
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
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Não tem uma conta?{' '}
          <a href="https://wa.me/5513978266892?text=Olá!%20Gostaria%20de%20contratar%20o%20plano%20NSteacher" target="_blank" className="text-blue-600 hover:underline">
            Fale conosco
          </a>
        </p>
      </div>
    </div>
  )
}

export default function LoginSitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <ThemeToggle />
        <div className="animate-pulse flex items-center space-x-2">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-blue-600">NSteacher</span>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
