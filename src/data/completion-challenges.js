// Completion Challenges - Fill in the blanks in code snippets
import { getContent } from './contentSource.js'

const jsChallenges = [
    // --- Difficulty 1: Basics ---
    {
        id: 'cc-js-01', difficulty: 1, category: 'bases',
        title: 'Déclarer et afficher',
        description: 'Complète le code pour déclarer une variable et l\'afficher.',
        template: '___BLANK___ message = "Bonjour";\nconsole.___BLANK___(message);',
        blanks: ['const', 'log'],
        hints: ['Mot-clé pour une constante', 'Méthode pour afficher'],
        xpReward: 20
    },
    {
        id: 'cc-js-02', difficulty: 1, category: 'bases',
        title: 'Opération mathématique',
        description: 'Calcule la somme et affiche le résultat.',
        template: 'let a = 10;\nlet b = 20;\nlet somme = a ___BLANK___ b;\nconsole.log(___BLANK___);',
        blanks: ['+', 'somme'],
        hints: ['Opérateur d\'addition', 'Quelle variable afficher ?'],
        xpReward: 20
    },
    {
        id: 'cc-js-03', difficulty: 1, category: 'conditions',
        title: 'Condition simple',
        description: 'Complète la structure conditionnelle.',
        template: 'let age = 18;\n___BLANK___ (age >= 18) {\n  console.log("Majeur");\n} ___BLANK___ {\n  console.log("Mineur");\n}',
        blanks: ['if', 'else'],
        hints: ['Mot-clé de condition', 'Sinon...'],
        xpReward: 20
    },
    // --- Difficulty 2: Intermediate ---
    {
        id: 'cc-js-04', difficulty: 2, category: 'fonctions',
        title: 'Fonction fléchée',
        description: 'Crée une fonction fléchée qui double un nombre.',
        template: 'const double = (x) ___BLANK___ x * 2;\nconsole.log(double(___BLANK___));',
        blanks: ['=>', '5'],
        hints: ['Syntaxe de la flèche', 'Un nombre quelconque'],
        xpReward: 30
    },
    {
        id: 'cc-js-05', difficulty: 2, category: 'tableaux',
        title: 'Filtrer un tableau',
        description: 'Filtre les nombres pairs du tableau.',
        template: 'const nombres = [1, 2, 3, 4, 5, 6];\nconst pairs = nombres.___BLANK___(n => n % 2 ___BLANK___ 0);',
        blanks: ['filter', '==='],
        hints: ['Méthode de filtrage', 'Opérateur de comparaison stricte'],
        xpReward: 30
    },
    {
        id: 'cc-js-06', difficulty: 2, category: 'objets',
        title: 'Destructuration d\'objet',
        description: 'Extrais les propriétés de l\'objet.',
        template: 'const personne = { nom: "Ada", age: 36 };\nconst { ___BLANK___, ___BLANK___ } = personne;',
        blanks: ['nom', 'age'],
        hints: ['Première propriété', 'Deuxième propriété'],
        xpReward: 30
    },
    {
        id: 'cc-js-07', difficulty: 2, category: 'boucles',
        title: 'Boucle for...of',
        description: 'Parcours le tableau avec for...of.',
        template: 'const fruits = ["pomme", "banane"];\n___BLANK___ (const fruit ___BLANK___ fruits) {\n  console.log(fruit);\n}',
        blanks: ['for', 'of'],
        hints: ['Mot-clé de boucle', 'Mot-clé pour itérer sur les valeurs'],
        xpReward: 30
    },
    // --- Difficulty 3: Advanced ---
    {
        id: 'cc-js-08', difficulty: 3, category: 'async',
        title: 'Fonction async/await',
        description: 'Complète la fonction asynchrone.',
        template: '___BLANK___ function charger(url) {\n  const response = ___BLANK___ fetch(url);\n  const data = await response.json();\n  return data;\n}',
        blanks: ['async', 'await'],
        hints: ['Mot-clé pour déclarer une fonction asynchrone', 'Mot-clé pour attendre une Promise'],
        xpReward: 40
    },
    {
        id: 'cc-js-09', difficulty: 3, category: 'classes',
        title: 'Classe avec héritage',
        description: 'Complète la classe fille.',
        template: 'class Animal {\n  constructor(nom) { this.nom = nom; }\n}\n\nclass Chat ___BLANK___ Animal {\n  constructor(nom) {\n    ___BLANK___(nom);\n    this.type = "chat";\n  }\n}',
        blanks: ['extends', 'super'],
        hints: ['Mot-clé pour l\'héritage', 'Appel au constructeur parent'],
        xpReward: 40
    },
    {
        id: 'cc-js-10', difficulty: 3, category: 'tableaux',
        title: 'Reduce pour sommer',
        description: 'Utilise reduce pour calculer la somme.',
        template: 'const nums = [1, 2, 3, 4, 5];\nconst total = nums.___BLANK___((acc, n) ___BLANK___ acc + n, 0);',
        blanks: ['reduce', '=>'],
        hints: ['Méthode d\'accumulation', 'Syntaxe de la flèche'],
        xpReward: 40
    }
];

