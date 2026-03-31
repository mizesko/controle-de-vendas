import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Package,
  Tag,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Wallet,
  BarChart3,
  Code2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transacoes', icon: ArrowLeftRight, label: 'Transações' },
  { to: '/contas', icon: Wallet, label: 'Contas' },
  { to: '/estoque', icon: Package, label: 'Estoque' },
  { to: '/categorias', icon: Tag, label: 'Categorias' },
  { to: '/metricas', icon: BarChart3, label: 'Métricas' },
  { to: '/dev', icon: Code2, label: 'Dev' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { signOut, user } = useAuth()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U'

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity',
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
        onClick={onToggle}
      />

      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 ease-out',
          'bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border)]',
          collapsed ? 'w-[72px]' : 'w-[240px]',
          'lg:relative',
          // mobile: hidden when collapsed
          collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-emerald)] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform duration-300">
              <Wallet className="text-white w-5 h-5 animate-[bounce_3s_infinite]" />
            </div>
            <span
              className={cn(
                'font-bold text-lg text-[var(--color-text-primary)] whitespace-nowrap transition-opacity',
                collapsed ? 'opacity-0' : 'opacity-100'
              )}
            >
              controle
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onMouseEnter={() => setHoveredItem(item.to)}
              onMouseLeave={() => setHoveredItem(null)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                  isActive
                    ? 'bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-text-primary)]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--color-emerald)] rounded-r-full" />
                  )}
                  <item.icon size={20} className="shrink-0" />
                  <span
                    className={cn(
                      'text-sm font-medium whitespace-nowrap transition-opacity',
                      collapsed ? 'opacity-0 w-0' : 'opacity-100'
                    )}
                  >
                    {item.label}
                  </span>
                  {/* Tooltip when collapsed */}
                  {collapsed && hoveredItem === item.to && (
                    <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-md text-xs font-medium text-[var(--color-text-primary)] whitespace-nowrap z-50 hidden lg:block">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-emerald)]/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-[var(--color-emerald)]">{initials}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={signOut}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-danger)] transition-all',
            )}
          >
            <LogOut size={20} className="shrink-0" />
            <span
              className={cn(
                'text-sm font-medium whitespace-nowrap transition-opacity',
                collapsed ? 'opacity-0 w-0' : 'opacity-100'
              )}
            >
              Sair
            </span>
          </button>
        </div>

        {/* Toggle button (desktop) */}
        <button
          onClick={onToggle}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 items-center justify-center rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-light)] transition-all"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  )
}
