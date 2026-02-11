// Bug Snippets - Find the bug in code snippets (JS & Python)
import { getContent } from './contentSource.js'

const jsBugSnippets = [
    {
        id: 'bug-js-01', difficulty: 1, category: 'bases',
        title: 'Variable non définie',
        buggyCode: `let message = "Bonjour";\nconsole.log(mesage);`,
        fixedCode: `let message = "Bonjour";\nconsole.log(message);`,
        hint: 'Regarde bien l\'orthographe de la variable.',
        bugLine: 2,
        explanation: 'Faute de frappe : "mesage" au lieu de "message". JS est sensible à la casse et à l\'orthographe.'
    },
    {
        id: 'bug-js-02', difficulty: 1, category: 'bases',
        title: 'Point-virgule manquant dans une boucle',
        buggyCode: `for (let i = 0 i < 5; i++) {\n  console.log(i);\n}`,
        fixedCode: `for (let i = 0; i < 5; i++) {\n  console.log(i);\n}`,
        hint: 'La boucle for a besoin de trois parties séparées par des ;',
        bugLine: 1,
        explanation: 'Il manque un point-virgule après "i = 0" dans la déclaration du for.'
    },
    {
        id: 'bug-js-03', difficulty: 1, category: 'conditions',
        title: 'Assignation au lieu de comparaison',
        buggyCode: `let age = 18;\nif (age = 20) {\n  console.log("Vingt ans");\n}`,
        fixedCode: `let age = 18;\nif (age === 20) {\n  console.log("Vingt ans");\n}`,
        hint: '= et === ne font pas la même chose.',
        bugLine: 2,
        explanation: '= est une assignation, === est une comparaison stricte. if(age = 20) assigne 20 à age et est toujours truthy.'
    },
    {
        id: 'bug-js-04', difficulty: 2, category: 'fonctions',
        title: 'Return dans une boucle forEach',
        buggyCode: `function trouver(arr, cible) {\n  arr.forEach(item => {\n    if (item === cible) return true;\n  });\n  return false;\n}`,
        fixedCode: `function trouver(arr, cible) {\n  for (const item of arr) {\n    if (item === cible) return true;\n  }\n  return false;\n}`,
        hint: 'return dans un callback forEach ne sort pas de la fonction parente.',
        bugLine: 3,
        explanation: 'Le return dans forEach ne retourne que du callback, pas de trouver(). Utiliser for...of ou .find() à la place.'
    },
    {
        id: 'bug-js-05', difficulty: 2, category: 'tableaux',
        title: 'Erreur d\'index off-by-one',
        buggyCode: `const fruits = ["pomme", "banane", "cerise"];\nfor (let i = 0; i <= fruits.length; i++) {\n  console.log(fruits[i]);\n}`,
        fixedCode: `const fruits = ["pomme", "banane", "cerise"];\nfor (let i = 0; i < fruits.length; i++) {\n  console.log(fruits[i]);\n}`,
        hint: 'Les indices vont de 0 à length - 1.',
        bugLine: 2,
        explanation: '<= fruits.length accède à l\'index 3 qui n\'existe pas (undefined). Utiliser < au lieu de <=.'
    },
    {
        id: 'bug-js-06', difficulty: 2, category: 'objets',
        title: 'this perdu dans un callback',
        buggyCode: `const compteur = {\n  valeur: 0,\n  incrementer: function() {\n    setTimeout(function() {\n      this.valeur++;\n    }, 100);\n  }\n};`,
        fixedCode: `const compteur = {\n  valeur: 0,\n  incrementer: function() {\n    setTimeout(() => {\n      this.valeur++;\n    }, 100);\n  }\n};`,
        hint: 'Quel est le contexte de this dans une fonction classique vs une arrow function ?',
        bugLine: 5,
        explanation: 'Dans une function() classique, this fait référence au contexte d\'appel (ici window). Une arrow function conserve le this parent.'
    },
    {
        id: 'bug-js-07', difficulty: 2, category: 'bases',
        title: 'Concaténation au lieu d\'addition',
        buggyCode: `function additionner(a, b) {\n  return a + b;\n}\nconsole.log(additionner("5", 3));`,
        fixedCode: `function additionner(a, b) {\n  return Number(a) + Number(b);\n}\nconsole.log(additionner("5", 3));`,
        hint: 'Que se passe-t-il quand on additionne un string et un number ?',
        bugLine: 4,
        explanation: '"5" + 3 donne "53" (concaténation). Convertir en Number d\'abord pour faire une addition.'
    },
    {
        id: 'bug-js-08', difficulty: 3, category: 'async',
        title: 'Await oublié',
        buggyCode: `async function getData() {\n  const response = fetch("/api/data");\n  const data = response.json();\n  return data;\n}`,
        fixedCode: `async function getData() {\n  const response = await fetch("/api/data");\n  const data = await response.json();\n  return data;\n}`,
        hint: 'fetch() retourne une Promise. Comment attend-on une Promise ?',
        bugLine: 2,
        explanation: 'Sans await, response est une Promise, pas la réponse. Il faut await fetch() et await response.json().'
    },
    {
        id: 'bug-js-09', difficulty: 2, category: 'conditions',
        title: 'Switch sans break',
        buggyCode: `function jour(n) {\n  let nom;\n  switch(n) {\n    case 1: nom = "Lundi";\n    case 2: nom = "Mardi";\n    case 3: nom = "Mercredi";\n    default: nom = "Inconnu";\n  }\n  return nom;\n}`,
        fixedCode: `function jour(n) {\n  let nom;\n  switch(n) {\n    case 1: nom = "Lundi"; break;\n    case 2: nom = "Mardi"; break;\n    case 3: nom = "Mercredi"; break;\n    default: nom = "Inconnu";\n  }\n  return nom;\n}`,
        hint: 'Sans une certaine instruction, le switch "tombe" dans les cas suivants.',
        bugLine: 4,
        explanation: 'Sans break, l\'exécution continue dans les case suivants (fall-through). jour(1) retourne "Inconnu".'
    },
    {
        id: 'bug-js-10', difficulty: 3, category: 'tableaux',
        title: 'Mutation d\'un tableau avec const',
        buggyCode: `const nombres = [3, 1, 4, 1, 5];\nconst trie = nombres.sort();\nconsole.log(nombres); // On s'attend à [3,1,4,1,5]\nconsole.log(trie);`,
        fixedCode: `const nombres = [3, 1, 4, 1, 5];\nconst trie = [...nombres].sort();\nconsole.log(nombres); // [3,1,4,1,5] non modifié\nconsole.log(trie);`,
        hint: 'sort() modifie-t-il le tableau original ou crée-t-il un nouveau tableau ?',
        bugLine: 2,
        explanation: 'sort() modifie le tableau en place. nombres est aussi modifié. Utiliser [...nombres].sort() pour copier d\'abord.'
    }
];

