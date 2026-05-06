import { on, off, emit } from '../core/event-bus.js'
import { buildEditorContent } from './editor.js'
import { createCodeTab } from './code-tab.js'
import { placeNear } from '../services/placement.js'

class PinpointEditor extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._pinned = false
    this._pinSide = 'right'
    this._currentEl = null
    this._styleChanges = {}
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { position: fixed; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; }
        .editor { background: #1e1e2e; border-radius: 8px; width: 260px; max-height: 70vh;
          overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.4); color: #cdd6f4; display: none; }
        .header { display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #313244; position: sticky; top: 0; background: #1e1e2e; z-index: 1; }
        .tab-btn { padding: 4px 10px; border: none; background: transparent; color: #cdd6f4;
          border-radius: 4px; cursor: pointer; font: inherit; }
        .tab-btn.active { background: #45475a; color: #fff; }
        .pin-btn { margin-left: auto; padding: 4px; border: none; background: transparent;
          color: #585b70; cursor: pointer; font: inherit; }
        .pin-btn.pinned { color: #89b4fa; }
        .content { padding: 8px; display: flex; flex-direction: column; gap: 8px; }
        .field-group { border-top: 1px solid #313244; padding-top: 6px; }
        .group-label { font-size: 10px; color: #585b70; text-transform: uppercase; margin-bottom: 4px; }
        .field-row { display: flex; align-items: center; gap: 4px; padding: 2px 0; }
        .field-row label { width: 50px; color: #a6adc8; font-size: 11px; flex-shrink: 0; }
        .field-row input { flex: 1; background: #313244; border: none; color: #cdd6f4;
          padding: 2px 6px; border-radius: 3px; font: inherit; min-width: 0; }
        .drag-handle { cursor: ew-resize; color: #585b70; font-size: 10px; }
        .color-swatch { width: 16px; height: 16px; border-radius: 3px; border: 1px solid #585b70; cursor: pointer; flex-shrink: 0; }
        .img-btn { padding: 4px 8px; background: #313244; border: none; color: #cdd6f4;
          border-radius: 4px; cursor: pointer; font: inherit; }
        .img-name { color: #a6adc8; font-size: 11px; margin-left: 4px; }
      </style>
      <div class="editor" data-pinpoint-ui>
        <div class="header">
          <button class="tab-btn active" data-tab="style">样式</button>
          <button class="tab-btn" data-tab="code">代码</button>
          <button class="pin-btn" title="固定编辑器">📌</button>
        </div>
        <div class="content"></div>
      </div>
    `
    this.editor = this.shadowRoot.querySelector('.editor')
    this.content = this.shadowRoot.querySelector('.content')
    this.pinBtn = this.shadowRoot.querySelector('.pin-btn')
    this._setupTabs()
    this._setupPin()
    this._onSelected = (e) => this.showFor(e.detail.els[0], e.detail.rects[0])
    on('pinpoint:selected', this._onSelected)
    this.editor.addEventListener('mousedown', (e) => e.stopPropagation())
  }

  disconnectedCallback() {
    off('pinpoint:selected', this._onSelected)
  }

  _setupTabs() {
    const btns = this.shadowRoot.querySelectorAll('.tab-btn')
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        this._showTab(btn.dataset.tab)
      })
    })
  }

  _setupPin() {
    this.pinBtn.addEventListener('click', () => {
      this._pinned = !this._pinned
      this.pinBtn.classList.toggle('pinned', this._pinned)
      emit('pinpoint:editor-pin', { pinned: this._pinned, side: this._pinSide })
      if (this._pinned) this._applyPinPosition()
    })
  }

  _applyPinPosition() {
    if (this._pinSide === 'right') {
      this.editor.style.cssText += ';position:fixed;top:40px;right:0;bottom:0;border-radius:0;display:block;'
    } else {
      this.editor.style.cssText += ';position:fixed;top:40px;left:0;bottom:0;border-radius:0;display:block;'
    }
  }

  showFor(el, rect) {
    this._currentEl = el
    this._styleChanges = {}
    this.content.innerHTML = ''
    this._showTab('style')
    this.editor.style.display = 'block'
    if (!this._pinned) {
      const pos = placeNear(rect, 260, 400)
      this.style.left = pos.x + 'px'
      this.style.top = pos.y + 'px'
    }
  }

  _showTab(tab) {
    this.content.innerHTML = ''
    if (tab === 'style' && this._currentEl) {
      buildEditorContent(this._currentEl, this.content, (prop, val, allowGradient) => {
        this._openColorPopover(prop, val, allowGradient)
      })
    } else if (tab === 'code' && this._currentEl) {
      const codeTab = createCodeTab(this._styleChanges)
      this.content.appendChild(codeTab)
    }
  }

  _openColorPopover(prop, val, allowGradient) {
    let popover = document.querySelector('pinpoint-color-popover')
    if (!popover) {
      popover = document.createElement('pinpoint-color-popover')
      document.body.appendChild(popover)
    }
    const rect = this.editor.getBoundingClientRect()
    popover.open(rect, val, allowGradient, (data) => {
      if (data.mode === 'solid') {
        const prev = this._currentEl.style.getPropertyValue(prop) || ''
        this._currentEl.style.setProperty(prop, data.hex)
        emit('pinpoint:style-changed', { el: this._currentEl, prop, from: prev, to: data.hex })
      } else {
        const gradStr = `linear-gradient(${data.angle}deg, ${data.stops.map(s => `${s.hex} ${s.position}%`).join(', ')})`
        const prev = this._currentEl.style.getPropertyValue(prop) || ''
        this._currentEl.style.setProperty(prop, gradStr)
        emit('pinpoint:style-changed', { el: this._currentEl, prop, from: prev, to: gradStr })
      }
    })
  }

  hide() {
    this.editor.style.display = 'none'
  }
}

customElements.define('pinpoint-editor', PinpointEditor)
