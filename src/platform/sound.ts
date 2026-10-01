export type BeepKind = 'tick' | 'go'

let ctx: AudioContext | null = null

function getContextClass(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { webkitAudioContext?: typeof AudioContext }
  return window.AudioContext ?? w.webkitAudioContext ?? null
}

/** Call from a tap handler: creates/resumes the AudioContext and plays a silent buffer. Never throws. */
export async function unlockAudio(): Promise<boolean> {
  try {
    if (!ctx) {
      const Ctor = getContextClass()
      if (!Ctor) return false
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') await ctx.resume()
    const src = ctx.createBufferSource()
    src.buffer = ctx.createBuffer(1, 1, 22050)
    src.connect(ctx.destination)
    src.start(0)
    return ctx.state === 'running'
  } catch {
    return false
  }
}

function tone(freq: number, start: number, duration: number, peak: number): void {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const t = ctx.currentTime + start
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

function ready(): boolean {
  return ctx !== null && ctx.state === 'running'
}

/** Countdown beep: 'tick' for 3-2-1, 'go' (higher, longer) for the final one. */
export function beep(kind: BeepKind): void {
  try {
    if (!ready()) return
    if (kind === 'tick') tone(660, 0, 0.12, 0.4)
    else tone(990, 0, 0.35, 0.5)
  } catch {
    // ignore
  }
}

/** End-of-workout chime: three rising notes. */
export function chime(): void {
  try {
    if (!ready()) return
    tone(523.25, 0, 0.4, 0.4)
    tone(659.25, 0.18, 0.4, 0.4)
    tone(783.99, 0.36, 0.7, 0.4)
  } catch {
    // ignore
  }
}

/** Test helper. */
export function resetSoundForTests(): void {
  ctx = null
}
