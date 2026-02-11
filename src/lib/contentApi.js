export async function fetchAllContent() {
  const res = await fetch('/api/content/all')
  if (!res.ok) throw new Error('content_fetch_failed')
  const payload = await res.json()
  return payload?.data || {}
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
