const bus = document

export function emit(name, detail = {}) {
  bus.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }))
}

export function on(name, handler) {
  bus.addEventListener(name, handler)
}

export function off(name, handler) {
  bus.removeEventListener(name, handler)
}
