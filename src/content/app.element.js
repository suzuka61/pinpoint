import { on, off, emit } from './core/event-bus.js'
import { activateSelectable, deactivateSelectable } from './core/hover.js'
import { setSelected, clearSelected } from './core/selected.js'
import { syncToBackground, loadFromBackground } from './services/state-sync.js'

class PinpointApp extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._mode = 'design'
    this._records = new Map()
    this._undoStack = []
  }

  connectedCallback() {
    this.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;'

    const toolbar = document.createElement('pinpoint-toolbar')
    const hoverOverlay = document.createElement('pinpoint-hover')
    const selectedOverlay = document.createElement('pinpoint-selected-overlay')
    const editor = document.createElement('pinpoint-editor')
    const overview = document.createElement('pinpoint-overview')

    document.body.append(toolbar, hoverOverlay, selectedOverlay, editor, overview)

    this._toolbar = toolbar
    this._editor = editor
    this._overview = overview

    activateSelectable()
    this._setupEvents()
    this._restoreState()
  }

  _setupEvents() {
    on('pinpoint:mode', ({ mode }) => {
      this._mode = mode
      if (mode === 'design') activateSelectable()
      else deactivateSelectable()
    })

    on('pinpoint:selected', ({ els }) => {
      setSelected(els)
    })

    on('pinpoint:style-changed', ({ el, prop, from, to }) => {
      this._undoStack.push({ el, prop, from, to })
      if (this._undoStack.length > 50) this._undoStack.shift()
      syncToBackground(location.href, this._records)
    })

    on('pinpoint:overview-toggle', ({ open }) => {
      this._overview.style.display = open ? 'block' : 'none'
    })

    on('pinpoint:editor-pin', ({ pinned }) => {
      if (pinned && this._overview.style.display !== 'none') {
        this._overview.style.display = 'none'
      }
    })

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        this._undo()
      }
      if (e.key === 'Escape') {
        clearSelected()
        this._editor.hide()
      }
    })
  }

  _undo() {
    const entry = this._undoStack.pop()
    if (!entry) return
    const { el, prop, from } = entry
    if (from) el.style.setProperty(prop, from)
    else el.style.removeProperty(prop)
  }

  async _restoreState() {
    const records = await loadFromBackground(location.href)
    if (!records) return
    for (const [id, rec] of Object.entries(records)) {
      const el = document.querySelector(rec.selector)
      if (!el) continue
      for (const [prop, { to }] of Object.entries(rec.styleChanges || {})) {
        el.style.setProperty(prop, to)
      }
    }
  }
}

customElements.define('pinpoint-app', PinpointApp)
