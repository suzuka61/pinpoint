export function cssWrite(el, prop, value) {
  const from = el.style.getPropertyValue(prop) || getComputedStyle(el).getPropertyValue(prop)
  el.style.setProperty(prop, value)
  return { prop, from, to: value }
}

export function cssReset(el, changes) {
  for (const [prop, { from }] of Object.entries(changes)) {
    if (from) el.style.setProperty(prop, from)
    else el.style.removeProperty(prop)
  }
}