import { useState, useEffect } from 'react'
import { X, Wallet, Building2, CreditCard, PiggyBank } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { usePeriod } from '@/contexts/PeriodContext'
import { cn } from '@/lib/utils'
import type { Account } from '@/types'

const iconOptions = [
  { name: 'Wallet', component: Wallet },
  { name: 'Building2', component: Building2 },
  { name: 'CreditCard', component: CreditCard },
  { name: 'PiggyBank', component: PiggyBank },
]

const colorOptions = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1',
]

interface AccountModalProps {
  onClose: () => void
  onSaved?: () => void
  initialAccount?: Account
}

export default function AccountModal({ onClose, onSaved, initialAccount }: AccountModalProps) {
  const { user } = useAuth()
  const { refresh } = usePeriod()
  const [name, setName] = useState('')
  const [type, setType] = useState('banco')
  const [balance, setBalance] = useState('0')
  const [icon, setIcon] = useState('Building2')
  const [color, setColor] = useState('#3b82f6')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialAccount) {
      setName(initialAccount.name)
      setType(initialAccount.type)
      setBalance(initialAccount.balance.toString().replace('.', ','))
      setIcon(initialAccount.icon)
      setColor(initialAccount.color)
    }
  }, [initialAccount])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    const accountData = {
      user_id: user.id,
      name,
      type,
      balance: parseFloat(balance.replace(',', '.')),
      icon,
      color,
    }

    let error;
    if (initialAccount) {
      const { error: updateError } = await supabase
        .from('accounts')
        .update(accountData)
        .eq('id', initialAccount.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('accounts')
        .insert(accountData)
      error = insertError
    }

    if (!error) {
      refresh()
      onSaved?.()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {initialAccount ? 'Editar Conta' : 'Nova Conta'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Nome da Conta</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Nubank, Carteira, Poupança..."
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Saldo da Conta</label>
            <input
              type="text"
              value={balance}
              onChange={e => setBalance(e.target.value)}
              placeholder="0,00"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Tipo de Conta</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="select-field"
            >
              <option value="banco">Conta Corrente / Banco</option>
              <option value="carteira">Dinheiro / Carteira</option>
              <option value="poupanca">Poupança / Investimento</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Ícone</label>
            <div className="flex gap-2">
              {iconOptions.map(opt => {
                const Icon = opt.component
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setIcon(opt.name)}
                    className={cn(
                      'p-3 rounded-lg transition-all flex items-center justify-center border-2',
                      icon === opt.name
                        ? 'border-[var(--color-emerald)] bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]'
                        : 'border-transparent bg-[var(--color-bg-input)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card-hover)]'
                    )}
                  >
                    <Icon size={24} />
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Cor</label>
            <div className="flex gap-2">
              {colorOptions.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-all',
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--color-bg-input)] scale-110' : 'hover:scale-110'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Salvando...' : initialAccount ? 'Atualizar Conta' : 'Criar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
