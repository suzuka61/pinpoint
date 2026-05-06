export function createImageField(el, onChange) {
  const group = document.createElement('div')
  group.className = 'field-group'
  group.innerHTML = '<div class="group-label">图片</div>'

  const row = document.createElement('div')
  row.className = 'field-row'
  row.innerHTML = `<button class="img-btn" data-pinpoint-ui>选择文件</button><span class="img-name"></span>`

  const btn = row.querySelector('.img-btn')
  const name = row.querySelector('.img-name')

  btn.addEventListener('click', () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      name.textContent = file.name
      const reader = new FileReader()
      reader.onload = () => onChange({ fileName: file.name, objectUrl: url, base64: reader.result })
      reader.readAsDataURL(file)
    }
    input.click()
  })

  group.appendChild(row)
  return group
}
