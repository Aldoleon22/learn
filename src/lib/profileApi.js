const DEVICE_ID_KEY = 'codemaster_device_id'

function createDeviceId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `device_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function getDeviceId() {
  const existing = localStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing
  const next = createDeviceId()
  localStorage.setItem(DEVICE_ID_KEY, next)
  return next
}

export async function fetchProfile() {
  const deviceId = getDeviceId()
  const res = await fetch(`/api/profile/${encodeURIComponent(deviceId)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('profile_fetch_failed')
  const payload = await res.json()
  return payload?.data ?? null
}

export async function saveProfile(data) {
  const deviceId = getDeviceId()
  const res = await fetch(`/api/profile/${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
  if (!res.ok) throw new Error('profile_save_failed')
  return res.json()
}
