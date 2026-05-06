import { hsvToHex, hexToHsv, hexToRgb } from './color-engine.js'
import { createSVPanel } from './sv-panel.js'
import { createHueSlider } from './hue-slider.js'
import { createAlphaSlider } from './alpha-slider.js'
import { createGradientEditor } from './gradient-editor.js'

class ColorPopover extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._hsv = { h: 0, s: 0, v: 100 }
    this._opacity = 100
    this._format = 'hex'
    this._allowGradient = false
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { position: fixed; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; }
        .popover { background: #1e1e2e; border-radius: 8px; padding: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          color: #cdd6f4; display: flex; flex-direction: column; gap: 8px; }
        .format-toggle { display: flex; gap: 4px; }
        .format-toggle button { padding: 2px 8px; border: none; background: #313244; color: #cdd6f4;
          border-radius: 3px; cursor: pointer; font: inherit; }
        .format-toggle button.active { background: #45475a; color: #fff; }
        .hex-input { background: #313244; border: none; color: #cdd6f4; padding: 4px 8px;
          border-radius: 4px; font: inherit; width: 100%; box-sizing: border-box; }
      </style>
      <div class="popover" data-pinpoint-ui></div>
    `
    this.popover = this.shadowRoot.querySelector('.popover')
  }

  open(anchorRect, initialColor, allowGradient, onChange) {
    this._allowGradient = allowGradient
    this._onChange = onChange
    if (initialColor && initialColor.startsWith('#') && initialColor.length >= 4) {
      this._hsv = hexToHsv(initialColor)
    }
    this._build()
    this._position(anchorRect)
  }

  _build() {
    this.popover.innerHTML = ''

    this._svPanel = createSVPanel(({ s, v }) => {
      this._hsv.s = s; this._hsv.v = v
      this._emitColor()
    })
    this._hueSlider = createHueSlider((h) => {
      this._hsv.h = h
      this._svPanel.setHue(h)
      this._emitColor()
    })
    this._alphaSlider = createAlphaSlider((opacity) => {
      this._opacity = opacity
      this._emitColor()
    })

    const formatRow = document.createElement('div')
    formatRow.className = 'format-toggle'
    for (const fmt of ['hex', 'rgb', 'hsl']) {
      const btn = document.createElement('button')
      btn.textContent = fmt.toUpperCase()
      btn.className = fmt === this._format ? 'active' : ''
      btn.addEventListener('click', () => {
        this._format = fmt
        formatRow.querySelectorAll('button').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        this._updateHexInput()
      })
      formatRow.appendChild(btn)
    }

    this._hexInput = document.createElement('input')
    this._hexInput.className = 'hex-input'
    this._hexInput.setAttribute('data-pinpoint-ui', '')
    this._hexInput.addEventListener('change', () => {
      const hex = this._hexInput.value
      if (hex.startsWith('#')) {
        this._hsv = hexToHsv(hex)
        this._svPanel.setHue(this._hsv.h)
        this._emitColor()
      }
    })

    this.popover.append(this._svPanel, this._hueSlider, this._alphaSlider, formatRow, this._hexInput)

    if (this._allowGradient) {
      const modeRow = document.createElement('div')
      modeRow.className = 'format-toggle'
      const solidBtn = document.createElement('button')
      solidBtn.textContent = '实色'
      solidBtn.className = 'active'
      const gradBtn = document.createElement('button')
      gradBtn.textContent = '渐变'
      let gradientEditor
      gradBtn.addEventListener('click', () => {
        solidBtn.classList.remove('active')
        gradBtn.classList.add('active')
        if (!gradientEditor) {
          gradientEditor = createGradientEditor((data) => this._onChange(data))
          this.popover.appendChild(gradientEditor)
        }
        gradientEditor.style.display = ''
      })
      solidBtn.addEventListener('click', () => {
        gradBtn.classList.remove('active')
        solidBtn.classList.add('active')
        if (gradientEditor) gradientEditor.style.display = 'none'
        this._emitColor()
      })
      modeRow.append(solidBtn, gradBtn)
      this.popover.insertBefore(modeRow, this._svPanel)
    }

    this._svPanel.setHue(this._hsv.h)
    this._updateHexInput()
  }

  _emitColor() {
    const hex = hsvToHex(this._hsv.h, this._hsv.s, this._hsv.v)
    this._alphaSlider.setColor(hex)
    this._updateHexInput()
    this._onChange({ mode: 'solid', hex, opacity: this._opacity })
  }

  _updateHexInput() {
    const hex = hsvToHex(this._hsv.h, this._hsv.s, this._hsv.v)
    if (this._format === 'hex') {
      this._hexInput.value = hex
    } else if (this._format === 'rgb') {
      const { r, g, b } = hexToRgb(hex)
      this._hexInput.value = `rgb(${r}, ${g}, ${b})`
    } else {
      this._hexInput.value = `hsl(${this._hsv.h}, ${this._hsv.s}%, ${this._hsv.v}%)`
    }
  }

  _position(anchorRect) {
    const w = 224, h = 320
    let x = anchorRect.right + 8
    let y = anchorRect.top
    if (x + w > window.innerWidth) x = anchorRect.left - w - 8
    if (y + h > window.innerHeight) y = window.innerHeight - h - 8
    if (x < 0) x = 8
    if (y < 0) y = 8
    this.style.left = x + 'px'
    this.style.top = y + 'px'
  }

  close() {
    this.popover.innerHTML = ''
  }
}

customElements.define('pinpoint-color-popover', ColorPopover)
