export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}

export function debounce(fn, ms) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

export function truncate(str, len = 60) {
  return str.length > len ? str.slice(0, len) + '…' : str
}