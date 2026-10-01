import { afterEach, describe, expect, it, vi } from 'vitest'
import { onHidden, onVisible } from '../../src/platform/visibility'

function setState(s: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: s, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

afterEach(() => setState('visible'))

describe('visibility', () => {
  it('fires onVisible/onHidden only for their state and unsubscribes', () => {
    const v = vi.fn()
    const h = vi.fn()
    const offV = onVisible(v)
    const offH = onHidden(h)
    setState('hidden')
    expect([v.mock.calls.length, h.mock.calls.length]).toEqual([0, 1])
    setState('visible')
    expect([v.mock.calls.length, h.mock.calls.length]).toEqual([1, 1])
    offV()
    offH()
    setState('hidden')
    setState('visible')
    expect([v.mock.calls.length, h.mock.calls.length]).toEqual([1, 1])
  })
})
