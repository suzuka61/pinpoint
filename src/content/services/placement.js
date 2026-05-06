export function placeNear(rect, elWidth, elHeight, viewport = { w: window.innerWidth, h: window.innerHeight }) {
  const gap = 8
  let x = rect.right + gap
  let y = rect.top

  if (x + elWidth > viewport.w) x = rect.left - elWidth - gap
  if (y + elHeight > viewport.h) y = viewport.h - elHeight - gap
  if (x < 0) x = gap
  if (y < 0) y = gap

  return { x, y }
}
