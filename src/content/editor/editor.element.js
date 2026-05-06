import { on, off, emit } from '../core/event-bus.js'
import { readStyles } from '../services/style-read.js'
import { cssWrite } from '../services/css-write.js'

const editorCSS = `:host {
  position: fixed;
  z-index: 2147483647;
  background: #1e293b;
  border-radius: 10px;
  width: 280px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #e2e8f0;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #0f172a;
  border-bottom: 1px solid #334155;
}

.tab-btn {
  padding: 4px 12px;
  border-radius: 4px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
  border: none;
}

.tab-btn.active {
  background: #3b82f6;
  color: #fff;
}

.pin-btn {
  background: transparent;
  color: #94a3b8;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.pin-btn.pinned {
  color: #3b82f6;
}

.body {
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.group {
  margin-bottom: 12px;
}

.group-title {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 6px;
  font-weight: 600;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.field-label {
  font-size: 11px;
  color: #94a3b8;
  min-width: 60px;
}

.field-input {
  width: 100%;
  padding: 4px 8px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 12px;
  outline: none;
}

.field-input:focus {
  border-color: #3b82f6;
}

.color-trigger {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #475569;
  cursor: pointer;
}

.no-element {
  text-align: center;
  color: #64748b;
  padding: 24px;
  font-size: 13px;
}`

