import { on, off } from '../core/event-bus.js'

const overlayCSS = `:host {
  position: fixed;
  z-index: 2147483646;
  pointer-events: none;
}`

class HoverOverlay extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [makeSheet(overlayCSS)]
    this.box = this.shadowRoot.appendChild(document.createElement('div'))
    this.label = this.shadowRoot.appendChild(document.createElement('span'))
  }

  connectedCallback() {
    on('pinpoint:hover', this._update)
    this.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;'
  }

  disconnectedCallback() {
    off('pinpoint:hover', this._update)
  }

  _update = ({ detail }) => {
    const { rect, el } = detail
    this.box.style.cssText = `
      position:fixed;
      left:${rect.left}px;top:${rect.top}px;
      width:${rect.width}px;height:${rect.height}px;
      border:1px dashed rgba(59,130,246,0.6);
      pointer-events:none;
    `
    this.label.textContent = el.localName + (el.id ? '#'+el.id : el.className ? '.'+el.className.split(' ')[0] : '')
    this.label.style.cssText = `
      position:fixed;left:${rect.left}px;top:${rect.top-18}px;
      font-size:11px;color:#fff;background:rgba(59,130,246,0.85);
      padding:1px 6px;border-radius:3px;pointer-events:none;
      white-space:nowrap;
    `
  }
}

function makeSheet(css) {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(css)
  return sheet
}

customElements.define('pinpoint-hover', HoverOverlay)