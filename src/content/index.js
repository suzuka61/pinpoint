// Pinpoint — Content Script Entry
// 注册所有 custom elements（不自动激活）
import './app.element.js'
import './toolbar/toolbar.element.js'
import './overlay/hover-overlay.element.js'
import './overlay/selected-overlay.element.js'
import './editor/editor.element.js'
import './color/color-popover.element.js'
import './overview/overview.element.js'

let app = document.querySelector('pinpoint-app')
if (!app) {
  app = document.createElement('pinpoint-app')
  app.setAttribute('data-pinpoint-ui', '')
  document.body.appendChild(app)
}

// 监听 popup 的激活/停用消息
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'activate') {
    app.activate()
    sendResponse({ ok: true })
  }
  if (msg.type === 'deactivate') {
    app.deactivate()
    sendResponse({ ok: true })
  }
  if (msg.type === 'ping') {
    sendResponse({ ok: true, active: app._active })
  }
})
