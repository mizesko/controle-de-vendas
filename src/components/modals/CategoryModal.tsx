import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import {
  Banknote, Laptop, ShoppingBag, TrendingUp, Plus, UtensilsCrossed,
  Car, Home, Heart, GraduationCap, Gamepad2, ShoppingCart, Wrench,
  MoreHorizontal, Briefcase, Gift, Plane, Music, Dumbbell, Coffee,
  Smartphone, BookOpen, Zap, Fuel, Shirt, Dog, Baby, Scissors, Palette,
} from 'lucide-react'

const iconOptions = [
  { name: 'Banknote', component: Banknote },
  { name: 'Laptop', component: Laptop },
  { name: 'ShoppingBag', component: ShoppingBag },
  { name: 'TrendingUp', component: TrendingUp },
  { name: 'Plus', component: Plus },
  { name: 'UtensilsCrossed', component: UtensilsCrossed },
  { name: 'Car', component: Car },
  { name: 'Home', component: Home },
  { name: 'Heart', component: Heart },
  { name: 'GraduationCap', component: GraduationCap },
  { name: 'Gamepad2', component: Gamepad2 },
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'Wrench', component: Wrench },
  { name: 'MoreHorizontal', component: MoreHorizontal },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Gift', component: Gift },
  { name: 'Plane', component: Plane },
  { name: 'Music', component: Music },
  { name: 'Dumbbell', component: Dumbbell },
  { name: 'Coffee', component: Coffee },
  { name: 'Smartphone', component: Smartphone },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Zap', component: Zap },
  { name: 'Fuel', component: Fuel },
  { name: 'Shirt', component: Shirt },
  { name: 'Dog', component: Dog },
  { name: 'Baby', component: Baby },
  { name: 'Scissors', component: Scissors },
  { name: 'Palette', component: Palette },
]

const colorOptions = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#6b7280', '#78716c', '#64748b',
]

interface CategoryModalProps {
  onClose: () => void
  onSaved?: () => void
  defaultType?: 'receita' | 'despesa'
}

export default function CategoryModal({ onClose, onSaved, defaultType = 'receita' }: CategoryModalProps) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [type, setType] = useState<'receita' | 'despesa'>(defaultType)
  const [icon, setIcon] = useState('Banknote')
  const [color, setColor] = useState('#10b981')
  const [customColor, setCustomColor] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    const { error } = await supabase.from('categories').insert({
      user_id: user.id,
      name,
      type,
      icon,
      color: customColor || color,
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
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Nova Categoria</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Nome</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Alimentação, Freelance..."
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Tipo</label>
            <div className="flex bg-[var(--color-bg-input)] rounded-lg p-1">
              <button
                type="button"
                onClick={() => setType('receita')}
                className={cn(
                  'flex-1 py-2 text-sm font-semibold rounded-md transition-all',
                  type === 'receita'
                    ? 'bg-[var(--color-emerald)] text-white'
                    : 'text-[var(--color-text-secondary)]'
                )}
              >
                Receita
              </button>
              <button
                type="button"
                onClick={() => setType('despesa')}
                className={cn(
                  'flex-1 py-2 text-sm font-semibold rounded-md transition-all',
                  type === 'despesa'
                    ? 'bg-[var(--color-danger)] text-white'
                    : 'text-[var(--color-text-secondary)]'
                )}
              >
                Despesa
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Ícone</label>
            <div className="grid grid-cols-8 gap-1.5 p-3 bg-[var(--color-bg-input)] rounded-lg max-h-[140px] overflow-y-auto">
              {iconOptions.map(opt => {
                const Icon = opt.component
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setIcon(opt.name)}
                    className={cn(
                      'p-2 rounded-lg transition-all flex items-center justify-center',
                      icon === opt.name
                        ? 'bg-[var(--color-emerald)]/20 text-[var(--color-emerald)] ring-1 ring-[var(--color-emerald)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-text-primary)]'
                    )}
                  >
                    <Icon size={18} />
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Cor</label>
            <div className="flex flex-wrap gap-2.5 p-3 bg-[var(--color-bg-input)] rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                {colorOptions.slice(0, 10).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setColor(c); setCustomColor('') }}
                    className={cn(
                      'w-10 h-10 rounded-full transition-all flex items-center justify-center',
                      color === c && !customColor ? 'ring-2 ring-[var(--color-emerald)] ring-offset-2 ring-offset-[var(--color-bg-input)] scale-110' : 'hover:scale-105'
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && !customColor && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                  </button>
                ))}
              </div>
              
              <div className="flex-1 min-w-[150px] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">Personalizada:</span>
                  <div className="relative">
                    <input
                      type="color"
                      value={customColor || color}
                      onChange={e => setCustomColor(e.target.value.toUpperCase())}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                  </div>
                  <span className="text-sm font-mono text-[var(--color-text-primary)]">{customColor || color}</span>
                </div>
                
                <input
                  type="text"
                  value={customColor || color}
                  onChange={e => setCustomColor(e.target.value.toUpperCase())}
                  placeholder="#HEX"
                  className="input-field text-sm font-mono"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className={cn(
                "btn-primary flex-1 justify-center py-3",
                type === 'despesa' && "bg-[var(--color-danger)] hover:bg-[var(--color-danger-dark)]"
              )}
            >
              {loading ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
