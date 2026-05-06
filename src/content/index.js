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
