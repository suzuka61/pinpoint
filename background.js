// Pinpoint background service worker
// Currently minimal — will handle cross-origin image proxy for eyedropper

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'ping') {
    sendResponse({ status: 'ok' });
  }
});