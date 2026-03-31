import { createContext, useContext, useState, type ReactNode } from 'react'
import type { MonthYear } from '@/types'

interface PeriodContextType {
  period: MonthYear
  setPeriod: (period: MonthYear) => void
  nextMonth: () => void
  prevMonth: () => void
  periodLabel: string
  refreshKey: number
  refresh: () => void
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined)

export function PeriodProvider({ children }: { children: ReactNode }) {
  const now = new Date()
  const [period, setPeriod] = useState<MonthYear>({
    month: now.getMonth(),
    year: now.getFullYear(),
  })
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => setRefreshKey(prev => prev + 1)

  const nextMonth = () => {
    setPeriod(prev => {
      if (prev.month === 11) return { month: 0, year: prev.year + 1 }
      return { ...prev, month: prev.month + 1 }
    })
  }

  const prevMonth = () => {
    setPeriod(prev => {
      if (prev.month === 0) return { month: 11, year: prev.year - 1 }
      return { ...prev, month: prev.month - 1 }
    })
  }

  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ]

  const periodLabel = `${months[period.month]} ${period.year}`

  return (
    <PeriodContext.Provider value={{
      period, setPeriod, nextMonth, prevMonth, periodLabel, refreshKey, refresh
    }}>
      {children}
    </PeriodContext.Provider>
  )
}

export function usePeriod() {
  const context = useContext(PeriodContext)
  if (!context) throw new Error('usePeriod must be used within a PeriodProvider')
  return context
}
