const selectedEls = []

export function getSelected() {
  return selectedEls
}

export function setSelected(els) {
  selectedEls.length = 0
  selectedEls.push(...els)
}

export function clearSelected() {
  selectedEls.length = 0
}