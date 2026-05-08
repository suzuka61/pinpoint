/**
 * Overlay — hover 高亮 + 选中态 + 间距可视化
 */

let hoverEl = null;
let selectedEl = null;
let onChange = null;
let eyedropperActive = false;

const hoverOverlay = createOverlay('pinpoint-hover', 'rgba(34,197,94,0.08)', '1px dashed #22c55e');
const selectOverlay = createOverlay('pinpoint-select', 'rgba(34,197,94,0.05)', '1px dashed #22c55e');
const OVERLAY_Z_INDEX = 2147483640;
const SPACING_Z_INDEX = 2147483639;

// Hover tooltip — 显示元素标签 + 尺寸
const hoverTooltip = document.createElement('div');
hoverTooltip.style.cssText = `
  position: fixed;
  pointer-events: none;
  z-index: 2147483647;
  background: #18181b;
  color: #e4e4e7;
  font-size: 10px;
  font-family: system-ui, sans-serif;
  padding: 2px 6px;
  border-radius: 3px;
  line-height: 1.4;
  white-space: nowrap;
  display: none;
`;

// 间距可视化 overlay
const spacingOverlays = {};
const SPACING_STYLE = {
  margin:  { bg: 'rgba(251,146,60,0.18)', label: '#fb923c' },
  padding: { bg: 'rgba(45,212,191,0.18)',  label: '#2dd4bf' },
};

function createOverlay(id, bg, border) {
  const el = document.createElement('div');
  el.id = id;
  el.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: ${OVERLAY_Z_INDEX};
    border: ${border};
    background: ${bg};
    border-radius: 2px;
    transition: all 0.1s ease;
    display: none;
  `;
  return el;
}

function createSpacingArea(type) {
  const s = SPACING_STYLE[type];
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: ${SPACING_Z_INDEX};
    background: ${s.bg};
    display: none;
    text-align: center;
    font-size: 10px;
    color: ${s.label};
    font-weight: 600;
    line-height: 1;
    overflow: hidden;
  `;
  return el;
}

function init(overlayHost, selectionCallback) {
  onChange = selectionCallback;
  overlayHost.appendChild(hoverOverlay);
  overlayHost.appendChild(selectOverlay);
  overlayHost.appendChild(hoverTooltip);

  for (const type of ['margin', 'padding']) {
    for (const side of ['top', 'right', 'bottom', 'left']) {
      const area = createSpacingArea(type);
      overlayHost.appendChild(area);
      spacingOverlays[`${type}-${side}`] = area;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

function onScroll() {
  if (selectedEl) {
    positionOverlay(selectOverlay, selectedEl);
    showSpacing(selectedEl);
  }
  if (hoverEl && !selectedEl) {
    positionOverlay(hoverOverlay, hoverEl);
  }
}

function setEyedropperActive(active) {
  eyedropperActive = active;
  if (active) {
    hideHover();
    if (selectOverlay) selectOverlay.style.display = 'none';
    hideSpacing();
  } else if (selectedEl) {
    selectOverlay.style.display = 'block';
    showSpacing(selectedEl);
  }
}

function showHover(el) {
  if (el === selectedEl) return;
  if (eyedropperActive) return;
  hoverEl = el;
  positionOverlay(hoverOverlay, el);
  hoverOverlay.style.display = 'block';
  const rect = el.getBoundingClientRect();
  const tag = el.tagName.toLowerCase();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  const id = el.id ? `#${el.id}` : '';
  const cls = el.classList.length ? `.${Array.from(el.classList).slice(0, 2).join('.')}` : '';
  hoverTooltip.textContent = `${tag}${id}${cls}  ${w}×${h}`;
  hoverTooltip.style.display = 'block';
  hoverTooltip.style.left = (rect.left - 1) + 'px';
  hoverTooltip.style.top = (rect.top - 18) + 'px';
}

function hideHover() {
  hoverEl = null;
  hoverOverlay.style.display = 'none';
  hoverTooltip.style.display = 'none';
}

function select(el) {
  selectedEl = el;
  if (eyedropperActive) return;
  positionOverlay(selectOverlay, el);
  selectOverlay.style.display = 'block';
  hoverOverlay.style.display = 'none';
  showSpacing(el);
  onChange?.(el);
}

function deselect() {
  selectedEl = null;
  selectOverlay.style.display = 'none';
  hideSpacing();
  onChange?.(null);
}

// === 间距可视化 ===

function showSpacing(el) {
  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(el);

  const mt = parseFloat(cs.marginTop) || 0;
  const mr = parseFloat(cs.marginRight) || 0;
  const mb = parseFloat(cs.marginBottom) || 0;
  const ml = parseFloat(cs.marginLeft) || 0;
  const pt = parseFloat(cs.paddingTop) || 0;
  const pr = parseFloat(cs.paddingRight) || 0;
  const pb = parseFloat(cs.paddingBottom) || 0;
  const pl = parseFloat(cs.paddingLeft) || 0;

  // margin：在元素外侧
  pos('margin-top',    rect.left - ml, rect.top - mt, rect.width + ml + mr, mt, mt);
  pos('margin-bottom', rect.left - ml, rect.bottom,   rect.width + ml + mr, mb, mb);
  pos('margin-left',   rect.left - ml, rect.top,      ml, rect.height, ml);
  pos('margin-right',  rect.right,     rect.top,      mr, rect.height, mr);

  // padding：在元素内侧
  pos('padding-top',    rect.left, rect.top,         rect.width, pt, pt);
  pos('padding-bottom', rect.left, rect.bottom - pb, rect.width, pb, pb);
  pos('padding-left',   rect.left, rect.top + pt,    pl, rect.height - pt - pb, pl);
  pos('padding-right',  rect.right - pr, rect.top + pt, pr, rect.height - pt - pb, pr);
}

function pos(key, left, top, width, height, value) {
  const area = spacingOverlays[key];
  if (!area) return;
  if (value <= 0 || width < 2 || height < 2) {
    area.style.display = 'none';
    area.textContent = '';
    return;
  }
  area.style.display = 'block';
  area.style.left = Math.round(left) + 'px';
  area.style.top = Math.round(top) + 'px';
  area.style.width = Math.round(width) + 'px';
  area.style.height = Math.round(height) + 'px';
  area.textContent = (width >= 24 && height >= 14) ? Math.round(value) + '' : '';
}

function hideSpacing() {
  for (const key in spacingOverlays) {
    spacingOverlays[key].style.display = 'none';
  }
}

function updateSpacing() {
  if (selectedEl) showSpacing(selectedEl);
}

// === 通用 ===

function positionOverlay(overlay, el) {
  const rect = el.getBoundingClientRect();
  overlay.style.top = rect.top + 'px';
  overlay.style.left = rect.left + 'px';
  overlay.style.width = rect.width + 'px';
  overlay.style.height = rect.height + 'px';
}

function updateSelectedPosition() {
  if (selectedEl) {
    positionOverlay(selectOverlay, selectedEl);
    showSpacing(selectedEl);
  }
}

function getSelected() { return selectedEl; }

export { init, showHover, hideHover, select, deselect, getSelected, updateSelectedPosition, updateSpacing, setEyedropperActive };