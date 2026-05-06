function hsvToRgbInline(h, s, v) {
  h /= 360; s /= 100; v /= 100
  const i = Math.floor(h * 6), f = h * 6 - i
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s)
  let r, g, b
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

export function createSVPanel(onChange) {
  const canvas = document.createElement('canvas')
  canvas.width = 200; canvas.height = 200
  canvas.style.cssText = 'width:200px;height:200px;cursor:crosshair;border-radius:4px;'
  canvas.setAttribute('data-pinpoint-ui', '')

  let hue = 0, dragging = false

  function draw() {
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    const imgData = ctx.createImageData(w, h)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const s = (x / w) * 100
        const v = (1 - y / h) * 100
        const { r, g, b } = hsvToRgbInline(hue, s, v)
        const idx = (y * w + x) * 4
        imgData.data[idx] = r
        imgData.data[idx+1] = g
        imgData.data[idx+2] = b
        imgData.data[idx+3] = 255
      }
    }
    ctx.putImageData(imgData, 0, 0)
  }

  function handleMove(e) {
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    const s = Math.round((x / rect.width) * 100)
    const v = Math.round((1 - y / rect.height) * 100)
    onChange({ s, v })
  }

  canvas.addEventListener('mousedown', (e) => { dragging = true; handleMove(e) })
  document.addEventListener('mousemove', (e) => { if (dragging) handleMove(e) })
  document.addEventListener('mouseup', () => { dragging = false })

  canvas.setHue = (h) => { hue = h; draw() }
  draw()
  return canvas
}
