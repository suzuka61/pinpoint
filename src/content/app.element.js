import { on, off, emit } from './core/event-bus.js'
import { activateSelectable, deactivateSelectable } from './core/hover.js'
import { generateSelector } from './services/selector-gen.js'
import { syncToBackground, loadFromBackground } from './services/state-sync.js'
import { hashString } from './core/utils.js'

const appCSS = `:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}`

class PinpointApp extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [makeSheet(appCSS)]
    this.setAttribute('data-pinpoint-ui', '')
    this.active = false
    this.mode = 'design'
    this.records = new Map()
    this.undoStack = []
  }

  async connectedCallback() {
    // Mount sub-components
    this.shadowRoot.innerHTML = ''
    this.shadowRoot.appendChild(document.createElement('pinpoint-toolbar'))
    this.shadowRoot.appendChild(document.createElement('pinpoint-hover'))
    this.shadowRoot.appendChild(document.createElement('pinpoint-selected'))
    this.shadowRoot.appendChild(document.createElement('pinpoint-editor'))
    this.shadowRoot.appendChild(document.createElement('pinpoint-color-popover'))
    this.shadowRoot.appendChild(document.createElement('pinpoint-overview'))

    // Listen to events
    on('pinpoint:mode', this._onMode)
    on('pinpoint:style-changed', this._onStyleChanged)
    on('pinpoint:style-reset', this._onReset)
    on('pinpoint:overview-toggle', this._onOverviewToggle)
    on('pinpoint:editor-pin', this._onEditorPin)

    // Undo
    document.addEventListener('keydown', this._onKey)

    // Activate in design mode
    this._setMode('design')

    // Restore state
    const saved = await loadFromBackground(location.href)
    if (saved) this._restoreState(saved)
  }

  disconnectedCallback() {
    off('pinpoint:mode', this._onMode)
    off('pinpoint:style-changed', this._onStyleChanged)
    off('pinpoint:style-reset', this._onReset)
    off('pinpoint:overview-toggle', this._onOverviewToggle)
    off('pinpoint:editor-pin', this._onEditorPin)
    document.removeEventListener('keydown', this._onKey)
    deactivateSelectable()
  }

  _onMode = ({ detail }) => this._setMode(detail.mode)

  _setMode(mode) {
    this.mode = mode
    if (mode === 'design') activateSelectable()
    else deactivateSelectable()

    // Toggle overview panel
    if (mode === 'overview') {
      emit('pinpoint:overview-toggle', { open: true })
    } else {
      emit('pinpoint:overview-toggle', { open: false })
    }
  }

  _onStyleChanged = ({ detail }) => {
    const { el, prop, from, to } = detail
    // Push to undo stack
    this.undoStack.push({ el, prop, from, to })
    if (this.undoStack.length > 50) this.undoStack.shift()

    // Update records
    const selector = generateSelector(el)
    const id = hashString(selector)
    if (!this.records.has(id)) {
      this.records.set(id, {
        id, selector, el,
        label: el.localName + (el.id ? '#' + el.id : ''),
        styleChanges: {}
      })
    }
    this.records.get(id).styleChanges[prop] = { from, to }

    // Sync to background
    syncToBackground(location.href, this.records)
  }

  _onReset = ({ detail }) => {
    const rec = this.records.get(detail.id)
    if (rec) {
      for (const [prop, { from }] of Object.entries(rec.styleChanges)) {
        if (from) rec.el.style.setProperty(prop, from)
        else rec.el.style.removeProperty(prop)
      }
      this.records.delete(detail.id)
      syncToBackground(location.href, this.records)
    }
  }

  _onOverviewToggle = () => {}
  _onEditorPin = () => {}

  _onKey = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault()
      const entry = this.undoStack.pop()
      if (!entry) return
      if (entry.from) entry.el.style.setProperty(entry.prop, entry.from)
      else entry.el.style.removeProperty(entry.prop)
    }
    if (e.key === 'Escape') {
      emit('pinpoint:selected', { els: [], rects: [] })
    }
  }

  _restoreState(records) {
    for (const [, rec] of Object.entries(records)) {
      const el = document.querySelector(rec.selector)
      if (!el) continue
      for (const [prop, { to }] of Object.entries(rec.styleChanges)) {
        el.style.setProperty(prop, to)
      }
      const id = hashString(rec.selector)
      this.records.set(id, { ...rec, el })
    }
  }
}

function makeSheet(css) {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(css)
  return sheet
}

customElements.define('pinpoint-app', PinpointApp)