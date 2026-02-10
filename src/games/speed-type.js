import { getProgressiveTypingSet } from '../data/typing-words.js';

export default class SpeedType {
  constructor(container, lang) {
    this.container = container;
    this.lang = lang;
    this._onCompleteCallback = null;

    this.words = [];
    this.currentIndex = 0;
    this.score = 0;
    this.total = 20;
    this.totalCharsTyped = 0;
    this.totalErrors = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.currentWordHasError = false;

    this.timeLimit = 60;
    this.timeRemaining = 60;
    this.elapsedMs = 0;
    this.startTime = null;
    this._timerInterval = null;
    this._wpmInterval = null;

    this._running = false;
    this._destroyed = false;

    this._els = {};
  }

  onComplete(callback) {
    this._onCompleteCallback = callback;
  }

  start() {
    this.words = getProgressiveTypingSet(this.lang, 20);
    this._buildUI();
    this._bindEvents();
    this._running = true;
    this.startTime = Date.now();
    this._startTimer();
    this._updateDisplay();
    this._els.input.focus();
  }

  destroy() {
    this._destroyed = true;
    this._running = false;
    if (this._timerInterval) clearInterval(this._timerInterval);
    if (this._wpmInterval) clearInterval(this._wpmInterval);
    this._unbindEvents();
    this.container.innerHTML = '';
  }

  _buildUI() {
    const styleId = 'speed-type-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = this._getCSS();
      document.head.appendChild(style);
    }

    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'st-wrapper';

    const topBar = document.createElement('div');
    topBar.className = 'st-top-bar';

    const timerBox = document.createElement('div');
    timerBox.className = 'st-stat-box';
    timerBox.innerHTML = `<span class="st-stat-label">Temps</span><span class="st-stat-value st-timer">60</span>`;

    const wordsBox = document.createElement('div');
    wordsBox.className = 'st-stat-box';
    wordsBox.innerHTML = `<span class="st-stat-label">Mots</span><span class="st-stat-value st-words-count">0/${this.total}</span>`;

    const wpmBox = document.createElement('div');
    wpmBox.className = 'st-stat-box';
    wpmBox.innerHTML = `<span class="st-stat-label">MPM</span><span class="st-stat-value st-wpm">0</span>`;

    const streakBox = document.createElement('div');
    streakBox.className = 'st-stat-box st-streak-box';
    streakBox.innerHTML = `<span class="st-stat-label">Serie</span><span class="st-stat-value st-streak">0</span>`;

    topBar.append(timerBox, wordsBox, wpmBox, streakBox);

    const progressContainer = document.createElement('div');
    progressContainer.className = 'st-progress-container';
    const progressBar = document.createElement('div');
    progressBar.className = 'st-progress-bar';
    progressContainer.appendChild(progressBar);

    const targetContainer = document.createElement('div');
    targetContainer.className = 'st-target-container';

    const targetLabel = document.createElement('div');
    targetLabel.className = 'st-target-label';
    targetLabel.textContent = 'Tapez :';

    const targetDisplay = document.createElement('div');
    targetDisplay.className = 'st-target-display';

    targetContainer.append(targetLabel, targetDisplay);

    const inputContainer = document.createElement('div');
    inputContainer.className = 'st-input-container';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'st-input';
    input.placeholder = 'Commencez a taper ici...';
    input.autocomplete = 'off';
    input.autocapitalize = 'off';
    input.autocorrect = 'off';
    input.spellcheck = false;

    inputContainer.appendChild(input);

    const feedback = document.createElement('div');
    feedback.className = 'st-feedback';

    wrapper.append(topBar, progressContainer, targetContainer, inputContainer, feedback);
    this.container.appendChild(wrapper);

