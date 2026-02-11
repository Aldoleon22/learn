// Memory Pairs - Match code concepts with their descriptions or equivalents
import { getContent } from './contentSource.js'

const jsMemoryPairs = [
    // Concept <-> Description pairs
    {
        id: 'mp-js-01', category: 'bases', difficulty: 1,
        pairs: [
            { term: 'let', match: 'Variable modifiable' },
            { term: 'const', match: 'Constante immuable' },
            { term: 'typeof', match: 'Type d\'une valeur' },
            { term: 'console.log()', match: 'Afficher un message' },
            { term: 'null', match: 'Absence volontaire de valeur' },
            { term: 'undefined', match: 'Valeur non assignée' }
        ]
    },
    {
        id: 'mp-js-02', category: 'types', difficulty: 1,
        pairs: [
            { term: '"Bonjour"', match: 'string' },
            { term: '42', match: 'number' },
            { term: 'true', match: 'boolean' },
            { term: '{ nom: "Ada" }', match: 'object' },
            { term: '[1, 2, 3]', match: 'Array' },
            { term: 'undefined', match: 'undefined' }
        ]
    },
    {
        id: 'mp-js-03', category: 'operateurs', difficulty: 1,
        pairs: [
            { term: '===', match: 'Egalité stricte' },
            { term: '!==', match: 'Différent strict' },
            { term: '&&', match: 'ET logique' },
            { term: '||', match: 'OU logique' },
            { term: '!', match: 'NON logique' },
            { term: '??', match: 'Nullish coalescing' }
        ]
    },
    {
        id: 'mp-js-04', category: 'tableaux', difficulty: 2,
        pairs: [
            { term: 'push()', match: 'Ajouter à la fin' },
            { term: 'pop()', match: 'Retirer le dernier' },
            { term: 'shift()', match: 'Retirer le premier' },
            { term: 'map()', match: 'Transformer chaque élément' },
            { term: 'filter()', match: 'Garder selon condition' },
            { term: 'reduce()', match: 'Réduire à une valeur' }
        ]
    },
    {
        id: 'mp-js-05', category: 'strings', difficulty: 2,
        pairs: [
            { term: '.length', match: 'Longueur de la chaîne' },
            { term: '.toUpperCase()', match: 'En majuscules' },
            { term: '.split(",")', match: 'Découper en tableau' },
            { term: '.includes("a")', match: 'Contient un texte ?' },
            { term: '.trim()', match: 'Supprimer les espaces' },
            { term: '.replace(a, b)', match: 'Remplacer du texte' }
        ]
    },
    {
        id: 'mp-js-06', category: 'fonctions', difficulty: 2,
        pairs: [
            { term: 'function', match: 'Déclaration classique' },
            { term: '() => {}', match: 'Fonction fléchée' },
            { term: 'return', match: 'Renvoyer une valeur' },
            { term: 'arguments', match: 'Paramètres reçus' },
            { term: 'callback', match: 'Fonction passée en argument' },
            { term: 'closure', match: 'Fonction + son environnement' }
        ]
    },
    {
        id: 'mp-js-07', category: 'dom', difficulty: 3,
        pairs: [
            { term: 'getElementById', match: 'Sélection par ID' },
            { term: 'querySelector', match: 'Sélection CSS' },
            { term: 'addEventListener', match: 'Écouter un événement' },
            { term: 'innerHTML', match: 'Contenu HTML' },
            { term: 'classList.add', match: 'Ajouter une classe CSS' },
            { term: 'createElement', match: 'Créer un élément' }
        ]
    },
    {
        id: 'mp-js-08', category: 'async', difficulty: 3,
        pairs: [
            { term: 'Promise', match: 'Valeur future' },
            { term: 'async', match: 'Fonction asynchrone' },
            { term: 'await', match: 'Attendre la résolution' },
            { term: '.then()', match: 'Quand c\'est résolu' },
            { term: '.catch()', match: 'Quand ça échoue' },
            { term: 'fetch()', match: 'Requête réseau' }
        ]
    }
];

