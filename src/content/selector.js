/**
 * 选择器生成 — 从 DOM 元素推导出精简、稳定的 CSS 选择器
 */

// 需要排除的随机 class 模式
const RANDOM_CLASS_RE = /^(_|[a-z]{1,2}-|css-|sc-|styled-|emotion-|makeStyles-)/;

function generateSelector(el) {
  if (!el || el === document.body || el === document.documentElement) {
    return el.tagName.toLowerCase();
  }

  // 优先 id
  if (el.id && !/^\d/.test(el.id)) {
    return `#${el.id}`;
  }

  // class 组合，过滤随机 class
  const stableClasses = el.classList
    ? Array.from(el.classList).filter(c => !RANDOM_CLASS_RE.test(c))
    : [];

  if (stableClasses.length > 0) {
    const selector = `${el.tagName.toLowerCase()}.${stableClasses.join('.')}`;
    if (isUnique(selector)) return selector;
  }

  // 带 parent 的 class 组合（最多3层）
  const parent = el.parentElement;
  if (parent && parent !== document.body) {
    const parentSelector = generateSelector(parent);
    if (stableClasses.length > 0) {
      const selector = `${parentSelector} > ${el.tagName.toLowerCase()}.${stableClasses.join('.')}`;
      if (isUnique(selector)) return selector;
    }
    // tag + nth-child
    const idx = amongSiblings(el);
    const selector = `${parentSelector} > ${el.tagName.toLowerCase()}:nth-child(${idx})`;
    if (isUnique(selector)) return selector;
  }

  // fallback: tag + nth-child from root
  const idx = amongSiblings(el);
  return `${el.tagName.toLowerCase()}:nth-child(${idx})`;
}

function isUnique(selector) {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

function amongSiblings(el) {
  let count = 0;
  let sibling = el.parentElement?.firstElementChild;
  while (sibling) {
    count++;
    if (sibling === el) return count;
    sibling = sibling.nextElementSibling;
  }
  return 1;
}

function getElementDescription(el) {
  // 用于导出 Prompt 时的人类可读描述
  const tag = el.tagName.toLowerCase();
  const text = el.textContent?.trim().slice(0, 30) || '';
  const role = el.getAttribute('role') || '';
  const ariaLabel = el.getAttribute('aria-label') || '';

  if (ariaLabel) return `<${tag}> "${ariaLabel}"`;
  if (role) return `<${tag} role="${role}">`;
  if (text) return `<${tag}> "${text}"`;
  return `<${tag}>`;
}

export { generateSelector, getElementDescription };