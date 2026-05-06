const PROPS = {
  text: ['color', 'font-size', 'font-weight', 'font-family', 'line-height', 'letter-spacing', 'text-align'],
  dimension: ['width', 'height'],
  spacing: ['padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'gap'],
  appearance: ['border-radius', 'background-color', 'border', 'box-shadow'],
}

export function readStyles(el) {
  const computed = getComputedStyle(el)
  const result = {}
  for (const group of Object.values(PROPS)) {
    for (const prop of group) {
      result[prop] = computed.getPropertyValue(prop).trim()
    }
  }
  result._textContent = el.textContent?.trim().slice(0, 100) || ''
  result._tagName = el.localName
  return result
}

export function readSingleProp(el, prop) {
  return getComputedStyle(el).getPropertyValue(prop).trim()
}
