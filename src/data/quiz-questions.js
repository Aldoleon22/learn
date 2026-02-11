// Quiz Questions - Dual language support (JavaScript & Python)
import { getContent } from './contentSource.js'

const jsQuestions = [
    // --- Les Bases ---
    {
        id: 'q-js-01', category: 'bases', difficulty: 1,
        question: 'Quelle fonction affiche un message dans la console ?',
        choices: ['console.log()', 'print()', 'echo()', 'write()'],
        correct: 0,
        explanation: 'En JavaScript, console.log() affiche un message dans la console du navigateur.'
    },
    {
        id: 'q-js-02', category: 'bases', difficulty: 1,
        question: 'Quel mot-clé déclare une variable qui peut changer ?',
        choices: ['const', 'let', 'var', 'def'],
        correct: 1,
        explanation: 'let déclare une variable modifiable avec une portée de bloc.'
    },
    {
        id: 'q-js-03', category: 'bases', difficulty: 1,
        question: 'Quel mot-clé déclare une constante ?',
        choices: ['let', 'var', 'const', 'final'],
        correct: 2,
        explanation: 'const déclare une variable dont la valeur ne peut pas être réassignée.'
    },
    {
        id: 'q-js-04', category: 'bases', difficulty: 1,
        question: 'Quel est le résultat de typeof "42" ?',
        choices: ['"number"', '"string"', '"integer"', '"char"'],
        correct: 1,
        explanation: '"42" est entre guillemets, c\'est donc une chaîne de caractères (string).'
    },
    {
        id: 'q-js-05', category: 'bases', difficulty: 1,
        question: 'Comment écrire un commentaire sur une ligne ?',
        choices: ['# commentaire', '// commentaire', '/* commentaire */', '-- commentaire'],
        correct: 1,
        explanation: 'En JS, les commentaires sur une ligne commencent par //.'
    },
    // --- Conditions & Logique ---
    {
        id: 'q-js-06', category: 'conditions', difficulty: 2,
        question: 'Que retourne 5 === "5" ?',
        choices: ['true', 'false', 'undefined', 'TypeError'],
        correct: 1,
        explanation: '=== compare la valeur ET le type. 5 (number) !== "5" (string).'
    },
    {
        id: 'q-js-07', category: 'conditions', difficulty: 2,
        question: 'Quel opérateur signifie "OU logique" ?',
        choices: ['&&', '||', '!', '??'],
        correct: 1,
        explanation: '|| est l\'opérateur OU logique. Il retourne true si au moins une condition est vraie.'
    },
    {
        id: 'q-js-08', category: 'conditions', difficulty: 2,
        question: 'Que fait l\'opérateur ?? (nullish coalescing) ?',
        choices: [
            'Compare deux valeurs',
            'Retourne la droite si la gauche est null ou undefined',
            'Retourne toujours null',
            'Convertit en booléen'
        ],
        correct: 1,
        explanation: '?? retourne l\'opérande de droite si celui de gauche est null ou undefined.'
    },
    // --- Fonctions ---
    {
        id: 'q-js-09', category: 'fonctions', difficulty: 2,
        question: 'Quelle syntaxe définit une fonction fléchée ?',
        choices: [
            'function => {}', 'def fn():', '() => {}', 'fn -> {}'
        ],
        correct: 2,
        explanation: 'La syntaxe () => {} est la fonction fléchée (arrow function) ES6.'
    },
    {
        id: 'q-js-10', category: 'fonctions', difficulty: 2,
        question: 'Que retourne une fonction sans instruction return ?',
        choices: ['null', '0', 'undefined', 'false'],
        correct: 2,
        explanation: 'Sans return explicite, une fonction JS retourne undefined.'
    },
    {
        id: 'q-js-11', category: 'fonctions', difficulty: 3,
        question: 'Qu\'est-ce qu\'une closure ?',
        choices: [
            'Une boucle infinie',
            'Une fonction qui se souvient de son environnement de création',
            'Une erreur de syntaxe',
            'Un type de variable'
        ],
        correct: 1,
        explanation: 'Une closure est une fonction qui conserve l\'accès aux variables de sa portée parente.'
    },
    // --- Tableaux ---
    {
        id: 'q-js-12', category: 'tableaux', difficulty: 2,
        question: 'Quelle méthode ajoute un élément à la fin d\'un tableau ?',
        choices: ['unshift()', 'push()', 'append()', 'add()'],
        correct: 1,
        explanation: 'push() ajoute un ou plusieurs éléments à la fin du tableau.'
    },
    {
        id: 'q-js-13', category: 'tableaux', difficulty: 2,
        question: 'Que retourne [1,2,3].map(x => x * 2) ?',
        choices: ['[1,2,3]', '[2,4,6]', '6', 'undefined'],
        correct: 1,
        explanation: 'map() crée un nouveau tableau en appliquant la fonction à chaque élément.'
    },
    {
        id: 'q-js-14', category: 'tableaux', difficulty: 3,
        question: 'Quelle méthode réduit un tableau à une seule valeur ?',
        choices: ['filter()', 'map()', 'reduce()', 'find()'],
        correct: 2,
        explanation: 'reduce() applique une fonction accumulatrice pour réduire le tableau à une valeur unique.'
    },
    // --- Objets ---
    {
        id: 'q-js-15', category: 'objets', difficulty: 2,
        question: 'Comment accéder à la propriété "nom" d\'un objet user ?',
        choices: ['user->nom', 'user.nom', 'user::nom', 'user[nom]'],
        correct: 1,
        explanation: 'La notation point (user.nom) accède aux propriétés d\'un objet.'
    },
    {
        id: 'q-js-16', category: 'objets', difficulty: 3,
        question: 'Que fait Object.keys(obj) ?',
        choices: [
            'Retourne les valeurs de l\'objet',
            'Retourne un tableau des noms de propriétés',
            'Supprime toutes les clés',
            'Verrouille l\'objet'
        ],
        correct: 1,
        explanation: 'Object.keys() retourne un tableau contenant les noms de propriétés de l\'objet.'
    },
    // --- DOM & Async ---
    {
        id: 'q-js-17', category: 'dom', difficulty: 3,
        question: 'Quelle méthode sélectionne un élément par son ID ?',
        choices: ['querySelector()', 'getElementById()', 'getElement()', 'select()'],
        correct: 1,
        explanation: 'document.getElementById("id") sélectionne l\'élément avec l\'ID donné.'
    },
    {
        id: 'q-js-18', category: 'async', difficulty: 3,
        question: 'Que retourne une fonction async ?',
        choices: ['Un callback', 'Une Promise', 'undefined', 'Un Observable'],
        correct: 1,
        explanation: 'Une fonction async retourne toujours une Promise.'
    },
    {
        id: 'q-js-19', category: 'async', difficulty: 3,
        question: 'À quoi sert le mot-clé await ?',
        choices: [
            'Créer une boucle',
            'Attendre la résolution d\'une Promise',
            'Déclarer une variable',
            'Arrêter le programme'
        ],
        correct: 1,
        explanation: 'await pause l\'exécution jusqu\'à ce que la Promise soit résolue.'
    },
    {
        id: 'q-js-20', category: 'bases', difficulty: 1,
        question: 'Quel est le résultat de 10 % 3 ?',
        choices: ['3', '1', '3.33', '0'],
        correct: 1,
        explanation: '% est l\'opérateur modulo. 10 divisé par 3 donne un reste de 1.'
    }
];

