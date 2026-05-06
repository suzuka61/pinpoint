import { on, off } from '../core/event-bus.js'

const template = document.createElement('template')
template.innerHTML = `
  <style>
    :host { position: fixed; z-index: 2147483646; pointer-events: none; }
    .box { position: absolute; border: 2px dashed #4a90d9; }
    .label { position: absolute; top: -22px; left: 0; font: 11px/1.4 monospace;
      color: #fff; background: #4a90d9; padding: 1px 6px; border-radius: 3px 3px 0 0;
      white-space: nowrap; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
  </style>
  <div class="box"><span class="label"></span></div>
`

class HoverOverlay extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
    this.box = this.shadowRoot.querySelector('.box')
    this.label = this.shadowRoot.querySelector('.label')
  }

  connectedCallback() {
    this._onHover = (e) => this.show(e.detail)
    on('pinpoint:hover', this._onHover)
    this.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;'
  }

  disconnectedCallback() {
    off('pinpoint:hover', this._onHover)
  }

  show({ rect, el }) {
    this.box.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;display:block;`
    const tag = el.localName
    const cls = [...el.classList].filter(c => !c.startsWith('pinpoint-')).join('.')
    this.label.textContent = tag + (cls ? '.' + cls : '')
  }

  hide() {
    this.box.style.display = 'none'
  }
}

customElements.define('pinpoint-hover', HoverOverlay)
