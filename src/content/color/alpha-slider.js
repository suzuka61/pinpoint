export function createAlphaSlider(onChange) {
  const canvas = document.createElement('canvas')
  canvas.width = 200; canvas.height = 16
  canvas.style.cssText = 'width:200px;height:16px;cursor:pointer;border-radius:4px;'
  canvas.setAttribute('data-pinpoint-ui', '')

  let dragging = false, currentColor = '#ffffff'

  function draw() {
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    ctx.clearRect(0, 0, w, h)
    for (let x = 0; x < w; x++) {
      const alpha = x / w
      ctx.globalAlpha = alpha
      ctx.fillStyle = currentColor
      ctx.fillRect(x, 0, 1, h)
    }
    ctx.globalAlpha = 1
  }

  function handleMove(e) {
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const opacity = Math.round((x / rect.width) * 100)
    onChange(opacity)
  }

  canvas.addEventListener('mousedown', (e) => { dragging = true; handleMove(e) })
  document.addEventListener('mousemove', (e) => { if (dragging) handleMove(e) })
  document.addEventListener('mouseup', () => { dragging = false })

  canvas.setColor = (hex) => { currentColor = hex; draw() }
  draw()
  return canvas
}
