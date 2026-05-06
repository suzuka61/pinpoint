export function createCodeTab(styleChanges) {
  const container = document.createElement('div')
  container.className = 'code-tab'
  const textarea = document.createElement('textarea')
  textarea.setAttribute('data-pinpoint-ui', '')
  textarea.style.cssText = 'width:100%;height:100%;background:#1e1e2e;color:#cdd6f4;border:none;padding:8px;font:12px monospace;resize:none;box-sizing:border-box;'

  const lines = Object.entries(styleChanges).map(([prop, { from, to }]) => `${prop}: ${to}  /* was: ${from} */`)
  textarea.value = lines.join('\n')

  container.appendChild(textarea)
  return container
}
