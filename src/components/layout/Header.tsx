import { ChevronLeft, ChevronRight, Menu, Plus, Moon, Sun } from 'lucide-react'
import { usePeriod } from '@/contexts/PeriodContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
  onNewTransaction: () => void
}

export default function Header({ onMenuClick, onNewTransaction }: HeaderProps) {
  const { periodLabel, nextMonth, prevMonth } = usePeriod()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6 bg-[var(--color-bg-primary)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Period selector */}
        <div className="flex items-center gap-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 py-1 text-sm font-semibold text-[var(--color-text-primary)] min-w-[100px] text-center">
            {periodLabel}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <button
          onClick={onNewTransaction}
          className="btn-primary ml-1"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nova Transação</span>
        </button>
      </div>
    </header>
  )
}
