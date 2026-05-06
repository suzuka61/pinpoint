import { cssWrite } from '../services/css-write.js'
import { readStyles } from '../services/style-read.js'
import { emit } from '../core/event-bus.js'
import { createDimensionField } from './fields/dimension-field.js'
import { createSpacingField } from './fields/spacing-field.js'
import { createTypographyField } from './fields/typography-field.js'
import { createBorderField } from './fields/border-field.js'
import { createShadowField } from './fields/shadow-field.js'
import { createImageField } from './fields/image-field.js'
import { createColorField } from './fields/color-field.js'
import { createTextField } from './fields/text-field.js'

export function buildEditorContent(el, container, onOpenColor) {
  container.innerHTML = ''
  const styles = readStyles(el)

  function onChange(prop, value) {
    const { from, to } = cssWrite(el, prop, value)
    emit('pinpoint:style-changed', { el, prop, from, to })
  }

  const textContent = createTextField('内容', styles._textContent, (v) => { el.textContent = v })
  const dimension = createDimensionField(el, onChange)
  const spacing = createSpacingField(el, onChange)
  const typography = createTypographyField(el, onChange)
  const textColor = createColorField('文字颜色', styles['color'], (label, val) => onOpenColor('color', val, false))
  const fillColor = createColorField('填充', styles['background-color'], (label, val) => onOpenColor('background-color', val, true))
  const borderColor = createColorField('边框色', styles['border-color'] || 'transparent', (label, val) => onOpenColor('border-color', val, false))
  const border = createBorderField(el, onChange)
  const shadow = createShadowField(el, onChange)

  container.append(textContent, dimension, spacing, typography, textColor, fillColor, borderColor, border, shadow)

  if (el.localName === 'img') {
    const image = createImageField(el, ({ fileName, objectUrl, base64 }) => {
      el.src = objectUrl
      emit('pinpoint:style-changed', { el, prop: 'image-replace', from: '', to: fileName })
    })
    container.appendChild(image)
  }

  return { textColor, fillColor, borderColor }
}
