export async function fetchAllContent() {
  const res = await fetch('/api/content/all')
  if (!res.ok) throw new Error('content_fetch_failed')
  const payload = await res.json()
  return payload?.data || {}
}

export async function deleteLanguage(langId) {
  const res = await fetch(`/api/content/language/${encodeURIComponent(langId)}`, { method: 'DELETE' })
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.error || 'delete_failed')
  }
  return true
}

export async function exportLanguage(langId) {
  const res = await fetch(`/api/content/export/${encodeURIComponent(langId)}`)
  if (!res.ok) throw new Error('export_failed')
  const data = await res.json()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `codemaster-${langId}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importLanguage(file) {
  const text = await file.text()
  const data = JSON.parse(text)
  const res = await fetch('/api/content/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.error || 'import_failed')
  }
  return res.json()
}

export async function fetchContent(type, { lang, key } = {}) {
  const params = new URLSearchParams({ type })
  if (lang) params.set('lang', lang)
  if (key) params.set('key', key)
  const res = await fetch(`/api/content?${params.toString()}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('content_fetch_failed')
  const payload = await res.json()
  return payload?.data ?? null
}
