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
  app.activate()
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'activate') {
    if (!app) {
      app = document.querySelector('pinpoint-app')
    }
    if (app) app.activate()
  }
  if (msg.type === 'deactivate') {
    if (app) app.deactivate()
  }
})
