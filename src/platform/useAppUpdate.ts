import { useRegisterSW } from 'virtual:pwa-register/react'

/** Registers the service worker and reports when a new version is waiting. */
export function useAppUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  return { needRefresh, applyUpdate: () => updateServiceWorker(true) }
}
