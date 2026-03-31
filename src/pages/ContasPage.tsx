import { useState, useEffect } from 'react'
import { Plus, Wallet, Trash2, LayoutGrid, List, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { getIcon } from '@/lib/icons'
import { formatCurrency } from '@/lib/utils'
import type { Account } from '@/types'
import AccountModal from '@/components/modals/AccountModal'
import { cn } from '@/lib/utils'

export default function ContasPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined)
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    if (user) loadAccounts()
  }, [user?.id])

  async function loadAccounts() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (data) setAccounts(data)
    setLoading(false)
  }

  async function deleteAccount(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta conta? Todas as transações nela serão afetadas.')) return
    
    // Check if there are transactions using this account
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', id)

    if (count && count > 0) {
      if (!confirm(`Esta conta possui ${count} transações vinculadas. Excluir a conta deletará todas essas transações. Deseja continuar?`)) return
    }

    if (!user) return
    await supabase.from('accounts').delete().eq('id', id).eq('user_id', user.id)
    loadAccounts()
  }

  const openNewModal = () => {
    setEditingAccount(undefined)
    setShowModal(true)
  }

  const openEditModal = (account: Account) => {
    setEditingAccount(account)
    setShowModal(true)
  }

  const totalBalance = accounts.reduce((sum: number, acc: Account) => sum + acc.balance, 0)

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
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Minhas Contas</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-0.5">
            <button
              onClick={() => setViewType('grid')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                viewType === 'grid' ? 'bg-[var(--color-bg-card-hover)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
              )}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewType('list')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                viewType === 'list' ? 'bg-[var(--color-bg-card-hover)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
              )}
            >
              <List size={16} />
            </button>
          </div>
          <button onClick={openNewModal} className="btn-primary">
            <Plus size={16} />
            Nova Conta
          </button>
        </div>
      </div>

      {/* Balance Summary Tooltip Style */}
      <div className="card !p-6 flex items-center justify-between bg-gradient-to-br from-[var(--color-emerald)]/10 to-transparent border-[var(--color-emerald)]/20">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Saldo Total consolidado</p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">{formatCurrency(totalBalance)}</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-emerald)]/20 flex items-center justify-center">
          <Wallet size={32} className="text-[var(--color-emerald)]" />
        </div>
      </div>

      {/* Accounts display */}
      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const Icon = getIcon(acc.icon)
            return (
              <div key={acc.id} className="card group relative overflow-hidden">
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-12 translate-x-12 opacity-10"
                  style={{ backgroundColor: acc.color }}
                />
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${acc.color}15` }}
                  >
                    <Icon size={22} style={{ color: acc.color }} />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                    <button
                      onClick={() => openEditModal(acc)}
                      className="p-2 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-info)] hover:bg-[var(--color-info)]/10"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteAccount(acc.id)}
                      className="p-2 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)]">{acc.name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] capitalize mb-3">{acc.type}</p>
                  <p className="text-xl font-bold text-[var(--color-text-primary)]">{formatCurrency(acc.balance)}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card !p-0 divide-y divide-[var(--color-border)]">
          {accounts.map(acc => {
            const Icon = getIcon(acc.icon)
            return (
              <div key={acc.id} className="flex items-center justify-between p-4 hover:bg-[var(--color-bg-card-hover)] transition-colors group">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${acc.color}15` }}
                  >
                    <Icon size={20} style={{ color: acc.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{acc.name}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] capitalize">{acc.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-[var(--color-text-primary)]">{formatCurrency(acc.balance)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => openEditModal(acc)}
                      className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-info)] hover:bg-[var(--color-info)]/10"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteAccount(acc.id)}
                      className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {accounts.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-12">
          <Wallet size={40} className="text-[var(--color-text-muted)] mb-3" />
          <p className="text-[var(--color-text-muted)] text-sm">Nenhuma conta cadastrada</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
            <Plus size={16} />
            Adicionar Conta
          </button>
        </div>
      )}

      {showModal && (
        <AccountModal
          onClose={() => setShowModal(false)}
          onSaved={loadAccounts}
          initialAccount={editingAccount}
        />
      )}
    </div>
  )
}
