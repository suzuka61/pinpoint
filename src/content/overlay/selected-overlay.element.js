import { on, off } from '../core/event-bus.js'

const overlayCSS = `:host {
  position: fixed;
  z-index: 2147483646;
  pointer-events: none;
}`

class SelectedOverlay extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [makeSheet(overlayCSS)]
    this.boxes = []
  }

  connectedCallback() {
    on('pinpoint:selected', this._update)
    this.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;'
  }

  disconnectedCallback() {
    off('pinpoint:selected', this._update)
  }

  _update = ({ detail }) => {
    // Clear old boxes
    for (const b of this.boxes) b.remove()
    this.boxes = []

    for (const rect of detail.rects) {
      const box = this.shadowRoot.appendChild(document.createElement('div'))
      const sizeLabel = this.shadowRoot.appendChild(document.createElement('span'))

      box.style.cssText = `
        position:fixed;
        left:${rect.left}px;top:${rect.top}px;
        width:${rect.width}px;height:${rect.height}px;
        border:2px solid rgba(59,130,246,0.9);
        background:rgba(59,130,246,0.08);
        pointer-events:none;
      `
      sizeLabel.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`
      sizeLabel.style.cssText = `
        position:fixed;left:${rect.left}px;top:${rect.top-18}px;
        font-size:11px;color:#fff;background:rgba(59,130,246,0.9);
        padding:1px 6px;border-radius:3px;pointer-events:none;
      `
      this.boxes.push(box, sizeLabel)
    }
  }
}

function makeSheet(css) {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(css)
  return sheet
}

customElements.define('pinpoint-selected', SelectedOverlay)