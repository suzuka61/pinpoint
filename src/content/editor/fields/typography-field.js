import { createNumberField } from './number-field.js'
import { createTextField } from './text-field.js'

export function createTypographyField(el, onChange) {
  const group = document.createElement('div')
  group.className = 'field-group'
  group.innerHTML = '<div class="group-label">字体</div>'

  const computed = getComputedStyle(el)
  const family = createTextField('字体', computed.fontFamily, (v) => onChange('font-family', v))
  const size = createNumberField('字号', parseInt(computed.fontSize), (v) => onChange('font-size', v + 'px'))
  const weight = createNumberField('字重', parseInt(computed.fontWeight), (v) => onChange('font-weight', String(v)))
  const lineH = createNumberField('行高', parseFloat(computed.lineHeight), (v) => onChange('line-height', v + 'px'))
  const spacing = createNumberField('字距', parseFloat(computed.letterSpacing) || 0, (v) => onChange('letter-spacing', v + 'px'))

  group.append(family, size, weight, lineH, spacing)
  return group
}
