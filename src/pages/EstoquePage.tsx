import { useState, useEffect } from 'react'
import { Plus, Package, AlertTriangle, Search, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, cn } from '@/lib/utils'
import type { Product } from '@/types'
import ProductModal from '@/components/modals/ProductModal'

export default function EstoquePage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) loadProducts()
  }, [user?.id])

  async function loadProducts() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (data) setProducts(data)
    setLoading(false)
  }

  async function deleteProduct(id: string) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    await supabase.from('products').delete().eq('id', id)
    loadProducts()
  }

  const filtered = products.filter(p =>
    searchQuery === '' ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalProducts = products.length
  const lowStockCount = products.filter(p => p.quantity <= p.min_stock_alert).length
  const totalValue = products.reduce((sum, p) => sum + (p.cost_price * p.quantity), 0)

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
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Estoque</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} />
          Novo Produto
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card !p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-[var(--color-info)]" />
            <p className="text-xs text-[var(--color-text-muted)]">Total de Produtos</p>
          </div>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">{totalProducts}</p>
        </div>
        <div className="card !p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-[var(--color-warning)]" />
            <p className="text-xs text-[var(--color-text-muted)]">Estoque Baixo</p>
          </div>
          <p className="text-lg font-bold text-[var(--color-warning)]">{lowStockCount}</p>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Valor Total em Estoque</p>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar produto..."
          className="input-field !pl-9"
        />
      </div>

      {/* Products table */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12">
          <Package size={40} className="text-[var(--color-text-muted)] mb-3" />
          <p className="text-[var(--color-text-muted)] text-sm">
            {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
          </p>
          {!searchQuery && (
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
              <Plus size={16} />
              Adicionar Produto
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="table-container hidden sm:block">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Qtd em Estoque</th>
                  <th>Preço de Custo</th>
                  <th>Preço de Venda</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => {
                  const isLow = product.quantity <= product.min_stock_alert
                  return (
                    <tr key={product.id}>
                      <td className="font-medium">{product.name}</td>
                      <td>
                        <span className="badge bg-[var(--color-info)]/10 text-[var(--color-info)]">
                          {product.category}
                        </span>
                      </td>
                      <td>
                        <span className={isLow ? 'text-[var(--color-warning)] font-semibold' : ''}>
                          {product.quantity}
                        </span>
                      </td>
                      <td>{formatCurrency(product.cost_price)}</td>
                      <td>{formatCurrency(product.sell_price)}</td>
                      <td>
                        <span className={cn(
                          'badge',
                          isLow
                            ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
                            : 'bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]'
                        )}>
                          {product.quantity === 0 ? 'Sem Estoque' : isLow ? 'Baixo' : 'Normal'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filtered.map(product => {
              const isLow = product.quantity <= product.min_stock_alert
              return (
                <div key={product.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm text-[var(--color-text-primary)]">{product.name}</h3>
                    <span className={cn(
                      'badge text-xs',
                      isLow
                        ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
                        : 'bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]'
                    )}>
                      {product.quantity === 0 ? 'Sem Estoque' : isLow ? 'Baixo' : 'Normal'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[var(--color-text-muted)]">Categoria:</span>
                      <span className="ml-1 text-[var(--color-text-primary)]">{product.category}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">Estoque:</span>
                      <span className={cn('ml-1', isLow ? 'text-[var(--color-warning)] font-semibold' : 'text-[var(--color-text-primary)]')}>
                        {product.quantity}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">Custo:</span>
                      <span className="ml-1 text-[var(--color-text-primary)]">{formatCurrency(product.cost_price)}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">Venda:</span>
                      <span className="ml-1 text-[var(--color-text-primary)]">{formatCurrency(product.sell_price)}</span>
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {showModal && (
        <ProductModal onClose={() => setShowModal(false)} onSaved={loadProducts} />
      )}
    </div>
  )
}
