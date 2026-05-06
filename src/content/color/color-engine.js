export function hsvToRgb(h, s, v) {
  s /= 100; v /= 100
  const c = v * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = v - c
  let r, g, b
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  }
}

export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  let h, s = max === 0 ? 0 : d / max, v = max
  if (d === 0) h = 0
  else if (max === r) h = 60 * (((g - b) / d) % 6)
  else if (max === g) h = 60 * ((b - r) / d + 2)
  else h = 60 * ((r - g) / d + 4)
  if (h < 0) h += 360
  return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) }
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

export function hexToRgb(hex) {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  }
}

export function parseColor(str) {
  if (!str) return { h: 0, s: 0, v: 100, a: 1 }
  str = str.trim()
  // hex
  const hexMatch = str.match(/^#([0-9a-f]{3,8})$/i)
  if (hexMatch) {
    const rgb = hexToRgb('#' + hexMatch[1])
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
    return { ...hsv, a: 1 }
  }
  // rgba
  const rgbaMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (rgbaMatch) {
    const hsv = rgbToHsv(+rgbaMatch[1], +rgbaMatch[2], +rgbaMatch[3])
    return { ...hsv, a: rgbaMatch[4] !== undefined ? +rgbaMatch[4] : 1 }
  }
  return { h: 0, s: 0, v: 100, a: 1 }
}
