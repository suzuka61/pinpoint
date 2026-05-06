# Pinpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension that lets users select elements on any webpage, edit styles visually, and export structured Prompt/JSON for AI or developers.

**Architecture:** Content Script + Shadow DOM Custom Elements. All modules communicate via CustomEvent bus. Single data source in `<pinpoint-app>`. Background script for cross-tab state persistence.

**Tech Stack:** Vite + CRXJS, Manifest V3, vanilla Custom Elements + Shadow DOM, Chrome Storage API

---

## File Structure

```
src/
├── background/index.js              # State cache + cross-tab persistence
├── content/
│   ├── index.js                     # Content script entry
│   ├── app.element.js               # <pinpoint-app> orchestrator
│   ├── app.element.css
│   ├── core/
│   │   ├── event-bus.js             # CustomEvent pub/sub ✅ exists
│   │   ├── selectable.js            # Element selection engine ✅ exists
│   │   ├── hover.js                 # Hover activation ✅ exists
│   │   ├── selected.js              # Selected element tracking ✅ exists
│   │   ├── overlays.js              # Overlay rect calc ✅ exists
│   │   └── utils.js                 # clamp, debounce, hash, truncate ✅ exists
│   ├── services/
│   │   ├── css-write.js             # CSS write-back ✅ exists
│   │   ├── selector-gen.js          # CSS selector generation ✅ exists
│   │   ├── style-read.js            # Computed style reader ✅ exists
│   │   ├── placement.js             # Overlay positioning ✅ exists
│   │   └── state-sync.js            # Background state sync ✅ exists
│   ├── toolbar/
│   │   ├── toolbar.element.js       # <pinpoint-toolbar>
│   │   └── toolbar.element.css
│   ├── editor/
│   │   ├── editor.element.js        # <pinpoint-editor>
│   │   ├── editor.element.css
│   │   ├── editor.js                # Editor logic
│   │   ├── fields/
│   │   │   ├── text-field.js
│   │   │   ├── dimension-field.js
│   │   │   ├── spacing-field.js
│   │   │   ├── typography-field.js
│   │   │   ├── color-field.js
│   │   │   ├── number-field.js
│   │   │   ├── border-field.js
│   │   │   ├── shadow-field.js
│   │   │   └── image-field.js
│   │   └── code-tab.js
│   ├── color/
│   │   ├── color-popover.element.js
│   │   ├── color-popover.element.css
│   │   ├── color-engine.js
│   │   ├── sv-panel.js
│   │   ├── hue-slider.js
│   │   ├── alpha-slider.js
│   │   └── gradient-editor.js
│   ├── overview/
│   │   ├── overview.element.js      # <pinpoint-overview>
│   │   └── overview.element.css
│   ├── overlay/
│   │   ├── hover-overlay.element.js
│   │   ├── selected-overlay.element.js
│   │   └── overlay.css
│   └── styles/
│       └── pinpoint.css
└── popup/
    ├── popup.html
    ├── popup.js
    └ popup.css
```

Files marked ✅ already exist with working code. Remaining files need to be created.

---

### Task 1: Overlay Custom Elements

**Files:**
- Create: `src/content/overlay/overlay.css`
- Create: `src/content/overlay/hover-overlay.element.js`
- Create: `src/content/overlay/selected-overlay.element.js`

- [ ] **Step 1: Create overlay.css**

```css
:host {
  position: fixed;
  z-index: 2147483646;
  pointer-events: none;
}

.overlay-box {
  position: absolute;
  border: 2px dashed #4a90d9;
  pointer-events: none;
}

.overlay-box.selected {
  border-style: solid;
  border-color: #4a90d9;
}

.overlay-label {
  position: absolute;
  top: -22px;
  left: 0;
  font: 11px/1.4 monospace;
  color: #fff;
  background: #4a90d9;
  padding: 1px 6px;
  border-radius: 3px 3px 0 0;
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.overlay-size {
  position: absolute;
  bottom: -20px;
  right: 0;
  font: 10px/1.4 monospace;
  color: #fff;
  background: #4a90d9;
  padding: 1px 6px;
  border-radius: 0 0 3px 3px;
  white-space: nowrap;
}
```

- [ ] **Step 2: Create hover-overlay.element.js**

```js
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
    this.box.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;`
    const tag = el.localName
    const cls = [...el.classList].filter(c => !c.startsWith('pinpoint-')).join('.')
    this.label.textContent = tag + (cls ? '.' + cls : '')
  }

  hide() {
    this.box.style.display = 'none'
  }
}

