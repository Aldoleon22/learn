// Typing Words - Code keywords and snippets for the typing speed game
import { getContent } from './contentSource.js'

const jsTypingWords = {
    // Level 1: Single keywords (short)
    keywords: [
        'let', 'const', 'var', 'function', 'return', 'if', 'else',
        'for', 'while', 'switch', 'case', 'break', 'continue',
        'class', 'new', 'this', 'typeof', 'instanceof', 'null',
        'undefined', 'true', 'false', 'import', 'export', 'default',
        'async', 'await', 'try', 'catch', 'throw', 'finally',
        'yield', 'super', 'extends', 'static', 'delete', 'void'
    ],
    // Level 2: Common expressions
    expressions: [
        'console.log("hello")',
        'let x = 10;',
        'const name = "Alice";',
        'if (x > 0) {}',
        'for (let i = 0; i < n; i++)',
        'arr.push(item)',
        'arr.map(x => x * 2)',
        'arr.filter(x => x > 0)',
        'obj.hasOwnProperty(key)',
        'Math.floor(Math.random() * 10)',
        'document.getElementById("app")',
        'JSON.stringify(data)',
        'arr.reduce((a, b) => a + b, 0)',
        'Object.keys(obj)',
        'typeof value === "string"',
        'Array.isArray(data)',
        'element.addEventListener("click", fn)',
        'Promise.all(promises)',
        'str.split("").reverse().join("")',
        'const { name, age } = person;'
    ],
    // Level 3: Full statements
    statements: [
        'function greet(name) { return `Hello ${name}`; }',
        'const double = (x) => x * 2;',
        'const fruits = ["pomme", "banane", "cerise"];',
        'for (const item of items) { console.log(item); }',
        'try { JSON.parse(data); } catch (e) { console.error(e); }',
        'const result = await fetch("/api/data");',
        'class Animal { constructor(name) { this.name = name; } }',
        'const unique = [...new Set(array)];',
        'const sum = numbers.reduce((acc, n) => acc + n, 0);',
        'export default function App() { return null; }'
    ]
};

const pythonTypingWords = {
    // Level 1: Single keywords (short)
    keywords: [
        'def', 'return', 'if', 'elif', 'else', 'for', 'while',
        'class', 'import', 'from', 'as', 'with', 'try', 'except',
        'finally', 'raise', 'pass', 'break', 'continue', 'and',
        'or', 'not', 'in', 'is', 'None', 'True', 'False', 'self',
        'lambda', 'yield', 'global', 'nonlocal', 'assert', 'del',
        'async', 'await', 'super', 'property'
    ],
    // Level 2: Common expressions
    expressions: [
        'print("hello")',
        'x = 10',
        'name = "Alice"',
        'if x > 0:',
        'for i in range(10):',
        'liste.append(item)',
        '[x * 2 for x in liste]',
        '[x for x in liste if x > 0]',
        'len(ma_liste)',
        'import random',
        'from math import sqrt',
        'isinstance(x, int)',
        'sum(nombres)',
        'dict.get("key", default)',
        'type(value) == str',
        'with open("file.txt") as f:',
        '", ".join(liste)',
        'sorted(data, key=lambda x: x[1])',
        'str.split(" ")',
        'name, age = person'
    ],
    // Level 3: Full statements
    statements: [
        'def greet(name): return f"Hello {name}"',
        'double = lambda x: x * 2',
        'fruits = ["pomme", "banane", "cerise"]',
        'for key, value in data.items():',
        'try: int(x) except ValueError: print("error")',
        'result = {k: v for k, v in data.items() if v > 0}',
        'class Animal: def __init__(self, name): self.name = name',
        'unique = list(set(ma_liste))',
        'total = sum(n for n in nombres if n > 0)',
        'if __name__ == "__main__": main()'
    ]
};

export function getTypingWords(lang) {
    const remote = getContent('typing_words', lang, 'default')
    if (remote && typeof remote === 'object') return remote
    return lang === 'python' ? pythonTypingWords : jsTypingWords;
}

export function getTypingWordsByLevel(lang, level) {
    const words = getTypingWords(lang);
    switch (level) {
        case 1: return words.keywords;
        case 2: return words.expressions;
        case 3: return words.statements;
        default: return words.keywords;
    }
}

export function getRandomTypingSet(lang, level, count = 15) {
    const pool = getTypingWordsByLevel(lang, level);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, pool.length));
}

export function getProgressiveTypingSet(lang, count = 20) {
    const words = getTypingWords(lang);
    const set = [];
    const levels = [words.keywords, words.expressions, words.statements];
    const distribution = [
        Math.ceil(count * 0.4),
        Math.ceil(count * 0.35),
        count - Math.ceil(count * 0.4) - Math.ceil(count * 0.35)
    ];
    levels.forEach((pool, i) => {
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        set.push(...shuffled.slice(0, distribution[i]));
    });
    return set;
}
