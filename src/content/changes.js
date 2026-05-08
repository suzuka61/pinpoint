/**
 * 修改记录管理 — 支持撤销 / 重做
 */

const changes = [];   // 当前修改栈
const redoStack = []; // 重做栈

function add(selector, description, property, oldValue, newValue) {
  const existing = changes.find(
    c => c.selector === selector && c.property === property
  );
  if (existing) {
    existing.newValue = newValue;
  } else {
    changes.push({ selector, description, property, oldValue, newValue });
  }
  // 新操作清空重做栈
  redoStack.length = 0;
}

function applyChange(item, valueKey) {
  const el = document.querySelector(item.selector);
  if (!el) return;

  const val = item[valueKey];
  if (item.property === 'textContent') {
    const textNodes = [];
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.textContent.trim().length > 0) textNodes.push(node);
    }
    if (textNodes.length > 0) textNodes[0].textContent = val;
    else if (el.children.length === 0) el.textContent = val;
  } else if (item.property === 'src') {
    el.removeAttribute('srcset');
    el.removeAttribute('sizes');
    el.src = val;
  } else if (item.property === 'background-image') {
    el.style.setProperty('background-image', val, 'important');
  } else if (item.property === 'transform') {
    el.style.transform = val === 'none' ? '' : val;
  } else {
    el.style[item.property] = val === 'none' || val === 'auto' ? '' : val;
  }
}

function undo() {
  if (changes.length === 0) return null;
  const item = changes.pop();
  redoStack.push(item);
  applyChange(item, 'oldValue');
  return item;
}

function redo() {
  if (redoStack.length === 0) return null;
  const item = redoStack.pop();
  changes.push(item);
  applyChange(item, 'newValue');
  return item;
}

function canUndo() { return changes.length > 0; }
function canRedo() { return redoStack.length > 0; }

function clear() {
  changes.length = 0;
  redoStack.length = 0;
}

function getAll() { return [...changes]; }
function getBySelector(selector) { return changes.filter(c => c.selector === selector); }

export { add, undo, redo, canUndo, canRedo, clear, getAll, getBySelector };