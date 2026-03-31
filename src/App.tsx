import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import AuthPage from '@/pages/AuthPage'
import Dashboard from '@/pages/Dashboard'
import TransacoesPage from '@/pages/TransacoesPage'
import EstoquePage from '@/pages/EstoquePage'
import CategoriasPage from '@/pages/CategoriasPage'
import ContasPage from '@/pages/ContasPage'
import MetricasPage from '@/pages/MetricasPage'
import DevPage from '@/pages/DevPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="w-8 h-8 border-2 border-[var(--color-emerald)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transacoes" element={<TransacoesPage />} />
        <Route path="contas" element={<ContasPage />} />
        <Route path="estoque" element={<EstoquePage />} />
        <Route path="categorias" element={<CategoriasPage />} />
        <Route path="metricas" element={<MetricasPage />} />
        <Route path="dev" element={<DevPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
