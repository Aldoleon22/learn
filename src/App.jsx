import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Navbar from './components/layout/Navbar'
import { ToastProvider } from './components/ui/ToastProvider'
import LevelUpOverlay from './components/ui/LevelUpOverlay'
import { useAchievements } from './hooks/useAchievements'
import { useStreak } from './hooks/useStreak'
import { useProfileSync } from './hooks/useProfileSync'
import { useContentBootstrap } from './hooks/useContentBootstrap'
import useContentStore from './store/contentStore'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Curriculum = lazy(() => import('./pages/Curriculum'))
const Lesson = lazy(() => import('./pages/Lesson'))
const GamesHub = lazy(() => import('./pages/GamesHub'))
const Game = lazy(() => import('./pages/Game'))
const Profile = lazy(() => import('./pages/Profile'))
const AdminLanguage = lazy(() => import('./pages/AdminLanguage'))
const NotFound = lazy(() => import('./pages/NotFound'))

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-text-muted text-lg animate-pulse">Chargement...</div>
    </div>
  )
}

function AppContent() {
  useAchievements()
  useStreak()
  useProfileSync()
  const { ready, error } = useContentBootstrap()
  return (
    <>
      <Navbar />
      <LevelUpOverlay />
      {!ready && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-text-muted text-lg animate-pulse">Chargement du contenu...</div>
            {error && (
              <div className="mt-3 text-neon-red text-sm">
                Erreur de chargement. Verifie l'API puis recharge la page.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default function App() {
  const ready = useContentStore(s => s.ready)

  return (
    <BrowserRouter>
      <ToastProvider>
        <AppContent />
        {ready && (
          <main className="max-w-[1200px] mx-auto p-4 min-h-[calc(100vh-140px)]">
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/curriculum" element={<Curriculum />} />
                <Route path="/lesson/:id" element={<Lesson />} />
                <Route path="/games" element={<GamesHub />} />
                <Route path="/game/:type" element={<Game />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin/language" element={<AdminLanguage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        )}
      </ToastProvider>
    </BrowserRouter>
  )
}
