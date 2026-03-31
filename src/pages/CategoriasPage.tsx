import { useState, useEffect } from 'react'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { getIcon } from '@/lib/icons'
import type { Category } from '@/types'
import CategoryModal from '@/components/modals/CategoryModal'
import { cn } from '@/lib/utils'

export default function CategoriasPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'receita' | 'despesa'>('receita')

  useEffect(() => {
    if (user) loadCategories()
  }, [user?.id])

  async function loadCategories() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (data) setCategories(data)
    setLoading(false)
  }

  async function deleteCategory(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return
    
    // Check if there are transactions using this category
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    if (count && count > 0) {
      alert(`Esta categoria possui ${count} transações vinculadas e não pode ser excluída.`)
      return
    }

    await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id)
    loadCategories()
  }

  const filtered = categories.filter(c => c.type === activeTab)

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
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Categorias</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} />
          Nova Categoria
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('receita')}
          className={cn(
            'px-6 py-2 text-sm font-semibold rounded-md transition-all',
            activeTab === 'receita'
              ? 'bg-[var(--color-emerald)] text-white'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          )}
        >
          Receitas
        </button>
        <button
          onClick={() => setActiveTab('despesa')}
          className={cn(
            'px-6 py-2 text-sm font-semibold rounded-md transition-all',
            activeTab === 'despesa'
              ? 'bg-[var(--color-danger)] text-white'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          )}
        >
          Despesas
        </button>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(cat => {
          const Icon = getIcon(cat.icon)
          return (
            <div key={cat.id} className="card flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}15` }}
                >
                  <Icon size={20} style={{ color: cat.color }} />
                </div>
                <span className="font-medium text-[var(--color-text-primary)]">{cat.name}</span>
              </div>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full card flex flex-col items-center justify-center py-12">
            <Tag size={40} className="text-[var(--color-text-muted)] mb-3" />
            <p className="text-[var(--color-text-muted)] text-sm">Nenhuma categoria encontrada</p>
          </div>
        )}
      </div>

      {showModal && (
        <CategoryModal
          onClose={() => setShowModal(false)}
          onSaved={loadCategories}
          defaultType={activeTab}
        />
      )}
    </div>
  )
}
