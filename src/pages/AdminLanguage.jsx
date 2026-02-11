import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '@/store/useStore'
import useContentStore from '@/store/contentStore'

export default function AdminLanguage() {
  const navigate = useNavigate()
  const setLang = useStore(s => s.setLang)

  const [language, setLanguage] = useState('')
  const [loading, setLoading] = useState(false)
  const [steps, setSteps] = useState([]) // { id, label, done, active }
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null) // { language, stats }
  const abortRef = useRef(null)

  const handleGenerate = async () => {
    const value = language.trim()
    if (!value) { setError('Entre un langage ou framework.'); return }

    setLoading(true)
    setError(null)
    setResult(null)
    setSteps([])

    try {
      const url = `/api/content/generate-language?language=${encodeURIComponent(value)}`
      const ctrl = new AbortController()
      abortRef.current = ctrl

      const res = await fetch(url, { signal: ctrl.signal })
      if (!res.ok) throw new Error('Serveur indisponible')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value: chunk } = await reader.read()
        if (done) break
        buffer += decoder.decode(chunk, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))

            if (data.step === 'error') {
              throw new Error(data.message)
            }

            if (data.step === 'complete') {
              setResult({ language: data.language, stats: data.stats })
              setSteps(prev => prev.map(s => ({ ...s, done: true, active: false })))
              continue
            }

            if (data.step === 'save') {
              setSteps(prev => prev.map(s => ({ ...s, active: false })))
              continue
            }

            // Numeric step — add or update
            if (typeof data.step === 'number') {
              setSteps(prev => {
                const exists = prev.find(s => s.id === data.step)
                if (exists) {
                  return prev.map(s => {
                    if (s.id === data.step) return { ...s, label: data.label, done: !!data.done, active: !data.done }
                    return { ...s, active: false }
                  })
                }
                // New step — add it
                return [
                  ...prev.map(s => ({ ...s, active: false })),
                  { id: data.step, label: data.label, done: !!data.done, active: !data.done },
                ]
              })
            }
          } catch (e) {
            if (e.message && !e.message.includes('JSON')) throw e
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Erreur de génération')
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  const handleStart = async () => {
    if (!result) return
    useContentStore.setState({ ready: false, loading: false })
    await useContentStore.getState().load()
    setLang(result.language.id)
    navigate('/curriculum')
  }

  const handleCancel = () => {
    abortRef.current?.abort()
    setLoading(false)
  }

  const doneCount = steps.filter(s => s.done).length
  const progressPct = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0

  return (
    <div className="max-w-[600px] mx-auto py-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ajouter un langage</h1>
          <p className="text-text-muted text-sm mt-1">L'IA génère automatiquement tout le contenu.</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-neon btn-small">← Retour</button>
      </div>

      <div className="neon-card">
        <label className="text-sm font-semibold block mb-2">Langage ou framework</label>
        <div className="flex gap-2">
          <input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleGenerate()}
            className="flex-1 px-3 py-2.5 bg-bg-input border border-white/[0.08] rounded-lg text-sm text-text-primary outline-none focus:border-accent-secondary transition-colors"
            placeholder="Ex: Rust, Go, React, C++, SQL..."
            disabled={loading}
          />
          {loading ? (
            <button onClick={handleCancel} className="btn-neon px-4" style={{ borderColor: 'var(--neon-red)', color: 'var(--neon-red)' }}>
              Annuler
            </button>
          ) : (
            <button onClick={handleGenerate} className="btn-neon btn-primary px-4" disabled={!language.trim()}>
              Générer
            </button>
          )}
        </div>

        {/* Global progress bar */}
        {steps.length > 0 && !result && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>{doneCount}/{steps.length} étapes</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Step list */}
        {steps.length > 0 && (
          <div className="mt-4 space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {steps.map(s => (
              <div key={s.id} className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all ${s.active ? 'bg-white/[0.03]' : ''}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-300 ${
                  s.done
                    ? 'bg-neon-green/20 text-neon-green'
                    : s.active
                    ? 'bg-accent-secondary/20 text-accent-secondary animate-pulse'
                    : 'bg-white/5 text-text-muted'
                }`}>
                  {s.done ? '✓' : s.active ? '⋯' : s.id}
                </div>
                <span className={`text-xs transition-colors ${s.done ? 'text-neon-green' : s.active ? 'text-text-primary' : 'text-text-muted'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-neon-red/10 border border-neon-red/20 text-sm text-neon-red">
            {error}
          </div>
        )}

        {/* Success */}
        {result && (
          <div className="mt-6 p-5 rounded-lg bg-neon-green/5 border border-neon-green/20 text-center">
            <div className="text-4xl mb-2">{result.language.icon}</div>
            <div className="text-xl font-bold text-neon-green mb-1">{result.language.name}</div>
            <p className="text-text-muted text-sm mb-4">
              {result.stats?.levels || '?'} niveaux, {result.stats?.lessons || '?'} leçons + quiz et exercices
            </p>
            <button onClick={handleStart} className="btn-neon btn-primary px-6 py-2">
              Commencer à apprendre
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
