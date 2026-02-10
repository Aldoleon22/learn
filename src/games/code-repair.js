import { getBugSnippets } from '../data/bug-snippets.js';

export default class CodeRepair {
    constructor(container, lang) {
        this.container = container;
        this.lang = lang;
        this.bugs = [];
        this.currentIndex = 0;
        this.score = 0;
        this.total = 5;
        this.startTime = 0;
        this.timers = [];
        this.completeCallback = null;
        this.destroyed = false;
    }

    onComplete(callback) {
        this.completeCallback = callback;
    }

    start() {
        const pool = getBugSnippets(this.lang);
        this.bugs = this._pickRandom(pool, this.total);
        this.currentIndex = 0;
        this.score = 0;
        this.startTime = Date.now();
        this._render();
    }

    destroy() {
        this.destroyed = true;
        this.timers.forEach(t => clearTimeout(t));
        this.timers = [];
        this.container.innerHTML = '';
    }

    _render() {
        if (this.destroyed) return;

        this.container.innerHTML = `
            <div class="cr-wrapper">
                <div class="cr-header">
                    <span class="cr-progress">Bug <strong>${this.currentIndex + 1}</strong> / ${this.total}</span>
                    <span class="cr-score">Score : <strong>${this.score}</strong></span>
                </div>
                <div class="cr-progress-bar">
                    <div class="cr-progress-fill" style="width:${((this.currentIndex) / this.total) * 100}%"></div>
                </div>
                <div id="cr-bug-area"></div>
            </div>
            <style>${this._styles()}</style>
        `;

        this._renderBug();
    }

