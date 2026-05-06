export function createHueSlider(onChange) {
  const canvas = document.createElement('canvas')
  canvas.width = 200; canvas.height = 16
  canvas.style.cssText = 'width:200px;height:16px;cursor:pointer;border-radius:4px;'
  canvas.setAttribute('data-pinpoint-ui', '')

  let dragging = false

  function draw() {
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    for (let x = 0; x < w; x++) {
      const hue = (x / w) * 360
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
      ctx.fillRect(x, 0, 1, h)
    }
  }

  function handleMove(e) {
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const hue = Math.round((x / rect.width) * 360)
    onChange(hue)
  }

  canvas.addEventListener('mousedown', (e) => { dragging = true; handleMove(e) })
  document.addEventListener('mousemove', (e) => { if (dragging) handleMove(e) })
  document.addEventListener('mouseup', () => { dragging = false })

  draw()
  return canvas
}