customElements.define('pinpoint-hover', HoverOverlay)
```

- [ ] **Step 3: Create selected-overlay.element.js**

```js
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
```

- [ ] **Step 4: Commit**

```bash
git add src/content/overlay/
git commit -m "feat: add hover and selected overlay custom elements"
```

---

### Task 2: Toolbar Custom Element

**Files:**
- Create: `src/content/toolbar/toolbar.element.js`
- Create: `src/content/toolbar/toolbar.element.css`

- [ ] **Step 1: Create toolbar.element.css**

```css
:host {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  user-select: none;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #1e1e2e;
  border-radius: 0 0 8px 8px;
  padding: 4px 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.3);
  color: #cdd6f4;
}

.handle {
  cursor: grab;
  padding: 2px 4px;
  color: #585b70;
  font-size: 14px;
}

.handle:active { cursor: grabbing; }

.mode-btn {
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: #cdd6f4;
  border-radius: 4px;
  cursor: pointer;
  font: inherit;
}

.mode-btn:hover { background: #313244; }
.mode-btn.active { background: #45475a; color: #fff; }

.more-btn {
  padding: 4px 6px;
  border: none;
  background: transparent;
  color: #585b70;
  border-radius: 4px;
  cursor: pointer;
  font: inherit;
}

.more-btn:hover { background: #313244; }

.collapsed {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}
```

- [ ] **Step 2: Create toolbar.element.js**

```js
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
      const onUp = (e) => {
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
```

- [ ] **Step 3: Commit**

```bash
git add src/content/toolbar/
git commit -m "feat: add toolbar custom element with mode switching, drag, collapse"
```

---

### Task 3: Editor Fields

**Files:**
- Create: `src/content/editor/fields/number-field.js`
- Create: `src/content/editor/fields/text-field.js`
- Create: `src/content/editor/fields/dimension-field.js`
- Create: `src/content/editor/fields/spacing-field.js`
- Create: `src/content/editor/fields/typography-field.js`
- Create: `src/content/editor/fields/color-field.js`
- Create: `src/content/editor/fields/border-field.js`
- Create: `src/content/editor/fields/shadow-field.js`
- Create: `src/content/editor/fields/image-field.js`

- [ ] **Step 1: Create number-field.js** — reusable numeric input with drag and keyboard adjust

```js
export function createNumberField(label, value, onChange) {
  const row = document.createElement('div')
  row.className = 'field-row'
  row.innerHTML = `
    <label>${label}</label>
    <span class="drag-handle" title="拖动调值">⇔</span>
    <input type="text" value="${value}" data-pinpoint-ui>
  `
  const input = row.querySelector('input')
  const handle = row.querySelector('.drag-handle')

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); adjust(1, e.shiftKey) }
    if (e.key === 'ArrowDown') { e.preventDefault(); adjust(-1, e.shiftKey) }
  })

  input.addEventListener('change', () => {
    onChange(input.value)
  })

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startVal = parseFloat(input.value) || 0
    const onMove = (e) => {
      const delta = Math.round((e.clientX - startX) / 2)
      input.value = startVal + delta
      onChange(input.value)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  })

  function adjust(dir, shift) {
    const step = shift ? 10 : 1
    const val = parseFloat(input.value) || 0
    input.value = val + dir * step
    onChange(input.value)
  }

  row.update = (v) => { input.value = v }
  return row
}
```

- [ ] **Step 2: Create text-field.js**

```js
export function createTextField(label, value, onChange) {
  const row = document.createElement('div')
  row.className = 'field-row'
  row.innerHTML = `
    <label>${label}</label>
    <input type="text" value="${value}" data-pinpoint-ui>
  `
  const input = row.querySelector('input')
  input.addEventListener('change', () => onChange(input.value))
  row.update = (v) => { input.value = v }
  return row
}
```

- [ ] **Step 3: Create dimension-field.js**

```js
import { createNumberField } from './number-field.js'

export function createDimensionField(el, onChange) {
  const group = document.createElement('div')
  group.className = 'field-group'
  group.innerHTML = '<div class="group-label">尺寸</div>'

  const computed = getComputedStyle(el)
  const w = createNumberField('W', parseInt(computed.width), (v) => onChange('width', v + 'px'))
  const h = createNumberField('H', parseInt(computed.height), (v) => onChange('height', v + 'px'))
  group.appendChild(w)
  group.appendChild(h)

  group.update = (prop, val) => {
    if (prop === 'width') w.update(parseInt(val) || 0)
    if (prop === 'height') h.update(parseInt(val) || 0)
  }
  return group
}
```

- [ ] **Step 4: Create spacing-field.js**

```js
import { createNumberField } from './number-field.js'

