import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { usePeriod } from '@/contexts/PeriodContext'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getIcon } from '@/lib/icons'
import type { Transaction, Category, Account } from '@/types'

export default function Dashboard() {
  const { user } = useAuth()
  const { period, refreshKey } = usePeriod()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadData()
  }, [user?.id, period, refreshKey])

  async function loadData() {
    if (!user) return
    setLoading(true)

    const startDate = `${period.year}-${String(period.month + 1).padStart(2, '0')}-01`
    const endMonth = period.month === 11 ? 0 : period.month + 1
    const endYear = period.month === 11 ? period.year + 1 : period.year
    const endDate = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-01`

    const [transRes, catsRes, accsRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, category:categories(*), account:accounts(*)')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lt('date', endDate)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('user_id', user.id),
      supabase.from('accounts').select('*').eq('user_id', user.id),
    ])

    if (transRes.data) setTransactions(transRes.data)
    if (catsRes.data) setCategories(catsRes.data)
    if (accsRes.data) setAccounts(accsRes.data)
    setLoading(false)
  }

  const totalReceitas = transactions
    .filter(t => t.type === 'receita')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalDespesas = transactions
    .filter(t => t.type === 'despesa')
    .reduce((sum, t) => sum + t.amount, 0)

  const paidReceitas = transactions
    .filter(t => t.type === 'receita' && t.is_paid)
    .reduce((sum, t) => sum + t.amount, 0)

  const paidDespesas = transactions
    .filter(t => t.type === 'despesa' && t.is_paid)
    .reduce((sum, t) => sum + t.amount, 0)

  // Group expenses by category for donut chart
  const despesasByCategory = transactions
    .filter(t => t.type === 'despesa' && t.is_paid)
    .reduce((acc, t) => {
      const catName = t.category?.name || 'Outros'
      const catColor = t.category?.color || '#6b7280'
      acc[catName] = { value: (acc[catName]?.value || 0) + t.amount, color: catColor }
      return acc
    }, {} as Record<string, { value: number; color: string }>)

  const receitasByCategory = transactions
    .filter(t => t.type === 'receita' && t.is_paid)
    .reduce((acc, t) => {
      const catName = t.category?.name || 'Outros'
      const catColor = t.category?.color || '#6b7280'
      acc[catName] = { value: (acc[catName]?.value || 0) + t.amount, color: catColor }
      return acc
    }, {} as Record<string, { value: number; color: string }>)

  const despesasChartData = Object.entries(despesasByCategory).map(([name, data]) => ({
    name, value: data.value, color: data.color,
  }))

  const receitasChartData = Object.entries(receitasByCategory).map(([name, data]) => ({
    name, value: data.value, color: data.color,
  }))

  const lastTransactions = transactions.slice(0, 8)
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--color-emerald)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-emerald)]/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-emerald)]/10 flex items-center justify-center">
              <Wallet size={20} className="text-[var(--color-emerald)]" />
            </div>
            <span className="text-sm text-[var(--color-text-secondary)]">Saldo Total</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(totalBalance)}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Todas as contas</p>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-emerald)]/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-emerald)]/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-[var(--color-emerald)]" />
            </div>
            <span className="text-sm text-[var(--color-text-secondary)]">Receitas do Mês</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-emerald)]">{formatCurrency(totalReceitas)}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {formatCurrency(paidReceitas)} recebido
          </p>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-danger)]/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-danger)]/10 flex items-center justify-center">
              <TrendingDown size={20} className="text-[var(--color-danger)]" />
            </div>
            <span className="text-sm text-[var(--color-text-secondary)]">Despesas do Mês</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-danger)]">{formatCurrency(totalDespesas)}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {formatCurrency(paidDespesas)} pago
          </p>
        </div>
      </div>

      {/* Charts + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DonutChart title="Despesas por Categoria" data={despesasChartData} emptyText="Sem despesas" />
          <DonutChart title="Receitas por Categoria" data={receitasChartData} emptyText="Sem receitas" />
        </div>

        {/* Accounts Widget */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Minhas Contas</h3>
            <Link to="/contas" className="text-xs text-[var(--color-emerald)] hover:underline flex items-center gap-1">
              Ver todas <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {accounts.map(account => {
              const Icon = getIcon(account.icon)
              return (
                <div key={account.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-bg-input)] hover:bg-[var(--color-bg-card-hover)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: account.color + '15' }}
                    >
                      <Icon size={18} style={{ color: account.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{account.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)] capitalize">{account.type}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {formatCurrency(account.balance)}
                  </span>
                </div>
              )
            })}
            {accounts.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">Nenhuma conta cadastrada</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Últimas Transações</h3>
        <div className="space-y-1">
          {lastTransactions.map(transaction => {
            const Icon = transaction.category ? getIcon(transaction.category.icon) : Wallet
            const isReceita = transaction.type === 'receita'
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-[var(--color-bg-input)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: (transaction.category?.color || '#6b7280') + '15' }}
                  >
                    <Icon size={18} style={{ color: transaction.category?.color || '#6b7280' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{transaction.description}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {transaction.category?.name} • {transaction.account?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${isReceita ? 'text-[var(--color-emerald)]' : 'text-[var(--color-danger)]'}`}>
                    {isReceita ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
            )
          })}
          {lastTransactions.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
              Nenhuma transação neste mês
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function DonutChart({ title, data, emptyText }: { title: string; data: { name: string; value: number; color: string }[]; emptyText: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase">{title}</h3>
      </div>
      
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-sm text-[var(--color-text-muted)]">{emptyText}</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="h-[200px] w-full sm:w-[200px] shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="var(--color-bg-card)"
                  strokeWidth={4}
                  cornerRadius={6}
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--color-text-primary)',
                  }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 w-full space-y-2">
            {data.slice(0, 5).map((item, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-2.5 rounded-lg bg-[var(--color-bg-input)]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[120px]" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">{formatCurrency(item.value)}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{((item.value / total) * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
