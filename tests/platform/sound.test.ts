import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { beep, chime, resetSoundForTests, unlockAudio } from '../../src/platform/sound'

const oscillators: { start: ReturnType<typeof vi.fn> }[] = []

class FakeCtx {
  state = 'suspended'
  currentTime = 0
  destination = {}
  resume = vi.fn(async () => {
    this.state = 'running'
  })
  createBuffer = vi.fn(() => ({}))
  createBufferSource = vi.fn(() => ({ connect: vi.fn(), start: vi.fn(), buffer: null }))
  createGain = vi.fn(() => ({
    connect: vi.fn(),
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  }))
  createOscillator = vi.fn(() => {
    const o = { type: '', frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() }
    oscillators.push(o)
    return o
  })
}

beforeEach(() => {
  oscillators.length = 0
  resetSoundForTests()
})
afterEach(() => {
  Reflect.deleteProperty(window, 'AudioContext')
})

describe('sound', () => {
  it('is a safe no-op without AudioContext or before unlock', async () => {
    expect(() => {
      beep('tick')
      chime()
    }).not.toThrow()
    expect(await unlockAudio()).toBe(false)
  })

  it('does not play before unlock, plays after', async () => {
    Object.defineProperty(window, 'AudioContext', { value: FakeCtx, configurable: true })
    beep('tick')
    expect(oscillators).toHaveLength(0)
    expect(await unlockAudio()).toBe(true)
    beep('tick')
    beep('go')
    expect(oscillators).toHaveLength(2)
    chime()
    expect(oscillators).toHaveLength(5)
  })
})