export function createSpacingField(el, onChange) {
  const group = document.createElement('div')
  group.className = 'field-group'
  group.innerHTML = '<div class="group-label">间距</div>'

  const computed = getComputedStyle(el)
  const props = [
    ['padding-top', 'PT'], ['padding-right', 'PR'],
    ['padding-bottom', 'PB'], ['padding-left', 'PL'],
    ['gap', 'Gap'],
  ]
  const fields = {}
  for (const [prop, label] of props) {
    const f = createNumberField(label, parseInt(computed.getPropertyValue(prop)), (v) => onChange(prop, v + 'px'))
    fields[prop] = f
    group.appendChild(f)
  }
  group.update = (prop, val) => { if (fields[prop]) fields[prop].update(parseInt(val) || 0) }
  return group
}
```

- [ ] **Step 5: Create typography-field.js**

```js
import { createNumberField } from './number-field.js'
import { createTextField } from './text-field.js'

export function createTypographyField(el, onChange) {
  const group = document.createElement('div')
  group.className = 'field-group'
  group.innerHTML = '<div class="group-label">字体</div>'

  const computed = getComputedStyle(el)
  const family = createTextField('字体', computed.fontFamily, (v) => onChange('font-family', v))
  const size = createNumberField('字号', parseInt(computed.fontSize), (v) => onChange('font-size', v + 'px'))
  const weight = createNumberField('字重', parseInt(computed.fontWeight), (v) => onChange('font-weight', String(v)))
  const lineH = createNumberField('行高', parseFloat(computed.lineHeight), (v) => onChange('line-height', v + 'px'))
  const spacing = createNumberField('字距', parseFloat(computed.letterSpacing) || 0, (v) => onChange('letter-spacing', v + 'px'))

  group.append(family, size, weight, lineH, spacing)
  return group
}
```

- [ ] **Step 6: Create color-field.js**

```js
export function createColorField(label, value, onOpenPopover) {
  const row = document.createElement('div')
  row.className = 'field-row'
  row.innerHTML = `
    <label>${label}</label>
    <div class="color-swatch" style="background:${value}" data-pinpoint-ui></div>
    <input type="text" value="${value}" data-pinpoint-ui>
  `
  const swatch = row.querySelector('.color-swatch')
  const input = row.querySelector('input')

  swatch.addEventListener('click', () => onOpenPopover(label, input.value))
  input.addEventListener('click', () => onOpenPopover(label, input.value))
  input.addEventListener('change', () => {
    swatch.style.background = input.value
  })

  row.update = (v) => { input.value = v; swatch.style.background = v }
  row.getValue = () => input.value
  return row
}
```

- [ ] **Step 7: Create border-field.js**

```js
import { createNumberField } from './number-field.js'

export function createBorderField(el, onChange) {
  const group = document.createElement('div')
  group.className = 'field-group'
  group.innerHTML = '<div class="group-label">描边</div>'

  const computed = getComputedStyle(el)
  const radius = createNumberField('圆角', parseInt(computed.borderRadius) || 0, (v) => onChange('border-radius', v + 'px'))
  const width = createNumberField('边框宽', parseInt(computed.borderWidth) || 0, (v) => onChange('border-width', v + 'px'))
  group.append(radius, width)
  return group
}
```

- [ ] **Step 8: Create shadow-field.js**

```js
import { createTextField } from './text-field.js'

export function createShadowField(el, onChange) {
  const group = document.createElement('div')
  group.className = 'field-group'
  group.innerHTML = '<div class="group-label">投影</div>'

  const computed = getComputedStyle(el)
  const shadow = createTextField('box-shadow', computed.boxShadow === 'none' ? '' : computed.boxShadow, (v) => onChange('box-shadow', v || 'none'))
  group.appendChild(shadow)
  return group
}
```

- [ ] **Step 9: Create image-field.js**

```js
export function createImageField(el, onChange) {
  const group = document.createElement('div')
  group.className = 'field-group'
  group.innerHTML = '<div class="group-label">图片</div>'

  const row = document.createElement('div')
  row.className = 'field-row'
  row.innerHTML = `<button class="img-btn" data-pinpoint-ui>选择文件</button><span class="img-name"></span>`

  const btn = row.querySelector('.img-btn')
  const name = row.querySelector('.img-name')

  btn.addEventListener('click', () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      name.textContent = file.name
      const reader = new FileReader()
      reader.onload = () => onChange({ fileName: file.name, objectUrl: url, base64: reader.result })
      reader.readAsDataURL(file)
    }
    input.click()
  })

  group.appendChild(row)
  return group
}
```

- [ ] **Step 10: Commit**

```bash
git add src/content/editor/fields/
git commit -m "feat: add all editor field components"
```

---

### Task 4: Color Engine and Color Popover

**Files:**
- Create: `src/content/color/color-engine.js`
- Create: `src/content/color/sv-panel.js`
- Create: `src/content/color/hue-slider.js`
- Create: `src/content/color/alpha-slider.js`
- Create: `src/content/color/gradient-editor.js`
- Create: `src/content/color/color-popover.element.js`
- Create: `src/content/color/color-popover.element.css`

- [ ] **Step 1: Create color-engine.js** — HSV ↔ Hex ↔ RGB conversions

```js
export function hsvToRgb(h, s, v) {
  h = h / 360; s = s / 100; v = v / 100
  const i = Math.floor(h * 6), f = h * 6 - i
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s)
  let r, g, b
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0, s = max === 0 ? 0 : d / max, v = max
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) }
}

