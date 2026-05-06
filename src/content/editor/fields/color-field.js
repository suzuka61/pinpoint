export function createColorField(label, value, onOpenPopover) {
  const row = document.createElement('div')
  row.className = 'field-row'
  row.innerHTML = `
    <label>${label}</label>
    <div class="color-swatch" style="background:${value}" data-pinpoint-ui></div>
    <input type="text" value="${value}" data-pinpoint-ui>
  `
  const swatch = row.querySelector('.color-swatch')
  const input = row.querySelector('input')

  swatch.addEventListener('click', () => onOpenPopover(label, input.value))
  input.addEventListener('click', () => onOpenPopover(label, input.value))
  input.addEventListener('change', () => { swatch.style.background = input.value })

  row.update = (v) => { input.value = v; swatch.style.background = v }
  row.getValue = () => input.value
  return row
}