const pythonBugSnippets = [
    {
        id: 'bug-py-01', difficulty: 1, category: 'bases',
        title: 'Indentation manquante',
        buggyCode: `if True:\nprint("Bonjour")`,
        fixedCode: `if True:\n    print("Bonjour")`,
        hint: 'Python utilise l\'indentation pour les blocs de code.',
        bugLine: 2,
        explanation: 'En Python, le code dans un bloc (if, for, def...) doit être indenté de 4 espaces.'
    },
    {
        id: 'bug-py-02', difficulty: 1, category: 'bases',
        title: 'Deux-points oubliés',
        buggyCode: `def saluer(nom)\n    print(f"Bonjour {nom}")`,
        fixedCode: `def saluer(nom):\n    print(f"Bonjour {nom}")`,
        hint: 'Les blocs de code en Python commencent par un caractère spécial.',
        bugLine: 1,
        explanation: 'Il manque les deux-points (:) après la définition de la fonction.'
    },
    {
        id: 'bug-py-03', difficulty: 1, category: 'bases',
        title: 'Mauvais opérateur de comparaison',
        buggyCode: `x = 10\nif x = 10:\n    print("Dix")`,
        fixedCode: `x = 10\nif x == 10:\n    print("Dix")`,
        hint: '= et == ne font pas la même chose.',
        bugLine: 2,
        explanation: '= est l\'assignation, == est la comparaison. Python lève une SyntaxError ici.'
    },
    {
        id: 'bug-py-04', difficulty: 2, category: 'listes',
        title: 'Modifier une liste en itérant',
        buggyCode: `nombres = [1, 2, 3, 4, 5]\nfor n in nombres:\n    if n % 2 == 0:\n        nombres.remove(n)\nprint(nombres)`,
        fixedCode: `nombres = [1, 2, 3, 4, 5]\nnombres = [n for n in nombres if n % 2 != 0]\nprint(nombres)`,
        hint: 'Modifier une liste pendant qu\'on itère dessus cause des problèmes.',
        bugLine: 4,
        explanation: 'Supprimer des éléments pendant l\'itération saute des éléments. Utiliser une list comprehension.'
    },
    {
        id: 'bug-py-05', difficulty: 2, category: 'fonctions',
        title: 'Argument mutable par défaut',
        buggyCode: `def ajouter(element, liste=[]):\n    liste.append(element)\n    return liste\n\nprint(ajouter(1))\nprint(ajouter(2))`,
        fixedCode: `def ajouter(element, liste=None):\n    if liste is None:\n        liste = []\n    liste.append(element)\n    return liste\n\nprint(ajouter(1))\nprint(ajouter(2))`,
        hint: 'Les arguments par défaut mutables sont partagés entre les appels.',
        bugLine: 1,
        explanation: 'La liste par défaut est créée une seule fois. Le 2e appel retourne [1, 2] au lieu de [2]. Utiliser None comme défaut.'
    },
    {
        id: 'bug-py-06', difficulty: 2, category: 'conditions',
        title: 'Comparaison chaînée incorrecte',
        buggyCode: `x = 5\nif x == 1 or 2 or 3:\n    print("Petit nombre")`,
        fixedCode: `x = 5\nif x in (1, 2, 3):\n    print("Petit nombre")`,
        hint: 'Comment Python évalue-t-il "or" entre des valeurs ?',
        bugLine: 2,
        explanation: '"x == 1 or 2 or 3" est évalué comme "(x==1) or (2) or (3)". 2 est truthy, donc c\'est toujours True. Utiliser "in".'
    },
    {
        id: 'bug-py-07', difficulty: 2, category: 'bases',
        title: 'Division entière inattendue',
        buggyCode: `temperature_f = 72\ntemperature_c = (temperature_f - 32) * 5/9\nprint(f"Température: {int(temperature_c)}°C")`,
        fixedCode: `temperature_f = 72\ntemperature_c = (temperature_f - 32) * 5 / 9\nprint(f"Température: {temperature_c:.1f}°C")`,
        hint: 'int() tronque, il ne fait pas un arrondi.',
        bugLine: 3,
        explanation: 'int() tronque vers zéro. Pour un affichage correct, utiliser le formatage :.1f pour une décimale.'
    },
    {
        id: 'bug-py-08', difficulty: 3, category: 'poo',
        title: 'Attribut de classe partagé',
        buggyCode: `class Equipe:\n    membres = []\n    def __init__(self, nom):\n        self.nom = nom\n    def ajouter(self, membre):\n        self.membres.append(membre)\n\na = Equipe("A")\nb = Equipe("B")\na.ajouter("Alice")\nprint(b.membres)  # ["Alice"] !`,
        fixedCode: `class Equipe:\n    def __init__(self, nom):\n        self.nom = nom\n        self.membres = []\n    def ajouter(self, membre):\n        self.membres.append(membre)\n\na = Equipe("A")\nb = Equipe("B")\na.ajouter("Alice")\nprint(b.membres)  # []`,
        hint: 'Les attributs de classe sont partagés entre toutes les instances.',
        bugLine: 2,
        explanation: 'membres = [] au niveau de la classe est partagé par toutes les instances. Le définir dans __init__ pour chaque instance.'
    },
    {
        id: 'bug-py-09', difficulty: 2, category: 'bases',
        title: 'Concaténation str + int',
        buggyCode: `age = 25\nmessage = "J'ai " + age + " ans"\nprint(message)`,
        fixedCode: `age = 25\nmessage = f"J'ai {age} ans"\nprint(message)`,
        hint: 'Python ne convertit pas automatiquement les types pour la concaténation.',
        bugLine: 2,
        explanation: 'On ne peut pas concaténer str et int avec +. Utiliser f-string ou str(age).'
    },
    {
        id: 'bug-py-10', difficulty: 3, category: 'fonctions',
        title: 'Variable non locale dans une closure',
        buggyCode: `def compteur():\n    count = 0\n    def incrementer():\n        count += 1\n        return count\n    return incrementer\n\nc = compteur()\nprint(c())`,
        fixedCode: `def compteur():\n    count = 0\n    def incrementer():\n        nonlocal count\n        count += 1\n        return count\n    return incrementer\n\nc = compteur()\nprint(c())`,
        hint: 'Une fonction imbriquée ne peut pas modifier une variable de la fonction parente par défaut.',
        bugLine: 4,
        explanation: 'Sans nonlocal, Python crée une nouvelle variable locale count. nonlocal permet de modifier la variable parente.'
    }
];

export function getBugSnippets(lang) {
    const remote = getContent('bug_snippets', lang, 'default')
    if (Array.isArray(remote) && remote.length > 0) return remote
    return lang === 'python' ? pythonBugSnippets : jsBugSnippets;
}

export function getBugSnippetsByDifficulty(lang, difficulty) {
    return getBugSnippets(lang).filter(s => s.difficulty === difficulty);
}

export function getRandomBugSnippet(lang) {
    const snippets = getBugSnippets(lang);
    return snippets[Math.floor(Math.random() * snippets.length)];
}
