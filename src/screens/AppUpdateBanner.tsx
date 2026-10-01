import { useAppUpdate } from '../platform/useAppUpdate'
import { UpdateBanner } from '../ui'

/** Connects the service worker update state to the banner. */
export function AppUpdateBanner() {
  const { needRefresh, applyUpdate } = useAppUpdate()
  return <UpdateBanner visible={needRefresh} onUpdate={applyUpdate} />
}
