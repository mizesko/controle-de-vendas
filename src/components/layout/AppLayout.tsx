import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import TransactionModal from '@/components/modals/TransactionModal'

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNewTransaction={() => setShowTransactionModal(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {showTransactionModal && (
        <TransactionModal onClose={() => setShowTransactionModal(false)} />
      )}
    </div>
  )
}
