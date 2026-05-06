import { createNumberField } from './number-field.js'

export function createBorderField(el, onChange) {
  const group = document.createElement('div')
  group.className = 'field-group'
  group.innerHTML = '<div class="group-label">描边</div>'

  const computed = getComputedStyle(el)
  const radius = createNumberField('圆角', parseInt(computed.borderRadius) || 0, (v) => onChange('border-radius', v + 'px'))
  const width = createNumberField('边框宽', parseInt(computed.borderWidth) || 0, (v) => onChange('border-width', v + 'px'))
  group.append(radius, width)
  return group
}
