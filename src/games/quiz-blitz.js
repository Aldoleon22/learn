import { getRandomQuizSet } from '../data/quiz-questions.js';

const TOTAL_QUESTIONS = 10;
const GAME_DURATION = 60;
const BASE_POINTS = 10;
const XP_PER_CORRECT = 15;
const COUNTDOWN_START = 3;
const ANSWER_FLASH_MS = 800;
const WRONG_ANSWER_PAUSE_MS = 1200;

export default class QuizBlitz {
  constructor(container, lang) {
    this.container = container;
    this.lang = lang;
    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.correctCount = 0;
    this.timeRemaining = GAME_DURATION;
    this.gameStartTime = null;
    this.timerId = null;
    this.countdownId = null;
    this.completionCallback = null;
    this.isFinished = false;
    this.isAnswerLocked = false;
  }

  onComplete(callback) {
    this.completionCallback = callback;
  }

  start() {
    this.questions = getRandomQuizSet(this.lang, TOTAL_QUESTIONS);
    this.currentIndex = 0;
    this.score = 0;
    this.correctCount = 0;
    this.timeRemaining = GAME_DURATION;
    this.isFinished = false;
    this.isAnswerLocked = false;
    this._renderCountdown();
  }

  destroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.countdownId) {
      clearInterval(this.countdownId);
      this.countdownId = null;
    }
    this.container.innerHTML = '';
  }

  // ---------- Countdown 3..2..1 ----------

  _renderCountdown() {
    let count = COUNTDOWN_START;

    this.container.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 320px;
      ">
        <div style="text-align: center;">
          <p style="
            color: var(--text-muted);
            font-size: 1.1rem;
            margin-bottom: var(--space-md);
          ">Preparez-vous...</p>
          <span id="qb-countdown" style="
            font-size: 5rem;
            font-weight: 800;
            color: var(--accent-primary);
            font-family: var(--font-code);
            text-shadow: 0 0 20px var(--accent-primary);
            transition: transform 0.2s ease;
          ">${count}</span>
        </div>
      </div>
    `;

    const countdownEl = this.container.querySelector('#qb-countdown');

    this.countdownId = setInterval(() => {
      count--;
      if (count > 0) {
        countdownEl.textContent = count;
        countdownEl.style.transform = 'scale(1.3)';
        setTimeout(() => { countdownEl.style.transform = 'scale(1)'; }, 150);
      } else {
        clearInterval(this.countdownId);
        this.countdownId = null;
        this._startGame();
      }
    }, 1000);
  }

  // ---------- Game Start ----------

  _startGame() {
    this.gameStartTime = Date.now();
    this._renderGameShell();
    this._renderQuestion();
    this._startTimer();
  }

  _startTimer() {
    this.timerId = setInterval(() => {
      this.timeRemaining--;
      this._updateTimerDisplay();

      if (this.timeRemaining <= 0) {
        clearInterval(this.timerId);
        this.timerId = null;
        this._endGame();
      }
    }, 1000);
  }

  _updateTimerDisplay() {
    const timerEl = this.container.querySelector('#qb-timer');
    if (!timerEl) return;

    const mins = Math.floor(this.timeRemaining / 60);
    const secs = this.timeRemaining % 60;
    timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (this.timeRemaining <= 10) {
      timerEl.style.color = 'var(--neon-red)';
      timerEl.style.textShadow = '0 0 10px var(--neon-red)';
    } else {
      timerEl.style.color = 'var(--accent-primary)';
      timerEl.style.textShadow = '0 0 10px var(--accent-primary)';
    }
  }

  // ---------- Game Shell ----------

  _renderGameShell() {
    const progressPercent = 0;

    this.container.innerHTML = `
      <div style="max-width: 700px; margin: 0 auto;">
        <!-- Header: counter + timer -->
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
        ">
          <span id="qb-counter" style="
            color: var(--text-muted);
            font-family: var(--font-code);
            font-size: 0.95rem;
          ">1/${TOTAL_QUESTIONS}</span>

          <span id="qb-timer" style="
            font-family: var(--font-code);
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--accent-primary);
            text-shadow: 0 0 10px var(--accent-primary);
          ">01:00</span>
        </div>

        <!-- Progress bar -->
        <div style="
          width: 100%;
          height: 6px;
          background: var(--bg-input);
          border-radius: var(--radius-sm);
          margin-bottom: var(--space-lg);
          overflow: hidden;
        ">
          <div id="qb-progress" style="
            width: ${progressPercent}%;
            height: 100%;
            background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
            border-radius: var(--radius-sm);
            transition: width 0.4s ease;
          "></div>
        </div>

        <!-- Question area -->
        <div id="qb-question-area"></div>
      </div>
    `;
  }

  _updateProgress() {
    const counter = this.container.querySelector('#qb-counter');
    const progressBar = this.container.querySelector('#qb-progress');

    if (counter) {
      counter.textContent = `${this.currentIndex + 1}/${TOTAL_QUESTIONS}`;
    }
    if (progressBar) {
      const pct = ((this.currentIndex) / TOTAL_QUESTIONS) * 100;
      progressBar.style.width = `${pct}%`;
    }
  }

  // ---------- Question Rendering ----------

  _renderQuestion() {
    if (this.currentIndex >= this.questions.length || this.isFinished) {
      this._endGame();
      return;
    }

    this.isAnswerLocked = false;
    this._updateProgress();

    const q = this.questions[this.currentIndex];
    const area = this.container.querySelector('#qb-question-area');
    if (!area) return;

    const difficultyColors = {
      easy: 'var(--neon-green)',
      medium: 'var(--accent-secondary)',
      hard: 'var(--neon-red)'
    };

    const difficultyLabels = {
      easy: 'Facile',
      medium: 'Moyen',
      hard: 'Difficile'
    };

    const diffColor = difficultyColors[q.difficulty] || 'var(--text-muted)';
    const diffLabel = difficultyLabels[q.difficulty] || q.difficulty;

    area.innerHTML = `
      <div class="neon-card" style="
        padding: var(--space-lg);
        margin-bottom: var(--space-md);
      ">
        <!-- Category + difficulty -->
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
        ">
          <span style="
            color: var(--text-muted);
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          ">${q.category}</span>
          <span style="
            color: ${diffColor};
            font-size: 0.8rem;
            font-weight: 600;
            padding: 2px 10px;
            border: 1px solid ${diffColor};
            border-radius: var(--radius-sm);
          ">${diffLabel}</span>
        </div>

        <!-- Question text -->
        <p style="
          color: var(--text-primary);
          font-size: 1.15rem;
          line-height: 1.6;
          margin-bottom: var(--space-lg);
        ">${this._escapeHtml(q.question)}</p>

        <!-- Choices -->
        <div id="qb-choices" style="
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        ">
          ${q.choices.map((choice, idx) => `
            <button
              class="btn-neon"
              data-index="${idx}"
              style="
                display: block;
                width: 100%;
                text-align: left;
                padding: var(--space-sm) var(--space-md);
                font-size: 1rem;
                font-family: var(--font-code);
                background: var(--bg-input);
                color: var(--text-primary);
                border: 1px solid transparent;
                border-radius: var(--radius-md);
                cursor: pointer;
                transition: border-color 0.2s ease, background 0.2s ease, transform 0.15s ease;
              "
              onmouseover="this.style.borderColor='var(--accent-primary)'; this.style.transform='translateX(4px)';"
              onmouseout="this.style.borderColor='transparent'; this.style.transform='translateX(0)';"
            >
              <span style="
                color: var(--accent-secondary);
                font-weight: 700;
                margin-right: var(--space-sm);
              ">${String.fromCharCode(65 + idx)}.</span>${this._escapeHtml(choice)}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    const choicesContainer = area.querySelector('#qb-choices');
    choicesContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-index]');
      if (!btn || this.isAnswerLocked) return;
      this._handleAnswer(parseInt(btn.dataset.index, 10));
    });
  }

  // ---------- Answer Handling ----------

  _handleAnswer(selectedIndex) {
    if (this.isAnswerLocked || this.isFinished) return;
    this.isAnswerLocked = true;

    const q = this.questions[this.currentIndex];
    const isCorrect = selectedIndex === q.correct;
    const buttons = this.container.querySelectorAll('#qb-choices button');

    // Remove hover effects on all buttons
    buttons.forEach((btn) => {
      btn.onmouseover = null;
      btn.onmouseout = null;
      btn.style.cursor = 'default';
      btn.style.transform = 'translateX(0)';
    });

    if (isCorrect) {
      const selectedBtn = buttons[selectedIndex];
      selectedBtn.style.background = 'var(--neon-green)';
      selectedBtn.style.color = 'var(--bg-primary)';
      selectedBtn.style.borderColor = 'var(--neon-green)';
      selectedBtn.style.fontWeight = '700';

      const timeBonus = Math.max(0, Math.floor(this.timeRemaining / 6));
      const points = BASE_POINTS + timeBonus;
      this.score += points;
      this.correctCount++;

      setTimeout(() => {
        this._nextQuestion();
      }, ANSWER_FLASH_MS);
    } else {
      const selectedBtn = buttons[selectedIndex];
      selectedBtn.style.background = 'var(--neon-red)';
      selectedBtn.style.color = 'var(--bg-primary)';
      selectedBtn.style.borderColor = 'var(--neon-red)';
      selectedBtn.style.fontWeight = '700';

      const correctBtn = buttons[q.correct];
      correctBtn.style.background = 'var(--neon-green)';
      correctBtn.style.color = 'var(--bg-primary)';
      correctBtn.style.borderColor = 'var(--neon-green)';
      correctBtn.style.fontWeight = '700';

      const area = this.container.querySelector('#qb-question-area .neon-card');
      if (area && q.explanation) {
        const explanationEl = document.createElement('div');
        explanationEl.style.cssText = `
          margin-top: var(--space-md);
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-input);
          border-left: 3px solid var(--accent-secondary);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.5;
        `;
        explanationEl.textContent = q.explanation;
        area.appendChild(explanationEl);
      }

      setTimeout(() => {
        this._nextQuestion();
      }, WRONG_ANSWER_PAUSE_MS);
    }
  }

  _nextQuestion() {
    this.currentIndex++;

    if (this.currentIndex >= this.questions.length) {
      this._endGame();
    } else {
      this._renderQuestion();
    }
  }

  // ---------- End Game ----------

  _endGame() {
    if (this.isFinished) return;
    this.isFinished = true;

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    const elapsedMs = Date.now() - this.gameStartTime;
    const elapsed = Math.round(elapsedMs / 1000);
    const xp = this.correctCount * XP_PER_CORRECT;
    const percentage = Math.round((this.correctCount / TOTAL_QUESTIONS) * 100);

    this._renderResults(elapsed, xp, percentage);

    if (this.completionCallback) {
      this.completionCallback({
        score: this.correctCount,
        total: TOTAL_QUESTIONS,
        xp,
        time: elapsedMs,
        extras: {
          points: this.score,
          percentage,
          lang: this.lang
        }
      });
    }
  }

  _renderResults(elapsed, xp, percentage) {
    let message = '';

    if (percentage === 100) {
      message = 'Score parfait ! Impressionnant !';
    } else if (percentage >= 80) {
      message = 'Excellent travail ! Presque parfait !';
    } else if (percentage >= 60) {
      message = 'Bon travail, continuez comme ca !';
    } else if (percentage >= 40) {
      message = 'Pas mal, mais vous pouvez faire mieux !';
    } else {
      message = 'Continuez a vous entrainer, vous progresserez !';
    }

    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    this.container.innerHTML = `
      <div style="
        max-width: 500px;
        margin: 0 auto;
        text-align: center;
      ">
        <div class="neon-card" style="padding: var(--space-lg);">
          <p style="
            font-size: 1.6rem;
            font-weight: 800;
            color: var(--text-primary);
            margin-bottom: var(--space-sm);
          ">Quiz termine !</p>

          <p style="
            color: var(--text-muted);
            font-size: 1rem;
            margin-bottom: var(--space-lg);
          ">${message}</p>

          <div style="
            width: 120px;
            height: 120px;
            margin: 0 auto var(--space-lg);
            border-radius: 50%;
            border: 4px solid ${percentage >= 60 ? 'var(--neon-green)' : 'var(--neon-red)'};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px ${percentage >= 60 ? 'var(--neon-green)' : 'var(--neon-red)'}40;
          ">
            <span style="
              font-size: 2.2rem;
              font-weight: 800;
              font-family: var(--font-code);
              color: var(--text-primary);
            ">${this.correctCount}/${TOTAL_QUESTIONS}</span>
            <span style="
              font-size: 0.8rem;
              color: var(--text-muted);
            ">${percentage}%</span>
          </div>

          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: var(--space-md);
            margin-bottom: var(--space-lg);
          ">
            <div style="
              background: var(--bg-input);
              border-radius: var(--radius-md);
              padding: var(--space-md) var(--space-sm);
            ">
              <p style="
                color: var(--accent-primary);
                font-family: var(--font-code);
                font-size: 1.4rem;
                font-weight: 700;
              ">${this.score}</p>
              <p style="
                color: var(--text-muted);
                font-size: 0.8rem;
                margin-top: 4px;
              ">Points</p>
            </div>

            <div style="
              background: var(--bg-input);
              border-radius: var(--radius-md);
              padding: var(--space-md) var(--space-sm);
            ">
              <p style="
                color: var(--accent-secondary);
                font-family: var(--font-code);
                font-size: 1.4rem;
                font-weight: 700;
              ">+${xp}</p>
              <p style="
                color: var(--text-muted);
                font-size: 0.8rem;
                margin-top: 4px;
              ">XP</p>
            </div>

            <div style="
              background: var(--bg-input);
              border-radius: var(--radius-md);
              padding: var(--space-md) var(--space-sm);
            ">
              <p style="
                color: var(--text-primary);
                font-family: var(--font-code);
                font-size: 1.4rem;
                font-weight: 700;
              ">${timeStr}</p>
              <p style="
                color: var(--text-muted);
                font-size: 0.8rem;
                margin-top: 4px;
              ">Temps</p>
            </div>
          </div>

          <button id="qb-replay" class="btn-neon btn-primary" style="
            padding: var(--space-sm) var(--space-lg);
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
          ">Rejouer</button>
        </div>
      </div>
    `;

    const replayBtn = this.container.querySelector('#qb-replay');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        this.start();
      });
    }
  }

  // ---------- Utility ----------

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
