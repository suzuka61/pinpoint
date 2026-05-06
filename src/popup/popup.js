document.getElementById('activate').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab) { window.close(); return }

  // 先尝试发消息给已注入的 content script
  chrome.tabs.sendMessage(tab.id, { type: 'activate' }, (resp) => {
    if (chrome.runtime.lastError || !resp) {
      // content script 还没注入，手动注入
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content/index.js'],
      }, () => {
        // 注入后再发激活消息
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { type: 'activate' })
        }, 100)
      })
    }
  })
  window.close()
})

document.getElementById('deactivate').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { type: 'deactivate' })
  }
  window.close()
})
