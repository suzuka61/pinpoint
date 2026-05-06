import { on, off, emit } from '../core/event-bus.js'
import { cssReset } from '../services/css-write.js'

class PinpointOverview extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._records = new Map()
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { position: fixed; top: 40px; right: 0; bottom: 0; width: 300px;
          z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; display: none; }
        .panel { background: #1e1e2e; height: 100%; display: flex; flex-direction: column;
          box-shadow: -2px 0 12px rgba(0,0,0,0.3); color: #cdd6f4; }
        .tabs { display: flex; border-bottom: 1px solid #313244; }
        .tab { flex: 1; padding: 8px; text-align: center; border: none; background: transparent;
          color: #cdd6f4; cursor: pointer; font: inherit; }
        .tab.active { background: #313244; color: #fff; }
        .list { flex: 1; overflow-y: auto; padding: 4px; }
        .record { padding: 8px; border-bottom: 1px solid #313244; }
        .record-label { font-weight: bold; margin-bottom: 4px; }
        .record-summary { color: #a6adc8; font-size: 11px; margin-bottom: 4px; }
        .record-actions { display: flex; gap: 4px; }
        .record-actions button { padding: 2px 6px; border: none; background: #313244;
          color: #cdd6f4; border-radius: 3px; cursor: pointer; font: inherit; }
        .footer { padding: 8px; border-top: 1px solid #313244; display: flex; gap: 4px; }
        .footer button { flex: 1; padding: 6px; border: none; background: #313244;
          color: #cdd6f4; border-radius: 4px; cursor: pointer; font: inherit; }
      </style>
      <div class="panel" data-pinpoint-ui>
        <div class="tabs">
          <button class="tab active">全部 <span class="count">0</span></button>
        </div>
        <div class="list"></div>
        <div class="footer">
          <button class="copy-all">复制 Prompt</button>
          <button class="export-json">导出 JSON</button>
          <button class="import-json">导入 JSON</button>
        </div>
      </div>
    `
    this.list = this.shadowRoot.querySelector('.list')
    this.countEl = this.shadowRoot.querySelector('.count')

    this.shadowRoot.querySelector('.copy-all').addEventListener('click', () => this._copyAllPrompt())
    this.shadowRoot.querySelector('.export-json').addEventListener('click', () => this._exportJSON())
    this.shadowRoot.querySelector('.import-json').addEventListener('click', () => this._importJSON())

    this._onStyleChanged = (e) => this._addRecord(e.detail)
    this._onReset = (e) => this._resetRecord(e.detail)
    on('pinpoint:style-changed', this._onStyleChanged)
    on('pinpoint:style-reset', this._onReset)
  }

  disconnectedCallback() {
    off('pinpoint:style-changed', this._onStyleChanged)
    off('pinpoint:style-reset', this._onReset)
  }

  _addRecord({ el, prop, from, to }) {
    const selector = this._getSelector(el)
    const id = this._hashId(selector)
    if (!this._records.has(id)) {
      this._records.set(id, { id, selector, label: this._getLabel(el), el, styleChanges: {} })
    }
    this._records.get(id).styleChanges[prop] = { from, to }
    this._render()
  }

  _resetRecord({ el }) {
    const selector = this._getSelector(el)
    const id = this._hashId(selector)
    const rec = this._records.get(id)
    if (rec) {
      cssReset(el, rec.styleChanges)
      this._records.delete(id)
      this._render()
    }
  }

  _render() {
    this.list.innerHTML = ''
    this.countEl.textContent = this._records.size
    for (const rec of this._records.values()) {
      const div = document.createElement('div')
      div.className = 'record'
      const changes = Object.entries(rec.styleChanges).map(([p, { from, to }]) => `${p}: ${from} → ${to}`).join(', ')
      div.innerHTML = `
        <div class="record-label">${rec.label}</div>
        <div class="record-summary">${changes}</div>
        <div class="record-actions">
          <button data-action="locate">定位</button>
          <button data-action="reset">重置</button>
          <button data-action="copy">复制P</button>
        </div>
      `
      div.querySelector('[data-action="locate"]').addEventListener('click', () => {
        rec.el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const rect = rec.el.getBoundingClientRect()
        emit('pinpoint:selected', { els: [rec.el], rects: [rect] })
      })
      div.querySelector('[data-action="reset"]').addEventListener('click', () => {
        emit('pinpoint:style-reset', { el: rec.el })
      })
      div.querySelector('[data-action="copy"]').addEventListener('click', () => {
        navigator.clipboard.writeText(this._formatSinglePrompt(rec))
      })
      this.list.appendChild(div)
    }
  }

  _formatSinglePrompt(rec) {
    let out = `- 选择器: \`${rec.selector}\`\n- 标签: ${rec.label}\n- 修改项:\n`
    let i = 1
    for (const [prop, { from, to }] of Object.entries(rec.styleChanges)) {
      out += `  ${i++}. ${prop}: ${from} → ${to}\n`
    }
    return out
  }

  _copyAllPrompt() {
    let out = '## Pinpoint 页面修改指令\n\n'
    let n = 1
    for (const rec of this._records.values()) {
      out += `### 元素 ${n++}\n${this._formatSinglePrompt(rec)}\n`
    }
    out += '请根据以上修改指令更新对应元素的 CSS 和 HTML 属性。'
    navigator.clipboard.writeText(out)
  }

  _exportJSON() {
    const data = {
      version: 1,
      url: location.href,
      timestamp: new Date().toISOString(),
      records: [...this._records.values()].map(r => ({
        id: r.id, selector: r.selector, label: r.label, styleChanges: r.styleChanges,
        frame: (() => { const rect = r.el.getBoundingClientRect(); return { x: rect.left, y: rect.top, w: rect.width, h: rect.height } })(),
      })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'pinpoint-export.json'; a.click()
    URL.revokeObjectURL(url)
  }

  _importJSON() {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = () => {
      const reader = new FileReader()
      reader.onload = () => {
        const data = JSON.parse(reader.result)
        for (const rec of data.records) {
          const el = document.querySelector(rec.selector)
          if (!el) continue
          for (const [prop, { to }] of Object.entries(rec.styleChanges)) {
            el.style.setProperty(prop, to)
            emit('pinpoint:style-changed', { el, prop, from: rec.styleChanges[prop].from, to })
          }
        }
      }
      reader.readAsText(input.files[0])
    }
    input.click()
  }

  _getSelector(el) {
    if (el.id) return `#${CSS.escape(el.id)}`
    const parts = []
    let cur = el
    while (cur && cur !== document.body) {
      let seg = cur.localName
      if (cur.id) { parts.unshift(`#${CSS.escape(cur.id)}`); break }
      const cls = [...cur.classList].filter(c => !c.startsWith('pinpoint-')).join('.')
      if (cls) seg += '.' + cls
      parts.unshift(seg)
      cur = cur.parentElement
    }
    return parts.join(' > ')
  }

  _getLabel(el) {
    const tag = el.localName
    const cls = [...el.classList].filter(c => !c.startsWith('pinpoint-')).join('.')
    return tag + (cls ? '.' + cls : '')
  }

  _hashId(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
    return Math.abs(hash).toString(36)
  }
}

customElements.define('pinpoint-overview', PinpointOverview)
