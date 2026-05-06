import { emit, on } from '../core/event-bus.js'

const toolbarCSS = `:host {
  position: fixed;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  background: #1e293b;
  border-radius: 8px;
  padding: 4px;
  gap: 2px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.handle {
  cursor: grab;
  padding: 4px 8px;
  color: #94a3b8;
  font-size: 14px;
  letter-spacing: 2px;
}

.mode-btn {
  padding: 6px 10px;
  border-radius: 4px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
  border: none;
  outline: none;
}

.mode-btn.active {
  background: #3b82f6;
  color: #fff;
}

.mode-btn:hover:not(.active) {
  background: rgba(255,255,255,0.1);
}`

const MODES = [
  { key: 'D', label: '设计', name: 'design' },
  { key: 'R', label: '标尺', name: 'ruler' },
  { key: 'L', label: '布局', name: 'layout' },
  { key: 'V', label: '列表', name: 'overview' },
]

class PinpointToolbar extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [makeSheet(toolbarCSS)]
    this.setAttribute('data-pinpoint-ui', '')
    this.currentMode = 'design'
  }

  connectedCallback() {
    this.render()
    this._bindKeys()
  }

  render() {
    const root = this.shadowRoot
    root.innerHTML = ''

    const handle = root.appendChild(document.createElement('span'))
    handle.className = 'handle'
    handle.textContent = '⋮⋮'
    this._makeDraggable(handle)

    for (const mode of MODES) {
      const btn = root.appendChild(document.createElement('button'))
      btn.className = 'mode-btn' + (mode.name === this.currentMode ? ' active' : '')
      btn.textContent = mode.label
      btn.title = `${mode.label} (${mode.key})`
      btn.addEventListener('click', () => this._setMode(mode.name))
    }

    const more = root.appendChild(document.createElement('button'))
    more.className = 'mode-btn'
    more.textContent = '···'
  }

  _setMode(name) {
    this.currentMode = name
    emit('pinpoint:mode', { mode: name })
    this.render()
  }

  _bindKeys() {
    this._keyHandler = (e) => {
      for (const mode of MODES) {
        if (e.key.toUpperCase() === mode.key && !e.ctrlKey && !e.metaKey) {
          this._setMode(mode.name)
        }
      }
    }
    document.addEventListener('keydown', this._keyHandler)
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._keyHandler)
  }

  _makeDraggable(handle) {
    let startX, startY, origX, origY
    handle.addEventListener('mousedown', (e) => {
      startX = e.clientX
      startY = e.clientY
      const rect = this.getBoundingClientRect()
      origX = rect.left
      origY = rect.top
      this.style.transform = 'none'

      const onMove = (e) => {
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        let newX = origX + dx
        let newY = origY + dy

        // Snap to edges
        if (newY < 40) newY = 8
        if (newY > window.innerHeight - 40) newY = window.innerHeight - this.offsetHeight - 8

        this.style.left = newX + 'px'
        this.style.top = newY + 'px'
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    })
  }
}

function makeSheet(css) {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(css)
  return sheet
}

customElements.define('pinpoint-toolbar', PinpointToolbar)