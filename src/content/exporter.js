/**
 * 导出器 — 修改记录 → 结构化 Prompt
 * 支持 CSS 属性 + textContent + src + background-image
 */

import { getAll } from './changes.js';

function generatePrompt() {
  const changes = getAll();
  if (changes.length === 0) return '';

  const grouped = {};
  for (const c of changes) {
    if (!grouped[c.selector]) {
      grouped[c.selector] = { description: c.description, items: [] };
    }
    grouped[c.selector].items.push(c);
  }

  let prompt = '请修改以下样式：\n';
  let i = 1;

  for (const [selector, group] of Object.entries(grouped)) {
    prompt += `\n${i}. ${selector}`;
    if (group.description) prompt += `  /* ${group.description} */`;
    prompt += '\n';

    for (const item of group.items) {
      prompt += formatItem(item);
    }
    i++;
  }

  return prompt;
}

function formatItem(item) {
  const { property, oldValue, newValue } = item;

  if (property === 'textContent') {
    return `   - 文字内容: "${oldValue}" → "${newValue}"\n`;
  }
  if (property === 'src') {
    return `   - 图片地址: ${truncateUrl(oldValue)} → [本地图片]\n`;
  }
  if (property === 'background-image') {
    return `   - 背景图片: ${truncateUrl(oldValue)} → url([本地图片])\n`;
  }

  // Standard CSS property
  return `   - ${property}: ${oldValue} → ${newValue}\n`;
}

function truncateUrl(url) {
  if (!url) return 'none';
  if (url.startsWith('data:')) return '[data image]';
  // Strip url() wrapper if present
  const m = url.match(/^url\(\s*["']?(.*?)["']?\s*\)$/);
  const clean = m ? m[1] : url;
  try {
    const path = new URL(clean, location.href).pathname;
    return decodeURIComponent(path.split('/').pop()) || clean;
  } catch {
    return clean.length > 40 ? clean.slice(0, 40) + '...' : clean;
  }
}

function copyToClipboard() {
  const prompt = generatePrompt();
  if (!prompt) return false;

  navigator.clipboard.writeText(prompt).then(() => {
    showToast('已复制到剪贴板');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = prompt;
    ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('已复制到剪贴板');
  });
  return true;
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:#ffffff;color:#1a1a2e;padding:8px 20px;border-radius:8px;
    font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.12);z-index:2147483647;pointer-events:none;
    animation:pp-fade 2s forwards;
  `;
  if (!document.getElementById('pinpoint-toast-style')) {
    const s = document.createElement('style');
    s.id = 'pinpoint-toast-style';
    s.textContent = '@keyframes pp-fade {0%,70%{opacity:1} 100%{opacity:0}}';
    document.head.appendChild(s);
  }
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

export { generatePrompt, copyToClipboard };