'use client'
import { BookOpen, LogOut, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:5001'

export function Header() {
  const [user, setUser] = useState<{name: string; email: string} | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authInitialView, setAuthInitialView] = useState<'login' | 'register'>('login')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setUser(data.user)
          }
        }
      } catch (err) {
        console.error('Error checking session', err)
      } finally {
        setLoading(false)
      }
    }
    checkSession()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Error logging out', error)
    }
  }

  const openLogin = () => {
    setAuthInitialView('login')
    setIsAuthModalOpen(true)
  }

  const openRegister = () => {
    setAuthInitialView('register')
    setIsAuthModalOpen(true)
  }

  const handleEntrarClick = () => {
    window.location.href = '/login'
  }

  return (
    <>
      <ThemeToggle />
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">NSteacher</span>
          </div>
          
          <button 
            className="md:hidden p-2 text-slate-500"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex items-center gap-4 flex-col md:flex-row absolute md:relative top-16 md:top-0 left-0 right-0 bg-white md:bg-transparent p-4 md:p-0 border-b md:border-none`}>
            {!loading && (
              user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      {user.name?.charAt(0) || 'P'}
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden sm:block">
                      {user.name || 'Professor'}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:block">Sair</span>
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={handleEntrarClick}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Entrar
                  </button>
                  <button 
                    onClick={openRegister}
                    className="text-sm font-medium bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                  >
                    Cadastrar
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </header>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialView={authInitialView} 
        onAuthSuccess={() => {
          setIsAuthModalOpen(false)
          window.location.reload()
        }}
      />
    </>
  )
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
  onAuthSuccess: () => void;
}

function AuthModal({ isOpen, onClose, initialView = 'login', onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialView)
  const [view, setView] = useState<'main' | 'verify'>('main')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setMode(initialView)
  }, [initialView, isOpen])

  const handleClose = () => {
    setView('main')
    setEmail('')
    setPassword('')
    setName('')
    setCode('')
    setError('')
    setSuccess('')
    onClose()
  }

  const triggerSendCode = async (userEmail: string) => {
    setView('verify')
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/enviar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('Código enviado! Verifique seu email.')
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar código')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: mode === 'register' ? name : undefined }),
        credentials: 'include'
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (mode === 'register') {
        await triggerSendCode(email)
      } else {
        await triggerSendCode(email)
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCodeRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/validar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include'
      })
      const registerData = await registerRes.json()
      
      if (!registerRes.ok) throw new Error(registerData.error)

      window.location.href = `https://wa.me/5513978266892?text=Olá!%20Gostaria%20de%20contratar%20o%20plano%20NSteacher.%0AMeu%20nome:%20${encodeURIComponent(name)}%0AMeu%20email:%20${encodeURIComponent(email)}`
    } catch (err: any) {
      setError(err.message || 'Código inválido ou expirado')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/validar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (mode === 'register') {
        window.location.href = `https://wa.me/5513978266892?text=Olá!%20Gostaria%20de%20contratar%20o%20plano%20NSteacher.%0AMeu%20nome:%20${encodeURIComponent(name)}%0AMeu%20email:%20${encodeURIComponent(email)}`
      } else {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        })
        const loginData = await loginRes.json()
        
        if (loginData.redirectUrl) {
          window.location.href = loginData.redirectUrl
        } else {
          window.location.href = `${APP_URL}/teacher`
        }
      }
    } catch (err: any) {
      setError(err.message || 'Código inválido ou expirado')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div 
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {view === 'main' && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">
                  {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
                </h2>
                <p className="text-slate-500 mt-2">
                  {mode === 'login' ? 'Entre para acessar seu painel.' : 'Junte-se a milhares de professores.'}
                </p>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

              <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      placeholder="Seu nome completo"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? 'Aguarde...' : (mode === 'login' ? 'Entrar' : 'Cadastrar')}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-slate-500">
                {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                <button 
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="ml-1 text-blue-600 font-medium hover:underline"
                >
                  {mode === 'login' ? 'Cadastre-se' : 'Entre'}
                </button>
              </div>
            </>
          )}

          {view === 'verify' && (
            <div>
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {mode === 'register' ? 'Verifique seu Email' : 'Verificação de Segurança'}
                </h2>
                <p className="text-slate-500 mt-2">
                  Enviamos um código para <br/><span className="font-medium text-slate-900">{email}</span>
                </p>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
              {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg border border-emerald-100">{success}</div>}

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-center text-3xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                />
                <button 
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-2.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? 'Verificando...' : 'Confirmar Acesso'}
                </button>
              </form>
              
              <button 
                onClick={() => triggerSendCode(email)}
                disabled={loading}
                className="mt-6 w-full text-sm text-slate-500 hover:text-slate-700 font-medium disabled:opacity-50"
              >
                Não recebeu? Reenviar código
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
