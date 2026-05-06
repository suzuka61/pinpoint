import { debounce } from '../core/utils.js'

const STORAGE_KEY = 'pinpoint_state'

export function pushToBackground(url, records) {
  const data = { url, records: serializeRecords(records), timestamp: Date.now() }
  chrome.storage.local.set({ [STORAGE_KEY + ':' + url]: data })
}

export const syncToBackground = debounce(pushToBackground, 500)

export async function loadFromBackground(url) {
  const result = await chrome.storage.local.get(STORAGE_KEY + ':' + url)
  return result[STORAGE_KEY + ':' + url]?.records || null
}

function serializeRecords(records) {
  const out = {}
  for (const [id, rec] of records) {
    out[id] = { ...rec, el: undefined }
  }
  return out
}
