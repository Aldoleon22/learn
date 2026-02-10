// OutputGuess - "Que va afficher ce code ?" game
// Players see code snippets and guess the output from 4 choices.

const JS_QUESTIONS = [
  {
    code: 'console.log(typeof [])',
    output: '"object"',
    choices: ['"array"', '"object"', '"list"', '"undefined"'],
    correct: 1,
    explanation: 'En JS, les tableaux sont des objets. typeof [] retourne "object".'
  },
  {
    code: 'console.log(1 + "2")',
    output: '"12"',
    choices: ['3', '"12"', '"3"', 'NaN'],
    correct: 1,
    explanation: 'JS convertit le nombre en string et concat\u00e8ne.'
  },
  {
    code: 'console.log([] == false)',
    output: 'true',
    choices: ['true', 'false', 'TypeError', 'undefined'],
    correct: 0,
    explanation: 'Un tableau vide est converti en 0 qui est == false.'
  },
  {
    code: 'console.log(+"hello")',
    output: 'NaN',
    choices: ['0', 'NaN', '"hello"', 'undefined'],
    correct: 1,
    explanation: 'L\'op\u00e9rateur unaire + tente de convertir en nombre. "hello" n\'est pas un nombre valide, donc NaN.'
  },
  {
    code: 'console.log(0.1 + 0.2 === 0.3)',
    output: 'false',
    choices: ['true', 'false', 'NaN', 'TypeError'],
    correct: 1,
    explanation: 'Les flottants en IEEE 754 ont des erreurs de pr\u00e9cision. 0.1 + 0.2 donne 0.30000000000000004.'
  },
  {
    code: 'console.log(typeof null)',
    output: '"object"',
    choices: ['"null"', '"object"', '"undefined"', '"boolean"'],
    correct: 1,
    explanation: 'C\'est un bug historique de JS. typeof null retourne "object" au lieu de "null".'
  },
  {
    code: 'console.log(!!"false")',
    output: 'true',
    choices: ['true', 'false', '"false"', 'TypeError'],
    correct: 0,
    explanation: 'Toute string non vide est truthy. !!"false" donne true car "false" est une string non vide.'
  },
  {
    code: 'console.log([1,2,3].map(String))',
    output: '["1","2","3"]',
    choices: ['[1,2,3]', '["1","2","3"]', '[NaN,NaN,NaN]', 'TypeError'],
    correct: 1,
    explanation: 'String est utilis\u00e9 comme callback. Chaque \u00e9l\u00e9ment est converti en string via String().'
  },
  {
    code: 'console.log("b" + "a" + +"a" + "a")',
    output: '"baNaNa"',
    choices: ['"baaa"', '"baNaNa"', '"ba0a"', 'SyntaxError'],
    correct: 1,
    explanation: '+"a" donne NaN (conversion unaire), puis NaN est concat\u00e9n\u00e9 comme string : "ba" + NaN + "a" = "baNaNa".'
  },
  {
    code: 'console.log([..."hello"])',
    output: '["h","e","l","l","o"]',
    choices: ['["hello"]', '["h","e","l","l","o"]', '"hello"', 'TypeError'],
    correct: 1,
    explanation: 'Le spread operator it\u00e8re sur la string et la d\u00e9compose en caract\u00e8res individuels.'
  },
  {
    code: 'console.log(3 > 2 > 1)',
    output: 'false',
    choices: ['true', 'false', 'TypeError', 'NaN'],
    correct: 1,
    explanation: '3 > 2 donne true (1), puis true > 1 donne false car 1 > 1 est false.'
  },
  {
    code: 'console.log(null == undefined)',
    output: 'true',
    choices: ['true', 'false', 'TypeError', 'NaN'],
    correct: 0,
    explanation: 'En JS, null == undefined est true par sp\u00e9cification. Mais null === undefined est false.'
  },
  {
    code: 'console.log([1,2,3].indexOf(4))',
    output: '-1',
    choices: ['undefined', '-1', 'false', 'null'],
    correct: 1,
    explanation: 'indexOf retourne -1 quand l\'\u00e9l\u00e9ment n\'est pas trouv\u00e9 dans le tableau.'
  },
  {
    code: 'console.log(NaN === NaN)',
    output: 'false',
    choices: ['true', 'false', 'NaN', 'TypeError'],
    correct: 1,
    explanation: 'NaN n\'est \u00e9gal \u00e0 rien, pas m\u00eame \u00e0 lui-m\u00eame. C\'est la seule valeur JS avec cette propri\u00e9t\u00e9.'
  },
  {
    code: 'let a = [1,2,3];\nconsole.log(a.length = 1, a)',
    output: '1 [1]',
    choices: ['1 [1]', '1 [1,2,3]', 'TypeError', '3 [1]'],
    correct: 0,
    explanation: 'Assigner a.length = 1 tronque le tableau. L\'expression retourne 1, et a vaut [1].'
  }
];

