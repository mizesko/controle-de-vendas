import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { usePeriod } from '@/contexts/PeriodContext'
import { formatCurrency, cn } from '@/lib/utils'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function MetricasPage() {
  const { user } = useAuth()
  const { period, refreshKey } = usePeriod()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadData()
  }, [user?.id, period, refreshKey])

  async function loadData() {
    if (!user) return
    setLoading(true)

    // Calculate start date (6 months ago)
    let startMonth = period.month - 5
    let startYear = period.year
    if (startMonth < 0) {
      startMonth += 12
      startYear -= 1
    }
    
    // Day 1 of the start month
    const startDate = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-01`
    
    // Day 1 of the month AFTER the selected period month (to get everything up to end of selected period)
    const endMonth = period.month === 11 ? 0 : period.month + 1
    const endYear = period.month === 11 ? period.year + 1 : period.year
    const endDate = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-01`

    const { data } = await supabase
      .from('transactions')
      .select('*, category:categories(name), product:products(name)')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lt('date', endDate)

    if (data) setTransactions(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--color-emerald)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // --- Calculations for 6-months chart ---
  const last6MonthsInfo = Array.from({ length: 6 }).map((_, i) => {
    let m = period.month - 5 + i
    let y = period.year
    if (m < 0) {
      m += 12
      y -= 1
    }
    return {
      monthIndex: m,
      year: y,
      label: monthsNames[m],
      key: `${y}-${String(m + 1).padStart(2, '0')}`
    }
  })

  const monthlyChartData = last6MonthsInfo.map(info => {
    const monthTx = transactions.filter(t => t.date.startsWith(info.key) && t.is_paid)
    const receitas = monthTx.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0)
    const despesas = monthTx.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0)
    return {
      name: info.label,
      Receitas: receitas,
      Despesas: despesas,
      Lucro: receitas - despesas
    }
  })

  // --- Calculations for current period vs previous period ---
  const currentMonthKey = `${period.year}-${String(period.month + 1).padStart(2, '0')}`
  let prevMonthM = period.month - 1
  let prevMonthY = period.year
  if (prevMonthM < 0) { prevMonthM = 11; prevMonthY -= 1; }
  const prevMonthKey = `${prevMonthY}-${String(prevMonthM + 1).padStart(2, '0')}`

  const currentTx = transactions.filter(t => t.date.startsWith(currentMonthKey) && t.is_paid)
  const prevTx = transactions.filter(t => t.date.startsWith(prevMonthKey) && t.is_paid)

  const curReceitas = currentTx.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0)
  const prevReceitas = prevTx.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0)
  
  const curDespesas = currentTx.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0)
  const prevDespesas = prevTx.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0)

  const curLucro = curReceitas - curDespesas
  const prevLucro = prevReceitas - prevDespesas

  const curVendasCount = currentTx.filter(t => t.type === 'receita').length
  const prevVendasCount = prevTx.filter(t => t.type === 'receita').length

  function calculateGrowth(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  // --- Pie Chart Data (Current Month) ---
  const productsMap = new Map<string, number>()
  currentTx.filter(t => t.type === 'receita').forEach(t => {
    const name = t.product?.name || 'Serviços/Outros'
    productsMap.set(name, (productsMap.get(name) || 0) + t.amount)
  })
  const productsPieData = Array.from(productsMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const categoriesMap = new Map<string, number>()
  currentTx.filter(t => t.type === 'despesa').forEach(t => {
    const name = t.category?.name || 'Outros'
    categoriesMap.set(name, (categoriesMap.get(name) || 0) + t.amount)
  })
  const categoriesPieData = Array.from(categoriesMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const totalProductsValue = productsPieData.reduce((acc, curr) => acc + curr.value, 0)
  const totalCategoriesValue = categoriesPieData.reduce((acc, curr) => acc + curr.value, 0)

  const GrowthBadge = ({ value, invertColors = false }: { value: number, invertColors?: boolean }) => {
    const isPositive = value >= 0
    // For expenses, positive growth is "bad" (red), negative growth is "good" (green)
    const isGood = invertColors ? !isPositive : isPositive
    return (
      <span className={cn(
        "text-xs px-2 py-0.5 rounded-full font-medium ml-2 flex items-center gap-0.5",
        isGood ? "bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]" : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
      )}>
        {isPositive ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
        {Math.abs(value).toFixed(1)}%
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
      <div className="flex items-center gap-3">
        <BarChart3 size={24} className="text-[var(--color-emerald)]" />
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Métricas e Relatórios</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-xs text-[var(--color-text-muted)] mb-1 uppercase font-semibold">Valor Ganho (Receitas)</p>
          <div className="flex items-baseline mb-2 mt-1">
            <p className="text-2xl font-bold text-[var(--color-emerald)]">{formatCurrency(curReceitas)}</p>
            <GrowthBadge value={calculateGrowth(curReceitas, prevReceitas)} />
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)]">Comparado a {monthsNames[prevMonthM]}</p>
        </div>

        <div className="card">
          <p className="text-xs text-[var(--color-text-muted)] mb-1 uppercase font-semibold">Despesas</p>
          <div className="flex items-baseline mb-2 mt-1">
            <p className="text-2xl font-bold text-[var(--color-danger)]">{formatCurrency(curDespesas)}</p>
            <GrowthBadge value={calculateGrowth(curDespesas, prevDespesas)} invertColors />
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)]">Comparado a {monthsNames[prevMonthM]}</p>
        </div>

        <div className="card">
          <p className="text-xs text-[var(--color-text-muted)] mb-1 uppercase font-semibold">Lucro Líquido</p>
          <div className="flex items-baseline mb-2 mt-1">
            <p className={cn("text-2xl font-bold", curLucro >= 0 ? "text-[var(--color-emerald)]" : "text-[var(--color-danger)]")}>
              {formatCurrency(curLucro)}
            </p>
            <GrowthBadge value={calculateGrowth(curLucro, prevLucro)} />
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)]">Comparado a {monthsNames[prevMonthM]}</p>
        </div>

        <div className="card">
          <p className="text-xs text-[var(--color-text-muted)] mb-1 uppercase font-semibold">Qtd. de Vendas</p>
          <div className="flex items-baseline mb-2 mt-1">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {curVendasCount} <span className="text-base font-normal text-[var(--color-text-muted)] ml-1">vendas</span>
            </p>
            <GrowthBadge value={calculateGrowth(curVendasCount, prevVendasCount)} />
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)]">Comparado a {monthsNames[prevMonthM]}</p>
        </div>
      </div>

      {/* Main Bar Chart: 6 Months Evolution */}
      <div className="card">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-6">Comparação Semestral (Últimos 6 meses)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                itemStyle={{ fontSize: '13px' }}
                formatter={(value: any) => formatCurrency(Number(value))}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Receitas" fill="var(--color-emerald)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Despesas" fill="var(--color-danger)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="card">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
            <ShoppingBag size={16} className="text-[var(--color-emerald)]"/>
            Receitas por Produto/Serviço no Mês
          </h3>
          {productsPieData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
              <div className="h-[200px] w-full sm:w-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productsPieData}
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
                      {productsPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '13px' }}
                      formatter={(value: any) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-2">
                {productsPieData.map((item, i) => (
                  <div key={item.name} className="flex justify-between items-center px-4 py-2.5 rounded-lg bg-[var(--color-bg-input)]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--color-text-primary)]">{formatCurrency(item.value)}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{((item.value / totalProductsValue) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-[var(--color-text-muted)] text-sm">
              Sem dados suficientes no período.
            </div>
          )}
        </div>

        {/* Top Expenses Categories */}
        <div className="card">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
            <ArrowDownRight size={16} className="text-[var(--color-danger)]"/>
            Despesas por Categoria no Mês
          </h3>
          {categoriesPieData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
              <div className="h-[200px] w-full sm:w-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoriesPieData}
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
                      {categoriesPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '13px' }}
                      formatter={(value: any) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-2">
                {categoriesPieData.map((item, i) => (
                  <div key={item.name} className="flex justify-between items-center px-4 py-2.5 rounded-lg bg-[var(--color-bg-input)]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--color-text-primary)]">{formatCurrency(item.value)}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{((item.value / totalCategoriesValue) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-[var(--color-text-muted)] text-sm">
              Sem dados suficientes no período.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
