// Background service worker — state cache + cross-tab persistence
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'pinpoint:getState') {
    chrome.storage.local.get(msg.key, (result) => {
      sendResponse(result[msg.key] || null)
    })
    return true
  }
  if (msg.type === 'pinpoint:setState') {
    chrome.storage.local.set({ [msg.key]: msg.data }, () => {
      sendResponse({ ok: true })
    })
    return true
  }
})