const pythonChallenges = [
    // --- Difficulty 1: Basics ---
    {
        id: 'cc-py-01', difficulty: 1, category: 'bases',
        title: 'Afficher un message',
        description: 'Complète le code pour afficher un message.',
        template: 'message = "Bonjour"\n___BLANK___(message)',
        blanks: ['print'],
        hints: ['Fonction d\'affichage en Python'],
        xpReward: 20
    },
    {
        id: 'cc-py-02', difficulty: 1, category: 'bases',
        title: 'F-string',
        description: 'Complète le f-string pour afficher le nom.',
        template: 'nom = "Alice"\nprint(___BLANK___"Bonjour {___BLANK___}")',
        blanks: ['f', 'nom'],
        hints: ['Préfixe de format string', 'Variable à insérer'],
        xpReward: 20
    },
    {
        id: 'cc-py-03', difficulty: 1, category: 'conditions',
        title: 'Condition elif',
        description: 'Complète la structure conditionnelle.',
        template: 'note = 15\nif note >= 16___BLANK___\n    print("Très bien")\n___BLANK___ note >= 12:\n    print("Bien")\nelse:\n    print("Peut mieux faire")',
        blanks: [':', 'elif'],
        hints: ['Fin de la ligne if', 'Sinon si en Python'],
        xpReward: 20
    },
    // --- Difficulty 2: Intermediate ---
    {
        id: 'cc-py-04', difficulty: 2, category: 'fonctions',
        title: 'Définir une fonction',
        description: 'Complète la définition de la fonction.',
        template: '___BLANK___ carre(x):\n    ___BLANK___ x ** 2\n\nprint(carre(5))',
        blanks: ['def', 'return'],
        hints: ['Mot-clé pour définir une fonction', 'Mot-clé pour renvoyer une valeur'],
        xpReward: 30
    },
    {
        id: 'cc-py-05', difficulty: 2, category: 'listes',
        title: 'List comprehension',
        description: 'Crée une liste des carrés des nombres pairs.',
        template: 'nombres = [1, 2, 3, 4, 5, 6]\ncarres = [x**2 ___BLANK___ x in nombres ___BLANK___ x % 2 == 0]',
        blanks: ['for', 'if'],
        hints: ['Mot-clé d\'itération', 'Mot-clé de condition'],
        xpReward: 30
    },
    {
        id: 'cc-py-06', difficulty: 2, category: 'dictionnaires',
        title: 'Parcourir un dictionnaire',
        description: 'Parcours les paires clé-valeur.',
        template: 'scores = {"Alice": 90, "Bob": 85}\nfor nom, score ___BLANK___ scores.___BLANK___():\n    print(f"{nom}: {score}")',
        blanks: ['in', 'items'],
        hints: ['Mot-clé d\'appartenance', 'Méthode pour obtenir les paires'],
        xpReward: 30
    },
    {
        id: 'cc-py-07', difficulty: 2, category: 'boucles',
        title: 'Boucle while',
        description: 'Complète la boucle while.',
        template: 'compteur = 0\n___BLANK___ compteur < 5:\n    print(compteur)\n    compteur ___BLANK___ 1',
        blanks: ['while', '+='],
        hints: ['Mot-clé de boucle conditionnelle', 'Opérateur d\'incrémentation'],
        xpReward: 30
    },
    // --- Difficulty 3: Advanced ---
    {
        id: 'cc-py-08', difficulty: 3, category: 'poo',
        title: 'Classe avec constructeur',
        description: 'Complète la définition de la classe.',
        template: '___BLANK___ Voiture:\n    def __init__(___BLANK___, marque, annee):\n        self.marque = marque\n        self.annee = annee',
        blanks: ['class', 'self'],
        hints: ['Mot-clé pour définir une classe', 'Référence à l\'instance courante'],
        xpReward: 40
    },
    {
        id: 'cc-py-09', difficulty: 3, category: 'fichiers',
        title: 'Lire un fichier',
        description: 'Complète la lecture de fichier avec context manager.',
        template: '___BLANK___ open("data.txt", "r") ___BLANK___ f:\n    contenu = f.read()\n    print(contenu)',
        blanks: ['with', 'as'],
        hints: ['Mot-clé du context manager', 'Mot-clé pour nommer la variable'],
        xpReward: 40
    },
    {
        id: 'cc-py-10', difficulty: 3, category: 'exceptions',
        title: 'Gestion d\'erreurs',
        description: 'Complète le bloc try/except.',
        template: '___BLANK___:\n    resultat = 10 / 0\n___BLANK___ ZeroDivisionError:\n    print("Division par zéro !")',
        blanks: ['try', 'except'],
        hints: ['Début du bloc de tentative', 'Mot-clé pour attraper une erreur'],
        xpReward: 40
    }
];

export function getCompletionChallenges(lang) {
    const remote = getContent('completion_challenges', lang, 'default')
    if (Array.isArray(remote) && remote.length > 0) return remote
    return lang === 'python' ? pythonChallenges : jsChallenges;
}

export function getCompletionChallengesByDifficulty(lang, difficulty) {
    return getCompletionChallenges(lang).filter(c => c.difficulty === difficulty);
}

export function getRandomCompletionChallenge(lang) {
    const challenges = getCompletionChallenges(lang);
    return challenges[Math.floor(Math.random() * challenges.length)];
}

export function parseTemplate(template) {
    // Split template into segments: text parts and blank placeholders
    const parts = template.split('___BLANK___');
    return parts;
}

export function validateCompletion(challenge, answers) {
    if (answers.length !== challenge.blanks.length) return false;
    return answers.every((ans, i) =>
        ans.trim().toLowerCase() === challenge.blanks[i].toLowerCase()
    );
}
