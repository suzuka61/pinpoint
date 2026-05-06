document.getElementById('activate').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/content/index.js'],
    })
  }
  window.close()
})

document.getElementById('deactivate').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { type: 'deactivate' })
  }
  window.close()
})
