import { createTextField } from './text-field.js'

export function createShadowField(el, onChange) {
  const group = document.createElement('div')
  group.className = 'field-group'
  group.innerHTML = '<div class="group-label">投影</div>'

  const computed = getComputedStyle(el)
  const shadow = createTextField('box-shadow', computed.boxShadow === 'none' ? '' : computed.boxShadow, (v) => onChange('box-shadow', v || 'none'))
  group.appendChild(shadow)
  return group
}
