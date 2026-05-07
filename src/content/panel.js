/**
 * Pinpoint 样式调整面板 — Figma/Inspecta 风格
 */

import { add } from './changes.js';
import { generateSelector, getElementDescription } from './selector.js';
import { copyToClipboard } from './exporter.js';
import { updateSpacing } from './overlay.js';

let panelHost = null;
let shadow = null;
let panel = null;
let currentEl = null;
let fontListCache = null;

const TEXT_EDITABLE_TAGS = new Set([
  'h1','h2','h3','h4','h5','h6','p','span','a','button',
  'label','legend','caption','li','blockquote','pre','code',
  'td','th','strong','em','small','sub','sup','mark','figcaption'
]);

const FALLBACK_FONTS = [
  { value: '', label: '继承' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Geneva', label: 'Geneva' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Palatino', label: 'Palatino' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Monaco', label: 'Monaco' },
  { value: 'system-ui', label: 'System UI' },
  { value: 'PingFang SC', label: 'PingFang SC' },
  { value: 'Microsoft YaHei', label: '微软雅黑' },
  { value: 'Noto Sans SC', label: 'Noto Sans SC' },
];

async function loadFontList() {
  if (fontListCache) return fontListCache;

  if (!window.queryLocalFonts) {
    fontListCache = FALLBACK_FONTS;
    return FALLBACK_FONTS;
  }

  try {
    const fonts = await queryLocalFonts();
    const seen = new Set();
    const list = [{ value: '', label: '继承' }];
    for (const f of fonts) {
      if (!seen.has(f.family)) {
        seen.add(f.family);
        list.push({ value: f.family, label: f.family });
      }
    }
    list.sort((a, b) => {
      if (!a.value) return -1;
      if (!b.value) return 1;
      return a.label.localeCompare(b.label);
    });
    fontListCache = list;
    return list;
  } catch {
    fontListCache = FALLBACK_FONTS;
    return FALLBACK_FONTS;
  }
}

function create() {
  panelHost = document.createElement('div');
  panelHost.id = 'pinpoint-panel-host';
  panelHost.style.cssText = `
    position: fixed; top: 60px; right: 20px; width: 280px;
    z-index: 2147483645; pointer-events: none;
  `;
  shadow = panelHost.attachShadow({ mode: 'closed' });
  shadow.innerHTML = buildHTML();
  document.body.appendChild(panelHost);
  panel = shadow.getElementById('pp-panel');
  bindEvents();
  return panelHost;
}

function buildHTML() {
  return `
<style>
${buildCSS()}
</style>
<div class="panel" id="pp-panel">
  <div class="panel-header" id="pp-drag-handle">
    <div class="header-info">
      <span class="header-tag" id="pp-el-tag">元素</span>
      <span class="header-selector" id="pp-selector"></span>
    </div>
    <button class="panel-close" id="pp-close">&times;</button>
  </div>

  <div class="scroll-area">

    <!-- 内容 -->
    <div class="section" id="pp-text-section" style="display:none">
      <div class="section-title">内容</div>
      <textarea class="field-textarea" id="pp-text-content" rows="3" placeholder="输入文字…"></textarea>
    </div>

    <!-- 图片 -->
    <div class="section" id="pp-image-section" style="display:none">
      <div class="section-title">图片</div>
      <div class="image-row">
        <div class="image-thumb" id="pp-img-preview"></div>
        <span class="image-label" id="pp-img-src-label">无</span>
      </div>
      <input type="file" id="pp-img-file" accept="image/*" class="file-upload-input">
    </div>

    <!-- 排版 -->
    <div class="section">
      <div class="section-title">排版</div>
      <div class="prop-row">
        <span class="prop-label">字体</span>
        <select class="prop-select" id="pp-ff"></select>
      </div>
      <div class="prop-row-2">
        <div class="prop-half">
          <span class="prop-label-sm">大小</span>
          <input class="prop-input" type="number" id="pp-fs" step="1">
        </div>
        <div class="prop-half">
          <span class="prop-label-sm">粗细</span>
          <select class="prop-select-sm" id="pp-fw">
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="300">细体</option>
            <option value="400">常规</option>
            <option value="500">500</option>
            <option value="600">600</option>
            <option value="700">粗体</option>
            <option value="800">800</option>
            <option value="900">900</option>
          </select>
        </div>
      </div>
      <div class="prop-row-2">
        <div class="prop-half">
          <span class="prop-label-sm">行高</span>
          <input class="prop-input" type="number" id="pp-lh" step="0.1">
        </div>
        <div class="prop-half">
          <span class="prop-label-sm">颜色</span>
          <div class="color-row">
            <div class="color-swatch-wrap">
              <div class="color-swatch" id="pp-fc-swatch"></div>
              <input type="color" class="color-picker" id="pp-fc-picker">
            </div>
            <input class="color-hex" type="text" id="pp-fc-text">
          </div>
        </div>
      </div>
      <div class="prop-row">
        <span class="prop-label">对齐</span>
        <select class="prop-select" id="pp-ta">
          <option value="">继承</option>
          <option value="left">左</option>
          <option value="center">中</option>
          <option value="right">右</option>
          <option value="justify">两端</option>
        </select>
      </div>
      <div class="prop-row-2">
        <div class="prop-half">
          <span class="prop-label-sm">装饰</span>
          <select class="prop-select-sm" id="pp-td">
            <option value="">继承</option>
            <option value="none">无</option>
            <option value="underline">下划线</option>
            <option value="line-through">删除线</option>
          </select>
        </div>
        <div class="prop-half">
          <span class="prop-label-sm">变换</span>
          <select class="prop-select-sm" id="pp-tt">
            <option value="">继承</option>
            <option value="none">无</option>
            <option value="uppercase">大写</option>
            <option value="lowercase">小写</option>
            <option value="capitalize">首字母</option>
          </select>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">尺寸</div>
      <div class="prop-row-2">
        <div class="prop-half">
          <span class="prop-label-sm">宽度</span>
          <input class="prop-input" type="number" id="pp-width" step="1">
        </div>
        <div class="prop-half">
          <span class="prop-label-sm">高度</span>
          <input class="prop-input" type="number" id="pp-height" step="1">
        </div>
      </div>
      <div class="prop-row-2">
        <div class="prop-half">
          <span class="prop-label-sm">偏移 X</span>
          <input class="prop-input" type="number" id="pp-offset-x" step="1" value="0">
        </div>
        <div class="prop-half">
          <span class="prop-label-sm">偏移 Y</span>
          <input class="prop-input" type="number" id="pp-offset-y" step="1" value="0">
        </div>
      </div>
    </div>

    <!-- 间距 -->
    <div class="section">
      <div class="section-title">间距</div>
      <div class="spacing-group-label">内间距</div>
      <div class="prop-row-4">
        <div class="prop-quarter"><span class="prop-label-xs">上</span><input class="prop-input-xs" type="number" id="pp-pt" step="1"></div>
        <div class="prop-quarter"><span class="prop-label-xs">右</span><input class="prop-input-xs" type="number" id="pp-pr" step="1"></div>
        <div class="prop-quarter"><span class="prop-label-xs">下</span><input class="prop-input-xs" type="number" id="pp-pb" step="1"></div>
        <div class="prop-quarter"><span class="prop-label-xs">左</span><input class="prop-input-xs" type="number" id="pp-pl" step="1"></div>
      </div>
      <div class="spacing-group-label">外间距</div>
      <div class="prop-row-4">
        <div class="prop-quarter"><span class="prop-label-xs">上</span><input class="prop-input-xs" type="number" id="pp-mt" step="1"></div>
        <div class="prop-quarter"><span class="prop-label-xs">右</span><input class="prop-input-xs" type="number" id="pp-mr" step="1"></div>
        <div class="prop-quarter"><span class="prop-label-xs">下</span><input class="prop-input-xs" type="number" id="pp-mb" step="1"></div>
        <div class="prop-quarter"><span class="prop-label-xs">左</span><input class="prop-input-xs" type="number" id="pp-ml" step="1"></div>
      </div>
    </div>

    <!-- 外观 -->
    <div class="section">
      <div class="section-title">外观</div>
      <div class="prop-row">
        <span class="prop-label">背景色</span>
        <div class="color-row">
          <div class="color-swatch-wrap">
            <div class="color-swatch" id="pp-bg-swatch"></div>
            <input type="color" class="color-picker" id="pp-bg-picker">
          </div>
          <input class="color-hex" type="text" id="pp-bg-text">
        </div>
      </div>
      <div class="prop-row-2">
        <div class="prop-half">
          <span class="prop-label-sm">圆角</span>
          <input class="prop-input" type="number" id="pp-br" step="1" min="0">
        </div>
        <div class="prop-half">
          <span class="prop-label-sm">透明度</span>
          <input class="prop-input" type="number" id="pp-op" step="0.1" min="0" max="1">
        </div>
      </div>
      <div class="prop-row">
        <span class="prop-label">阴影</span>
        <input class="prop-input" type="text" id="pp-bs" placeholder="0 2px 4px …">
      </div>
    </div>

    <!-- 边框 -->
    <div class="section">
      <div class="section-title">边框</div>
      <div class="prop-row-2">
        <div class="prop-half">
          <span class="prop-label-sm">宽度</span>
          <input class="prop-input" type="number" id="pp-bw" step="1" min="0">
        </div>
        <div class="prop-half">
          <span class="prop-label-sm">样式</span>
          <select class="prop-select-sm" id="pp-bst">
            <option value="none">无</option>
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="dotted">点线</option>
          </select>
        </div>
      </div>
      <div class="prop-row">
        <span class="prop-label">颜色</span>
        <div class="color-row">
          <div class="color-swatch-wrap">
            <div class="color-swatch" id="pp-bc-swatch"></div>
            <input type="color" class="color-picker" id="pp-bc-picker">
          </div>
          <input class="color-hex" type="text" id="pp-bc-text">
        </div>
      </div>
    </div>

  </div>

  <div class="actions">
    <button class="btn btn-reset" id="pp-reset">重置</button>
    <button class="btn btn-export" id="pp-export">导出指令</button>
  </div>
</div>`;
}

function buildCSS() {
  const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2371717a' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

  return `
:host { font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", sans-serif; }
:host *, :host *::before, :host *::after { box-sizing: border-box; }

.panel {
  pointer-events: auto;
  background: #ffffff;
  color: #1a1a1a;
  max-height: 80vh;
  display: none;
  flex-direction: column;
  font-size: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06);
  overflow: hidden;
  width: 280px;
}
.panel.open { display: flex; }

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  cursor: grab;
  user-select: none;
  background: #f5f5f5;
}
.panel-header:active { cursor: grabbing; }
.header-info { flex: 1; min-width: 0; }
.header-tag { font-size: 13px; font-weight: 600; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #111827; }
.header-selector { font-size: 10px; color: #9ca3af; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px; }
.panel-close { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 18px; padding: 2px 8px; border-radius: 6px; flex-shrink: 0; line-height: 1; }
.panel-close:hover { background: #e5e7eb; color: #374151; }

.scroll-area { flex: 1; overflow-y: auto; overflow-x: hidden; }

/* Section */
.section { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; }
.section:last-of-type { border-bottom: none; }
.section-title { font-size: 11px; font-weight: 600; color: #71717a; margin-bottom: 8px; letter-spacing: 0.02em; }

/* Property rows */
.prop-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.prop-row:last-child { margin-bottom: 0; }
.prop-row-2 { display: flex; gap: 6px; margin-bottom: 6px; }
.prop-row-4 { display: flex; gap: 4px; margin-bottom: 6px; }
.prop-half { flex: 1; display: flex; align-items: center; gap: 4px; min-width: 0; }
.prop-quarter { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }

.prop-label { width: 40px; flex-shrink: 0; font-size: 11px; color: #71717a; }
.prop-label-sm { width: 32px; flex-shrink: 0; font-size: 11px; color: #71717a; }
.prop-label-xs { font-size: 10px; color: #71717a; text-align: center; }

/* Inputs */
.prop-input {
  flex: 1;
  background: #f4f4f5;
  border: 1px solid #d4d4d8;
  color: #18181b;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 11px;
  min-width: 0;
}
.prop-input:focus { outline: none; border-color: #e94560; box-shadow: 0 0 0 2px rgba(233,69,96,0.12); }
.prop-input-xs {
  width: 100%;
  background: #f4f4f5;
  border: 1px solid #d4d4d8;
  color: #18181b;
  padding: 3px 4px;
  border-radius: 4px;
  font-size: 11px;
  text-align: center;
}
.prop-input-xs:focus { outline: none; border-color: #e94560; }

/* Selects */
.prop-select, .prop-select-sm {
  flex: 1;
  background: #f4f4f5;
  border: 1px solid #d4d4d8;
  color: #18181b;
  padding: 4px 24px 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  background-image: ${CHEVRON};
  background-repeat: no-repeat;
  background-position: right 8px center;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.prop-select:focus, .prop-select-sm:focus { outline: none; border-color: #e94560; box-shadow: 0 0 0 2px rgba(233,69,96,0.12); }

/* Textarea */
.field-textarea {
  width: 100%;
  background: #f4f4f5;
  border: 1px solid #d4d4d8;
  color: #18181b;
  padding: 8px;
  border-radius: 6px;
  font-size: 12px;
  resize: vertical;
  min-height: 56px;
  box-sizing: border-box;
}
.field-textarea:focus { outline: none; border-color: #e94560; box-shadow: 0 0 0 2px rgba(233,69,96,0.12); }

/* Color */
.color-row { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }
.color-swatch-wrap { position: relative; width: 22px; height: 22px; flex-shrink: 0; }
.color-swatch { width: 22px; height: 22px; border-radius: 4px; border: 1.5px solid #d4d4d8; cursor: pointer; pointer-events: none; }
.color-picker { position: absolute; left: 0; top: 0; width: 22px; height: 22px; padding: 0; border: none; cursor: pointer; opacity: 0.01; }
.color-hex { flex: 1; min-width: 0; background: #f4f4f5; border: 1px solid #d4d4d8; color: #18181b; padding: 4px 6px; border-radius: 6px; font-size: 10px; overflow: hidden; }
.color-hex:focus { outline: none; border-color: #e94560; }

/* Image */
.image-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.image-thumb { width: 36px; height: 36px; border-radius: 6px; background: #f4f4f5; background-size: cover; background-position: center; border: 1px solid #d4d4d8; flex-shrink: 0; }
.image-label { font-size: 11px; color: #71717a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-upload-input {
  width: 100%;
  padding: 6px;
  background: #f4f4f5;
  border: 1px dashed #d4d4d8;
  color: #71717a;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  text-align: center;
}
.file-upload-input::-webkit-file-upload-button {
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  padding: 0;
  margin: 0;
}
.file-upload-input:hover { background: #e4e4e7; border-color: #e94560; color: #e94560; }

/* Spacing */
.spacing-group-label { font-size: 10px; color: #a1a1aa; font-weight: 600; margin-bottom: 4px; }
.spacing-group-label:not(:first-of-type) { margin-top: 6px; }

/* Actions */
.actions { padding: 10px 14px; display: flex; gap: 8px; flex-shrink: 0; border-top: 1px solid #e5e7eb; }
.btn { flex: 1; padding: 8px; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; }
.btn-export { background: #e94560; color: white; }
.btn-export:hover { background: #d63d56; }
.btn-reset { background: #f4f4f5; color: #71717a; }
.btn-reset:hover { background: #e4e4e7; color: #18181b; }

/* Scrollbar */
.scroll-area::-webkit-scrollbar { width: 4px; }
.scroll-area::-webkit-scrollbar-track { background: transparent; }
.scroll-area::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 2px; }
`;
}

// === 事件绑定 ===

function bindEvents() {
  $('pp-close').addEventListener('click', close);
  wireDrag();

  wireNumber('pp-width', 'width', 'px');
  wireNumber('pp-height', 'height', 'px');
  wireNumber('pp-pt', 'padding-top', 'px', true);
  wireNumber('pp-pb', 'padding-bottom', 'px', true);
  wireNumber('pp-pl', 'padding-left', 'px', true);
  wireNumber('pp-pr', 'padding-right', 'px', true);
  wireNumber('pp-mt', 'margin-top', 'px', true);
  wireNumber('pp-mb', 'margin-bottom', 'px', true);
  wireNumber('pp-ml', 'margin-left', 'px', true);
  wireNumber('pp-mr', 'margin-right', 'px', true);
  wireNumber('pp-fs', 'font-size', 'px');
  wireNumber('pp-lh', 'line-height', '');
  wireNumber('pp-br', 'border-radius', 'px');
  wireNumber('pp-bw', 'border-width', 'px');
  wireNumber('pp-op', 'opacity', '');

  wireSelect('pp-fw', 'font-weight');
  wireSelect('pp-ta', 'text-align');
  wireSelect('pp-td', 'text-decoration');
  wireSelect('pp-tt', 'text-transform');
  wireSelect('pp-bst', 'border-style');
  wireFontFamily();

  wireColor('pp-fc-swatch', 'pp-fc-text', 'pp-fc-picker', 'color');
  wireColor('pp-bg-swatch', 'pp-bg-text', 'pp-bg-picker', 'background-color');
  wireColor('pp-bc-swatch', 'pp-bc-text', 'pp-bc-picker', 'border-color');

  wireTextInput('pp-bs', 'box-shadow');
  wireOffset();
  wireTextContent();
  wireImageUpload();

  $('pp-reset').addEventListener('click', () => { if (currentEl) open(currentEl); });
  $('pp-export').addEventListener('click', () => copyToClipboard());
}

function $(id) { return shadow.getElementById(id); }

function wireNumber(id, prop, unit, refreshSpacing) {
  const el = $(id);
  if (!el) return;
  el.addEventListener('change', () => {
    if (!currentEl) return;
    const val = el.value + (unit || '');
    const old = getComputedStyle(currentEl)[prop];
    if (old === val) return;
    record(prop, old, val);
    currentEl.style[prop] = val;
    if (refreshSpacing) updateSpacing();
  });
}

function wireSelect(id, prop) {
  const el = $(id);
  if (!el) return;
  el.addEventListener('change', () => {
    if (!currentEl || !el.value) return;
    const old = getComputedStyle(currentEl)[prop];
    if (old === el.value) return;
    record(prop, old, el.value);
    currentEl.style[prop] = el.value;
  });
}

async function wireFontFamily() {
  const selectEl = $('pp-ff');
  if (!selectEl) return;

  const fonts = await loadFontList();
  for (const f of fonts) {
    const opt = document.createElement('option');
    opt.value = f.value;
    opt.textContent = f.label;
    selectEl.appendChild(opt);
  }

  selectEl.addEventListener('change', () => {
    if (!currentEl || !selectEl.value) return;
    const newVal = `'${selectEl.value}'`;
    const old = getComputedStyle(currentEl).fontFamily;
    if (old === newVal) return;
    record('font-family', old, newVal);
    currentEl.style.fontFamily = newVal;
  });
}

function wireColor(swatchId, textId, pickerId, prop) {
  const swatch = $(swatchId);
  const text = $(textId);
  const picker = $(pickerId);
  if (!swatch || !text || !picker) return;

  picker.addEventListener('input', () => {
    const val = picker.value;
    text.value = val;
    swatch.style.background = val;
    applyColor(prop, val);
  });

  text.addEventListener('change', () => {
    let val = text.value.trim();
    if (val && !val.startsWith('#') && !val.startsWith('rgb')) val = '#' + val;
    swatch.style.background = val;
    picker.value = toHex(val);
    applyColor(prop, val);
  });
}

function applyColor(prop, val) {
  if (!currentEl) return;
  const old = getComputedStyle(currentEl)[prop];
  if (old === val) return;
  record(prop, old, val);
  currentEl.style[prop] = val;
}

function wireTextInput(id, prop) {
  const el = $(id);
  if (!el) return;
  el.addEventListener('change', () => {
    if (!currentEl) return;
    const old = getComputedStyle(currentEl)[prop];
    if (old === el.value) return;
    record(prop, old, el.value);
    currentEl.style[prop] = el.value;
  });
}

function wireOffset() {
  const ox = $('pp-offset-x');
  const oy = $('pp-offset-y');
  const apply = () => {
    if (!currentEl) return;
    const x = parseInt(ox.value) || 0;
    const y = parseInt(oy.value) || 0;
    const old = getComputedStyle(currentEl).transform;
    const val = `translate(${x}px, ${y}px)`;
    record('transform', old, val);
    currentEl.style.transform = val;
    currentEl.style.position = currentEl.style.position || 'relative';
  };
  ox.addEventListener('change', apply);
  oy.addEventListener('change', apply);
}

function wireTextContent() {
  const textarea = $('pp-text-content');
  if (!textarea) return;
  textarea.addEventListener('blur', () => {
    if (!currentEl) return;
    const newText = textarea.value;
    const oldText = getDirectText(currentEl);
    if (oldText === newText) return;
    record('textContent', oldText, newText);
    setDirectText(currentEl, newText);
  });
}

function wireImageUpload() {
  const fileInput = $('pp-img-file');
  if (!fileInput) return;

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    const el = currentEl;
    if (!file || !el) return;

    const objectUrl = URL.createObjectURL(file);

    if (el.tagName === 'IMG') {
      const oldSrc = el.src;
      // 清除 srcset/sizes，它们会覆盖 src
      el.removeAttribute('srcset');
      el.removeAttribute('sizes');
      // 如果在 <picture> 内，禁用 <source>
      const picture = el.closest('picture');
      if (picture) {
        picture.querySelectorAll('source').forEach(s => {
          s.setAttribute('data-pinpoint-srcset', s.getAttribute('srcset') || '');
          s.removeAttribute('srcset');
        });
      }
      el.src = objectUrl;
      // 防止 React/Vue 等框架重渲染把 src 重置回去
      const observer = new MutationObserver(() => {
        if (el.src !== objectUrl && !el.getAttribute('srcset')) {
          el.src = objectUrl;
        }
      });
      observer.observe(el, { attributes: true, attributeFilter: ['src', 'srcset'] });
      setTimeout(() => observer.disconnect(), 5000);
      try { record('src', oldSrc, objectUrl); } catch {}
    } else {
      const oldBg = getComputedStyle(el).backgroundImage;
      const newVal = `url(${objectUrl})`;
      el.style.setProperty('background-image', newVal, 'important');
      try { record('background-image', oldBg, newVal); } catch {}
    }
    $('pp-img-preview').style.backgroundImage = `url(${objectUrl})`;
    $('pp-img-src-label').textContent = '[已上传]';
    fileInput.value = '';
  });
}