class PinpointEditor extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [makeSheet(editorCSS)]
    this.setAttribute('data-pinpoint-ui', '')
    this.el = null
    this.styles = null
    this.tab = 'style'
    this.pinned = false
    this.pinSide = 'right'
  }

  connectedCallback() {
    on('pinpoint:selected', this._onSelected)
    this._renderEmpty()
    // Prevent losing focus
    this.shadowRoot.addEventListener('mousedown', (e) => e.stopPropagation())
  }

  disconnectedCallback() {
    off('pinpoint:selected', this._onSelected)
  }

  _onSelected = ({ detail }) => {
    this.el = detail.els[0]
    this.styles = readStyles(this.el)
    this._renderEditor()
    this._position()
  }

  _position() {
    if (this.pinned) return
    const rect = this.el.getBoundingClientRect()
    const w = 280, h = 420
    let x = rect.right + 8
    let y = rect.top
    if (x + w > window.innerWidth) x = rect.left - w - 8
    if (y + h > window.innerHeight) y = Math.max(8, window.innerHeight - h - 8)
    if (x < 8) x = 8
    this.style.left = x + 'px'
    this.style.top = y + 'px'
  }

  _renderEmpty() {
    this.shadowRoot.innerHTML = '<div class="no-element">点击页面元素开始编辑</div>'
  }

  _renderEditor() {
    const s = this.shadowRoot
    s.innerHTML = ''

    // Header with tabs + pin
    const header = s.appendChild(document.createElement('div'))
    header.className = 'header'

    const styleTab = header.appendChild(document.createElement('button'))
    styleTab.className = 'tab-btn' + (this.tab === 'style' ? ' active' : '')
    styleTab.textContent = '样式'
    styleTab.onclick = () => { this.tab = 'style'; this._renderEditor() }

    const codeTab = header.appendChild(document.createElement('button'))
    codeTab.className = 'tab-btn' + (this.tab === 'code' ? ' active' : '')
    codeTab.textContent = '代码'
    codeTab.onclick = () => { this.tab = 'code'; this._renderEditor() }

    const pinBtn = header.appendChild(document.createElement('button'))
    pinBtn.className = 'pin-btn' + (this.pinned ? ' pinned' : '')
    pinBtn.textContent = '📌'
    pinBtn.onclick = () => this._togglePin()

    const body = s.appendChild(document.createElement('div'))
    body.className = 'body'

    if (this.tab === 'code') {
      this._renderCodeTab(body)
    } else {
      this._renderStyleTab(body)
    }
  }

  _renderStyleTab(body) {
    const st = this.styles

    // Text group
    const textGroup = body.appendChild(document.createElement('div'))
    textGroup.className = 'group'
    textGroup.innerHTML = '<div class="group-title">文本</div>'
    this._addField(textGroup, '内容', '_textContent', st._textContent, 'text')
    this._addField(textGroup, '颜色', 'color', st.color, 'color')
    this._addField(textGroup, '字号', 'font-size', st['font-size'], 'dimension')

    // Dimension group
    const dimGroup = body.appendChild(document.createElement('div'))
    dimGroup.className = 'group'
    dimGroup.innerHTML = '<div class="group-title">尺寸</div>'
    this._addField(dimGroup, '宽', 'width', st.width, 'dimension')
    this._addField(dimGroup, '高', 'height', st.height, 'dimension')

    // Spacing group
    const spGroup = body.appendChild(document.createElement('div'))
    spGroup.className = 'group'
    spGroup.innerHTML = '<div class="group-title">间距</div>'
    this._addField(spGroup, 'Padding', 'padding', st.padding, 'dimension')

    // Typography group
    const tpGroup = body.appendChild(document.createElement('div'))
    tpGroup.className = 'group'
    tpGroup.innerHTML = '<div class="group-title">字体</div>'
    this._addField(tpGroup, '字重', 'font-weight', st['font-weight'], 'dimension')
    this._addField(tpGroup, '行高', 'line-height', st['line-height'], 'dimension')

    // Appearance group
    const apGroup = body.appendChild(document.createElement('div'))
    apGroup.className = 'group'
    apGroup.innerHTML = '<div class="group-title">外观</div>'
    this._addField(apGroup, '圆角', 'border-radius', st['border-radius'], 'dimension')
    this._addField(apGroup, '填充', 'background-color', st['background-color'], 'color')
    this._addField(apGroup, '描边', 'border', st.border, 'dimension')
    this._addField(apGroup, '投影', 'box-shadow', st['box-shadow'], 'dimension')

    // Image group (only for img elements)
    if (this.el?.localName === 'img') {
      const imgGroup = body.appendChild(document.createElement('div'))
      imgGroup.className = 'group'
      imgGroup.innerHTML = '<div class="group-title">图片</div>'
      const fileRow = imgGroup.appendChild(document.createElement('div'))
      fileRow.className = 'field-row'
      const fileBtn = fileRow.appendChild(document.createElement('button'))
      fileBtn.className = 'mode-btn'
      fileBtn.textContent = '替换图片'
      fileBtn.style.cssText = 'padding:6px 12px;border-radius:4px;background:#3b82f6;color:#fff;border:none;cursor:pointer;font-size:12px;'
      fileBtn.onclick = () => this._pickImage()
    }
  }

  _renderCodeTab(body) {
    if (!this.el) return
    const text = document.createElement('textarea')
    text.className = 'field-input'
    text.style.cssText = 'width:100%;height:200px;resize:vertical;font-size:11px;'
    // Collect all modified styles
    const styleText = []
    for (const prop of this.el.style) {
      const val = this.el.style.getPropertyValue(prop)
      styleText.push(`${prop}: ${val}`)
    }
    text.value = styleText.join('\n') || '暂无修改'
    text.addEventListener('input', () => {
      // Parse and apply
      for (const line of text.value.split('\n')) {
        const [prop, ...rest] = line.split(':')
        if (prop && rest.length) {
          this.el.style.setProperty(prop.trim(), rest.join(':').trim())
        }
      }
    })
    body.appendChild(text)
  }

  _addField(group, label, prop, value, type) {
    const row = group.appendChild(document.createElement('div'))
    row.className = 'field-row'

    const lbl = row.appendChild(document.createElement('span'))
    lbl.className = 'field-label'
    lbl.textContent = label

    if (type === 'color') {
      const trigger = row.appendChild(document.createElement('div'))
      trigger.className = 'color-trigger'
      trigger.style.background = value || 'transparent'
      trigger.onclick = () => this._openColorPicker(prop, value, trigger)
    } else {
      const input = row.appendChild(document.createElement('input'))
      input.className = 'field-input'
      input.value = value || ''
      input.type = prop === '_textContent' ? 'text' : 'text'
      input.addEventListener('change', () => {
        if (prop === '_textContent') {
          this.el.textContent = input.value
        } else {
          const result = cssWrite(this.el, prop, input.value)
          emit('pinpoint:style-changed', { el: this.el, prop: result.prop, from: result.from, to: result.to })
        }
      })
      // Drag to adjust number values
      if (type === 'dimension') {
        this._makeDragAdjustable(input, prop)
      }
    }
  }

  _makeDragAdjustable(input, prop) {
    let startX, startVal
    input.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return
      startX = e.clientX
      startVal = parseFloat(input.value) || 0
      const onMove = (e) => {
        const dx = e.clientX - startX
        const step = e.shiftKey ? 10 : 1
        const newVal = startVal + dx * step * 0.5
        input.value = newVal + (input.value.match(/[a-z%]+/)?.[0] || 'px')
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        input.dispatchEvent(new Event('change'))
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    })
  }

  _openColorPicker(prop, currentColor, trigger) {
    emit('pinpoint:color-request', { prop, currentColor, el: this.el, trigger })
  }

  _togglePin() {
    this.pinned = !this.pinned
    if (this.pinned) {
      this.pinSide = 'right'
      this.style.left = (window.innerWidth - 288) + 'px'
      this.style.top = '8px'
      this.style.height = 'calc(100vh - 16px)'
    } else {
      this.style.height = ''
      this._position()
    }
    emit('pinpoint:editor-pin', { pinned: this.pinned, side: this.pinSide })
    this._renderEditor()
  }

  _pickImage() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      this.el.src = url
      emit('pinpoint:style-changed', {
        el: this.el, prop: 'imageReplace', from: this.el._originalSrc, to: file.name
      })
      this.el._pinpointImageFile = file
    }
    input.click()
  }
}

function makeSheet(css) {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(css)
  return sheet
}

customElements.define('pinpoint-editor', PinpointEditor)