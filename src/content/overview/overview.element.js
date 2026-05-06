import { on, off, emit } from '../core/event-bus.js'
import { cssReset } from '../services/css-write.js'

const overviewCSS = `:host {
  position: fixed;
  top: 0;
  right: 0;
  width: 320px;
  height: 100vh;
  z-index: 2147483647;
  background: #0f172a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #1e293b;
  box-shadow: -4px 0 12px rgba(0,0,0,0.3);
}

.tabs {
  display: flex;
  border-bottom: 1px solid #1e293b;
}

.tab {
  flex: 1;
  padding: 10px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  cursor: pointer;
  background: transparent;
  border: none;
}

.tab.active {
  color: #3b82f6;
  border-bottom: 2px solid #3b82f6;
}

.records {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.record {
  background: #1e293b;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 6px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.record-label {
  font-size: 12px;
  font-weight: 600;
}

.record-selector {
  font-size: 10px;
  color: #64748b;
  margin-bottom: 4px;
}

.record-summary {
  font-size: 11px;
  color: #94a3b8;
}

.record-actions {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}

.record-actions button {
  padding: 3px 8px;
  border-radius: 3px;
  background: #334155;
  color: #94a3b8;
  border: none;
  cursor: pointer;
  font-size: 10px;
}

.record-actions button:hover {
  background: #475569;
}

.footer {
  padding: 10px;
  border-top: 1px solid #1e293b;
  display: flex;
  gap: 6px;
}

.footer button {
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  background: #3b82f6;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 12px;
}

.footer button.secondary {
  background: #334155;
  color: #e2e8f0;
}

.empty {
  text-align: center;
  color: #64748b;
  padding: 40px 20px;
  font-size: 13px;
}`

