import { emit } from '../core/event-bus.js'

const MODES = [
  { key: 'design', label: '设计', shortcut: 'D' },
  { key: 'ruler', label: '标尺', shortcut: 'R' },
  { key: 'layout', label: '布局', shortcut: 'L' },
  { key: 'overview', label: '配置列表', shortcut: 'V' },
]

const template = document.createElement('template')
template.innerHTML = `
  <style>
    :host { position: fixed; top: 0; left: 50%; transform: translateX(-50%);
      z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px; user-select: none; }
    .toolbar { display: flex; align-items: center; gap: 2px; background: #1e1e2e;
      border-radius: 0 0 8px 8px; padding: 4px 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.3); color: #cdd6f4; }
    .handle { cursor: grab; padding: 2px 4px; color: #585b70; font-size: 14px; }
    .handle:active { cursor: grabbing; }
    .mode-btn { padding: 4px 10px; border: none; background: transparent; color: #cdd6f4;
      border-radius: 4px; cursor: pointer; font: inherit; }
    .mode-btn:hover { background: #313244; }
    .mode-btn.active { background: #45475a; color: #fff; }
    .more-btn { padding: 4px 6px; border: none; background: transparent; color: #585b70;
      border-radius: 4px; cursor: pointer; font: inherit; }
    .more-btn:hover { background: #313244; }
    .collapsed { width: 32px; height: 32px; border-radius: 50%; background: #1e1e2e;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      font-size: 14px; font-weight: bold; color: #cdd6f4; box-shadow: 0 2px 12px rgba(0,0,0,0.3); }
  </style>
  <div class="toolbar" data-pinpoint-ui>
    <span class="handle" title="拖动 · 双击收起">⋮⋮</span>
  </div>
  <div class="collapsed" style="display:none" data-pinpoint-ui>P</div>
`

class PinpointToolbar extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
    this.toolbar = this.shadowRoot.querySelector('.toolbar')
    this.collapsed = this.shadowRoot.querySelector('.collapsed')
    this.handle = this.shadowRoot.querySelector('.handle')
    this.currentMode = 'design'
  }

  connectedCallback() {
    this._buildModeButtons()
    this._buildMoreButton()
    this._setupDrag()
    this._setupCollapse()
    this._setupKeyboard()
    this.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:2147483647;'
  }

  _buildModeButtons() {
    for (const mode of MODES) {
      const btn = document.createElement('button')
      btn.className = 'mode-btn' + (mode.key === this.currentMode ? ' active' : '')
      btn.textContent = mode.label
      btn.title = mode.shortcut
      btn.dataset.mode = mode.key
      btn.addEventListener('click', () => this._setMode(mode.key))
      this.handle.after(btn)
    }
  }

  _buildMoreButton() {
    const btn = document.createElement('button')
    btn.className = 'more-btn'
    btn.textContent = '···'
    btn.title = '更多'
    this.toolbar.appendChild(btn)
  }

  _setMode(mode) {
    this.currentMode = mode
    this.shadowRoot.querySelectorAll('.mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode)
    })
    if (mode === 'overview') {
      emit('pinpoint:overview-toggle', { open: true })
    } else {
      emit('pinpoint:mode', { mode })
    }
  }

  _setupDrag() {
    let dragging = false, startY, startTop
    this.handle.addEventListener('mousedown', (e) => {
      dragging = true
      startY = e.clientY
      startTop = this.toolbar.getBoundingClientRect().top
      const onMove = (e) => {
        if (!dragging) return
        const newTop = startTop + (e.clientY - startY)
        this.toolbar.style.top = newTop + 'px'
      }
      const onUp = () => {
        dragging = false
        const rect = this.toolbar.getBoundingClientRect()
        if (rect.top < 40) this.toolbar.style.top = '0px'
        if (rect.bottom > window.innerHeight - 40) this.toolbar.style.top = (window.innerHeight - rect.height) + 'px'
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    })
  }

  _setupCollapse() {
    this.handle.addEventListener('dblclick', () => {
      this.toolbar.style.display = 'none'
      this.collapsed.style.display = 'flex'
    })
    this.collapsed.addEventListener('click', () => {
      this.toolbar.style.display = 'flex'
      this.collapsed.style.display = 'none'
    })
  }

  _setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('[data-pinpoint-ui]')) return
      const map = { d: 'design', r: 'ruler', l: 'layout', v: 'overview' }
      const mode = map[e.key.toLowerCase()]
      if (mode) this._setMode(mode)
    })
  }
}

customElements.define('pinpoint-toolbar', PinpointToolbar)
