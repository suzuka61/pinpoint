/**
 * 修改记录管理
 */

const changes = []; // { selector, description, property, oldValue, newValue }

function add(selector, description, property, oldValue, newValue) {
  // 如果同一元素同一属性已存在，更新而非追加
  const existing = changes.find(
    c => c.selector === selector && c.property === property
  );
  if (existing) {
    existing.newValue = newValue;
    existing.description = description;
  } else {
    changes.push({ selector, description, property, oldValue, newValue });
  }
}

function remove(index) {
  changes.splice(index, 1);
}

function clear() {
  changes.length = 0;
}

function getAll() {
  return [...changes];
}

function getBySelector(selector) {
  return changes.filter(c => c.selector === selector);
}

export { add, remove, clear, getAll, getBySelector };