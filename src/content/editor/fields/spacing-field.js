import { createNumberField } from './number-field.js'

export function createSpacingField(el, onChange) {
  const group = document.createElement('div')
  group.className = 'field-group'
  group.innerHTML = '<div class="group-label">间距</div>'

  const computed = getComputedStyle(el)
  const props = [
    ['padding-top', 'PT'], ['padding-right', 'PR'],
    ['padding-bottom', 'PB'], ['padding-left', 'PL'],
    ['gap', 'Gap'],
  ]
  const fields = {}
  for (const [prop, label] of props) {
    const f = createNumberField(label, parseInt(computed.getPropertyValue(prop)) || 0, (v) => onChange(prop, v + 'px'))
    fields[prop] = f
    group.appendChild(f)
  }
  group.update = (prop, val) => { if (fields[prop]) fields[prop].update(parseInt(val) || 0) }
  return group
}
