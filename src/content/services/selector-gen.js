export function generateSelector(el) {
  if (el.id) return `#${CSS.escape(el.id)}`

  const parts = []
  let current = el
  while (current && current !== document.body) {
    let seg = current.localName
    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`)
      break
    }
    const cls = [...current.classList].filter(c => !c.startsWith('pinpoint-')).join('.')
    if (cls) seg += '.' + cls
    parts.unshift(seg)
    current = current.parentElement
  }
  return parts.join(' > ')
}