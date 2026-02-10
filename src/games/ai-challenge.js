// AI Challenge - Jeu généré dynamiquement par l'IA
// Mixe des rounds de Quiz, Debug, Output Guess et Memory adaptés au joueur

import { getQuizQuestions } from '../data/quiz-questions.js'
import { getBugSnippets } from '../data/bug-snippets.js'
import { getMemoryPairs, buildMemoryBoard } from '../data/memory-pairs.js'
import { getGeneratedQuestions } from '../lib/questionGenerator.js'

const ROUND_TYPES = ['quiz', 'debug', 'output', 'memory']

const ROUND_ICONS = {
  quiz: '⚡',
  debug: '🔧',
  output: '🔮',
  memory: '🧠',
}

const ROUND_NAMES = {
  quiz: 'Quiz Express',
  debug: 'Repare le Bug',
  output: 'Devine la Sortie',
  memory: 'Paires Eclair',
}

// Output Guess questions intégrées directement
const JS_OUTPUT_QUESTIONS = [
  { code: 'console.log(typeof [])', choices: ['"array"', '"object"', '"list"', '"undefined"'], correct: 1, explanation: 'En JS, typeof [] retourne "object".' },
  { code: 'console.log(1 + "2")', choices: ['3', '"12"', '"3"', 'NaN'], correct: 1, explanation: 'JS convertit le nombre en string et concatène.' },
  { code: 'console.log(+"hello")', choices: ['0', 'NaN', '"hello"', 'undefined'], correct: 1, explanation: 'L\'opérateur + tente de convertir en nombre. "hello" donne NaN.' },
  { code: 'console.log(0.1 + 0.2 === 0.3)', choices: ['true', 'false', 'NaN', 'TypeError'], correct: 1, explanation: 'Erreur de précision flottante. 0.1 + 0.2 != 0.3 exactement.' },
  { code: 'console.log(typeof null)', choices: ['"null"', '"object"', '"undefined"', '"boolean"'], correct: 1, explanation: 'Bug historique de JS : typeof null retourne "object".' },
  { code: 'console.log(!!"false")', choices: ['true', 'false', '"false"', 'TypeError'], correct: 0, explanation: 'Toute string non vide est truthy. !!"false" donne true.' },
  { code: 'console.log(3 > 2 > 1)', choices: ['true', 'false', 'TypeError', 'NaN'], correct: 1, explanation: '3>2 donne true(1), puis 1>1 donne false.' },
  { code: 'console.log(NaN === NaN)', choices: ['true', 'false', 'NaN', 'TypeError'], correct: 1, explanation: 'NaN n\'est égal à rien, pas même à lui-même.' },
  { code: 'console.log([1,2,3].indexOf(4))', choices: ['undefined', '-1', 'false', 'null'], correct: 1, explanation: 'indexOf retourne -1 quand l\'élément n\'est pas trouvé.' },
  { code: 'console.log([] == false)', choices: ['true', 'false', 'TypeError', 'undefined'], correct: 0, explanation: 'Un tableau vide est converti en 0 qui est == false.' },
]

const PY_OUTPUT_QUESTIONS = [
  { code: 'print(type([]))', choices: ["<class 'list'>", "<class 'array'>", "list", "[]"], correct: 0, explanation: "type([]) retourne <class 'list'>." },
  { code: 'print(3 * "ab")', choices: ['"ababab"', 'Error', '"3ab"', '"ab3"'], correct: 0, explanation: 'Multiplier une string par un entier la répète n fois.' },
  { code: 'print(10 // 3)', choices: ['3.33', '3', '4', '3.0'], correct: 1, explanation: '// fait une division entière. 10 // 3 = 3.' },
  { code: 'print(bool(""))', choices: ['True', 'False', 'None', 'Error'], correct: 1, explanation: 'Une string vide est falsy. bool("") retourne False.' },
  { code: 'print([1,2,3][::-1])', choices: ['[3,2,1]', '[1,2,3]', 'Error', '[1,3]'], correct: 0, explanation: '[::-1] inverse la liste.' },
  { code: 'print(None == False)', choices: ['True', 'False', 'None', 'Error'], correct: 1, explanation: 'None n\'est égal qu\'à None. None == False est False.' },
  { code: 'print("hello"[-1])', choices: ['"o"', '"h"', 'Error', '"e"'], correct: 0, explanation: 'L\'index -1 accède au dernier élément.' },
  { code: 'print(len({1,2,2,3,3}))', choices: ['5', '3', '2', 'Error'], correct: 1, explanation: 'Un set élimine les doublons. Longueur = 3.' },
  { code: 'print(2 ** 3 ** 2)', choices: ['64', '512', '36', '8'], correct: 1, explanation: '** est associatif à droite. 2**(3**2) = 2**9 = 512.' },
  { code: 'print(isinstance(True, int))', choices: ['True', 'False', 'Error', 'None'], correct: 0, explanation: 'bool est une sous-classe de int en Python.' },
]