    _renderBug() {
        if (this.destroyed) return;

        const bug = this.bugs[this.currentIndex];
        const area = this.container.querySelector('#cr-bug-area');
        if (!area) return;

        const codeHTML = this._buildCodeBlock(bug.buggyCode, bug.bugLine);
        const options = this._generateOptions(bug);
        const shuffled = this._shuffle(options);

        area.innerHTML = `
            <div class="cr-title">${bug.title}</div>
            <div class="cr-subtitle">Categorie : ${bug.category} &middot; Difficulte : ${'★'.repeat(bug.difficulty)}${'☆'.repeat(3 - bug.difficulty)}</div>

            <div class="cr-code-card neon-card">
                <div class="cr-code-label">Code bugue</div>
                <pre class="cr-code-block"><code>${codeHTML}</code></pre>
            </div>

            <div class="cr-hint-area">
                <button class="btn-neon btn-small cr-hint-btn" id="cr-hint-btn">Indice</button>
                <span class="cr-hint-text" id="cr-hint-text" style="display:none;">${bug.hint}</span>
            </div>

            <div class="cr-question-label">Choisissez le correctif correct :</div>

            <div class="cr-options" id="cr-options">
                ${shuffled.map((opt, i) => `
                    <button class="cr-option neon-card" data-index="${i}" data-correct="${opt.correct ? 'true' : 'false'}">
                        <div class="cr-option-badge">Option ${String.fromCharCode(65 + i)}</div>
                        <pre class="cr-option-code"><code>${this._escapeHTML(opt.code)}</code></pre>
                    </button>
                `).join('')}
            </div>

            <div class="cr-explanation" id="cr-explanation" style="display:none;"></div>
        `;

        const hintBtn = area.querySelector('#cr-hint-btn');
        const hintText = area.querySelector('#cr-hint-text');
        hintBtn.addEventListener('click', () => {
            hintText.style.display = 'inline';
            hintBtn.style.display = 'none';
        });

        const optionBtns = area.querySelectorAll('.cr-option');
        optionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this._handleAnswer(btn, optionBtns, bug);
            }, { once: true });
        });
    }

    _handleAnswer(selectedBtn, allBtns, bug) {
        if (this.destroyed) return;

        const isCorrect = selectedBtn.dataset.correct === 'true';

        allBtns.forEach(btn => {
            btn.style.pointerEvents = 'none';
            if (btn.dataset.correct === 'true') {
                btn.classList.add('cr-option--correct');
            }
        });

        if (isCorrect) {
            selectedBtn.classList.add('cr-option--correct');
            this.score++;
        } else {
            selectedBtn.classList.add('cr-option--wrong');
        }

        const scoreEl = this.container.querySelector('.cr-score strong');
        if (scoreEl) scoreEl.textContent = this.score;

        const explEl = this.container.querySelector('#cr-explanation');
        if (explEl) {
            explEl.style.display = 'block';
            explEl.innerHTML = `
                <div class="cr-explanation-header ${isCorrect ? 'cr-explanation--correct' : 'cr-explanation--wrong'}">
                    ${isCorrect ? 'Correct !' : 'Incorrect'}
                </div>
                <div class="cr-explanation-body">${bug.explanation}</div>
            `;
        }

        const delay = isCorrect ? 1500 : 2000;
        const timer = setTimeout(() => {
            this._next();
        }, delay);
        this.timers.push(timer);
    }

    _next() {
        if (this.destroyed) return;

        this.currentIndex++;

        if (this.currentIndex >= this.total) {
            this._finish();
            return;
        }

        const fill = this.container.querySelector('.cr-progress-fill');
        if (fill) fill.style.width = `${(this.currentIndex / this.total) * 100}%`;

        const prog = this.container.querySelector('.cr-progress');
        if (prog) prog.innerHTML = `Bug <strong>${this.currentIndex + 1}</strong> / ${this.total}`;

        this._renderBug();
    }

    _finish() {
        if (this.destroyed) return;

        const elapsed = Date.now() - this.startTime;
        const xp = this.score * 20;

        this.container.innerHTML = `
            <div class="cr-wrapper cr-finish">
                <div class="cr-finish-icon">🔍</div>
                <h2 class="cr-finish-title">Chasse aux bugs terminee !</h2>
                <p class="cr-finish-score">${this.score} / ${this.total} bugs corriges</p>
                <p class="cr-finish-xp">+${xp} XP</p>
                <p class="cr-finish-time">Temps : ${Math.round(elapsed / 1000)}s</p>
            </div>
            <style>${this._styles()}</style>
        `;

        const timer = setTimeout(() => {
            if (this.completeCallback && !this.destroyed) {
                this.completeCallback({
                    score: this.score,
                    total: this.total,
                    xp,
                    time: elapsed,
                    extras: {
                        hintsUsed: 0,
                        perfectRound: this.score === this.total
                    }
                });
            }
        }, 1200);
        this.timers.push(timer);
    }

    _generateOptions(bug) {
        const correct = { code: bug.fixedCode, correct: true };
        const wrong1 = { code: bug.buggyCode, correct: false };
        const wrong2 = { code: this._createPlausibleWrong(bug), correct: false };
        return [correct, wrong1, wrong2];
    }

    _createPlausibleWrong(bug) {
        const fixed = bug.fixedCode;
        const buggy = bug.buggyCode;
        const fixedLines = fixed.split('\n');
        const buggyLines = buggy.split('\n');
        const bugLineIdx = bug.bugLine - 1;

        if (fixedLines.length > 1 && bugLineIdx >= 0 && bugLineIdx < fixedLines.length) {
            const altLines = [...fixedLines];
            const fixedBugLine = fixedLines[bugLineIdx] || '';
            const buggyBugLine = (buggyLines[bugLineIdx] || '');

            let mutated = this._mutateLine(fixedBugLine, buggyBugLine);

            if (mutated === fixedBugLine || mutated === buggyBugLine) {
                mutated = this._fallbackMutate(fixedBugLine);
            }

            altLines[bugLineIdx] = mutated;
            const result = altLines.join('\n');

            if (result !== fixed && result !== buggy) {
                return result;
            }
        }

        const mid = Math.floor(fixedLines.length / 2);
        if (fixedLines.length >= 2) {
            const blend = [
                ...fixedLines.slice(0, mid),
                ...buggyLines.slice(mid)
            ].join('\n');
            if (blend !== fixed && blend !== buggy) {
                return blend;
            }
        }

        if (this.lang === 'python') {
            return fixed.replace(/\n/, '\n# fix\n');
        }
        return fixed.replace(/;(\s*)$/, ';;$1').replace(/\n/, '\n// fix\n');
    }

    _mutateLine(fixedLine, buggyLine) {
        const swaps = [
            ['===', '=='], ['==', '!='], ['!==', '==='],
            ['<=', '<'], ['>=', '>'], ['< ', '<= '], ['> ', '>= '],
            ['const ', 'let '], ['let ', 'var '], ['await ', ''],
            ['break;', ''], ['break', 'continue'],
            ['...', ''], ['Number(', 'String('],
            ['f"', '"'], ['in (', '== ('],
        ];

        for (const [from, to] of swaps) {
            if (fixedLine.includes(from)) {
                const mutated = fixedLine.replace(from, to);
                if (mutated !== fixedLine && mutated !== buggyLine) {
                    return mutated;
                }
            }
        }

        return fixedLine;
    }

    _fallbackMutate(line) {
        if (line.length > 6) {
            const mid = Math.floor(line.length / 2);
            return line.slice(0, mid) + ' ' + line.slice(mid);
        }
        return line + ' ';
    }

    _buildCodeBlock(code, bugLine) {
        const lines = code.split('\n');
        return lines.map((line, i) => {
            const lineNum = i + 1;
            const isBugLine = lineNum === bugLine;
            const escapedLine = this._escapeHTML(line) || ' ';
            const cls = isBugLine ? ' class="cr-line--bug"' : '';
            const numCls = isBugLine ? ' cr-linenum--bug' : '';
            return `<span class="cr-line"${cls}><span class="cr-linenum${numCls}">${String(lineNum).padStart(2, ' ')}</span>${escapedLine}</span>`;
        }).join('\n');
    }

    _escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    _pickRandom(arr, count) {
        const copy = [...arr];
        const result = [];
        const n = Math.min(count, copy.length);
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(Math.random() * copy.length);
            result.push(copy.splice(idx, 1)[0]);
        }
        return result;
    }

    _shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    _styles() {
        return `
            .cr-wrapper {
                max-width: 720px;
                margin: 0 auto;
                font-family: inherit;
            }
            .cr-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--space-xs);
                font-size: 0.9rem;
                color: var(--text-muted);
            }
            .cr-header strong { color: var(--text-primary); }
            .cr-score strong { color: var(--neon-green); }
            .cr-progress-bar {
                width: 100%;
                height: 4px;
                background: var(--bg-input);
                border-radius: var(--radius-sm);
                margin-bottom: var(--space-lg);
                overflow: hidden;
            }
            .cr-progress-fill {
                height: 100%;
                background: var(--accent-primary);
                border-radius: var(--radius-sm);
                transition: width 0.4s ease;
            }
            .cr-title {
                font-size: 1.2rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: var(--space-xs);
            }
            .cr-subtitle {
                font-size: 0.8rem;
                color: var(--text-muted);
                margin-bottom: var(--space-md);
            }
            .cr-code-card {
                padding: 0;
                overflow: hidden;
                margin-bottom: var(--space-md);
            }
            .cr-code-label {
                padding: var(--space-xs) var(--space-sm);
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--text-muted);
                background: var(--bg-input);
                border-bottom: 1px solid var(--bg-input);
            }
            .cr-code-block {
                margin: 0;
                padding: var(--space-sm);
                background: var(--bg-primary);
                overflow-x: auto;
                font-family: var(--font-code);
                font-size: 0.85rem;
                line-height: 1.7;
                color: var(--text-primary);
                tab-size: 4;
            }
            .cr-code-block code { font-family: inherit; }
            .cr-line { display: block; }
            .cr-linenum {
                display: inline-block;
                width: 2.5em;
                text-align: right;
                margin-right: 1em;
                color: var(--text-muted);
                opacity: 0.5;
                user-select: none;
                font-size: 0.8em;
            }
            .cr-linenum--bug {
                color: var(--neon-gold);
                opacity: 0.9;
            }
            .cr-line--bug {
                background: rgba(255, 200, 50, 0.08);
                border-left: 3px solid var(--neon-gold);
                padding-left: 2px;
                margin-left: -3px;
            }
            .cr-hint-area {
                margin-bottom: var(--space-md);
                display: flex;
                align-items: center;
                gap: var(--space-sm);
            }
            .cr-hint-btn { font-size: 0.8rem; cursor: pointer; }
            .cr-hint-text {
                font-size: 0.85rem;
                color: var(--neon-gold);
                font-style: italic;
            }
            .cr-question-label {
                font-size: 0.95rem;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: var(--space-sm);
            }
            .cr-options {
                display: flex;
                flex-direction: column;
                gap: var(--space-sm);
                margin-bottom: var(--space-md);
            }
            .cr-option {
                display: block;
                width: 100%;
                text-align: left;
                cursor: pointer;
                padding: var(--space-sm);
                border: 1px solid var(--bg-input);
                background: var(--bg-card);
                border-radius: var(--radius-md);
                transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
            }
            .cr-option:hover {
                border-color: var(--accent-primary);
                box-shadow: 0 0 10px var(--accent-primary)22;
                transform: translateY(-1px);
            }
            .cr-option-badge {
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--text-muted);
                margin-bottom: var(--space-xs);
            }
            .cr-option-code {
                margin: 0;
                padding: var(--space-xs);
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
                font-family: var(--font-code);
                font-size: 0.8rem;
                line-height: 1.6;
                color: var(--text-primary);
                overflow-x: auto;
                white-space: pre;
                tab-size: 4;
            }
            .cr-option-code code { font-family: inherit; }
            .cr-option--correct {
                border-color: var(--neon-green) !important;
                box-shadow: 0 0 12px var(--neon-green)44 !important;
                background: rgba(105, 219, 124, 0.06);
            }
            .cr-option--correct .cr-option-badge { color: var(--neon-green); }
            .cr-option--wrong {
                border-color: var(--neon-red) !important;
                box-shadow: 0 0 12px var(--neon-red)44 !important;
                background: rgba(255, 80, 80, 0.06);
            }
            .cr-option--wrong .cr-option-badge { color: var(--neon-red); }
            .cr-explanation {
                border-radius: var(--radius-md);
                overflow: hidden;
                margin-bottom: var(--space-md);
                animation: cr-fade-in 0.3s ease;
            }
            .cr-explanation-header {
                padding: var(--space-xs) var(--space-sm);
                font-weight: 700;
                font-size: 0.9rem;
            }
            .cr-explanation--correct {
                background: rgba(105, 219, 124, 0.15);
                color: var(--neon-green);
            }
            .cr-explanation--wrong {
                background: rgba(255, 80, 80, 0.15);
                color: var(--neon-red);
            }
            .cr-explanation-body {
                padding: var(--space-sm);
                font-size: 0.85rem;
                color: var(--text-primary);
                background: var(--bg-card);
                border: 1px solid var(--bg-input);
                border-top: none;
                border-radius: 0 0 var(--radius-md) var(--radius-md);
                line-height: 1.5;
            }
            .cr-finish {
                text-align: center;
                padding: var(--space-lg) 0;
            }
            .cr-finish-icon { font-size: 3rem; margin-bottom: var(--space-md); }
            .cr-finish-title {
                font-size: 1.4rem;
                font-weight: 700;
                color: var(--text-primary);
                margin: 0 0 var(--space-sm) 0;
            }
            .cr-finish-score {
                font-size: 1.1rem;
                color: var(--text-muted);
                margin: 0 0 var(--space-xs) 0;
            }
            .cr-finish-xp {
                font-size: 1.3rem;
                font-weight: 700;
                color: var(--neon-green);
                margin: 0 0 var(--space-xs) 0;
            }
            .cr-finish-time {
                font-size: 0.9rem;
                color: var(--text-muted);
                margin: 0;
            }
            @keyframes cr-fade-in {
                from { opacity: 0; transform: translateY(6px); }
                to   { opacity: 1; transform: translateY(0); }
            }
        `;
    }
}
