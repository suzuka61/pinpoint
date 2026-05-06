export function createGradientEditor(onChange) {
  const container = document.createElement('div')
  container.style.cssText = 'display:flex;flex-direction:column;gap:4px;'

  const bar = document.createElement('div')
  bar.style.cssText = 'height:16px;border-radius:4px;cursor:pointer;'
  bar.setAttribute('data-pinpoint-ui', '')

  const controls = document.createElement('div')
  controls.style.cssText = 'display:flex;align-items:center;gap:4px;'
  controls.innerHTML = '<label style="color:#a6adc8;font-size:11px;">角度</label>'

  const angleInput = document.createElement('input')
  angleInput.type = 'number'
  angleInput.value = '135'
  angleInput.min = '0'
  angleInput.max = '360'
  angleInput.setAttribute('data-pinpoint-ui', '')
  angleInput.style.cssText = 'width:50px;background:#313244;border:none;color:#cdd6f4;padding:2px 4px;border-radius:3px;font:inherit;'
  controls.appendChild(angleInput)

  let stops = [
    { hex: '#667eea', position: 0 },
    { hex: '#764ba2', position: 100 },
  ]
  let angle = 135

  function render() {
    const gradStr = stops.map(s => `${s.hex} ${s.position}%`).join(', ')
    bar.style.background = `linear-gradient(90deg, ${gradStr})`
  }

  angleInput.addEventListener('change', () => {
    angle = parseInt(angleInput.value) || 0
    emitChange()
  })

  bar.addEventListener('click', (e) => {
    const rect = bar.getBoundingClientRect()
    const pos = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    stops.push({ hex: '#ffffff', position: Math.max(0, Math.min(100, pos)) })
    stops.sort((a, b) => a.position - b.position)
    render()
    emitChange()
  })

  function emitChange() {
    onChange({ mode: 'gradient', angle, stops: [...stops] })
  }

  container.setStops = (s) => { stops = s; render() }
  container.setAngle = (a) => { angle = a; angleInput.value = a; render() }

  container.append(bar, controls)
  render()
  return container
}
