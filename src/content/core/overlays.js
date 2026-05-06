export function getOverlayRect(rect, padding = 2) {
  return {
    x: rect.left - padding,
    y: rect.top - padding,
    w: rect.width + padding * 2,
    h: rect.height + padding * 2,
  }
}
