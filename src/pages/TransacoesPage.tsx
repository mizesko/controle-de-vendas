import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownRight, Trash2, Search, CheckCircle2, Circle, Clock, MoreHorizontal, FileText, Pencil, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { usePeriod } from '@/contexts/PeriodContext'
import { formatCurrency, cn } from '@/lib/utils'
import { getIcon } from '@/lib/icons'
import type { Transaction } from '@/types'

export default function TransacoesPage() {
  const { user } = useAuth()
  const { period, refreshKey, refresh } = usePeriod()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'todos' | 'receita' | 'despesa'>('todos')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewingNotes, setViewingNotes] = useState<Transaction | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Transaction | null>(null)

  useEffect(() => {
    if (user) loadTransactions()
  }, [user?.id, period, refreshKey])

  async function loadTransactions() {
    if (!user) return
    setLoading(true)

    const startDate = `${period.year}-${String(period.month + 1).padStart(2, '0')}-01`
    const endMonth = period.month === 11 ? 0 : period.month + 1
    const endYear = period.month === 11 ? period.year + 1 : period.year
    const endDate = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-01`

    const { data } = await supabase
      .from('transactions')
      .select('*, category:categories(*), account:accounts(*)')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lt('date', endDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (data) setTransactions(data)
    setLoading(false)
  }

  async function deleteTransaction(transaction: Transaction, deleteAllFuture: boolean = false) {
    if (!user) return

    setLoading(true)

    try {
      if (deleteAllFuture && transaction.transaction_type === 'recorrente') {
        // Find all identical transactions from this date forward
        // Criteria: same description, amount, type, category, account AND date >= current
        const { data: toDelete } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('description', transaction.description)
          .eq('amount', transaction.amount)
          .eq('type', transaction.type)
          .eq('category_id', transaction.category_id)
          .eq('account_id', transaction.account_id)
          .gte('date', transaction.date)

        if (toDelete && toDelete.length > 0) {
          const ids = toDelete.map(t => t.id)
          await supabase.from('transactions').delete().in('id', ids)

          // Revert account balance for any PAID transactions being deleted
          for (const t of toDelete) {
            if (t.is_paid && t.account_id) {
              const { data: acc } = await supabase.from('accounts').select('balance').eq('id', t.account_id).eq('user_id', user.id).single()
              if (acc) {
                const diff = t.type === 'receita' ? -t.amount : t.amount
                await supabase.from('accounts').update({ balance: acc.balance + diff }).eq('id', t.account_id).eq('user_id', user.id)
              }
            }
          }
        }
      } else {
        await supabase.from('transactions').delete().eq('id', transaction.id).eq('user_id', user.id)

        // Revert account balance
        if (transaction.is_paid && transaction.account_id) {
          const { data: account } = await supabase.from('accounts').select('balance').eq('id', transaction.account_id).eq('user_id', user.id).single()
          if (account) {
            const newBalance = transaction.type === 'receita' ? account.balance - transaction.amount : account.balance + transaction.amount
            await supabase.from('accounts').update({ balance: newBalance }).eq('id', transaction.account_id).eq('user_id', user.id)
          }
        }

        // Revert stock if product was linked
        if (transaction.product_id && transaction.type === 'receita') {
          const { data: product } = await supabase.from('products').select('quantity').eq('id', transaction.product_id).eq('user_id', user.id).single()
          if (product) {
            await supabase.from('products').update({ quantity: product.quantity + 1 }).eq('id', transaction.product_id).eq('user_id', user.id)
          }
        }
      }
    } catch (err) {
      console.error('Error deleting:', err)
    }

    setDeleteConfirm(null)
    loadTransactions()
    refresh()
  }

  async function toggleTransactionStatus(transaction: Transaction) {
    const newStatus = !transaction.is_paid

    // 1. Update transaction
    const { error: transError } = await supabase
      .from('transactions')
      .update({ is_paid: newStatus })
      .eq('id', transaction.id)

    if (transError) return

    // 2. Update account balance
    if (transaction.account_id) {
          const { data: account } = await supabase
            .from('accounts')
            .select('balance')
            .eq('id', transaction.account_id)
            .eq('user_id', user.id)
            .single()

          if (account) {
            let balanceDiff = 0
            if (transaction.type === 'receita') {
              balanceDiff = newStatus ? transaction.amount : -transaction.amount
            } else {
              balanceDiff = newStatus ? -transaction.amount : transaction.amount
            }

            await supabase
              .from('accounts')
              .update({ balance: account.balance + balanceDiff })
              .eq('id', transaction.account_id)
              .eq('user_id', user.id)
          }
    }

    refresh()
  }

  const filtered = transactions.filter(t => {
    const matchesType = filterType === 'todos' || t.type === filterType
    const matchesSearch = searchQuery === '' ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const totalReceitas = transactions.filter(t => t.type === 'receita' && t.is_paid).reduce((s, t) => s + t.amount, 0)
  const totalDespesas = transactions.filter(t => t.type === 'despesa' && t.is_paid).reduce((s, t) => s + t.amount, 0)
  const capitalRetido = transactions.filter(t => t.type === 'receita' && !t.is_paid).reduce((s, t) => s + t.amount, 0)
  const balanco = totalReceitas - totalDespesas

  // Group by date
  const groupedByDate = filtered.reduce((acc, t) => {
    const dateKey = t.date
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(t)
    return acc
  }, {} as Record<string, Transaction[]>)

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--color-emerald)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Transações</h1>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar transação..."
              className="input-field !pl-9"
            />
          </div>

          {/* Filter */}
          <div className="flex bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-0.5">
            {(['todos', 'receita', 'despesa'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  filterType === t
                    ? t === 'receita' ? 'bg-[var(--color-emerald)] text-white' :
                      t === 'despesa' ? 'bg-[var(--color-danger)] text-white' :
                      'bg-[var(--color-bg-card-hover)] text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                {t === 'todos' ? 'Todos' : t === 'receita' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card !p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Receitas</p>
          <p className="text-lg font-bold text-[var(--color-emerald)]">
            {formatCurrency(totalReceitas)}
          </p>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Despesas</p>
          <p className="text-lg font-bold text-[var(--color-danger)]">
            {formatCurrency(totalDespesas)}
          </p>
        </div>
        <div className="card !p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-1 uppercase font-semibold">Capital Retido</p>
              <p className="text-lg font-bold text-[var(--color-text-primary)]">
                {formatCurrency(capitalRetido)}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Aguardando conciliação</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[var(--color-warning)]/10 flex items-center justify-center">
              <Clock size={18} className="text-[var(--color-warning)]" />
            </div>
          </div>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Balanço</p>
          <p className={`text-lg font-bold ${balanco >= 0 ? 'text-[var(--color-emerald)]' : 'text-[var(--color-danger)]'}`}>
            {formatCurrency(balanco)}
          </p>
        </div>
      </div>

      {/* Transactions grouped by date */}
      {sortedDates.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12">
          <p className="text-[var(--color-text-muted)] text-sm">Nenhuma transação encontrada</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => {
            const dateObj = new Date(date + 'T00:00:00')
            const dateLabel = dateObj.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })

            return (
              <div key={date}>
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 px-1">
                  {dateLabel}
                </p>
                <div className="card !p-0 divide-y divide-[var(--color-border)]">
                  {groupedByDate[date].map(transaction => {
                    const Icon = transaction.category ? getIcon(transaction.category.icon) : ArrowUpRight
                    const isReceita = transaction.type === 'receita'

                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between py-3 px-4 hover:bg-[var(--color-bg-card-hover)] transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: (transaction.category?.color || '#6b7280') + '15' }}
                          >
                            <Icon size={18} style={{ color: transaction.category?.color || '#6b7280' }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate flex items-center gap-2">
                              {transaction.description}
                              {transaction.notes && (
                                <span title="Possui anotação" className="flex items-center">
                                  <FileText size={14} className="text-[var(--color-text-muted)]" />
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-2 flex-wrap">
                              <span>{transaction.category?.name}</span>
                              {transaction.account && <span>• {transaction.account.name}</span>}
                              {!transaction.is_paid && (
                                <span className="text-[var(--color-warning)]">• Pendente</span>
                              )}
                              {isReceita && (
                                <span className="flex items-center gap-1 ml-1">
                                  <span className="px-1.5 py-0.5 rounded-full border border-[var(--color-warning)] text-[10px] font-bold text-[var(--color-warning)]">
                                    Emp {formatCurrency(transaction.amount * 0.6)}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded-full border border-[var(--color-emerald)] text-[10px] font-bold text-[var(--color-emerald)]">
                                    Meu {formatCurrency(transaction.amount * 0.4)}
                                  </span>
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleTransactionStatus(transaction)}
                            className={cn(
                              'p-1.5 rounded-md transition-all',
                              transaction.is_paid
                                ? 'text-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/10'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/10'
                            )}
                            title={transaction.is_paid ? 'Marcar como não pago' : 'Marcar como pago'}
                          >
                            {transaction.is_paid ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                          </button>
                          <span className={`text-sm font-semibold whitespace-nowrap ${isReceita ? 'text-[var(--color-emerald)]' : 'text-[var(--color-danger)]'}`}>
                            {isReceita ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                          
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === transaction.id ? null : transaction.id)}
                              className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)] transition-all"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            
                            {openMenuId === transaction.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                                <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden z-50 animate-[scaleIn_0.15s_ease-out]">
                                  {transaction.notes && (
                                    <button
                                      onClick={() => { setViewingNotes(transaction); setOpenMenuId(null) }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
                                    >
                                      <FileText size={14} /> Ver Anotação
                                    </button>
                                  )}
                                  <button
                                    onClick={() => { setDeleteConfirm(transaction); setOpenMenuId(null) }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors border-t border-[var(--color-border)]"
                                  >
                                    <Trash2 size={14} /> Excluir
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Notes Modal */}
      {viewingNotes && (
        <div className="modal-overlay z-50" onClick={() => setViewingNotes(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <FileText size={18} className="text-[var(--color-text-muted)]" />
                Anotação
              </h2>
              <button
                onClick={() => setViewingNotes(null)}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 bg-[var(--color-bg-input)] rounded-lg text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
              {viewingNotes.notes}
            </div>
            
            <button onClick={() => setViewingNotes(null)} className="btn-secondary w-full mt-4 justify-center">
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4 text-[var(--color-danger)]">
              <div className="w-10 h-10 rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <h2 className="text-lg font-bold">Excluir Transação</h2>
            </div>
            
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Como você deseja excluir esta transação?
              {deleteConfirm.transaction_type === 'recorrente' && (
                <span className="block mt-2 font-medium text-[var(--color-text-primary)]">
                  Esta é uma transação recorrente.
                </span>
              )}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => deleteTransaction(deleteConfirm, false)}
                className="w-full btn-secondary justify-center py-3"
              >
                Excluir apenas esta
              </button>
              
              {deleteConfirm.transaction_type === 'recorrente' && (
                <button
                  onClick={() => deleteTransaction(deleteConfirm, true)}
                  className="w-full bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  Excluir esta e todas as futuras
                </button>
              )}
              
              <button
                onClick={() => setDeleteConfirm(null)}
                className="w-full text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] pt-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