const pythonQuestions = [
    // --- Les Bases ---
    {
        id: 'q-py-01', category: 'bases', difficulty: 1,
        question: 'Quelle fonction affiche un message en Python ?',
        choices: ['console.log()', 'print()', 'echo()', 'puts()'],
        correct: 1,
        explanation: 'print() est la fonction standard pour afficher du texte en Python.'
    },
    {
        id: 'q-py-02', category: 'bases', difficulty: 1,
        question: 'Comment déclarer une variable x avec la valeur 10 ?',
        choices: ['let x = 10', 'var x = 10', 'x = 10', 'int x = 10'],
        correct: 2,
        explanation: 'En Python, on assigne simplement avec =, sans mot-clé de déclaration.'
    },
    {
        id: 'q-py-03', category: 'bases', difficulty: 1,
        question: 'Quel est le type de 3.14 en Python ?',
        choices: ['int', 'float', 'double', 'decimal'],
        correct: 1,
        explanation: 'Les nombres à virgule sont de type float en Python.'
    },
    {
        id: 'q-py-04', category: 'bases', difficulty: 1,
        question: 'Comment écrire un commentaire sur une ligne en Python ?',
        choices: ['// commentaire', '/* commentaire */', '# commentaire', '-- commentaire'],
        correct: 2,
        explanation: 'En Python, les commentaires commencent par #.'
    },
    {
        id: 'q-py-05', category: 'bases', difficulty: 1,
        question: 'Que retourne type("hello") ?',
        choices: ["<class 'string'>", "<class 'str'>", "str", "text"],
        correct: 1,
        explanation: 'type() retourne le type de l\'objet. Les chaînes sont de type str.'
    },
    // --- Conditions & Logique ---
    {
        id: 'q-py-06', category: 'conditions', difficulty: 2,
        question: 'Quel mot-clé remplace "else if" en Python ?',
        choices: ['elseif', 'else if', 'elif', 'elsif'],
        correct: 2,
        explanation: 'Python utilise elif comme raccourci pour else if.'
    },
    {
        id: 'q-py-07', category: 'conditions', difficulty: 2,
        question: 'Quel opérateur signifie "ET logique" en Python ?',
        choices: ['&&', 'AND', 'and', '&'],
        correct: 2,
        explanation: 'Python utilise les mots-clés and, or, not pour la logique booléenne.'
    },
    {
        id: 'q-py-08', category: 'conditions', difficulty: 2,
        question: 'Que retourne bool("") ?',
        choices: ['True', 'False', 'None', 'Error'],
        correct: 1,
        explanation: 'Une chaîne vide est falsy en Python, donc bool("") retourne False.'
    },
    // --- Fonctions ---
    {
        id: 'q-py-09', category: 'fonctions', difficulty: 2,
        question: 'Quel mot-clé définit une fonction en Python ?',
        choices: ['function', 'func', 'def', 'fn'],
        correct: 2,
        explanation: 'Le mot-clé def est utilisé pour définir une fonction en Python.'
    },
    {
        id: 'q-py-10', category: 'fonctions', difficulty: 2,
        question: 'Que retourne une fonction sans return ?',
        choices: ['0', 'False', 'None', '""'],
        correct: 2,
        explanation: 'Sans return explicite, une fonction Python retourne None.'
    },
    {
        id: 'q-py-11', category: 'fonctions', difficulty: 3,
        question: 'Qu\'est-ce qu\'une lambda en Python ?',
        choices: [
            'Une boucle spéciale',
            'Une fonction anonyme sur une ligne',
            'Un type de liste',
            'Un module standard'
        ],
        correct: 1,
        explanation: 'lambda crée une petite fonction anonyme : lambda x: x * 2.'
    },
    // --- Listes ---
    {
        id: 'q-py-12', category: 'listes', difficulty: 2,
        question: 'Quelle méthode ajoute un élément à la fin d\'une liste ?',
        choices: ['push()', 'add()', 'append()', 'insert()'],
        correct: 2,
        explanation: 'append() ajoute un élément à la fin de la liste.'
    },
    {
        id: 'q-py-13', category: 'listes', difficulty: 2,
        question: 'Que retourne [1,2,3][1:] ?',
        choices: ['[1]', '[2,3]', '[1,2]', 'Error'],
        correct: 1,
        explanation: 'Le slicing [1:] retourne tous les éléments à partir de l\'index 1.'
    },
    {
        id: 'q-py-14', category: 'listes', difficulty: 2,
        question: 'Que fait [x**2 for x in range(4)] ?',
        choices: ['[0,1,2,3]', '[0,1,4,9]', '[1,4,9,16]', 'Error'],
        correct: 1,
        explanation: 'C\'est une list comprehension : le carré de 0,1,2,3 donne [0,1,4,9].'
    },
    // --- Dictionnaires ---
    {
        id: 'q-py-15', category: 'dictionnaires', difficulty: 2,
        question: 'Comment accéder à la valeur associée à la clé "nom" dans un dict d ?',
        choices: ['d.nom', 'd["nom"]', 'd->nom', 'd(nom)'],
        correct: 1,
        explanation: 'On accède aux valeurs d\'un dictionnaire avec d["clé"] ou d.get("clé").'
    },
    {
        id: 'q-py-16', category: 'dictionnaires', difficulty: 3,
        question: 'Que retourne d.get("age", 0) si "age" n\'existe pas dans d ?',
        choices: ['None', 'KeyError', '0', 'False'],
        correct: 2,
        explanation: '.get(clé, défaut) retourne la valeur par défaut si la clé est absente.'
    },
    // --- POO & Avancé ---
    {
        id: 'q-py-17', category: 'poo', difficulty: 3,
        question: 'Quel est le premier paramètre d\'une méthode d\'instance ?',
        choices: ['this', 'self', 'cls', 'me'],
        correct: 1,
        explanation: 'self fait référence à l\'instance courante dans une méthode Python.'
    },
    {
        id: 'q-py-18', category: 'poo', difficulty: 3,
        question: 'Quel est le nom du constructeur en Python ?',
        choices: ['__init__', '__new__', 'constructor', '__create__'],
        correct: 0,
        explanation: '__init__ est la méthode d\'initialisation appelée à la création d\'un objet.'
    },
    {
        id: 'q-py-19', category: 'avance', difficulty: 3,
        question: 'Que fait le mot-clé with en Python ?',
        choices: [
            'Crée une boucle',
            'Gère automatiquement les ressources (context manager)',
            'Importe un module',
            'Définit une classe'
        ],
        correct: 1,
        explanation: 'with assure que les ressources (fichiers, etc.) sont correctement fermées.'
    },
    {
        id: 'q-py-20', category: 'bases', difficulty: 1,
        question: 'Que fait l\'opérateur // en Python ?',
        choices: ['Commentaire', 'Division flottante', 'Division entière', 'Puissance'],
        correct: 2,
        explanation: '// effectue une division entière (floor division). Ex: 7 // 2 = 3.'
    }
];

export function getQuizQuestions(lang) {
    const remote = getContent('quiz_questions', lang, 'default')
    if (Array.isArray(remote) && remote.length > 0) return remote
    return lang === 'python' ? pythonQuestions : jsQuestions;
}

export function getQuizQuestionsByCategory(lang, category) {
    const questions = getQuizQuestions(lang);
    return questions.filter(q => q.category === category);
}

export function getQuizQuestionsByDifficulty(lang, difficulty) {
    const questions = getQuizQuestions(lang);
    return questions.filter(q => q.difficulty === difficulty);
}

export function getRandomQuizSet(lang, count = 10) {
    const questions = [...getQuizQuestions(lang)];
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    return questions.slice(0, count);
}
