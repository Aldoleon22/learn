import { getRandomMemorySet, buildMemoryBoard } from '../data/memory-pairs.js';

const STYLE_ID = 'memory-match-styles';

const STYLES = `
  .mm-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
  }

  /* -- En-tete -- */
  .mm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    background: var(--bg-card);
    border: 1px solid var(--accent-primary);
  }

  .mm-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .mm-stat-label {
    font-size: 0.7rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mm-stat-value {
    font-family: var(--font-code);
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .mm-stat-value.--accent {
    color: var(--neon-gold);
  }

  /* -- Grille de cartes -- */
  .mm-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-sm);
  }

  /* -- Carte (conteneur perspective) -- */
  .mm-card {
    position: relative;
    aspect-ratio: 1 / 1.15;
    perspective: 600px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .mm-card.--matched {
    cursor: default;
  }

  .mm-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.5s ease;
    transform-style: preserve-3d;
  }

  .mm-card.--flipped .mm-card-inner {
    transform: rotateY(180deg);
  }

  .mm-card-face {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    padding: var(--space-xs);
    text-align: center;
    overflow: hidden;
    border: 2px solid transparent;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }

  /* Face cachee (dos) */
  .mm-card-back {
    background: var(--bg-input);
    border-color: var(--text-muted);
    color: var(--text-muted);
    font-size: 2rem;
    font-weight: 700;
    user-select: none;
  }

  .mm-card-back::after {
    content: '?';
    font-family: var(--font-code);
  }

  /* Face visible (avant, tournee 180 sur Y) */
  .mm-card-front {
    background: var(--bg-card);
    transform: rotateY(180deg);
    font-family: var(--font-code);
    font-size: 0.8rem;
    line-height: 1.35;
    color: var(--text-primary);
    word-break: break-word;
  }

  .mm-card.--type-term .mm-card-front {
    border-color: var(--accent-primary);
  }

  .mm-card.--type-match .mm-card-front {
    border-color: var(--accent-secondary);
  }

  /* Feedback flash */
  .mm-card.--correct .mm-card-front {
    border-color: var(--neon-green);
    box-shadow: 0 0 12px var(--neon-green);
  }

  .mm-card.--wrong .mm-card-front {
    border-color: var(--neon-red);
    box-shadow: 0 0 12px var(--neon-red);
  }

  /* Cartes trouvees */
  .mm-card.--matched .mm-card-front {
    box-shadow: 0 0 8px 2px var(--neon-green);
    opacity: 0.88;
  }

  /* -- Message de fin -- */
  .mm-complete {
    text-align: center;
    padding: var(--space-lg);
    border-radius: var(--radius-md);
    background: var(--bg-card);
    border: 1px solid var(--neon-gold);
    box-shadow: 0 0 20px color-mix(in srgb, var(--neon-gold) 25%, transparent);
  }

  .mm-complete h2 {
    margin: 0 0 var(--space-sm);
    color: var(--neon-gold);
    font-size: 1.5rem;
  }

  .mm-complete p {
    margin: var(--space-xs) 0;
    color: var(--text-primary);
    font-size: 0.95rem;
  }

  .mm-complete .mm-xp {
    font-family: var(--font-code);
    font-weight: 700;
    color: var(--neon-green);
    font-size: 1.3rem;
  }
`;

export default class MemoryMatch {
  constructor(container, lang) {
    this._container = container;
    this._lang = lang;

    this._onCompleteCb = null;

    this._cards = [];
    this._flipped = [];
    this._matchedPairs = 0;
    this._totalPairs = 6;
    this._moves = 0;
    this._startTime = null;
    this._elapsed = 0;
    this._timerRAF = null;
    this._flipTimeout = null;
    this._busy = false;

    this._el = null;
    this._movesEl = null;
    this._timerEl = null;
    this._pairsEl = null;
    this._gridEl = null;
    this._cardEls = [];
  }

  /* -- API publique -- */

  start() {
    this._injectStyles();

    const pairSet = getRandomMemorySet(this._lang, 6);
    this._cards = buildMemoryBoard(pairSet);

    this._matchedPairs = 0;
    this._moves = 0;
    this._startTime = null;
    this._elapsed = 0;
    this._flipped = [];
    this._busy = false;

    this._render();
    this._bindEvents();
    this._updateStats();
  }

  destroy() {
    if (this._timerRAF) {
      cancelAnimationFrame(this._timerRAF);
      this._timerRAF = null;
    }
    if (this._flipTimeout) {
      clearTimeout(this._flipTimeout);
      this._flipTimeout = null;
    }
    if (this._el) {
      this._el.removeEventListener('click', this._handleClick);
      this._el.remove();
      this._el = null;
    }
    this._cardEls = [];
  }

  onComplete(callback) {
    this._onCompleteCb = callback;
  }

  /* -- Rendu -- */

  _injectStyles() {
    if (!document.getElementById(STYLE_ID)) {
      const tag = document.createElement('style');
      tag.id = STYLE_ID;
      tag.textContent = STYLES;
      document.head.appendChild(tag);
    }
  }

