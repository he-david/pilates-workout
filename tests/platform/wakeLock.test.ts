import { afterEach, describe, expect, it, vi } from 'vitest'
import { createWakeLock } from '../../src/platform/wakeLock'

function setState(s: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: s, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

function mockNative() {
  const sentinel = {
    released: false,
    release: vi.fn(async () => {
      sentinel.released = true
    }),
  }
  const request = vi.fn(async () => {
    sentinel.released = false
    return sentinel
  })
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
  return { request, sentinel }
}

afterEach(() => {
  setState('visible')
  Reflect.deleteProperty(navigator, 'wakeLock')
  vi.restoreAllMocks()
})

describe('wakeLock', () => {
  it('acquires natively and is idempotent', async () => {
    const { request } = mockNative()
    const lock = createWakeLock()
    expect(await lock.acquire()).toBe('native')
    await lock.acquire()
    expect(request).toHaveBeenCalledTimes(1)
    expect(lock.status()).toBe('native')
  })

  it('re-acquires when the page becomes visible again after the sentinel is released', async () => {
    const { request, sentinel } = mockNative()
    const lock = createWakeLock()
    await lock.acquire()
    sentinel.released = true // browser releases it when hidden
    setState('visible')
    await Promise.resolve()
    await Promise.resolve()
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('releases and stops re-acquiring', async () => {
    const { request, sentinel } = mockNative()
    const lock = createWakeLock()
    await lock.acquire()
    await lock.release()
    expect(sentinel.release).toHaveBeenCalled()
    expect(lock.status()).toBe('none')
    setState('visible')
    await Promise.resolve()
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('never throws when the native request rejects and no fallback exists', async () => {
    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    })
    const lock = createWakeLock()
    expect(await lock.acquire()).toBe('none')
  })

  it('uses the video fallback when wakeLock is unsupported', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    HTMLCanvasElement.prototype.captureStream = vi.fn(() => ({}) as MediaStream)
    const lock = createWakeLock()
    expect(await lock.acquire()).toBe('fallback')
    expect(play).toHaveBeenCalled()
    expect(document.querySelector('video')).not.toBeNull()
    await lock.release()
    expect(document.querySelector('video')).toBeNull()
    Reflect.deleteProperty(HTMLCanvasElement.prototype, 'captureStream')
  })

  it('reports none when nothing is supported', async () => {
    expect(await createWakeLock().acquire()).toBe('none')
  })
})
