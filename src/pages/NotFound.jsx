import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="text-text-muted mb-6">Page introuvable</p>
      <Link to="/dashboard" className="btn-neon btn-primary">← Retour au tableau de bord</Link>
    </div>
  )
}
