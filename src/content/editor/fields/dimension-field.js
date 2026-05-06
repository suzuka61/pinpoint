import { createNumberField } from './number-field.js'

export function createDimensionField(el, onChange) {
  const group = document.createElement('div')
  group.className = 'field-group'
  group.innerHTML = '<div class="group-label">尺寸</div>'

  const computed = getComputedStyle(el)
  const w = createNumberField('W', parseInt(computed.width), (v) => onChange('width', v + 'px'))
  const h = createNumberField('H', parseInt(computed.height), (v) => onChange('height', v + 'px'))
  group.appendChild(w)
  group.appendChild(h)

  group.update = (prop, val) => {
    if (prop === 'width') w.update(parseInt(val) || 0)
    if (prop === 'height') h.update(parseInt(val) || 0)
  }
  return group
}