export function hexToRgb(hex) {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]
  return { r: parseInt(hex.slice(0,2), 16), g: parseInt(hex.slice(2,4), 16), b: parseInt(hex.slice(4,6), 16) }
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
}

export function hexToHsv(hex) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHsv(r, g, b)
}

export function hsvToHex(h, s, v) {
  const { r, g, b } = hsvToRgb(h, s, v)
  return rgbToHex(r, g, b)
}
```

- [ ] **Step 2: Create sv-panel.js**

```js
export function createSVPanel(onChange) {
  const canvas = document.createElement('canvas')
  canvas.width = 200; canvas.height = 200
  canvas.style.cssText = 'width:200px;height:200px;cursor:crosshair;border-radius:4px;'
  canvas.setAttribute('data-pinpoint-ui', '')

  let hue = 0, dragging = false

  function draw() {
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        const s = (x / w) * 100
        const v = (1 - y / h) * 100
        const { r, g, b } = hsvToRgbInline(hue, s, v)
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  function hsvToRgbInline(h, s, v) {
    h /= 360; s /= 100; v /= 100
    const i = Math.floor(h * 6), f = h * 6 - i
    const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s)
    let r, g, b
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break
      case 1: r = q; g = v; b = p; break
      case 2: r = p; g = v; b = t; break
      case 3: r = p; g = q; b = v; break
      case 4: r = t; g = p; b = v; break
      case 5: r = v; g = p; b = q; break
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
  }

  function handleMove(e) {
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    const s = Math.round((x / rect.width) * 100)
    const v = Math.round((1 - y / rect.height) * 100)
    onChange({ s, v })
  }

  canvas.addEventListener('mousedown', (e) => { dragging = true; handleMove(e) })
  document.addEventListener('mousemove', (e) => { if (dragging) handleMove(e) })
  document.addEventListener('mouseup', () => { dragging = false })

  canvas.setHue = (h) => { hue = h; draw() }
  draw()
  return canvas
}
```

- [ ] **Step 3: Create hue-slider.js**

```js
export function createHueSlider(onChange) {
  const canvas = document.createElement('canvas')
  canvas.width = 200; canvas.height = 16
  canvas.style.cssText = 'width:200px;height:16px;cursor:pointer;border-radius:4px;'
  canvas.setAttribute('data-pinpoint-ui', '')

  let dragging = false

  function draw() {
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    for (let x = 0; x < w; x++) {
      const hue = (x / w) * 360
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
      ctx.fillRect(x, 0, 1, h)
    }
  }

  function handleMove(e) {
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const hue = Math.round((x / rect.width) * 360)
    onChange(hue)
  }

  canvas.addEventListener('mousedown', (e) => { dragging = true; handleMove(e) })
  document.addEventListener('mousemove', (e) => { if (dragging) handleMove(e) })
  document.addEventListener('mouseup', () => { dragging = false })

  draw()
  return canvas
}
```

- [ ] **Step 4: Create alpha-slider.js**

```js
export function createAlphaSlider(onChange) {
  const canvas = document.createElement('canvas')
  canvas.width = 200; canvas.height = 16
  canvas.style.cssText = 'width:200px;height:16px;cursor:pointer;border-radius:4px;'
  canvas.setAttribute('data-pinpoint-ui', '')

  let dragging = false, currentColor = '#ffffff'

  function draw() {
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    for (let x = 0; x < w; x++) {
      const alpha = x / w
      ctx.fillStyle = currentColor
      ctx.globalAlpha = alpha
      ctx.fillRect(x, 0, 1, h)
    }
    ctx.globalAlpha = 1
  }

  function handleMove(e) {
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const opacity = Math.round((x / rect.width) * 100)
    onChange(opacity)
  }

  canvas.addEventListener('mousedown', (e) => { dragging = true; handleMove(e) })
  document.addEventListener('mousemove', (e) => { if (dragging) handleMove(e) })
  document.addEventListener('mouseup', () => { dragging = false })

  canvas.setColor = (hex) => { currentColor = hex; draw() }
  draw()
  return canvas
}
```

- [ ] **Step 5: Create gradient-editor.js**

```js
export function createGradientEditor(onChange) {
  const container = document.createElement('div')
  container.className = 'gradient-editor'
  container.innerHTML = `
    <div class="gradient-bar" data-pinpoint-ui></div>
    <div class="gradient-controls">
      <label>角度</label>
      <input type="number" value="135" min="0" max="360" data-pinpoint-ui>
    </div>
  `
  container.style.cssText = 'display:flex;flex-direction:column;gap:4px;'

  const bar = container.querySelector('.gradient-bar')
  const angleInput = container.querySelector('input')
  bar.style.cssText = 'height:16px;border-radius:4px;cursor:pointer;'

  let stops = [
    { hex: '#667eea', position: 0 },
    { hex: '#764ba2', position: 100 },
  ]
  let angle = 135

  function render() {
    const gradStr = stops.map(s => `${s.hex} ${s.position}%`).join(', ')
    bar.style.background = `linear-gradient(90deg, ${gradStr})`
  }

  angleInput.addEventListener('change', () => {
    angle = parseInt(angleInput.value) || 0
    emitChange()
  })

  bar.addEventListener('click', (e) => {
    const rect = bar.getBoundingClientRect()
    const pos = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    stops.push({ hex: '#ffffff', position: Math.max(0, Math.min(100, pos)) })
    stops.sort((a, b) => a.position - b.position)
    render()
    emitChange()
  })

  function emitChange() {
    onChange({ mode: 'gradient', angle, stops: [...stops] })
  }

  container.setStops = (s) => { stops = s; render() }
  container.setAngle = (a) => { angle = a; angleInput.value = a; render() }
  render()
  return container
}
```

- [ ] **Step 6: Create color-popover.element.css**

```css
:host {
  position: fixed;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
}

