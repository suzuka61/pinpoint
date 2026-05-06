export function createNumberField(label, value, onChange) {
  const row = document.createElement('div')
  row.className = 'field-row'
  row.innerHTML = `
    <label>${label}</label>
    <span class="drag-handle" title="拖动调值">⇔</span>
    <input type="text" value="${value}" data-pinpoint-ui>
  `
  const input = row.querySelector('input')
  const handle = row.querySelector('.drag-handle')

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); adjust(1, e.shiftKey) }
    if (e.key === 'ArrowDown') { e.preventDefault(); adjust(-1, e.shiftKey) }
  })

  input.addEventListener('change', () => onChange(input.value))

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startVal = parseFloat(input.value) || 0
    const onMove = (e) => {
      const delta = Math.round((e.clientX - startX) / 2)
      input.value = startVal + delta
      onChange(input.value)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  })

  function adjust(dir, shift) {
    const step = shift ? 10 : 1
    const val = parseFloat(input.value) || 0
    input.value = val + dir * step
    onChange(input.value)
  }

  row.update = (v) => { input.value = v }
  return row
}
