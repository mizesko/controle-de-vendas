import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) return { error: error.message }

    // Seed default data for new user
    await seedDefaultData()
    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

async function seedDefaultData() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Check if user already has categories
  const { data: existingCats } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (existingCats && existingCats.length > 0) return

  // Seed categories
  const defaultCategories = [
    // Receitas
    { name: 'Ajuste de valor', type: 'receita', icon: 'Banknote', color: '#10b981' },
    { name: 'Venda', type: 'receita', icon: 'ShoppingBag', color: '#0ea5e9' },
    { name: 'Salário', type: 'receita', icon: 'Banknote', color: '#22c55e' },
    { name: 'Devolução', type: 'receita', icon: 'TrendingUp', color: '#d946ef' },
    // Despesas
    { name: 'Contas', type: 'despesa', icon: 'Wallet', color: '#ef4444' },
    { name: 'Saúde', type: 'despesa', icon: 'Heart', color: '#06b6d4' },
    { name: 'Educação', type: 'despesa', icon: 'GraduationCap', color: '#14b8a6' },
    { name: 'Moradia', type: 'despesa', icon: 'Home', color: '#3b82f6' },
    { name: 'Lazer', type: 'despesa', icon: 'Gamepad2', color: '#f59e0b' },
    { name: 'Alimentação', type: 'despesa', icon: 'UtensilsCrossed', color: '#f43f5e' },
  ]

  await supabase.from('categories').insert(
    defaultCategories.map(cat => ({ ...cat, user_id: user.id }))
  )

  // Seed a default account
  await supabase.from('accounts').insert([
    { user_id: user.id, name: 'Carteira', type: 'carteira', balance: 0, icon: 'Wallet', color: '#10b981' },
    { user_id: user.id, name: 'Banco', type: 'banco', balance: 0, icon: 'Building2', color: '#3b82f6' },
  ])
}
