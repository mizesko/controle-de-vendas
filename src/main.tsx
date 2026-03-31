import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { AuthProvider } from './contexts/AuthContext'
import { PeriodProvider } from './contexts/PeriodContext'
import { ThemeProvider } from './contexts/ThemeContext'
import App from './App'
import './index.css'

// Registrar Service Worker do PWA
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <PeriodProvider>
            <App />
          </PeriodProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