function wireDrag() {
  const handle = $('pp-drag-handle');
  if (!handle) return;

  let dragging = false;
  let startX, startY, startLeft, startTop;

  handle.addEventListener('mousedown', (e) => {
    if (e.target.closest('.panel-close')) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = panelHost.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    panelHost.style.right = 'auto';
    panelHost.style.left = startLeft + 'px';
    panelHost.style.top = startTop + 'px';
    e.preventDefault();
  });

  const onMove = (e) => {
    if (!dragging) return;
    panelHost.style.left = (startLeft + e.clientX - startX) + 'px';
    panelHost.style.top = (startTop + e.clientY - startY) + 'px';
  };

  const onUp = () => { dragging = false; };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// === 核心逻辑 ===

function record(prop, oldVal, newVal) {
  if (!currentEl || oldVal === newVal) return;
  const selector = generateSelector(currentEl);
  const desc = getElementDescription(currentEl);
  add(selector, desc, prop, oldVal, newVal);
}

async function open(el) {
  currentEl = el;
  const cs = getComputedStyle(el);

  $('pp-el-tag').textContent = getElementDescription(el);
  $('pp-selector').textContent = generateSelector(el);

  // 文字
  const directText = getDirectText(el);
  $('pp-text-section').style.display = directText.length > 0 ? '' : 'none';
  if (directText.length > 0) $('pp-text-content').value = directText;

  // 图片
  const isImg = el.tagName === 'IMG';
  const hasBgImage = cs.backgroundImage && cs.backgroundImage !== 'none';
  $('pp-image-section').style.display = (isImg || hasBgImage) ? '' : 'none';
  if (isImg || hasBgImage) {
    if (isImg) {
      $('pp-img-preview').style.backgroundImage = `url(${el.src})`;
      $('pp-img-src-label').textContent = truncateUrl(el.src);
    } else {
      $('pp-img-preview').style.backgroundImage = cs.backgroundImage;
      $('pp-img-src-label').textContent = truncateUrl(extractUrlFromBg(cs.backgroundImage));
    }
  }

  // 字体
  matchFontFamily($('pp-ff'), cs.fontFamily);

  // 数值
  setNum('pp-width', parseFloat(cs.width));
  setNum('pp-height', parseFloat(cs.height));
  setNum('pp-pt', parseFloat(cs.paddingTop));
  setNum('pp-pb', parseFloat(cs.paddingBottom));
  setNum('pp-pl', parseFloat(cs.paddingLeft));
  setNum('pp-pr', parseFloat(cs.paddingRight));
  setNum('pp-mt', parseFloat(cs.marginTop));
  setNum('pp-mb', parseFloat(cs.marginBottom));
  setNum('pp-ml', parseFloat(cs.marginLeft));
  setNum('pp-mr', parseFloat(cs.marginRight));
  setNum('pp-fs', parseFloat(cs.fontSize));
  setNum('pp-lh', parseFloat(cs.lineHeight));
  setNum('pp-br', parseFloat(cs.borderRadius));
  setNum('pp-bw', parseFloat(cs.borderWidth));
  setNum('pp-op', parseFloat(cs.opacity));
  setNum('pp-offset-x', 0);
  setNum('pp-offset-y', 0);

  $('pp-fw').value = cs.fontWeight;
  $('pp-ta').value = cs.textAlign;
  $('pp-td').value = cs.textDecorationLine;
  $('pp-tt').value = cs.textTransform;
  $('pp-bst').value = cs.borderStyle;

  setSwatchColor('pp-fc-swatch', 'pp-fc-text', 'pp-fc-picker', cs.color);
  setSwatchColor('pp-bg-swatch', 'pp-bg-text', 'pp-bg-picker', cs.backgroundColor);
  setSwatchColor('pp-bc-swatch', 'pp-bc-text', 'pp-bc-picker', cs.borderColor);

  const bsEl = $('pp-bs');
  if (bsEl) bsEl.value = cs.boxShadow === 'none' ? '' : cs.boxShadow;

  panel.classList.add('open');
}

function close() {
  panel.classList.remove('open');
  currentEl = null;
}

function isOpen() {
  return panel?.classList.contains('open') ?? false;
}

// === 辅助 ===

function setNum(id, val) {
  const el = $(id);
  if (el) el.value = isNaN(val) ? 0 : Math.round(val);
}

function setSwatchColor(swatchId, textId, pickerId, val) {
  const hex = toHex(val);
  const swatch = $(swatchId);
  const text = $(textId);
  const picker = $(pickerId);
  if (swatch) swatch.style.background = hex;
  if (text) text.value = hex;
  if (picker) picker.value = hex;
}

function toHex(str) {
  if (!str || str === 'transparent') return '#000000';
  if (str.startsWith('#') && str.length === 7) return str;
  if (str.startsWith('#') && str.length === 4) {
    return '#' + str[1]+str[1] + str[2]+str[2] + str[3]+str[3];
  }
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '#000000';
  return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
}

function getDirectText(el) {
  let text = '';
  for (const node of el.childNodes) {
    if (node.nodeType === 3) text += node.textContent;
  }
  return text.trim();
}

function setDirectText(el, newText) {
  if (el.children.length === 0) { el.textContent = newText; return; }
  const textNodes = [];
  for (const node of el.childNodes) {
    if (node.nodeType === 3 && node.textContent.trim().length > 0) textNodes.push(node);
  }
  if (textNodes.length > 0) {
    textNodes[0].textContent = newText;
    for (let i = 1; i < textNodes.length; i++) textNodes[i].textContent = '';
  } else {
    el.insertBefore(document.createTextNode(newText), el.firstChild);
  }
}

function matchFontFamily(selectEl, computedFF) {
  if (!selectEl || !computedFF) { selectEl && (selectEl.value = ''); return; }
  const primary = computedFF.split(',')[0].trim().replace(/['"]/g, '').toLowerCase();
  for (const option of selectEl.options) {
    if (!option.value) continue;
    const optPrimary = option.value.split(',')[0].trim().replace(/['"]/g, '').toLowerCase();
    if (primary === optPrimary) { selectEl.value = option.value; return; }
  }
  selectEl.value = '';
}

function extractUrlFromBg(bgValue) {
  const m = bgValue.match(/url\(\s*["']?(.*?)["']?\s*\)/);
  return m ? m[1] : bgValue;
}

function truncateUrl(url) {
  if (!url) return '无';
  if (url.startsWith('data:')) return '[data图片]';
  try { return decodeURIComponent(new URL(url, location.href).pathname.split('/').pop()) || url; }
  catch { return url.length > 40 ? url.slice(0, 40) + '...' : url; }
}

export { create, open, close, isOpen };