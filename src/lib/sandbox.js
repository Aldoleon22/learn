// JavaScript Sandbox using iframe
class JSSandbox {
  constructor() {
    this.iframe = null
    this.timeout = 3000
  }

  execute(code) {
    return new Promise((resolve) => {
      if (this.iframe) this.iframe.remove()

      const logs = []
      const errors = []
      let resolved = false

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true
          this.iframe?.remove()
          resolve({ success: false, logs, errors: ["Temps d'execution depasse (boucle infinie ?)"] })
        }
      }, this.timeout)

      const handler = (event) => {
        if (event.source !== this.iframe?.contentWindow) return
        const msg = event.data

        if (msg.type === 'log') {
          logs.push(msg.args.map(a => this._serialize(a)).join(' '))
        } else if (msg.type === 'error') {
          errors.push(msg.message)
        } else if (msg.type === 'done') {
          resolved = true
          clearTimeout(timer)
          window.removeEventListener('message', handler)
          resolve({ success: errors.length === 0, logs, errors, returnValue: msg.returnValue })
        }
      }
      window.addEventListener('message', handler)

      this.iframe = document.createElement('iframe')
      this.iframe.setAttribute('sandbox', 'allow-scripts')
      this.iframe.style.display = 'none'

      const wrappedCode = `
        <script>
          const _origConsole = console;
          console = {
            log: (...args) => parent.postMessage({ type: 'log', args: args.map(a => {
              if (a === null) return null;
              if (a === undefined) return undefined;
              if (typeof a === 'object') { try { return JSON.parse(JSON.stringify(a)); } catch(e) { return String(a); } }
              return a;
            }) }, '*'),
            warn: (...args) => parent.postMessage({ type: 'log', args }, '*'),
            error: (...args) => parent.postMessage({ type: 'error', message: args.join(' ') }, '*'),
            info: (...args) => parent.postMessage({ type: 'log', args }, '*'),
          };

          window.onerror = (msg, src, line, col, err) => {
            parent.postMessage({ type: 'error', message: err?.message || msg }, '*');
          };

          try {
            ${code}
            parent.postMessage({ type: 'done' }, '*');
          } catch (e) {
            parent.postMessage({ type: 'error', message: e.message }, '*');
            parent.postMessage({ type: 'done' }, '*');
          }
        <\/script>
      `

      this.iframe.srcdoc = wrappedCode
      document.body.appendChild(this.iframe)
    })
  }

  _serialize(val) {
    if (val === null) return 'null'
    if (val === undefined) return 'undefined'
    if (typeof val === 'object') {
      try { return JSON.stringify(val) } catch { return String(val) }
    }
    return String(val)
  }

  destroy() {
    if (this.iframe) {
      this.iframe.remove()
      this.iframe = null
    }
  }
}

// Python Sandbox using Skulpt
class PythonSandbox {
  constructor() {
    this.timeout = 5000
  }

  execute(code) {
    return new Promise((resolve) => {
      const logs = []
      const errors = []

      const timer = setTimeout(() => {
        resolve({ success: false, logs, errors: ["Temps d'execution depasse (boucle infinie ?)"] })
      }, this.timeout)

      if (typeof Sk === 'undefined') {
        clearTimeout(timer)
        resolve({ success: false, logs, errors: ["Skulpt n'est pas charge. Verifie ta connexion internet."] })
        return
      }

      Sk.configure({
        output: (text) => {
          const line = text.replace(/\n$/, '')
          if (line !== '') logs.push(line)
        },
        read: (filename) => {
          if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][filename] === undefined) {
            throw "File not found: '" + filename + "'"
          }
          return Sk.builtinFiles["files"][filename]
        },
        __future__: Sk.python3,
        execLimit: this.timeout,
      })

      Sk.misceval.asyncToPromise(() => {
        return Sk.importMainWithBody("<stdin>", false, code, true)
      }).then(() => {
        clearTimeout(timer)
        resolve({ success: true, logs, errors })
      }).catch((err) => {
        clearTimeout(timer)
        let errorMsg = err.toString()
        if (err.args && err.args.v && err.args.v[0]) {
          errorMsg = err.tp$name + ': ' + err.args.v[0].v
        }
        errors.push(errorMsg)
        resolve({ success: false, logs, errors })
      })
    })
  }

  destroy() {}
}

// Unified Sandbox - takes lang as parameter
export class Sandbox {
  constructor(lang = 'js') {
    this.lang = lang
    this._sandbox = lang === 'python' ? new PythonSandbox() : new JSSandbox()
  }

  execute(code) {
    return this._sandbox.execute(code)
  }

  destroy() {
    this._sandbox.destroy()
  }
}
