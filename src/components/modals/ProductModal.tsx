import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface ProductModalProps {
  onClose: () => void
  onSaved?: () => void
}

const productCategories = [
  'Eletrônicos', 'Roupas', 'Alimentos', 'Bebidas', 'Beleza',
  'Saúde', 'Casa', 'Esportes', 'Outros'
]

export default function ProductModal({ onClose, onSaved }: ProductModalProps) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [minStockAlert, setMinStockAlert] = useState('5')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    const { error } = await supabase.from('products').insert({
      user_id: user.id,
      name,
      category,
      cost_price: parseFloat(costPrice.replace(',', '.')),
      sell_price: parseFloat(sellPrice.replace(',', '.')),
      quantity: parseInt(quantity),
      min_stock_alert: parseInt(minStockAlert),
    })

    if (!error) {
      onSaved?.()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Novo Produto</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Nome do Produto</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Camiseta, Celular..."
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Categoria</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="select-field"
              required
            >
              <option value="">Selecione</option>
              {productCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Preço de Custo</label>
              <input
                type="text"
                value={costPrice}
                onChange={e => setCostPrice(e.target.value)}
                placeholder="0.00"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Preço de Venda</label>
              <input
                type="text"
                value={sellPrice}
                onChange={e => setSellPrice(e.target.value)}
                placeholder="0.00"
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Qtd Inicial</label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="0"
                className="input-field"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Estoque Mínimo</label>
              <input
                type="number"
                value={minStockAlert}
                onChange={e => setMinStockAlert(e.target.value)}
                placeholder="5"
                className="input-field"
                min="0"
              />
            </div>
          </div>

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
