import { on, off, emit } from '../core/event-bus.js'
import { hsvToRgb, rgbToHex, parseColor } from './color-engine.js'

const popoverCSS = `:host {
  position: fixed;
  z-index: 2147483647;
  background: #1e293b;
  border-radius: 10px;
  padding: 12px;
  width: 240px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #e2e8f0;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}

.sv-panel {
  width: 100%;
  height: 160px;
  border-radius: 6px;
  cursor: crosshair;
  position: relative;
  margin-bottom: 10px;
}

.sv-cursor {
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-radius: 50%;
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 0 2px rgba(0,0,0,0.5);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.slider-row label {
  font-size: 11px;
  color: #94a3b8;
  min-width: 28px;
}

.slider-track {
  flex: 1;
  height: 14px;
  border-radius: 7px;
  position: relative;
  cursor: pointer;
}

.slider-thumb {
  width: 8px;
  height: 18px;
  border: 2px solid #fff;
  border-radius: 3px;
  position: absolute;
  top: -2px;
  transform: translateX(-50%);
  pointer-events: none;
  box-shadow: 0 0 2px rgba(0,0,0,0.5);
}

.format-row {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.format-btn {
  flex: 1;
  padding: 4px;
  border-radius: 4px;
  background: #0f172a;
  color: #94a3b8;
  border: none;
  cursor: pointer;
  font-size: 11px;
}

.format-btn.active {
  background: #3b82f6;
  color: #fff;
}

.hex-input {
  width: 100%;
  padding: 4px 8px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 12px;
  margin-top: 8px;
  outline: none;
  box-sizing: border-box;
}`