    this._els = {
      wrapper,
      timer: wrapper.querySelector('.st-timer'),
      wordsCount: wrapper.querySelector('.st-words-count'),
      wpm: wrapper.querySelector('.st-wpm'),
      streak: wrapper.querySelector('.st-streak'),
      streakBox: wrapper.querySelector('.st-streak-box'),
      progressBar: progressBar,
      targetDisplay: targetDisplay,
      input: input,
      inputContainer: inputContainer,
      feedback: feedback,
    };
  }

  _bindEvents() {
    this._onInput = this._handleInput.bind(this);
    this._onKeyDown = this._handleKeyDown.bind(this);

    this._els.input.addEventListener('input', this._onInput);
    this._els.input.addEventListener('keydown', this._onKeyDown);
  }

  _unbindEvents() {
    if (this._els.input) {
      this._els.input.removeEventListener('input', this._onInput);
      this._els.input.removeEventListener('keydown', this._onKeyDown);
    }
  }

  _handleInput() {
    if (!this._running) return;

    const typed = this._els.input.value;
    const target = this.words[this.currentIndex];

    this._renderTarget(typed);
    this._updateInputBorder(typed, target);

    if (typed === target) {
      this._wordCompleted();
    }
  }

  _handleKeyDown(e) {
    if (!this._running) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      const typed = this._els.input.value;
      const target = this.words[this.currentIndex];

      if (typed === target) {
        this._wordCompleted();
      } else {
        this._shakeInput();
        this.totalErrors++;
        this.currentWordHasError = true;
      }
    }
  }

  _wordCompleted() {
    this.score++;
    this.totalCharsTyped += this.words[this.currentIndex].length;

    if (!this.currentWordHasError) {
      this.streak++;
      if (this.streak > this.bestStreak) {
        this.bestStreak = this.streak;
      }
    } else {
      this.streak = 0;
    }

    this._flashSuccess();

    this.currentIndex++;

    if (this.currentIndex >= this.total) {
      this._endGame();
      return;
    }

    this._els.input.value = '';
    this.currentWordHasError = false;
    this._updateDisplay();
    this._els.input.focus();
  }

  _startTimer() {
    this._timerInterval = setInterval(() => {
      if (!this._running || this._destroyed) return;

      this.elapsedMs = Date.now() - this.startTime;
      this.timeRemaining = Math.max(0, this.timeLimit - Math.floor(this.elapsedMs / 1000));

      this._els.timer.textContent = this.timeRemaining;

      if (this.timeRemaining <= 10) {
        this._els.timer.classList.add('st-timer-warning');
      }
      if (this.timeRemaining <= 5) {
        this._els.timer.classList.add('st-timer-critical');
      }

      this._updateWPM();

      if (this.timeRemaining <= 0) {
        this._endGame();
      }
    }, 200);
  }

  _updateWPM() {
    const elapsedMinutes = this.elapsedMs / 60000;
    if (elapsedMinutes <= 0) return;
    const wpm = Math.round((this.totalCharsTyped / 5) / elapsedMinutes);
    this._els.wpm.textContent = wpm;
  }

  _updateDisplay() {
    this._els.wordsCount.textContent = `${this.score}/${this.total}`;

    this._els.streak.textContent = this.streak;
    if (this.streak >= 3) {
      this._els.streakBox.classList.add('st-streak-active');
    } else {
      this._els.streakBox.classList.remove('st-streak-active');
    }

    const pct = (this.score / this.total) * 100;
    this._els.progressBar.style.width = `${pct}%`;

    this._renderTarget('');

    this._els.inputContainer.classList.remove('st-input-correct', 'st-input-error');
  }

  _renderTarget(typed) {
    const target = this.words[this.currentIndex];
    if (!target) return;

    let html = '';
    for (let i = 0; i < target.length; i++) {
      const char = target[i] === ' ' ? '&nbsp;' : this._escapeHTML(target[i]);
      if (i < typed.length) {
        if (typed[i] === target[i]) {
          html += `<span class="st-char st-char-correct">${char}</span>`;
        } else {
          html += `<span class="st-char st-char-wrong">${char}</span>`;
        }
      } else {
        html += `<span class="st-char">${char}</span>`;
      }
    }

    this._els.targetDisplay.innerHTML = html;
  }

  _updateInputBorder(typed, target) {
    const container = this._els.inputContainer;
    container.classList.remove('st-input-correct', 'st-input-error');

    if (typed.length === 0) return;

    let hasError = false;
    for (let i = 0; i < typed.length; i++) {
      if (i >= target.length || typed[i] !== target[i]) {
        hasError = true;
        break;
      }
    }

    if (hasError) {
      container.classList.add('st-input-error');
      if (!this.currentWordHasError) {
        this.totalErrors++;
        this.currentWordHasError = true;
      }
    } else {
      container.classList.add('st-input-correct');
    }
  }

  _flashSuccess() {
    this._els.feedback.textContent = this._getSuccessMessage();
    this._els.feedback.classList.add('st-feedback-show');

    const targetContainer = this._els.targetDisplay.closest('.st-target-container');
    targetContainer.classList.add('st-flash-success');

    setTimeout(() => {
      this._els.feedback.classList.remove('st-feedback-show');
      targetContainer.classList.remove('st-flash-success');
    }, 500);
  }

  _shakeInput() {
    this._els.inputContainer.classList.add('st-shake');
    setTimeout(() => {
      this._els.inputContainer.classList.remove('st-shake');
    }, 400);
  }

  _getSuccessMessage() {
    const messages = ['Bien joue !', 'Excellent !', 'Parfait !', 'Bravo !', 'Super !', 'Correct !'];
    if (this.streak >= 5) return 'Inarretable !';
    if (this.streak >= 3) return 'En feu !';
    return messages[Math.floor(Math.random() * messages.length)];
  }

  _endGame() {
    this._running = false;
    if (this._timerInterval) clearInterval(this._timerInterval);
    if (this._wpmInterval) clearInterval(this._wpmInterval);

    this.elapsedMs = Date.now() - this.startTime;
    if (this.elapsedMs > this.timeLimit * 1000) {
      this.elapsedMs = this.timeLimit * 1000;
    }

    const elapsedMinutes = this.elapsedMs / 60000;
    const wpm = elapsedMinutes > 0 ? Math.round((this.totalCharsTyped / 5) / elapsedMinutes) : 0;

    const totalAttemptedChars = this.totalCharsTyped + this.totalErrors;
    const accuracy = totalAttemptedChars > 0
      ? Math.round(((totalAttemptedChars - this.totalErrors) / totalAttemptedChars) * 100)
      : 100;

    const xp = this.score * 8;

    this._showEndScreen(wpm, accuracy, xp);

    if (this._onCompleteCallback) {
      this._onCompleteCallback({
        score: this.score,
        total: this.total,
        xp,
        time: this.elapsedMs,
        extras: { wpm, accuracy },
      });
    }
  }

  _showEndScreen(wpm, accuracy, xp) {
    const wrapper = this._els.wrapper;
    if (!wrapper) return;

    const elapsedSeconds = Math.round(this.elapsedMs / 1000);

    wrapper.innerHTML = `
      <div class="st-end-screen">
        <h2 class="st-end-title">Temps ecoule !</h2>
        <div class="st-end-stats">
          <div class="st-end-stat">
            <span class="st-end-stat-value">${this.score}<span class="st-end-stat-small">/${this.total}</span></span>
            <span class="st-end-stat-label">Mots completes</span>
          </div>
          <div class="st-end-stat">
            <span class="st-end-stat-value">${wpm}</span>
            <span class="st-end-stat-label">MPM</span>
          </div>
          <div class="st-end-stat">
            <span class="st-end-stat-value">${accuracy}%</span>
            <span class="st-end-stat-label">Precision</span>
          </div>
          <div class="st-end-stat">
            <span class="st-end-stat-value">${elapsedSeconds}s</span>
            <span class="st-end-stat-label">Duree</span>
          </div>
          <div class="st-end-stat">
            <span class="st-end-stat-value">${this.bestStreak}</span>
            <span class="st-end-stat-label">Meilleure serie</span>
          </div>
          <div class="st-end-stat st-end-stat-xp">
            <span class="st-end-stat-value">+${xp}</span>
            <span class="st-end-stat-label">XP gagnes</span>
          </div>
        </div>
      </div>
    `;
  }

  _escapeHTML(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, c => map[c]);
  }

  _getCSS() {
    return `
.st-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);
  max-width: 720px;
  margin: 0 auto;
  user-select: none;
}

.st-top-bar {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.st-stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  min-width: 80px;
}

.st-stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: var(--space-xs);
}

.st-stat-value {
  font-family: var(--font-code);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
}

.st-timer-warning {
  color: var(--neon-gold) !important;
}

.st-timer-critical {
  color: var(--neon-red) !important;
  animation: st-pulse 0.6s ease-in-out infinite;
}

.st-streak-box .st-stat-value {
  transition: var(--transition-fast);
}

.st-streak-active .st-stat-value {
  color: var(--neon-gold);
  text-shadow: 0 0 8px var(--neon-gold);
}

.st-progress-container {
  width: 100%;
  height: 6px;
  background: var(--bg-card);
  border-radius: 3px;
  overflow: hidden;
}

.st-progress-bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.st-target-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg) var(--space-md);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: var(--transition-fast);
}

.st-target-container.st-flash-success {
  border-color: var(--neon-green);
  box-shadow: 0 0 16px rgba(0, 255, 100, 0.15);
}

.st-target-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.st-target-display {
  font-family: var(--font-code);
  font-size: 1.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-primary);
  padding: var(--space-sm) var(--space-md);
  min-height: 2.4em;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1px;
  word-break: break-all;
}

.st-char {
  display: inline-block;
  transition: color 0.08s;
}

.st-char-correct {
  color: var(--neon-green);
}

.st-char-wrong {
  color: var(--neon-red);
  text-decoration: underline;
  text-decoration-color: var(--neon-red);
}

.st-input-container {
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  background: var(--bg-input);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  padding: 2px;
}

.st-input-container.st-input-correct {
  border-color: var(--neon-green);
  box-shadow: 0 0 8px rgba(0, 255, 100, 0.1);
}

.st-input-container.st-input-error {
  border-color: var(--neon-red);
  box-shadow: 0 0 8px rgba(255, 50, 50, 0.15);
}

.st-input {
  width: 100%;
  box-sizing: border-box;
  font-family: var(--font-code);
  font-size: 1.4rem;
  padding: var(--space-md) var(--space-lg);
  background: transparent;
  border: none;
  color: var(--text-primary);
  outline: none;
  caret-color: var(--accent-primary);
}

.st-input::placeholder {
  color: var(--text-muted);
  opacity: 0.6;
}

.st-feedback {
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
  color: var(--neon-green);
  min-height: 1.4em;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.st-feedback-show {
  opacity: 1;
  transform: translateY(0);
}

.st-end-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-xl) var(--space-md);
  animation: st-fade-in 0.4s ease;
}

.st-end-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.st-end-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  width: 100%;
  max-width: 480px;
}

.st-end-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  gap: var(--space-xs);
}

.st-end-stat-value {
  font-family: var(--font-code);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent-primary);
}

.st-end-stat-small {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.st-end-stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.st-end-stat-xp .st-end-stat-value {
  color: var(--neon-gold);
  text-shadow: 0 0 10px var(--neon-gold);
}

@keyframes st-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes st-shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-6px); }
  30% { transform: translateX(6px); }
  45% { transform: translateX(-4px); }
  60% { transform: translateX(4px); }
  75% { transform: translateX(-2px); }
  90% { transform: translateX(2px); }
}

.st-shake {
  animation: st-shake 0.4s ease;
}

@keyframes st-fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
  }
}
