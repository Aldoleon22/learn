import { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, { type = 'info', icon = '', duration = 3000 } = {}) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type, icon }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const toastRoot = document.getElementById('toast-root')

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {toastRoot && createPortal(
        <div className="fixed top-[70px] right-4 z-[1000] flex flex-col gap-2 pointer-events-none max-md:top-4">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-2 bg-bg-card border border-white/[0.06] rounded-xl px-6 py-4 min-w-[280px] max-w-[400px] shadow-lg animate-[toastIn_0.3s_ease]
                ${t.type === 'success' ? 'border-l-[3px] border-l-neon-green' : ''}
                ${t.type === 'error' ? 'border-l-[3px] border-l-neon-red' : ''}
                ${t.type === 'achievement' ? 'border-l-[3px] border-l-neon-gold bg-gradient-to-br from-bg-card to-[rgba(255,209,102,0.1)]' : ''}
              `}
            >
              {t.icon && <span className="text-xl">{t.icon}</span>}
              <span className="text-sm flex-1">{t.message}</span>
            </div>
          ))}
        </div>,
        toastRoot
      )}
    </ToastContext.Provider>
  )
}
