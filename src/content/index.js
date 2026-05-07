/**
 * Pinpoint Content Script 入口
 * popup 点击图标激活，再次点击关闭
 */

// 防止 executeScript 重复注入
if (window.__pinpoint_loaded) {
  // 已注入，只注册消息监听（重新注册不冲突）
} else {
  window.__pinpoint_loaded = true;
}

import { init as overlayInit, showHover, hideHover, select, deselect, updateSelectedPosition } from './overlay.js';
import { create as panelCreate, open as panelOpen, close as panelClose } from './panel.js';

let active = false;
let initialized = false;
let overlayHost = null;

function isSelectable(el) {
  if (!el || el === document.body || el === document.documentElement) return false;
  const tag = el.tagName.toLowerCase();
  if (['script', 'style', 'meta', 'link', 'noscript', 'br', 'hr'].includes(tag)) return false;
  if (el.closest('#pinpoint-panel-host')) return false;
  if (el.closest('#pinpoint-overlay-host')) return false;
  if (el.closest('[id^="pinpoint-"]')) return false;
  return true;
}

function activate() {
  if (active) return;
  active = true;

  if (!initialized) {
    initialized = true;
    overlayHost = document.createElement('div');
    overlayHost.id = 'pinpoint-overlay-host';
    overlayHost.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;';
    document.body.appendChild(overlayHost);
    overlayInit(overlayHost, onSelectionChange);
    panelCreate();
  }

  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);
}

function deactivate() {
  if (!active) return;
  active = false;
  hideHover();
  deselect();
  panelClose();

  document.removeEventListener('mousemove', onMouseMove, true);
  document.removeEventListener('click', onClick, true);
  document.removeEventListener('keydown', onKeyDown, true);
}

function onMouseMove(e) {
  // 面板内部的鼠标移动不触发 hover
  if (e.target.closest?.('#pinpoint-panel-host')) { hideHover(); return; }
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (el && isSelectable(el)) {
    showHover(el);
  } else {
    hideHover();
  }
}

function onClick(e) {
  // 面板内部的点击不拦截（e.target 在 shadow DOM 事件中会重定向到 host）
  if (e.target.closest?.('#pinpoint-panel-host')) return;

  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (!el || !isSelectable(el)) {
    e.preventDefault();
    e.stopPropagation();
    deselect();
    panelClose();
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  select(el);
  panelOpen(el);
}

function onKeyDown(e) {
  if (e.key === 'Escape') {
    deselect();
    panelClose();
  }
}

function onSelectionChange(el) {
  if (el) panelOpen(el);
  else panelClose();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'ping') {
    sendResponse({ status: 'ok', active });
  }
  if (msg.type === 'toggle') {
    if (active) deactivate();
    else activate();
    sendResponse({ active });
  }
  if (msg.type === 'status') {
    sendResponse({ active });
  }
  return true;
});

window.addEventListener('resize', () => {
  if (active) updateSelectedPosition();
});