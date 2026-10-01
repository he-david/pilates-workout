import { useEffect } from 'react'
import { createWakeLock } from './wakeLock'

/** Keep the screen awake while `active` is true. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const lock = createWakeLock()
    void lock.acquire()
    return () => {
      void lock.release()
    }
  }, [active])
}
