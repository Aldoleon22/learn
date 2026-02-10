import { useEffect } from 'react'

export default function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div className="bg-bg-card border border-white/[0.06] rounded-2xl p-8 w-[90%] max-w-[480px] shadow-2xl animate-[levelUpBounce_0.4s_ease]">
        {children}
      </div>
    </div>
  )
}
