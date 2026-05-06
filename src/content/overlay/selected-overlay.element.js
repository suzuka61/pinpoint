import { on, off } from '../core/event-bus.js'

const template = document.createElement('template')
template.innerHTML = `
  <style>
    :host { position: fixed; z-index: 2147483646; pointer-events: none; }
    .box { position: absolute; border: 2px solid #4a90d9; }
    .label { position: absolute; top: -22px; left: 0; font: 11px/1.4 monospace;
      color: #fff; background: #4a90d9; padding: 1px 6px; border-radius: 3px 3px 0 0;
      white-space: nowrap; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
    .size { position: absolute; bottom: -20px; right: 0; font: 10px/1.4 monospace;
      color: #fff; background: #4a90d9; padding: 1px 6px; border-radius: 0 0 3px 3px;
      white-space: nowrap; }
  </style>
  <div class="box"><span class="label"></span><span class="size"></span></div>
`

class SelectedOverlay extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
    this.box = this.shadowRoot.querySelector('.box')
    this.label = this.shadowRoot.querySelector('.label')
    this.size = this.shadowRoot.querySelector('.size')
  }

  connectedCallback() {
    this._onSelected = (e) => this.show(e.detail)
    on('pinpoint:selected', this._onSelected)
    this.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;'
  }

  disconnectedCallback() {
    off('pinpoint:selected', this._onSelected)
  }

  show({ els, rects }) {
    if (!rects.length) { this.hide(); return }
    const r = rects[0]
    this.box.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;display:block;`
    const el = els[0]
    const tag = el.localName
    const cls = [...el.classList].filter(c => !c.startsWith('pinpoint-')).join('.')
    this.label.textContent = tag + (cls ? '.' + cls : '')
    this.size.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`
  }

  hide() {
    this.box.style.display = 'none'
  }
}

customElements.define('pinpoint-selected-overlay', SelectedOverlay)
