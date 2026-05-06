export function findDeepElement(x, y) {
  const els = document.elementsFromPoint(x, y)
  for (let i = els.length - 1; i >= 0; i--) {
    const el = els[i]
    if (isPinpointUI(el)) continue
    return el
  }
  return null
}

function isPinpointUI(el) {
  return el.localName?.startsWith('pinpoint-') || el.closest('[data-pinpoint-ui]')
}