const PYTHON_QUESTIONS = [
  {
    code: 'print(type([]))',
    output: "<class 'list'>",
    choices: ["<class 'list'>", "<class 'array'>", "list", "[]"],
    correct: 0,
    explanation: "type() retourne le type de l'objet. Une liste vide est de type list."
  },
  {
    code: 'print(3 * "ab")',
    output: '"ababab"',
    choices: ['"ababab"', 'Error', '"3ab"', '"ab3"'],
    correct: 0,
    explanation: 'Multiplier une string par un entier la r\u00e9p\u00e8te n fois.'
  },
  {
    code: 'print(10 // 3)',
    output: '3',
    choices: ['3.33', '3', '4', '3.0'],
    correct: 1,
    explanation: 'L\'op\u00e9rateur // fait une division enti\u00e8re (floor division). 10 // 3 = 3.'
  },
  {
    code: 'print(bool(""))',
    output: 'False',
    choices: ['True', 'False', 'None', 'Error'],
    correct: 1,
    explanation: 'Une string vide est falsy en Python. bool("") retourne False.'
  },
  {
    code: 'print([1, 2, 3][::-1])',
    output: '[3, 2, 1]',
    choices: ['[3, 2, 1]', '[1, 2, 3]', 'Error', '[1, 3]'],
    correct: 0,
    explanation: 'Le slice [::-1] inverse la liste en cr\u00e9ant une copie invers\u00e9e.'
  },
  {
    code: 'print(None == False)',
    output: 'False',
    choices: ['True', 'False', 'None', 'Error'],
    correct: 1,
    explanation: 'None n\'est \u00e9gal qu\'\u00e0 None. None == False est False.'
  },
  {
    code: 'print(type(1 == 1))',
    output: "<class 'bool'>",
    choices: ["<class 'int'>", "<class 'bool'>", "True", "<class 'str'>"],
    correct: 1,
    explanation: 'Les comparaisons retournent un bool\u00e9en. type(True) est bool.'
  },
  {
    code: 'print("hello"[-1])',
    output: '"o"',
    choices: ['"o"', '"h"', 'Error', '"e"'],
    correct: 0,
    explanation: 'L\'index -1 acc\u00e8de au dernier \u00e9l\u00e9ment. "hello"[-1] est "o".'
  },
  {
    code: 'print(len({1, 2, 2, 3, 3}))',
    output: '3',
    choices: ['5', '3', '2', 'Error'],
    correct: 1,
    explanation: 'Un set \u00e9limine les doublons. {1, 2, 2, 3, 3} devient {1, 2, 3}, longueur 3.'
  },
  {
    code: 'print(2 ** 3 ** 2)',
    output: '512',
    choices: ['64', '512', '36', '8'],
    correct: 1,
    explanation: 'L\'exponentiation est associative \u00e0 droite. 2 ** (3 ** 2) = 2 ** 9 = 512, pas (2**3)**2 = 64.'
  },
  {
    code: 'x = [1, 2, 3]\nprint(x.pop())',
    output: '3',
    choices: ['[1, 2]', '3', '1', 'None'],
    correct: 1,
    explanation: 'pop() sans argument retire et retourne le dernier \u00e9l\u00e9ment de la liste.'
  },
  {
    code: 'print("abc".upper().isupper())',
    output: 'True',
    choices: ['True', 'False', '"ABC"', 'Error'],
    correct: 0,
    explanation: '"abc".upper() donne "ABC", puis isupper() v\u00e9rifie que tout est en majuscule : True.'
  },
  {
    code: 'print(list(range(0, 10, 3)))',
    output: '[0, 3, 6, 9]',
    choices: ['[0, 3, 6, 9]', '[0, 3, 6]', '[3, 6, 9]', '[0, 1, 2, 3]'],
    correct: 0,
    explanation: 'range(0, 10, 3) g\u00e9n\u00e8re 0, 3, 6, 9 (de 0 \u00e0 10 exclu, pas de 3).'
  },
  {
    code: 'print(isinstance(True, int))',
    output: 'True',
    choices: ['True', 'False', 'Error', 'None'],
    correct: 0,
    explanation: 'En Python, bool est une sous-classe de int. True est aussi un int (valeur 1).'
  },
  {
    code: 'a = [1, 2]\nb = a\nb.append(3)\nprint(a)',
    output: '[1, 2, 3]',
    choices: ['[1, 2]', '[1, 2, 3]', 'Error', '[3]'],
    correct: 1,
    explanation: 'b = a ne copie pas la liste, les deux variables r\u00e9f\u00e9rencent le m\u00eame objet. Modifier b modifie aussi a.'
  }
];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default class OutputGuess {
  constructor(container, lang) {
    this.container = container;
    this.lang = lang;
    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.startTime = null;
    this.timers = [];
    this.completionCallback = null;
    this.destroyed = false;
  }

  start() {
    const pool = this.lang === 'python' ? [...PYTHON_QUESTIONS] : [...JS_QUESTIONS];
    this.questions = shuffle(pool).slice(0, 8);
    this.currentIndex = 0;
    this.score = 0;
    this.startTime = Date.now();
    this.destroyed = false;

    this._injectStyles();
    this._renderShell();
    this._showQuestion();
  }

  destroy() {
    this.destroyed = true;
    this.timers.forEach(id => clearTimeout(id));
    this.timers = [];
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
    this.container.innerHTML = '';
  }

  onComplete(callback) {
    this.completionCallback = callback;
  }

  _injectStyles() {
    if (document.getElementById('og-styles')) return;

    const style = document.createElement('style');
    style.id = 'og-styles';
    style.textContent = `
      .og-wrapper {
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
        max-width: 720px;
        margin: 0 auto;
        padding: var(--space-md) 0;
        user-select: none;
      }

      .og-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-md);
      }
      .og-counter {
        font-size: 1rem;
        font-weight: 700;
        color: var(--text-primary);
        white-space: nowrap;
      }
      .og-progress-track {
        flex: 1;
        height: 8px;
        background: var(--bg-input);
        border-radius: 999px;
        overflow: hidden;
      }
      .og-progress-fill {
        height: 100%;
        background: var(--accent-primary);
        border-radius: 999px;
        transition: width 0.4s ease;
      }
      .og-score-label {
        font-size: 0.9rem;
        color: var(--neon-gold);
        font-weight: 600;
        white-space: nowrap;
      }

      .og-prompt {
        text-align: center;
        font-size: 1.15rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .og-code-block {
        background: var(--bg-primary);
        border: 1px solid var(--accent-primary);
        border-radius: var(--radius-md);
        padding: var(--space-md) var(--space-lg);
        overflow-x: auto;
      }
      .og-code-block pre {
        margin: 0;
      }
      .og-code-block code {
        font-family: var(--font-code);
        font-size: 1.05rem;
        line-height: 1.6;
        color: var(--neon-gold);
        white-space: pre;
      }

      .og-choices {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-sm);
      }
      @media (max-width: 500px) {
        .og-choices {
          grid-template-columns: 1fr;
        }
      }
      .og-choice-btn {
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        background: var(--bg-card);
        border: 2px solid var(--bg-input);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-family: var(--font-code);
        font-size: 0.95rem;
        cursor: pointer;
        transition: border-color 0.2s, background 0.2s, transform 0.15s;
        text-align: left;
        line-height: 1.4;
      }
      .og-choice-btn:hover:not(.og-disabled) {
        border-color: var(--accent-primary);
        transform: translateY(-1px);
      }
      .og-choice-btn .og-choice-key {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 28px;
        border-radius: var(--radius-sm);
        background: var(--bg-input);
        font-weight: 700;
        font-size: 0.8rem;
        color: var(--text-muted);
        flex-shrink: 0;
      }
      .og-choice-btn.og-correct {
        border-color: var(--neon-green);
        background: rgba(0, 255, 136, 0.1);
      }
      .og-choice-btn.og-correct .og-choice-key {
        background: var(--neon-green);
        color: #000;
      }
      .og-choice-btn.og-wrong {
        border-color: var(--neon-red);
        background: rgba(255, 64, 96, 0.1);
      }
      .og-choice-btn.og-wrong .og-choice-key {
        background: var(--neon-red);
        color: #fff;
      }
      .og-choice-btn.og-disabled {
        pointer-events: none;
        opacity: 0.7;
      }
      .og-choice-btn.og-correct.og-disabled,
      .og-choice-btn.og-wrong.og-disabled {
        opacity: 1;
      }

      .og-explanation {
        background: var(--bg-card);
        border-left: 4px solid var(--accent-secondary);
        border-radius: var(--radius-sm);
        padding: var(--space-sm) var(--space-md);
        font-size: 0.9rem;
        color: var(--text-muted);
        line-height: 1.5;
        animation: og-fade-in 0.3s ease;
      }
      @keyframes og-fade-in {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  _renderShell() {
    this.container.innerHTML = `
      <div class="og-wrapper">
        <div class="og-header">
          <span class="og-counter" data-og="counter"></span>
          <div class="og-progress-track">
            <div class="og-progress-fill" data-og="progress" style="width:0%"></div>
          </div>
          <span class="og-score-label" data-og="score"></span>
        </div>
        <div class="og-prompt">Que va afficher ce code ?</div>
        <div class="og-code-block"><pre><code data-og="code"></code></pre></div>
        <div class="og-choices" data-og="choices"></div>
        <div data-og="explanation"></div>
      </div>
    `;
  }

  _el(key) {
    return this.container.querySelector(`[data-og="${key}"]`);
  }

  _showQuestion() {
    if (this.destroyed) return;

    const q = this.questions[this.currentIndex];
    const total = this.questions.length;

    this._el('counter').textContent = `${this.currentIndex + 1}/${total}`;
    this._el('progress').style.width = `${((this.currentIndex) / total) * 100}%`;
    this._el('score').textContent = `${this.score * 15} XP`;

    this._el('code').textContent = q.code;

    this._el('explanation').innerHTML = '';

    const keys = ['A', 'B', 'C', 'D'];
    const choicesContainer = this._el('choices');
    choicesContainer.innerHTML = '';

    q.choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'og-choice-btn';
      btn.innerHTML = `<span class="og-choice-key">${keys[idx]}</span><span>${this._escapeHtml(choice)}</span>`;
      btn.addEventListener('click', () => this._handleAnswer(idx));
      choicesContainer.appendChild(btn);
    });

    this._keyHandler = (e) => {
      const map = { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
      const idx = map[e.key.toLowerCase()];
      if (idx !== undefined) {
        this._handleAnswer(idx);
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  }

  _handleAnswer(selectedIdx) {
    if (this.destroyed) return;

    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }

    const q = this.questions[this.currentIndex];
    const btns = this._el('choices').querySelectorAll('.og-choice-btn');
    const isCorrect = selectedIdx === q.correct;

    btns.forEach(b => b.classList.add('og-disabled'));

    btns[q.correct].classList.add('og-correct');

    if (!isCorrect) {
      btns[selectedIdx].classList.add('og-wrong');
    } else {
      this.score++;
      this._el('score').textContent = `${this.score * 15} XP`;
    }

    this._el('explanation').innerHTML = `<div class="og-explanation">${this._escapeHtml(q.explanation)}</div>`;

    const delay = isCorrect ? 1500 : 2000;
    const timerId = setTimeout(() => {
      this._nextQuestion();
    }, delay);
    this.timers.push(timerId);
  }

  _nextQuestion() {
    if (this.destroyed) return;

    this.currentIndex++;

    if (this.currentIndex >= this.questions.length) {
      this._finish();
    } else {
      this._showQuestion();
    }
  }

  _finish() {
    if (this.destroyed) return;

    const elapsedMs = Date.now() - this.startTime;
    const total = this.questions.length;
    const xp = this.score * 15;

    this._el('progress').style.width = '100%';

    if (typeof this.completionCallback === 'function') {
      this.completionCallback({
        score: this.score,
        total,
        xp,
        time: elapsedMs,
        extras: {
          lang: this.lang,
          perfect: this.score === total
        }
      });
    }
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
