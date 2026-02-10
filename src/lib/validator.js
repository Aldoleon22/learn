export class Validator {
  validate(exercise, sandboxResult) {
    const { validation } = exercise

    if (!sandboxResult.success && sandboxResult.errors.length > 0) {
      return { pass: false, message: `Erreur: ${sandboxResult.errors[0]}` }
    }

    switch (validation.type) {
      case 'output':
        return this._validateOutput(sandboxResult.logs, validation.expected)
      case 'contains':
        return this._validateContains(sandboxResult.sourceCode || '', validation.patterns)
      case 'outputContains':
        return this._validateOutputContains(sandboxResult.logs, validation.expected)
      case 'custom':
        return validation.fn(sandboxResult)
      default:
        return { pass: false, message: 'Type de validation inconnu' }
    }
  }

  _validateOutput(logs, expected) {
    const expectedLines = Array.isArray(expected) ? expected : [expected]
    const output = logs.map(l => l.trim())
    const expectedTrimmed = expectedLines.map(l => String(l).trim())

    if (output.length === expectedTrimmed.length && output.every((line, i) => line === expectedTrimmed[i])) {
      return { pass: true, message: 'Parfait ! Sortie correcte.' }
    }

    return { pass: false, message: `Attendu : ${expectedTrimmed.join(', ')}\nObtenu : ${output.join(', ') || '(rien)'}` }
  }

  _validateOutputContains(logs, expected) {
    const output = logs.join('\n').toLowerCase()
    const search = String(expected).toLowerCase()
    if (output.includes(search)) return { pass: true, message: 'Bravo ! Resultat correct.' }
    return { pass: false, message: `La sortie devrait contenir "${expected}"` }
  }

  _validateContains(code, patterns) {
    for (const pattern of patterns) {
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
      if (!regex.test(code)) return { pass: false, message: `Ton code doit utiliser : ${pattern}` }
    }
    return { pass: true, message: 'Bien joue !' }
  }
}
