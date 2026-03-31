import { useState, useEffect } from 'react'
import { X, Calendar, Repeat } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { usePeriod } from '@/contexts/PeriodContext'
import type { Category, Account } from '@/types'
import { cn } from '@/lib/utils'

interface TransactionModalProps {
  onClose: () => void
  onSaved?: () => void
}

export default function TransactionModal({ onClose, onSaved }: TransactionModalProps) {
  const { user } = useAuth()
  const { refresh } = usePeriod()
  const [type, setType] = useState<'despesa' | 'receita'>('despesa')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [transactionType, setTransactionType] = useState<'unico' | 'recorrente'>('unico')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [isPaid, setIsPaid] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [productId, setProductId] = useState<string | null>(null)
  const [products, setProducts] = useState<{ id: string; name: string; sell_price: number; quantity: number }[]>([])

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user, type])

  async function loadData() {
    if (!user) return

    const [catsRes, accsRes, prodsRes] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', user.id).eq('type', type).order('name'),
      supabase.from('accounts').select('*').eq('user_id', user.id).order('name'),
      supabase.from('products').select('id, name, sell_price, quantity').eq('user_id', user.id).gt('quantity', 0).order('name'),
    ])

    if (catsRes.data) setCategories(catsRes.data)
    if (accsRes.data) {
      setAccounts(accsRes.data)
      if (accsRes.data.length > 0 && !accountId) setAccountId(accsRes.data[0].id)
    }
    if (prodsRes.data) setProducts(prodsRes.data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !categoryId || !accountId) return

    setLoading(true)
    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setLoading(false)
      return
    }

    const records = []
    const baseDate = new Date(`${date}T12:00:00`)
    const iterations = transactionType === 'recorrente' ? 12 : 1

    for (let i = 0; i < iterations; i++) {
      const iterDate = new Date(baseDate)
      iterDate.setMonth(baseDate.getMonth() + i)
      
      const iterDateStr = iterDate.toISOString().split('T')[0]

      records.push({
        user_id: user.id,
        description,
        amount: parsedAmount,
        type,
        category_id: categoryId,
        account_id: accountId,
        date: iterDateStr,
        notes: notes || null,
        is_paid: i === 0 ? isPaid : false,
        transaction_type: transactionType,
        product_id: productId,
      })
    }

    const { error } = await supabase.from('transactions').insert(records)

    if (!error) {
      // Update account balance
      const account = accounts.find(a => a.id === accountId)
      if (account && isPaid) {
        const newBalance = type === 'receita'
          ? account.balance + parsedAmount
          : account.balance - parsedAmount
        await supabase.from('accounts').update({ balance: newBalance }).eq('id', accountId)
      }

      // If linked to a product (sale), decrease stock
      if (productId && type === 'receita') {
        const product = products.find(p => p.id === productId)
        if (product) {
          await supabase.from('products').update({
            quantity: product.quantity - 1
          }).eq('id', productId)
        }
      }

      refresh()
      onSaved?.()
      onClose()
    }
    setLoading(false)
  }

  const handleProductSelection = (pid: string) => {
    setProductId(pid)
    const product = products.find(p => p.id === pid)
    if (product) {
      setDescription(product.name)
      setAmount(product.sell_price.toString())
      // Auto-select "Vendas" category
      const salesCat = categories.find(c => c.name === 'Vendas')
      if (salesCat) setCategoryId(salesCat.id)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Nova Transação</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Type toggle */}
        <div className="flex bg-[var(--color-bg-input)] rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => setType('despesa')}
            className={cn(
              'flex-1 py-2 text-sm font-semibold rounded-md transition-all',
              type === 'despesa'
                ? 'bg-[var(--color-danger)] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setType('receita')}
            className={cn(
              'flex-1 py-2 text-sm font-semibold rounded-md transition-all',
              type === 'receita'
                ? 'bg-[var(--color-emerald)] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            Receita
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product selection for sales */}
          {type === 'receita' && products.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                Produto (opcional)
              </label>
              <select
                value={productId || ''}
                onChange={e => e.target.value ? handleProductSelection(e.target.value) : setProductId(null)}
                className="select-field"
              >
                <option value="">Sem produto vinculado</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Estoque: {p.quantity})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Salário..."
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Valor</label>
            <input
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Categoria</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="select-field"
                required
              >
                <option value="">Selecione</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Conta</label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="select-field"
                required
              >
                {accounts.length === 0 ? (
                  <option value="">Nenhuma conta encontrada</option>
                ) : (
                  accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))
                )}
              </select>
              {accounts.length === 0 && (
                <p className="mt-1 text-xs text-[var(--color-danger)]">Cadastre uma conta primeiro!</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 flex items-center gap-1">
              <Calendar size={14} className="text-[var(--color-emerald)]" /> Data
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 flex items-center gap-1">
              <Repeat size={14} className="text-[var(--color-emerald)]" /> Tipo de Lançamento
            </label>
            <div className="flex bg-[var(--color-bg-input)] rounded-lg p-1">
              <button
                type="button"
                onClick={() => setTransactionType('unico')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all',
                  transactionType === 'unico'
                    ? 'bg-[var(--color-bg-card-hover)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                Único
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('recorrente')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all',
                  transactionType === 'recorrente'
                    ? 'bg-[var(--color-bg-card-hover)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                Recorrente
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Observações (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Adicione uma nota..."
              className="input-field resize-none"
              rows={3}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPaid}
              onChange={e => setIsPaid(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-emerald)] accent-[var(--color-emerald)]"
            />
            <span className="text-sm text-[var(--color-text-secondary)]">Já pago</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
