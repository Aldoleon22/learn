import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Navbar from './components/layout/Navbar'
import { ToastProvider } from './components/ui/ToastProvider'
import LevelUpOverlay from './components/ui/LevelUpOverlay'
import { useAchievements } from './hooks/useAchievements'
import { useStreak } from './hooks/useStreak'
import { useProfileSync } from './hooks/useProfileSync'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Curriculum = lazy(() => import('./pages/Curriculum'))
const Lesson = lazy(() => import('./pages/Lesson'))
const GamesHub = lazy(() => import('./pages/GamesHub'))
const Game = lazy(() => import('./pages/Game'))
const Profile = lazy(() => import('./pages/Profile'))
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
  return (
    <>
      <Navbar />
      <LevelUpOverlay />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppContent />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </ToastProvider>
    </BrowserRouter>
  )
}
