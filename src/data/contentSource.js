import useContentStore from '../store/contentStore.js'

export function getContent(type, lang, key = 'default') {
  return useContentStore.getState().getType(type, lang, key)
}

export function isContentReady() {
  return useContentStore.getState().ready
}

export function getLanguages() {
  const data = getContent('languages', null, 'default')
  if (Array.isArray(data) && data.length > 0) return data
  return [
    { id: 'js', name: 'JavaScript', icon: '⚡' },
    { id: 'python', name: 'Python', icon: '🐍' },
  ]
}