.popover {
  background: #1e1e2e;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  color: #cdd6f4;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.format-toggle {
  display: flex;
  gap: 4px;
}

.format-toggle button {
  padding: 2px 8px;
  border: none;
  background: #313244;
  color: #cdd6f4;
  border-radius: 3px;
  cursor: pointer;
  font: inherit;
}

.format-toggle button.active {
  background: #45475a;
  color: #fff;
}

.hex-input {
  background: #313244;
  border: none;
  color: #cdd6f4;
  padding: 4px 8px;
  border-radius: 4px;
  font: inherit;
  width: 100%;
  box-sizing: border-box;
}
```

- [ ] **Step 7: Create color-popover.element.js**

```js
import { hsvToHex, hexToHsv, rgbToHex, hexToRgb } from './color-engine.js'
import { createSVPanel } from './sv-panel.js'
import { createHueSlider } from './hue-slider.js'
import { createAlphaSlider } from './alpha-slider.js'
import { createGradientEditor } from './gradient-editor.js'

class ColorPopover extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._hsv = { h: 0, s: 0, v: 100 }
    this._opacity = 100
    this._format = 'hex'
    this._allowGradient = false
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { position: fixed; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; }
        .popover { background: #1e1e2e; border-radius: 8px; padding: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          color: #cdd6f4; display: flex; flex-direction: column; gap: 8px; }
        .format-toggle { display: flex; gap: 4px; }
        .format-toggle button { padding: 2px 8px; border: none; background: #313244; color: #cdd6f4;
          border-radius: 3px; cursor: pointer; font: inherit; }
        .format-toggle button.active { background: #45475a; color: #fff; }
        .hex-input { background: #313244; border: none; color: #cdd6f4; padding: 4px 8px;
          border-radius: 4px; font: inherit; width: 100%; box-sizing: border-box; }
      </style>
      <div class="popover" data-pinpoint-ui></div>
    `
    this.popover = this.shadowRoot.querySelector('.popover')
  }

  open(anchorRect, initialColor, allowGradient, onChange) {
    this._allowGradient = allowGradient
    this._onChange = onChange
    if (initialColor && initialColor.startsWith('#')) {
      this._hsv = hexToHsv(initialColor)
    }
    this._build()
    this._position(anchorRect)
  }

  _build() {
    this.popover.innerHTML = ''

    this._svPanel = createSVPanel(({ s, v }) => {
      this._hsv.s = s; this._hsv.v = v
      this._emitColor()
    })
    this._hueSlider = createHueSlider((h) => {
      this._hsv.h = h
      this._svPanel.setHue(h)
      this._emitColor()
    })
    this._alphaSlider = createAlphaSlider((opacity) => {
      this._opacity = opacity
      this._emitColor()
    })

    const formatRow = document.createElement('div')
    formatRow.className = 'format-toggle'
    for (const fmt of ['hex', 'rgb', 'hsl']) {
      const btn = document.createElement('button')
      btn.textContent = fmt.toUpperCase()
      btn.className = fmt === this._format ? 'active' : ''
      btn.addEventListener('click', () => {
        this._format = fmt
        formatRow.querySelectorAll('button').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        this._updateHexInput()
      })
      formatRow.appendChild(btn)
    }

    this._hexInput = document.createElement('input')
    this._hexInput.className = 'hex-input'
    this._hexInput.setAttribute('data-pinpoint-ui', '')
    this._hexInput.addEventListener('change', () => {
      const hex = this._hexInput.value
      if (hex.startsWith('#')) {
        this._hsv = hexToHsv(hex)
        this._svPanel.setHue(this._hsv.h)
        this._emitColor()
      }
    })

    this.popover.append(this._svPanel, this._hueSlider, this._alphaSlider, formatRow, this._hexInput)

    if (this._allowGradient) {
      const modeRow = document.createElement('div')
      modeRow.className = 'format-toggle'
      const solidBtn = document.createElement('button')
      solidBtn.textContent = '实色'
      solidBtn.className = 'active'
      const gradBtn = document.createElement('button')
      gradBtn.textContent = '渐变'
      let gradientEditor
      gradBtn.addEventListener('click', () => {
        solidBtn.classList.remove('active')
        gradBtn.classList.add('active')
        if (!gradientEditor) {
          gradientEditor = createGradientEditor((data) => this._onChange(data))
          this.popover.appendChild(gradientEditor)
        }
        gradientEditor.style.display = ''
      })
      solidBtn.addEventListener('click', () => {
        gradBtn.classList.remove('active')
        solidBtn.classList.add('active')
        if (gradientEditor) gradientEditor.style.display = 'none'
        this._emitColor()
      })
      modeRow.append(solidBtn, gradBtn)
      this.popover.insertBefore(modeRow, this._svPanel)
    }

    this._svPanel.setHue(this._hsv.h)
    this._updateHexInput()
  }

  _emitColor() {
    const hex = hsvToHex(this._hsv.h, this._hsv.s, this._hsv.v)
    this._alphaSlider.setColor(hex)
    this._updateHexInput()
    this._onChange({ mode: 'solid', hex, opacity: this._opacity })
  }

  _updateHexInput() {
    const hex = hsvToHex(this._hsv.h, this._hsv.s, this._hsv.v)
    if (this._format === 'hex') {
      this._hexInput.value = hex
    } else if (this._format === 'rgb') {
      const { r, g, b } = hexToRgb(hex)
      this._hexInput.value = `rgb(${r}, ${g}, ${b})`
    } else {
      this._hexInput.value = `hsl(${this._hsv.h}, ${this._hsv.s}%, ${this._hsv.v}%)`
    }
  }

  _position(anchorRect) {
    const w = 224, h = 320
    let x = anchorRect.right + 8
    let y = anchorRect.top
    if (x + w > window.innerWidth) x = anchorRect.left - w - 8
    if (y + h > window.innerHeight) y = window.innerHeight - h - 8
    if (x < 0) x = 8
    if (y < 0) y = 8
    this.style.left = x + 'px'
    this.style.top = y + 'px'
  }

  close() {
    this.popover.innerHTML = ''
  }
}

customElements.define('pinpoint-color-popover', ColorPopover)
```

- [ ] **Step 8: Commit**

```bash
git add src/content/color/
git commit -m "feat: add color engine, SV panel, hue/alpha sliders, gradient editor, color popover"
```

---

### Task 5: Style Editor Element

**Files:**
- Create: `src/content/editor/editor.js`
- Create: `src/content/editor/code-tab.js`
- Create: `src/content/editor/editor.element.js`
- Create: `src/content/editor/editor.element.css`

- [ ] **Step 1: Create editor.js** — logic hub connecting fields to css-write and event bus

```js
import { cssWrite } from '../services/css-write.js'
import { readStyles } from '../services/style-read.js'
import { emit } from '../core/event-bus.js'
import { createDimensionField } from './fields/dimension-field.js'
import { createSpacingField } from './fields/spacing-field.js'
import { createTypographyField } from './fields/typography-field.js'
import { createBorderField } from './fields/border-field.js'
import { createShadowField } from './fields/shadow-field.js'
import { createImageField } from './fields/image-field.js'
import { createColorField } from './fields/color-field.js'
import { createTextField } from './fields/text-field.js'

export function buildEditorContent(el, container, onOpenColor) {
  container.innerHTML = ''
  const styles = readStyles(el)

  function onChange(prop, value) {
    const { from, to } = cssWrite(el, prop, value)
    emit('pinpoint:style-changed', { el, prop, from, to })
  }

  const textContent = createTextField('内容', styles._textContent, (v) => { el.textContent = v })
  const dimension = createDimensionField(el, onChange)
  const spacing = createSpacingField(el, onChange)
  const typography = createTypographyField(el, onChange)
  const textColor = createColorField('文字颜色', styles['color'], (label, val) => onOpenColor('color', val, false))
  const borderColor = createColorField('边框色', styles['border-color'] || 'transparent', (label, val) => onOpenColor('border-color', val, false))
  const fillColor = createColorField('填充', styles['background-color'], (label, val) => onOpenColor('background-color', val, true))
  const border = createBorderField(el, onChange)
  const shadow = createShadowField(el, onChange)

  container.append(textContent, dimension, spacing, typography, textColor, fillColor, borderColor, border, shadow)

  if (el.localName === 'img') {
    const image = createImageField(el, ({ fileName, objectUrl, base64 }) => {
      el.src = objectUrl
      emit('pinpoint:style-changed', { el, prop: 'image-replace', from: '', to: fileName })
    })
    container.appendChild(image)
  }

  return { textColor, fillColor, borderColor }
}
```

- [ ] **Step 2: Create code-tab.js**

```js
export function createCodeTab(styleChanges) {
  const container = document.createElement('div')
  container.className = 'code-tab'
  const textarea = document.createElement('textarea')
  textarea.setAttribute('data-pinpoint-ui', '')
  textarea.style.cssText = 'width:100%;height:100%;background:#1e1e2e;color:#cdd6f4;border:none;padding:8px;font:12px monospace;resize:none;box-sizing:border-box;'

  const lines = Object.entries(styleChanges).map(([prop, { from, to }]) => `${prop}: ${to}  /* was: ${from} */`)
  textarea.value = lines.join('\n')

  container.appendChild(textarea)
  container.getChanges = () => {
    return textarea.value.split('\n').filter(l => l.includes(':')).map(l => {
      const [prop, ...rest] = l.split(':')
      return { prop: prop.trim(), value: rest.join(':').split('/*')[0].trim() }
    })
  }
  return container
}
```

- [ ] **Step 3: Create editor.element.css** (inlined in template)

- [ ] **Step 4: Create editor.element.js**

```js
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
        :host { position: fixed; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 12px; }
        .editor { background: #1e1e2e; border-radius: 8px; width: 260px; max-height: 70vh;
          overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.4); color: #cdd6f4; }
        .header { display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #313244; }
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
        .field-row label { width: 50px; color: #a6adc8; font-size: 11px; }
        .field-row input { flex: 1; background: #313244; border: none; color: #cdd6f4;
          padding: 2px 6px; border-radius: 3px; font: inherit; }
        .drag-handle { cursor: ew-resize; color: #585b70; font-size: 10px; }
        .color-swatch { width: 16px; height: 16px; border-radius: 3px; border: 1px solid #585b70; cursor: pointer; }
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
      this.editor.style.cssText = 'position:fixed;top:40px;right:0;bottom:0;border-radius:0;'
    } else {
      this.editor.style.cssText = 'position:fixed;top:40px;left:0;bottom:0;border-radius:0;'
    }
  }

  showFor(el, rect) {
    this._currentEl = el
    this.content.innerHTML = ''
    this._showTab('style')
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
        const { from, to } = this._currentEl.style.getPropertyValue(prop) || ''
        this._currentEl.style.setProperty(prop, data.hex)
        emit('pinpoint:style-changed', { el: this._currentEl, prop, from: from || '', to: data.hex })
      } else {
        const gradStr = `linear-gradient(${data.angle}deg, ${data.stops.map(s => `${s.hex} ${s.position}%`).join(', ')})`
        this._currentEl.style.setProperty(prop, gradStr)
        emit('pinpoint:style-changed', { el: this._currentEl, prop, from: '', to: gradStr })
      }
    })
  }

  hide() {
    this.editor.style.display = 'none'
  }
}

customElements.define('pinpoint-editor', PinpointEditor)
```

- [ ] **Step 5: Commit**

```bash
git add src/content/editor/
git commit -m "feat: add style editor with fields, code tab, pin mode, color popover integration"
```

---

### Task 6: Overview Panel

**Files:**
- Create: `src/content/overview/overview.element.js`
- Create: `src/content/overview/overview.element.css`

- [ ] **Step 1: Create overview.element.js**

```js
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
          z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; }
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
    let out = `### ${rec.label}\n- 选择器: \`${rec.selector}\`\n- 修改项:\n`
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
      out += `### 元素 ${n++}\n` + this._formatSinglePrompt(rec).replace(/^### /, '- ') + '\n'
    }
    out += '\n请根据以上修改指令更新对应元素的 CSS 和 HTML 属性。'
    navigator.clipboard.writeText(out)
  }

  _exportJSON() {
    const data = {
      version: 1,
      url: location.href,
      timestamp: new Date().toISOString(),
      records: [...this._records.values()].map(r => ({
        id: r.id, selector: r.selector, label: r.label,
        styleChanges: r.styleChanges,
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
```

- [ ] **Step 2: Commit**

```bash
git add src/content/overview/
git commit -m "feat: add overview panel with records, prompt export, JSON import/export"
```

---

### Task 7: App Orchestrator + Content Script Entry + Global CSS

**Files:**
- Create: `src/content/styles/pinpoint.css`
- Create: `src/content/app.element.js`
- Create: `src/content/app.element.css`
- Create: `src/content/index.js`

- [ ] **Step 1: Create pinpoint.css** — global resets injected into page

```css
pinpoint-toolbar,
pinpoint-editor,
pinpoint-hover,
pinpoint-selected-overlay,
pinpoint-color-popover,
pinpoint-overview {
  all: initial;
}
```

- [ ] **Step 2: Create app.element.js** — top-level orchestrator that mounts all components

```js
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
    this.innerHTML = ''
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
    this._hoverOverlay = hoverOverlay
    this._selectedOverlay = selectedOverlay

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
```

- [ ] **Step 3: Create index.js** — content script entry point

```js
import './app.element.js'
import './toolbar/toolbar.element.js'
import './overlay/hover-overlay.element.js'
import './overlay/selected-overlay.element.js'
import './editor/editor.element.js'
import './color/color-popover.element.js'
import './overview/overview.element.js'

if (!document.querySelector('pinpoint-app')) {
  const app = document.createElement('pinpoint-app')
  document.body.appendChild(app)
}
```

- [ ] **Step 4: Commit**

```bash
git add src/content/app.element.js src/content/index.js src/content/styles/pinpoint.css
git commit -m "feat: add app orchestrator, content script entry, global CSS"
```

---

### Task 8: Background Script

**Files:**
- Create: `src/background/index.js`

- [ ] **Step 1: Create background/index.js**

```js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'ping') {
    sendResponse({ status: 'ok' })
  }
})

chrome.storage.local.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return
})
```

- [ ] **Step 2: Commit**

```bash
git add src/background/index.js
git commit -m "feat: add background service worker"
```

---

### Task 9: Popup Page

**Files:**
- Create: `src/popup/popup.html`
- Create: `src/popup/popup.js`
- Create: `src/popup/popup.css`

- [ ] **Step 1: Create popup.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup">
    <h1>Pinpoint</h1>
    <p class="subtitle">AI 编程定位 · 样式编辑 · 批注</p>
    <button id="activate">启用</button>
    <button id="deactivate">停用</button>
  </div>
  <script src="popup.js" type="module"></script>
</body>
</html>
```

- [ ] **Step 2: Create popup.css**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 200px; }
.popup { padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
h1 { font-size: 16px; color: #1e1e2e; }
.subtitle { font-size: 11px; color: #585b70; margin: 4px 0 12px; }
button { width: 100%; padding: 8px; margin-bottom: 4px; border: none; border-radius: 4px;
  cursor: pointer; font: 13px/1 inherit; }
#activate { background: #4a90d9; color: #fff; }
#deactivate { background: #313244; color: #cdd6f4; }
```

- [ ] **Step 3: Create popup.js**

```js
document.getElementById('activate').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/content/index.js'],
    })
  }
  window.close()
})

document.getElementById('deactivate').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { type: 'deactivate' })
  }
  window.close()
})
```

- [ ] **Step 4: Commit**

```bash
git add src/popup/
git commit -m "feat: add popup page with activate/deactivate"
```

---

### Task 10: Build Verification

**Files:**
- Modify: `package.json` (add dependencies)

- [ ] **Step 1: Install dependencies**

```bash
npm install
```

Expected: dependencies installed, node_modules created

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: Vite builds successfully, dist/ created with manifest and bundled content scripts

- [ ] **Step 3: Verify dist output**

```bash
ls dist/
```

Expected: manifest.json, content scripts, background script, popup HTML present

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: lock dependencies after build verification"
```