  _render() {
    this._container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.classList.add('mm-wrapper');

    wrapper.innerHTML = `
      <div class="mm-header neon-card">
        <div class="mm-stat">
          <span class="mm-stat-label">Coups</span>
          <span class="mm-stat-value" data-mm="moves">0</span>
        </div>
        <div class="mm-stat">
          <span class="mm-stat-label">Temps</span>
          <span class="mm-stat-value" data-mm="timer">00:00</span>
        </div>
        <div class="mm-stat">
          <span class="mm-stat-label">Paires</span>
          <span class="mm-stat-value --accent" data-mm="pairs">0/${this._totalPairs}</span>
        </div>
      </div>
      <div class="mm-grid" data-mm="grid"></div>
    `;

    this._container.appendChild(wrapper);
    this._el = wrapper;

    this._movesEl = wrapper.querySelector('[data-mm="moves"]');
    this._timerEl = wrapper.querySelector('[data-mm="timer"]');
    this._pairsEl = wrapper.querySelector('[data-mm="pairs"]');
    this._gridEl = wrapper.querySelector('[data-mm="grid"]');

    this._cardEls = [];
    this._cards.forEach((card, i) => {
      const el = document.createElement('div');
      el.classList.add('mm-card', `--type-${card.type}`);
      el.dataset.index = i;

      el.innerHTML = `
        <div class="mm-card-inner">
          <div class="mm-card-face mm-card-back"></div>
          <div class="mm-card-face mm-card-front">${this._escapeHTML(card.text)}</div>
        </div>
      `;

      this._gridEl.appendChild(el);
      this._cardEls.push(el);
    });
  }

  /* -- Interactions -- */

  _bindEvents() {
    this._handleClick = this._onClick.bind(this);
    this._el.addEventListener('click', this._handleClick);
  }

  _onClick(e) {
    const cardEl = e.target.closest('.mm-card');
    if (!cardEl) return;

    const index = parseInt(cardEl.dataset.index, 10);

    if (this._busy) return;
    if (cardEl.classList.contains('--flipped')) return;
    if (cardEl.classList.contains('--matched')) return;

    if (this._startTime === null) {
      this._startTime = performance.now();
      this._tickTimer();
    }

    cardEl.classList.add('--flipped');
    this._flipped.push(index);

    if (this._flipped.length === 2) {
      this._moves++;
      this._updateStats();
      this._checkMatch();
    }
  }

  _checkMatch() {
    const [i1, i2] = this._flipped;
    const c1 = this._cards[i1];
    const c2 = this._cards[i2];
    const el1 = this._cardEls[i1];
    const el2 = this._cardEls[i2];

    if (c1.pairIndex === c2.pairIndex) {
      el1.classList.add('--correct');
      el2.classList.add('--correct');

      this._flipTimeout = setTimeout(() => {
        el1.classList.remove('--correct');
        el2.classList.remove('--correct');
        el1.classList.add('--matched');
        el2.classList.add('--matched');

        this._matchedPairs++;
        this._flipped = [];
        this._updateStats();

        if (this._matchedPairs === this._totalPairs) {
          this._endGame();
        }
      }, 500);
    } else {
      this._busy = true;
      el1.classList.add('--wrong');
      el2.classList.add('--wrong');

      this._flipTimeout = setTimeout(() => {
        el1.classList.remove('--flipped', '--wrong');
        el2.classList.remove('--flipped', '--wrong');
        this._flipped = [];
        this._busy = false;
      }, 1000);
    }
  }

  /* -- Chrono & Stats -- */

  _tickTimer() {
    if (!this._startTime) return;

    this._elapsed = performance.now() - this._startTime;
    this._timerEl.textContent = this._formatTime(this._elapsed);

    this._timerRAF = requestAnimationFrame(() => this._tickTimer());
  }

  _formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  _updateStats() {
    this._movesEl.textContent = this._moves;
    this._pairsEl.textContent = `${this._matchedPairs}/${this._totalPairs}`;
  }

  /* -- Fin de partie -- */

  _endGame() {
    if (this._timerRAF) {
      cancelAnimationFrame(this._timerRAF);
      this._timerRAF = null;
    }

    const elapsedMs = Math.round(this._elapsed);
    const elapsedSec = elapsedMs / 1000;

    let xp = 60;
    const bonusMessages = [];

    if (this._moves < 15) {
      xp += 30;
      bonusMessages.push(`Bonus efficacite : +30 XP (${this._moves} coups)`);
    }
    if (elapsedSec < 30) {
      xp += 30;
      bonusMessages.push(`Bonus rapidite : +30 XP (${this._formatTime(elapsedMs)})`);
    }

    const completeEl = document.createElement('div');
    completeEl.classList.add('mm-complete', 'neon-card');
    completeEl.innerHTML = `
      <h2>Bravo !</h2>
      <p>Toutes les paires trouvees en <strong>${this._moves}</strong> coups
         et <strong>${this._formatTime(elapsedMs)}</strong>.</p>
      ${bonusMessages.length > 0
        ? bonusMessages.map(b => `<p>${b}</p>`).join('')
        : ''
      }
      <p class="mm-xp">+${xp} XP</p>
    `;

    this._gridEl.replaceWith(completeEl);

    if (this._onCompleteCb) {
      this._onCompleteCb({
        score: this._matchedPairs,
        total: this._totalPairs,
        xp,
        time: elapsedMs,
        extras: {
          moves: this._moves,
          bonusEfficiency: this._moves < 15,
          bonusSpeed: elapsedSec < 30,
        },
      });
    }
  }

  /* -- Utilitaires -- */

  _escapeHTML(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }
}
