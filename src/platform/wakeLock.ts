import { isVisible, onVisible } from './visibility'

export type WakeLockStatus = 'native' | 'fallback' | 'none'

export interface WakeLockController {
  acquire(): Promise<WakeLockStatus>
  release(): Promise<void>
  status(): WakeLockStatus
}

/**
 * Fallback for browsers without the Screen Wake Lock API (NoSleep.js approach): a muted,
 * looping, inline video keeps the screen on. Instead of a bundled video file the stream
 * comes from a tiny canvas via captureStream().
 * TODO: if captureStream does not keep an iPhone awake in Home Screen mode, ship a tiny
 * looping mp4 in public/ and set it as `video.src` here.
 */
function createFallbackVideo(): HTMLVideoElement | null {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 2
    if (typeof canvas.captureStream !== 'function') return null
    const ctx = canvas.getContext('2d')
    ctx?.fillRect(0, 0, 2, 2)
    const video = document.createElement('video')
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.setAttribute('muted', '')
    video.setAttribute('aria-hidden', 'true')
    video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0.01;pointer-events:none;'
    video.srcObject = canvas.captureStream(1)
    document.body.appendChild(video)
    return video
  } catch {
    return null
  }
}

export function createWakeLock(): WakeLockController {
  let wanted = false
  let current: WakeLockStatus = 'none'
  let sentinel: WakeLockSentinel | null = null
  let video: HTMLVideoElement | null = null
  let unsubscribe: (() => void) | null = null
  let pending: Promise<WakeLockStatus> | null = null

  async function request(): Promise<WakeLockStatus> {
    try {
      if (typeof navigator !== 'undefined' && navigator.wakeLock?.request) {
        if (sentinel && !sentinel.released) return 'native'
        sentinel = await navigator.wakeLock.request('screen')
        return 'native'
      }
    } catch {
      // fall through to the video fallback
    }
    try {
      if (typeof document === 'undefined') return 'none'
      video ??= createFallbackVideo()
      if (!video) return 'none'
      await video.play()
      return 'fallback'
    } catch {
      return 'none'
    }
  }

  function run(): Promise<WakeLockStatus> {
    pending ??= request().then((s) => {
      pending = null
      current = wanted ? s : 'none'
      return current
    })
    return pending
  }

  return {
    async acquire() {
      if (wanted) return current
      wanted = true
      unsubscribe = onVisible(() => {
        if (wanted) void run()
      })
      if (!isVisible()) return current
      return run()
    },
    async release() {
      wanted = false
      unsubscribe?.()
      unsubscribe = null
      current = 'none'
      const s = sentinel
      sentinel = null
      try {
        await s?.release()
      } catch {
        // ignore
      }
      try {
        video?.pause()
        video?.remove()
      } catch {
        // ignore
      }
      video = null
    },
    status: () => current,
  }
}