const pythonMemoryPairs = [
    {
        id: 'mp-py-01', category: 'bases', difficulty: 1,
        pairs: [
            { term: 'print()', match: 'Afficher un message' },
            { term: 'input()', match: 'Lire une saisie' },
            { term: 'type()', match: 'Type d\'une valeur' },
            { term: 'len()', match: 'Longueur / taille' },
            { term: 'None', match: 'Absence de valeur' },
            { term: '#', match: 'Commentaire' }
        ]
    },
    {
        id: 'mp-py-02', category: 'types', difficulty: 1,
        pairs: [
            { term: '"Bonjour"', match: 'str' },
            { term: '42', match: 'int' },
            { term: '3.14', match: 'float' },
            { term: 'True', match: 'bool' },
            { term: '[1, 2, 3]', match: 'list' },
            { term: '{"a": 1}', match: 'dict' }
        ]
    },
    {
        id: 'mp-py-03', category: 'operateurs', difficulty: 1,
        pairs: [
            { term: '==', match: 'Egalité' },
            { term: '!=', match: 'Différent' },
            { term: 'and', match: 'ET logique' },
            { term: 'or', match: 'OU logique' },
            { term: 'not', match: 'NON logique' },
            { term: 'in', match: 'Appartenance' }
        ]
    },
    {
        id: 'mp-py-04', category: 'listes', difficulty: 2,
        pairs: [
            { term: '.append()', match: 'Ajouter à la fin' },
            { term: '.pop()', match: 'Retirer le dernier' },
            { term: '.insert(i, x)', match: 'Insérer à la position i' },
            { term: '.sort()', match: 'Trier en place' },
            { term: '.reverse()', match: 'Inverser l\'ordre' },
            { term: '.index(x)', match: 'Position de x' }
        ]
    },
    {
        id: 'mp-py-05', category: 'strings', difficulty: 2,
        pairs: [
            { term: '.upper()', match: 'En majuscules' },
            { term: '.lower()', match: 'En minuscules' },
            { term: '.split()', match: 'Découper en liste' },
            { term: '.join()', match: 'Assembler une liste' },
            { term: '.strip()', match: 'Supprimer les espaces' },
            { term: '.replace(a, b)', match: 'Remplacer du texte' }
        ]
    },
    {
        id: 'mp-py-06', category: 'fonctions', difficulty: 2,
        pairs: [
            { term: 'def', match: 'Définir une fonction' },
            { term: 'return', match: 'Renvoyer une valeur' },
            { term: 'lambda', match: 'Fonction anonyme' },
            { term: '*args', match: 'Arguments positionnels variables' },
            { term: '**kwargs', match: 'Arguments nommés variables' },
            { term: 'yield', match: 'Générateur' }
        ]
    },
    {
        id: 'mp-py-07', category: 'dictionnaires', difficulty: 2,
        pairs: [
            { term: '.keys()', match: 'Toutes les clés' },
            { term: '.values()', match: 'Toutes les valeurs' },
            { term: '.items()', match: 'Paires clé-valeur' },
            { term: '.get(k, d)', match: 'Valeur avec défaut' },
            { term: '.update()', match: 'Fusionner des dicts' },
            { term: 'del d[k]', match: 'Supprimer une clé' }
        ]
    },
    {
        id: 'mp-py-08', category: 'poo', difficulty: 3,
        pairs: [
            { term: 'class', match: 'Définir un modèle' },
            { term: '__init__', match: 'Constructeur' },
            { term: 'self', match: 'Instance courante' },
            { term: 'super()', match: 'Classe parente' },
            { term: '@property', match: 'Attribut calculé' },
            { term: '@staticmethod', match: 'Méthode sans self' }
        ]
    }
];

export function getMemoryPairs(lang) {
    const remote = getContent('memory_pairs', lang, 'default')
    if (Array.isArray(remote) && remote.length > 0) return remote
    return lang === 'python' ? pythonMemoryPairs : jsMemoryPairs;
}

export function getMemoryPairsByCategory(lang, category) {
    return getMemoryPairs(lang).filter(set => set.category === category);
}

export function getMemoryPairsByDifficulty(lang, difficulty) {
    return getMemoryPairs(lang).filter(set => set.difficulty === difficulty);
}

export function getRandomMemorySet(lang, pairCount = 6) {
    const allSets = getMemoryPairs(lang);
    const chosen = allSets[Math.floor(Math.random() * allSets.length)];
    // Shuffle the pairs and take the requested count
    const shuffled = [...chosen.pairs].sort(() => Math.random() - 0.5);
    return {
        ...chosen,
        pairs: shuffled.slice(0, Math.min(pairCount, shuffled.length))
    };
}

export function buildMemoryBoard(pairSet) {
    // Create cards: each pair becomes two cards (term + match)
    const cards = [];
    pairSet.pairs.forEach((pair, i) => {
        cards.push({ id: `t-${i}`, type: 'term', text: pair.term, pairIndex: i });
        cards.push({ id: `m-${i}`, type: 'match', text: pair.match, pairIndex: i });
    });
    // Shuffle the cards
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
}
