import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AuthPage() {
  const { user, loading } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { signIn, signUp } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="w-8 h-8 border-2 border-[var(--color-emerald)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (isLogin) {
      const { error } = await signIn(email, password)
      if (error) setError(error)
    } else {
      const { error } = await signUp(email, password, name)
      if (error) {
        setError(error)
      } else {
        setEmailSent(true)
      }
    }
    setSubmitting(false)
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-emerald)]/10 flex items-center justify-center mx-auto mb-6">
            <TrendingUp size={32} className="text-[var(--color-emerald)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">Verifique seu email</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Enviamos um link de confirmação para <span className="text-[var(--color-text-primary)] font-medium">{email}</span>.
            Clique no link para ativar sua conta.
          </p>
          <button
            onClick={() => { setEmailSent(false); setIsLogin(true) }}
            className="btn-primary mx-auto"
          >
            Voltar para Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-primary)]">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-emerald)]/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-emerald)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[var(--color-info)]/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg px-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-emerald)] flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-3xl font-bold text-[var(--color-text-primary)]">controle</span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)] leading-tight mb-4">
            Gerencie suas finanças com
            <span className="text-[var(--color-emerald)]"> inteligência</span>
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
            Dashboard completo, controle de estoque, categorias personalizadas e muito mais.
            Tudo em um só lugar.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: 'Transações', value: '∞' },
              { label: 'Categorias', value: '100+' },
              { label: 'Relatórios', value: 'Tempo Real' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-[var(--color-emerald)]">{stat.value}</div>
                <div className="text-sm text-[var(--color-text-muted)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 lg:max-w-lg flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-emerald)] flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-2xl font-bold text-[var(--color-text-primary)]">controle</span>
          </div>

          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-8">
            {isLogin ? 'Entre com suas credenciais para continuar' : 'Comece a gerenciar suas finanças agora'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="input-field"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field !pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center py-3"
            >
              {submitting ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError('') }}
              className="text-[var(--color-emerald)] font-medium hover:underline"
            >
              {isLogin ? 'Criar conta' : 'Fazer login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