export default class AIChallenge {
  constructor(container, lang, config) {
    this.container = container
    this.lang = lang
    this.config = config || {}
    this.rounds = []
    this.currentRound = 0
    this.score = 0
    this.totalPossible = 0
    this.startTime = null
    this.timers = []
    this.completionCallback = null
    this.destroyed = false
    this._keyHandler = null
    // Memory round state
    this._memoryFlipped = []
    this._memoryMatched = []
    this._memoryLocked = false
    this._memoryMoves = 0
    this._memoryCards = []
  }

  onComplete(callback) {
    this.completionCallback = callback
  }

  start() {
    this.destroyed = false
    this.startTime = Date.now()
    this.rounds = this._generateRounds()
    this.currentRound = 0
    this.score = 0
    this.totalPossible = this.rounds.length
    this._injectStyles()
    this._renderShell()
    this._playRound()
  }

  destroy() {
    this.destroyed = true
    this.timers.forEach(id => clearTimeout(id))
    this.timers = []
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler)
      this._keyHandler = null
    }
    this.container.innerHTML = ''
  }

  // --- Round Generation (the AI part) ---

  _generateRounds() {
    const rounds = []
    const gameStats = this.config.gameStats || {}

    // Pull generated questions from cache (OpenAI) — anti-répétition via hash
    const genQuiz = getGeneratedQuestions('quiz', this.lang, 3)
    const genOutput = getGeneratedQuestions('output', this.lang, 2)
    const genBug = getGeneratedQuestions('bug', this.lang, 2)

    // Static pools as fallback
    const quizPool = shuffle([...getQuizQuestions(this.lang)])
    const bugPool = shuffle([...getBugSnippets(this.lang)])
    const outputPool = shuffle([...(this.lang === 'python' ? PY_OUTPUT_QUESTIONS : JS_OUTPUT_QUESTIONS)])
    const memoryPool = shuffle([...getMemoryPairs(this.lang)])

    // Determine which types to emphasize based on weak stats
    const weakTypes = this._findWeakTypes(gameStats)

    // Build 6 rounds mixing types, emphasizing weaknesses
    const roundTypes = this._buildRoundSequence(weakTypes)

    for (const type of roundTypes) {
      switch (type) {
        case 'quiz': {
          // Priorité : question générée par OpenAI, sinon statique
          const q = genQuiz.pop() || quizPool.pop()
          if (q) rounds.push({ type: 'quiz', data: q, generated: !!q._hash })
          break
        }
        case 'debug': {
          const b = genBug.pop() || bugPool.pop()
          if (b) rounds.push({ type: 'debug', data: b, generated: !!b._hash })
          break
        }
        case 'output': {
          const o = genOutput.pop() || outputPool.pop()
          if (o) rounds.push({ type: 'output', data: o, generated: !!o._hash })
          break
        }
        case 'memory': {
          const m = memoryPool.pop()
          if (m) {
            const pairs = shuffle([...m.pairs]).slice(0, 4)
            rounds.push({ type: 'memory', data: { ...m, pairs }, generated: false })
          }
          break
        }
      }
    }

    // Fallback: if not enough rounds, fill with quiz
    while (rounds.length < 4 && quizPool.length > 0) {
      rounds.push({ type: 'quiz', data: quizPool.pop(), generated: false })
    }

    return rounds
  }

  _findWeakTypes(gameStats) {
    const typeMap = {
      'quiz-blitz': 'quiz',
      'code-repair': 'debug',
      'output-guess': 'output',
      'memory-match': 'memory',
    }
    const weak = []
    for (const [game, type] of Object.entries(typeMap)) {
      const stats = gameStats[game]
      if (!stats || stats.played === 0) {
        weak.push(type) // Never played = weak
      } else if (stats.bestScore < 60) {
        weak.push(type) // Low score = weak
      }
    }
    return weak.length > 0 ? weak : ROUND_TYPES
  }

  _buildRoundSequence(weakTypes) {
    const sequence = []
    const totalRounds = 6

    // 1. Add 2 rounds targeting weaknesses
    for (let i = 0; i < 2 && i < weakTypes.length; i++) {
      sequence.push(weakTypes[i % weakTypes.length])
    }

    // 2. Fill remaining with variety
    const remaining = totalRounds - sequence.length
    const available = [...ROUND_TYPES]
    for (let i = 0; i < remaining; i++) {
      const pick = available[i % available.length]
      sequence.push(pick)
    }

    // 3. Shuffle to avoid predictable patterns
    return shuffle(sequence)
  }

  // --- Rendering ---

  _renderShell() {
    this.container.innerHTML = `
      <div class="aic-wrapper">
        <div class="aic-header">
          <div class="aic-title-row">
            <span class="aic-badge">🤖 DEFI IA</span>
            <span class="aic-counter" data-aic="counter">Round 1/${this.rounds.length}</span>
            <span class="aic-score" data-aic="score">0 pts</span>
          </div>
          <div class="aic-progress-track">
            <div class="aic-progress-fill" data-aic="progress" style="width:0%"></div>
          </div>
          <div class="aic-round-types" data-aic="types"></div>
        </div>
        <div class="aic-round-intro" data-aic="intro"></div>
        <div class="aic-round-content" data-aic="content"></div>
      </div>
    `
    this._renderRoundIndicators()
  }

  _renderRoundIndicators() {
    const el = this._el('types')
    if (!el) return
    el.innerHTML = this.rounds.map((r, i) => {
      let cls = 'aic-type-dot'
      if (i < this.currentRound) cls += ' aic-type-done'
      else if (i === this.currentRound) cls += ' aic-type-active'
      return `<span class="${cls}" title="${ROUND_NAMES[r.type]}">${ROUND_ICONS[r.type]}</span>`
    }).join('')
  }

  _el(key) {
    return this.container.querySelector(`[data-aic="${key}"]`)
  }

  _updateHeader() {
    const counter = this._el('counter')
    const score = this._el('score')
    const progress = this._el('progress')
    if (counter) counter.textContent = `Round ${this.currentRound + 1}/${this.rounds.length}`
    if (score) score.textContent = `${this.score} pts`
    if (progress) progress.style.width = `${(this.currentRound / this.rounds.length) * 100}%`
    this._renderRoundIndicators()
  }

  // --- Round Playback ---

  _playRound() {
    if (this.destroyed || this.currentRound >= this.rounds.length) {
      this._finish()
      return
    }

    this._updateHeader()
    const round = this.rounds[this.currentRound]
    const introEl = this._el('intro')
    const contentEl = this._el('content')

    // Show round intro animation
    if (introEl) {
      const genTag = round.generated
        ? '<div class="aic-intro-gen">Generee par IA</div>'
        : ''
      introEl.innerHTML = `
        <div class="aic-intro-card">
          <div class="aic-intro-icon">${ROUND_ICONS[round.type]}</div>
          <div class="aic-intro-name">${ROUND_NAMES[round.type]}</div>
          <div class="aic-intro-num">Round ${this.currentRound + 1}</div>
          ${genTag}
        </div>
      `
      introEl.style.display = 'block'
    }

    const timer = setTimeout(() => {
      if (this.destroyed) return
      if (introEl) introEl.style.display = 'none'
      if (contentEl) contentEl.innerHTML = ''

      switch (round.type) {
        case 'quiz': this._playQuizRound(round.data); break
        case 'debug': this._playDebugRound(round.data); break
        case 'output': this._playOutputRound(round.data); break
        case 'memory': this._playMemoryRound(round.data); break
      }
    }, 1200)
    this.timers.push(timer)
  }

  _nextRound(scored) {
    if (scored) this.score++
    this.currentRound++
    this._playRound()
  }

  // --- QUIZ ROUND ---

  _playQuizRound(q) {
    const el = this._el('content')
    const keys = ['A', 'B', 'C', 'D']
    el.innerHTML = `
      <div class="aic-question">${esc(q.question)}</div>
      <div class="aic-choices" data-aic="choices">
        ${q.choices.map((c, i) => `
          <button class="aic-choice-btn" data-idx="${i}">
            <span class="aic-choice-key">${keys[i]}</span>
            <span>${esc(c)}</span>
          </button>
        `).join('')}
      </div>
      <div data-aic="feedback"></div>
    `
    this._bindChoices(q.correct, q.explanation)
  }

  // --- OUTPUT ROUND ---

  _playOutputRound(q) {
    const el = this._el('content')
    const keys = ['A', 'B', 'C', 'D']
    el.innerHTML = `
      <div class="aic-question">Que va afficher ce code ?</div>
      <div class="aic-code-block"><pre><code>${esc(q.code)}</code></pre></div>
      <div class="aic-choices" data-aic="choices">
        ${q.choices.map((c, i) => `
          <button class="aic-choice-btn" data-idx="${i}">
            <span class="aic-choice-key">${keys[i]}</span>
            <span>${esc(c)}</span>
          </button>
        `).join('')}
      </div>
      <div data-aic="feedback"></div>
    `
    this._bindChoices(q.correct, q.explanation)
  }

  // --- DEBUG ROUND ---

  _playDebugRound(bug) {
    const el = this._el('content')
    const codeHTML = bug.buggyCode.split('\n').map((line, i) => {
      const isBug = (i + 1) === bug.bugLine
      return `<span class="aic-code-line${isBug ? ' aic-code-line--bug' : ''}">${esc(line)}</span>`
    }).join('\n')

    const options = shuffle([
      { code: bug.fixedCode, correct: true },
      { code: bug.buggyCode, correct: false },
    ])

    el.innerHTML = `
      <div class="aic-question">${esc(bug.title)} - Trouve le correctif !</div>
      <div class="aic-code-block"><pre><code>${codeHTML}</code></pre></div>
      <div class="aic-debug-options" data-aic="choices">
        ${options.map((opt, i) => `
          <button class="aic-debug-btn" data-idx="${i}" data-correct="${opt.correct}">
            <div class="aic-debug-label">Option ${String.fromCharCode(65 + i)}</div>
            <pre class="aic-debug-code"><code>${esc(opt.code)}</code></pre>
          </button>
        `).join('')}
      </div>
      <div data-aic="feedback"></div>
    `

    const btns = el.querySelectorAll('.aic-debug-btn')
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.destroyed) return
        const isCorrect = btn.dataset.correct === 'true'
        btns.forEach(b => {
          b.style.pointerEvents = 'none'
          if (b.dataset.correct === 'true') b.classList.add('aic-debug-correct')
        })
        if (!isCorrect) btn.classList.add('aic-debug-wrong')
        this._showFeedback(isCorrect, bug.explanation)
        const t = setTimeout(() => this._nextRound(isCorrect), isCorrect ? 1500 : 2200)
        this.timers.push(t)
      }, { once: true })
    })
  }

  // --- MEMORY ROUND ---

  _playMemoryRound(memData) {
    const el = this._el('content')
    this._memoryCards = buildMemoryBoard(memData)
    this._memoryFlipped = []
    this._memoryMatched = []
    this._memoryLocked = false
    this._memoryMoves = 0
    const totalPairs = memData.pairs.length

    el.innerHTML = `
      <div class="aic-question">Trouve les ${totalPairs} paires !</div>
      <div class="aic-memory-info">
        <span data-aic="mem-moves">0 coups</span>
        <span data-aic="mem-pairs">0/${totalPairs}</span>
      </div>
      <div class="aic-memory-grid" data-aic="mem-grid">
        ${this._memoryCards.map((card, i) => `
          <button class="aic-mem-card" data-card-idx="${i}" data-pair="${card.pairIndex}">
            <span class="aic-mem-card-back">?</span>
            <span class="aic-mem-card-front">${esc(card.text)}</span>
          </button>
        `).join('')}
      </div>
      <div data-aic="feedback"></div>
    `

    const cards = el.querySelectorAll('.aic-mem-card')
    cards.forEach(card => {
      card.addEventListener('click', () => this._handleMemoryClick(card, cards, totalPairs))
    })
  }

  _handleMemoryClick(card, allCards, totalPairs) {
    if (this.destroyed || this._memoryLocked) return
    const idx = parseInt(card.dataset.cardIdx)
    if (this._memoryFlipped.includes(idx) || this._memoryMatched.includes(idx)) return

    card.classList.add('aic-mem-flipped')
    this._memoryFlipped.push(idx)

    if (this._memoryFlipped.length === 2) {
      this._memoryLocked = true
      this._memoryMoves++
      const movesEl = this._el('mem-moves')
      if (movesEl) movesEl.textContent = `${this._memoryMoves} coups`

      const [i1, i2] = this._memoryFlipped
      const c1 = this._memoryCards[i1]
      const c2 = this._memoryCards[i2]

      if (c1.pairIndex === c2.pairIndex) {
        // Match!
        this._memoryMatched.push(i1, i2)
        allCards[i1].classList.add('aic-mem-matched')
        allCards[i2].classList.add('aic-mem-matched')
        this._memoryFlipped = []
        this._memoryLocked = false

        const pairsEl = this._el('mem-pairs')
        const found = this._memoryMatched.length / 2
        if (pairsEl) pairsEl.textContent = `${found}/${totalPairs}`

        if (found === totalPairs) {
          // All pairs found!
          const scored = this._memoryMoves <= totalPairs * 2.5
          this._showFeedback(scored, scored ? `Bravo, en seulement ${this._memoryMoves} coups !` : `Termine en ${this._memoryMoves} coups. Tu peux faire mieux !`)
          const t = setTimeout(() => this._nextRound(scored), 1500)
          this.timers.push(t)
        }
      } else {
        // No match
        const t = setTimeout(() => {
          if (this.destroyed) return
          allCards[i1].classList.remove('aic-mem-flipped')
          allCards[i2].classList.remove('aic-mem-flipped')
          this._memoryFlipped = []
          this._memoryLocked = false
        }, 800)
        this.timers.push(t)
      }
    }
  }

  // --- Shared helpers ---

  _bindChoices(correctIdx, explanation) {
    const el = this._el('content')
    if (!el) return
    const btns = el.querySelectorAll('.aic-choice-btn')
    const keys = { a: 0, b: 1, c: 2, d: 3 }

    const handle = (idx) => {
      if (this.destroyed) return
      if (this._keyHandler) {
        document.removeEventListener('keydown', this._keyHandler)
        this._keyHandler = null
      }
      const isCorrect = idx === correctIdx
      btns.forEach((b, i) => {
        b.style.pointerEvents = 'none'
        b.classList.add('aic-choice-disabled')
        if (i === correctIdx) b.classList.add('aic-choice-correct')
      })
      if (!isCorrect) btns[idx].classList.add('aic-choice-wrong')
      this._showFeedback(isCorrect, explanation)
      const t = setTimeout(() => this._nextRound(isCorrect), isCorrect ? 1300 : 2000)
      this.timers.push(t)
    }

    btns.forEach(btn => {
      btn.addEventListener('click', () => handle(parseInt(btn.dataset.idx)), { once: true })
    })

    this._keyHandler = (e) => {
      const idx = keys[e.key.toLowerCase()]
      if (idx !== undefined && idx < btns.length) handle(idx)
    }
    document.addEventListener('keydown', this._keyHandler)
  }

  _showFeedback(isCorrect, text) {
    const el = this._el('feedback')
    if (!el) return
    el.innerHTML = `
      <div class="aic-feedback ${isCorrect ? 'aic-feedback--correct' : 'aic-feedback--wrong'}">
        <strong>${isCorrect ? 'Correct !' : 'Rate...'}</strong>
        <span>${esc(text)}</span>
      </div>
    `
  }

  // --- Finish ---

  _finish() {
    if (this.destroyed) return

    const elapsed = Date.now() - this.startTime
    const total = this.rounds.length
    const xp = this.score * 20 + (this.score === total ? 30 : 0)

    const progress = this._el('progress')
    if (progress) progress.style.width = '100%'

    if (typeof this.completionCallback === 'function') {
      this.completionCallback({
        score: this.score,
        total,
        xp,
        time: elapsed,
        extras: {
          roundTypes: this.rounds.map(r => r.type),
          perfect: this.score === total,
          generated: true,
        }
      })
    }
  }

  // --- Styles ---

  _injectStyles() {
    if (document.getElementById('aic-styles')) return
    const style = document.createElement('style')
    style.id = 'aic-styles'
    style.textContent = `
      .aic-wrapper {
        max-width: 720px;
        margin: 0 auto;
        padding: var(--space-md) 0;
        user-select: none;
      }
      .aic-header { margin-bottom: var(--space-lg); }
      .aic-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-sm);
        margin-bottom: var(--space-sm);
      }
      .aic-badge {
        background: linear-gradient(135deg, #7c3aed, #06b6d4);
        color: #fff;
        font-weight: 800;
        font-size: 0.75rem;
        padding: 4px 12px;
        border-radius: 999px;
        letter-spacing: 0.08em;
      }
      .aic-counter {
        font-size: 0.9rem;
        color: var(--text-muted);
        font-weight: 600;
      }
      .aic-score {
        font-size: 0.9rem;
        color: var(--neon-gold);
        font-weight: 700;
      }
      .aic-progress-track {
        width: 100%;
        height: 6px;
        background: var(--bg-input);
        border-radius: 999px;
        overflow: hidden;
        margin-bottom: var(--space-sm);
      }
      .aic-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #7c3aed, #06b6d4);
        border-radius: 999px;
        transition: width 0.5s ease;
      }
      .aic-round-types {
        display: flex;
        gap: 8px;
        justify-content: center;
      }
      .aic-type-dot {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 1rem;
        background: var(--bg-input);
        border: 2px solid transparent;
        opacity: 0.5;
        transition: all 0.3s;
      }
      .aic-type-active {
        opacity: 1;
        border-color: #7c3aed;
        background: rgba(124, 58, 237, 0.15);
        transform: scale(1.15);
      }
      .aic-type-done {
        opacity: 1;
        background: rgba(0, 255, 136, 0.12);
        border-color: var(--neon-green);
      }

      /* Intro animation */
      .aic-round-intro {
        text-align: center;
        animation: aic-intro-pop 0.4s ease;
      }
      .aic-intro-card {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-xs);
        padding: var(--space-lg);
      }
      .aic-intro-icon { font-size: 3rem; }
      .aic-intro-name {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-primary);
      }
      .aic-intro-num {
        font-size: 0.8rem;
        color: var(--text-muted);
      }
      .aic-intro-gen {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #06b6d4;
        background: rgba(6, 182, 212, 0.12);
        border: 1px solid rgba(6, 182, 212, 0.3);
        padding: 2px 10px;
        border-radius: 999px;
        margin-top: var(--space-xs);
      }
      @keyframes aic-intro-pop {
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1); }
      }

      /* Questions & choices */
      .aic-question {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-md);
        text-align: center;
      }
      .aic-code-block {
        background: var(--bg-primary);
        border: 1px solid var(--accent-primary);
        border-radius: var(--radius-md);
        padding: var(--space-md);
        margin-bottom: var(--space-md);
        overflow-x: auto;
      }
      .aic-code-block pre { margin: 0; }
      .aic-code-block code {
        font-family: var(--font-code);
        font-size: 0.95rem;
        line-height: 1.6;
        color: var(--neon-gold);
        white-space: pre;
      }
      .aic-code-line { display: block; }
      .aic-code-line--bug {
        background: rgba(255, 200, 50, 0.1);
        border-left: 3px solid var(--neon-gold);
        padding-left: 4px;
      }

      .aic-choices {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-sm);
        margin-bottom: var(--space-md);
      }
      @media (max-width: 500px) { .aic-choices { grid-template-columns: 1fr; } }
      .aic-choice-btn {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        background: var(--bg-card);
        border: 2px solid var(--bg-input);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-size: 0.9rem;
        cursor: pointer;
        transition: border-color 0.2s, transform 0.15s;
        text-align: left;
      }
      .aic-choice-btn:hover:not(.aic-choice-disabled) {
        border-color: #7c3aed;
        transform: translateY(-1px);
      }
      .aic-choice-key {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 26px;
        height: 26px;
        border-radius: var(--radius-sm);
        background: var(--bg-input);
        font-weight: 700;
        font-size: 0.75rem;
        color: var(--text-muted);
      }
      .aic-choice-correct {
        border-color: var(--neon-green) !important;
        background: rgba(0, 255, 136, 0.08);
      }
      .aic-choice-correct .aic-choice-key {
        background: var(--neon-green);
        color: #000;
      }
      .aic-choice-wrong {
        border-color: var(--neon-red) !important;
        background: rgba(255, 64, 96, 0.08);
      }
      .aic-choice-wrong .aic-choice-key {
        background: var(--neon-red);
        color: #fff;
      }
      .aic-choice-disabled { pointer-events: none; opacity: 0.7; }
      .aic-choice-correct.aic-choice-disabled,
      .aic-choice-wrong.aic-choice-disabled { opacity: 1; }

      /* Debug options */
      .aic-debug-options {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
        margin-bottom: var(--space-md);
      }
      .aic-debug-btn {
        text-align: left;
        cursor: pointer;
        padding: var(--space-sm);
        background: var(--bg-card);
        border: 2px solid var(--bg-input);
        border-radius: var(--radius-md);
        transition: border-color 0.2s, transform 0.15s;
      }
      .aic-debug-btn:hover { border-color: #7c3aed; transform: translateY(-1px); }
      .aic-debug-label {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: var(--space-xs);
      }
      .aic-debug-code {
        margin: 0;
        padding: var(--space-xs);
        background: var(--bg-primary);
        border-radius: var(--radius-sm);
        font-family: var(--font-code);
        font-size: 0.8rem;
        line-height: 1.5;
        color: var(--text-primary);
        overflow-x: auto;
        white-space: pre;
      }
      .aic-debug-correct {
        border-color: var(--neon-green) !important;
        background: rgba(0, 255, 136, 0.08);
      }
      .aic-debug-wrong {
        border-color: var(--neon-red) !important;
        background: rgba(255, 64, 96, 0.08);
      }

      /* Memory */
      .aic-memory-info {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: var(--text-muted);
        margin-bottom: var(--space-sm);
      }
      .aic-memory-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-xs);
        margin-bottom: var(--space-md);
      }
      @media (max-width: 500px) { .aic-memory-grid { grid-template-columns: repeat(2, 1fr); } }
      .aic-mem-card {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-xs);
        background: var(--bg-card);
        border: 2px solid var(--bg-input);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-primary);
        transition: border-color 0.2s, transform 0.2s;
        text-align: center;
        word-break: break-word;
      }
      .aic-mem-card:hover { border-color: #7c3aed; transform: scale(1.03); }
      .aic-mem-card .aic-mem-card-front { display: none; }
      .aic-mem-card .aic-mem-card-back { font-size: 1.2rem; color: var(--text-muted); }
      .aic-mem-flipped {
        border-color: #7c3aed;
        background: rgba(124, 58, 237, 0.1);
      }
      .aic-mem-flipped .aic-mem-card-front { display: block; }
      .aic-mem-flipped .aic-mem-card-back { display: none; }
      .aic-mem-matched {
        border-color: var(--neon-green) !important;
        background: rgba(0, 255, 136, 0.08) !important;
        pointer-events: none;
      }

      /* Feedback */
      .aic-feedback {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-md);
        font-size: 0.85rem;
        line-height: 1.4;
        animation: aic-fade-in 0.3s ease;
      }
      .aic-feedback--correct {
        background: rgba(0, 255, 136, 0.1);
        border: 1px solid var(--neon-green);
        color: var(--neon-green);
      }
      .aic-feedback--wrong {
        background: rgba(255, 64, 96, 0.1);
        border: 1px solid var(--neon-red);
        color: var(--neon-red);
      }
      .aic-feedback span { color: var(--text-primary); }
      @keyframes aic-fade-in {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `
    document.head.appendChild(style)
  }
}

// --- Utils ---

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function esc(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