class ColorPopover extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [makeSheet(popoverCSS)]
    this.setAttribute('data-pinpoint-ui', '')
    this.h = 0; this.s = 100; this.v = 100; this.a = 1
    this.prop = null; this.el = null; this.format = 'hex'
    this._visible = false
  }

  connectedCallback() {
    on('pinpoint:color-request', this._onRequest)
    this.style.display = 'none'
  }

  disconnectedCallback() {
    off('pinpoint:color-request', this._onRequest)
  }

  _onRequest = ({ detail }) => {
    const { prop, currentColor, el, trigger } = detail
    this.prop = prop
    this.el = el
    const parsed = parseColor(currentColor)
    this.h = parsed.h; this.s = parsed.s; this.v = parsed.v; this.a = parsed.a
    this._visible = true
    this.style.display = ''
    this._render()
    this._position(trigger)
  }

  _position(trigger) {
    const tr = trigger.getBoundingClientRect()
    const w = 264, h = 320
    let x = tr.right + 8
    let y = tr.top
    if (x + w > window.innerWidth) x = tr.left - w - 8
    if (y + h > window.innerHeight) y = Math.max(8, window.innerHeight - h - 8)
    this.style.left = x + 'px'
    this.style.top = y + 'px'
  }

  _render() {
    const s = this.shadowRoot
    s.innerHTML = ''

    // SV Panel
    const panel = s.appendChild(document.createElement('div'))
    panel.className = 'sv-panel'
    const { r: pureR, g: pureG, b: pureB } = hsvToRgb(this.h, 100, 100)
    panel.style.background = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, rgb(${pureR},${pureG},${pureB}))`
    const cursor = panel.appendChild(document.createElement('div'))
    cursor.className = 'sv-cursor'
    cursor.style.left = this.s + '%'
    cursor.style.top = (100 - this.v) + '%'
    this._bindSV(panel)

    // Hue slider
    this._renderSlider(s, 'H', `linear-gradient(to right, #f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)`, this.h / 360, 'hue')

    // Alpha slider
    this._renderSlider(s, 'A', `linear-gradient(to right, transparent, ${this._currentColor()})`, this.a, 'alpha')

    // Format buttons
    const fmtRow = s.appendChild(document.createElement('div'))
    fmtRow.className = 'format-row'
    for (const f of ['hex', 'rgb', 'hsl']) {
      const btn = fmtRow.appendChild(document.createElement('button'))
      btn.className = 'format-btn' + (f === this.format ? ' active' : '')
      btn.textContent = f.toUpperCase()
      btn.onclick = () => { this.format = f; this._render() }
    }

    // Hex input
    const hexInput = s.appendChild(document.createElement('input'))
    hexInput.className = 'hex-input'
    hexInput.value = this._formatColor()
    hexInput.addEventListener('change', () => {
      const parsed = parseColor(hexInput.value)
      this.h = parsed.h; this.s = parsed.s; this.v = parsed.v; this.a = parsed.a
      this._applyColor()
      this._render()
    })

    // Close on outside click
    setTimeout(() => {
      this._closeHandler = (e) => {
        if (!this.contains(e.target) && !e.target.closest('[data-pinpoint-ui]')) {
          this._close()
        }
      }
      document.addEventListener('mousedown', this._closeHandler, { once: true })
    }, 100)
  }

  _renderSlider(parent, label, gradient, value, type) {
    const row = parent.appendChild(document.createElement('div'))
    row.className = 'slider-row'
    const lbl = row.appendChild(document.createElement('label'))
    lbl.textContent = label
    const track = row.appendChild(document.createElement('div'))
    track.className = 'slider-track'
    track.style.background = gradient
    const thumb = track.appendChild(document.createElement('div'))
    thumb.className = 'slider-thumb'
    thumb.style.left = (value * 100) + '%'
    this._bindSlider(track, type)
  }

  _bindSV(panel) {
    const onMove = (e) => {
      const rect = panel.getBoundingClientRect()
      this.s = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)))
      this.v = Math.round(Math.max(0, Math.min(100, (1 - (e.clientY - rect.top) / rect.height) * 100)))
      this._applyColor()
      this._render()
    }
    panel.addEventListener('mousedown', (e) => {
      onMove(e)
      const up = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', up) }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', up)
    })
  }

  _bindSlider(track, type) {
    const onMove = (e) => {
      const rect = track.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      if (type === 'hue') this.h = Math.round(ratio * 360)
      else this.a = Math.round(ratio * 100) / 100
      this._applyColor()
      this._render()
    }
    track.addEventListener('mousedown', (e) => {
      onMove(e)
      const up = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', up) }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', up)
    })
  }

  _currentColor() {
    const { r, g, b } = hsvToRgb(this.h, this.s, this.v)
    return `rgb(${r},${g},${b})`
  }

  _formatColor() {
    const { r, g, b } = hsvToRgb(this.h, this.s, this.v)
    if (this.format === 'hex') return rgbToHex(r, g, b)
    if (this.format === 'rgb') return this.a < 1 ? `rgba(${r}, ${g}, ${b}, ${this.a})` : `rgb(${r}, ${g}, ${b})`
    // hsl simplified
    return rgbToHex(r, g, b)
  }

  _applyColor() {
    if (!this.el || !this.prop) return
    const colorStr = this.a < 1
      ? `rgba(${hsvToRgb(this.h, this.s, this.v).r}, ${hsvToRgb(this.h, this.s, this.v).g}, ${hsvToRgb(this.h, this.s, this.v).b}, ${this.a})`
      : this._currentColor()
    const result = cssWriteLocal(this.el, this.prop, colorStr)
    emit('pinpoint:style-changed', { el: this.el, prop: this.prop, from: result.from, to: colorStr })
  }

  _close() {
    this._visible = false
    this.style.display = 'none'
    if (this._closeHandler) document.removeEventListener('mousedown', this._closeHandler)
  }
}

function cssWriteLocal(el, prop, value) {
  const from = el.style.getPropertyValue(prop) || getComputedStyle(el).getPropertyValue(prop)
  el.style.setProperty(prop, value)
  return { from, to: value }
}

function makeSheet(css) {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(css)
  return sheet
}

customElements.define('pinpoint-color-popover', ColorPopover)