class PinpointOverview extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [makeSheet(overviewCSS)]
    this.setAttribute('data-pinpoint-ui', '')
    this.records = new Map()
    this.tab = 'all'
    this._visible = false
  }

  connectedCallback() {
    on('pinpoint:style-changed', this._onStyleChanged)
    on('pinpoint:overview-toggle', this._onToggle)
    on('pinpoint:style-reset', this._onReset)
    this.style.display = 'none'
    // Prevent selection engine from picking our elements
    this.shadowRoot.addEventListener('mousedown', (e) => e.stopPropagation())
  }

  disconnectedCallback() {
    off('pinpoint:style-changed', this._onStyleChanged)
    off('pinpoint:overview-toggle', this._onToggle)
    off('pinpoint:style-reset', this._onReset)
  }

  _onStyleChanged = ({ detail }) => {
    const { el, prop, from, to } = detail
    const selector = generateSelector(el)
    const id = hashId(selector)
    if (!this.records.has(id)) {
      this.records.set(id, {
        id, selector,
        label: el.localName + (el.id ? '#' + el.id : el.className ? '.' + el.className.split(' ')[0] : ''),
        text: el.textContent?.trim().slice(0, 60) || '',
        frame: getFrame(el),
        styleChanges: {},
        el
      })
    }
    const rec = this.records.get(id)
    rec.styleChanges[prop] = { from, to }
    rec.frame = getFrame(el)
    this._render()
  }

  _onReset = ({ detail }) => {
    const { id } = detail
    const rec = this.records.get(id)
    if (rec) {
      cssReset(rec.el, rec.styleChanges)
      this.records.delete(id)
      this._render()
    }
  }

  _onToggle = ({ detail }) => {
    this._visible = detail.open
    this.style.display = this._visible ? '' : 'none'
    if (this._visible) this._render()
  }

  _render() {
    const s = this.shadowRoot
    s.innerHTML = ''

    // Tabs
    const tabs = s.appendChild(document.createElement('div'))
    tabs.className = 'tabs'
    for (const t of ['全部', '配置']) {
      const btn = tabs.appendChild(document.createElement('button'))
      btn.className = 'tab' + (t === this.tab ? ' active' : '')
      btn.textContent = t + (t === '全部' ? ` (${this.records.size})` : '')
      btn.onclick = () => { this.tab = t === '全部' ? 'all' : 'config'; this._render() }
    }

    // Records
    const list = s.appendChild(document.createElement('div'))
    list.className = 'records'

    if (this.records.size === 0) {
      list.innerHTML = '<div class="empty">暂无修改记录</div>'
    } else {
      for (const [id, rec] of this.records) {
        const card = list.appendChild(document.createElement('div'))
        card.className = 'record'

        const header = card.appendChild(document.createElement('div'))
        header.className = 'record-header'
        const label = header.appendChild(document.createElement('span'))
        label.className = 'record-label'
        label.textContent = rec.label

        const sel = card.appendChild(document.createElement('div'))
        sel.className = 'record-selector'
        sel.textContent = rec.selector

        const summary = card.appendChild(document.createElement('div'))
        summary.className = 'record-summary'
        summary.textContent = Object.keys(rec.styleChanges).map(p => `${p}`).join(', ')

        const actions = card.appendChild(document.createElement('div'))
        actions.className = 'record-actions'

        const locateBtn = actions.appendChild(document.createElement('button'))
        locateBtn.textContent = '定位'
        locateBtn.onclick = () => {
          rec.el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          emit('pinpoint:selected', { els: [rec.el], rects: [rec.el.getBoundingClientRect()] })
        }

        const resetBtn = actions.appendChild(document.createElement('button'))
        resetBtn.textContent = '重置'
        resetBtn.onclick = () => emit('pinpoint:style-reset', { id })

        const copyBtn = actions.appendChild(document.createElement('button'))
        copyBtn.textContent = '复制P'
        copyBtn.onclick = () => this._copySinglePrompt(rec)
      }
    }

    // Footer
    const footer = s.appendChild(document.createElement('div'))
    footer.className = 'footer'

    const copyAllBtn = footer.appendChild(document.createElement('button'))
    copyAllBtn.textContent = '复制整页Prompt'
    copyAllBtn.onclick = () => this._copyAllPrompt()

    const exportBtn = footer.appendChild(document.createElement('button'))
    exportBtn.className = 'secondary'
    exportBtn.textContent = '导出JSON'
    exportBtn.onclick = () => this._exportJSON()

    const importBtn = footer.appendChild(document.createElement('button'))
    importBtn.className = 'secondary'
    importBtn.textContent = '导入JSON'
    importBtn.onclick = () => this._importJSON()
  }

  _copySinglePrompt(rec) {
    let text = `### ${rec.label}\n- 选择器: \`${rec.selector}\`\n- 修改项:\n`
    for (const [prop, { from, to }] of Object.entries(rec.styleChanges)) {
      text += `  1. ${prop}: ${from} → ${to}\n`
    }
    navigator.clipboard.writeText(text)
  }

  _copyAllPrompt() {
    let text = '## Pinpoint 页面修改指令\n\n'
    let i = 1
    for (const [, rec] of this.records) {
      text += `### 元素 ${i}\n- 选择器: \`${rec.selector}\`\n- 标签: ${rec.label}\n`
      if (rec.text) text += `- 文本内容: "${rec.text}"\n`
      text += '- 修改项:\n'
      let j = 1
      for (const [prop, { from, to }] of Object.entries(rec.styleChanges)) {
        text += `  ${j}. ${prop}: ${from} → ${to}\n`
        j++
      }
      text += '\n'
      i++
    }
    text += '请根据以上修改指令更新对应元素的 CSS 和 HTML 属性。'
    navigator.clipboard.writeText(text)
  }

  _exportJSON() {
    const data = {
      version: 1,
      url: location.href,
      timestamp: new Date().toISOString(),
      records: [...this.records.values()].map(r => ({
        id: r.id, selector: r.selector, label: r.label, text: r.text,
        frame: r.frame, styleChanges: r.styleChanges
      }))
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'pinpoint-export.json'
    a.click()
  }

  _importJSON() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const text = await input.files[0].text()
      const data = JSON.parse(text)
      for (const rec of data.records) {
        const el = document.querySelector(rec.selector)
        if (!el) continue
        for (const [prop, { to }] of Object.entries(rec.styleChanges)) {
          el.style.setProperty(prop, to)
        }
      }
    }
    input.click()
  }
}

function generateSelector(el) {
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

function hashId(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
}

function getFrame(el) {
  const r = el.getBoundingClientRect()
  return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }
}

function makeSheet(css) {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(css)
  return sheet
}

customElements.define('pinpoint-overview', PinpointOverview)