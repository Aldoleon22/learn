import { useState, useRef, useCallback } from 'react'
import { Sandbox } from '@/lib/sandbox'
import { Validator } from '@/lib/validator'

export default function CodeEditor({ lang, exercise, onSuccess }) {
  const [code, setCode] = useState(exercise?.starterCode || '')
  const [output, setOutput] = useState(null)
  const [status, setStatus] = useState(null) // 'success' | 'error' | null
  const [hintIndex, setHintIndex] = useState(-1)
  const [running, setRunning] = useState(false)
  const sandboxRef = useRef(null)

  const handleRun = useCallback(async () => {
    if (running) return
    setRunning(true)
    setOutput(null)
    setStatus(null)

    if (!sandboxRef.current) sandboxRef.current = new Sandbox(lang)

    try {
      const result = await sandboxRef.current.execute(code)

      if (exercise?.validation) {
        const validator = new Validator()
        const validation = validator.validate(exercise, result)
        setOutput(validation.message)
        setStatus(validation.pass ? 'success' : 'error')
        if (validation.pass) onSuccess?.()
      } else {
        setOutput(result.logs.join('\n') || (result.errors.length ? result.errors.join('\n') : '(aucune sortie)'))
        setStatus(result.success ? 'success' : 'error')
      }
    } catch {
      setOutput('Erreur inattendue')
      setStatus('error')
    }

    setRunning(false)
  }, [code, lang, exercise, running, onSuccess])

  const handleReset = () => {
    setCode(exercise?.starterCode || '')
    setOutput(null)
    setStatus(null)
    setHintIndex(-1)
  }

  const handleHint = () => {
    if (exercise?.hints && hintIndex < exercise.hints.length - 1) {
      setHintIndex(prev => prev + 1)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      setCode(code.substring(0, start) + '  ' + code.substring(end))
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2
      }, 0)
    }
  }

  return (
    <div>
      {exercise?.instruction && (
        <div
          className="text-sm text-text-secondary mb-3 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: exercise.instruction }}
        />
      )}

      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">
          {lang === 'python' ? '🐍 Python' : '⚡ JavaScript'}
        </span>
        <button
          onClick={handleReset}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          Reinitialiser
        </button>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[160px] bg-bg-input border border-white/[0.06] rounded-lg p-4 font-code text-sm text-text-primary resize-y outline-none focus:border-accent-secondary transition-colors"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleRun}
          disabled={running}
          className="btn-neon btn-primary flex-1"
        >
          {running ? 'Execution...' : '▶ Executer'}
        </button>
        {exercise?.hints?.length > 0 && (
          <button onClick={handleHint} className="btn-neon btn-small">
            💡 Indice
          </button>
        )}
      </div>

      {hintIndex >= 0 && exercise?.hints && (
        <div className="hint-box mt-3">
          💡 {exercise.hints[hintIndex]}
        </div>
      )}

      {output !== null && (
        <div className={`mt-3 rounded-lg border overflow-hidden ${
          status === 'success'
            ? 'border-neon-green/30 bg-neon-green/[0.05]'
            : status === 'error'
            ? 'border-neon-red/30 bg-neon-red/[0.05]'
            : 'border-white/[0.06] bg-bg-input'
        }`}>
          <div className="flex items-center justify-between px-3 py-1.5 bg-bg-secondary border-b border-white/[0.06] text-xs text-text-muted uppercase tracking-wider">
            <span>Sortie</span>
            <span>{status === 'success' ? '✅' : status === 'error' ? '❌' : ''}</span>
          </div>
          <pre className="p-3 font-code text-xs leading-relaxed whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}
    </div>
  )
}
