// Pinpoint Popup

const toggleBtn = document.getElementById('toggle-btn');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

function updateUI(active) {
  if (active) {
    toggleBtn.textContent = '关闭选取';
    statusDot.classList.add('active');
    statusText.textContent = '已激活';
  } else {
    toggleBtn.textContent = '启动选取';
    statusDot.classList.remove('active');
    statusText.textContent = '未激活';
  }
}

async function getTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ? tab : null;
}

async function ensureScript(tabId) {
  try {
    const resp = await chrome.tabs.sendMessage(tabId, { type: 'ping' });
    if (resp?.status === 'ok') return;
  } catch {}

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content/index.js']
  });
  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ['content/styles/global.css']
  });
}

async function checkStatus() {
  const tab = await getTab();
  if (!tab) { updateUI(false); return; }
  try {
    await ensureScript(tab.id);
    const resp = await chrome.tabs.sendMessage(tab.id, { type: 'status' });
    updateUI(!!resp?.active);
  } catch { updateUI(false); }
}

toggleBtn.addEventListener('click', async () => {
  const tab = await getTab();
  if (!tab) return;
  try {
    await ensureScript(tab.id);
    const resp = await chrome.tabs.sendMessage(tab.id, { type: 'toggle' });
    updateUI(!!resp?.active);
  } catch { updateUI(false); }
});

checkStatus();