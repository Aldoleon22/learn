import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Sync body data-lang with persisted store
try {
  const stored = JSON.parse(localStorage.getItem('codemaster_state') || '{}')
  document.body.dataset.lang = stored?.state?.currentLang || 'js'
} catch { /* ignore */ }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW registered:', reg.scope))
    .catch(err => console.warn('SW failed:', err))
}
