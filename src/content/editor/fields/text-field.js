export function createTextField(label, value, onChange) {
  const row = document.createElement('div')
  row.className = 'field-row'
  row.innerHTML = `
    <label>${label}</label>
    <input type="text" value="${value}" data-pinpoint-ui>
  `
  const input = row.querySelector('input')
  input.addEventListener('change', () => onChange(input.value))
  row.update = (v) => { input.value = v }
  return row
}
