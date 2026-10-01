function subscribe(state: DocumentVisibilityState, cb: () => void): () => void {
  if (typeof document === 'undefined') return () => undefined
  const handler = () => {
    if (document.visibilityState === state) cb()
  }
  document.addEventListener('visibilitychange', handler)
  return () => document.removeEventListener('visibilitychange', handler)
}

/** Call `cb` whenever the page becomes visible. Returns an unsubscribe function. */
export function onVisible(cb: () => void): () => void {
  return subscribe('visible', cb)
}

/** Call `cb` whenever the page becomes hidden. Returns an unsubscribe function. */
export function onHidden(cb: () => void): () => void {
  return subscribe('hidden', cb)
}

export function isVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState === 'visible'
}
