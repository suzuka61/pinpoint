import { findDeepElement } from './selectable.js'
import { emit } from './event-bus.js'

let active = false

export function activateSelectable() {
  if (active) return
  active = true
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('click', onClick)
}

export function deactivateSelectable() {
  active = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('click', onClick)
}

function onMouseMove(e) {
  const el = findDeepElement(e.clientX, e.clientY)
  if (!el) return
  const rect = el.getBoundingClientRect()
  emit('pinpoint:hover', { el, rect })
}

function onClick(e) {
  if (e.target.closest('[data-pinpoint-ui]')) return
  e.preventDefault()
  e.stopPropagation()

  const el = findDeepElement(e.clientX, e.clientY)
  if (!el) return
  const rect = el.getBoundingClientRect()
  emit('pinpoint:selected', { els: [el], rects: [rect] })
}