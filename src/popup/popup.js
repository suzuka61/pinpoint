const btn = document.getElementById('activate')
const status = document.getElementById('status')

btn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab) return

  // Inject content script
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/content/index.js']
    })
    status.textContent = 'Pinpoint 已激活 ✓'
    btn.textContent = '已启用'
    btn.disabled = true
    btn.style.background = '#1e293b'
  } catch (e) {
    status.textContent = '无法在此页面启用: ' + e.message
  }
})