import { Outlet } from 'react-router'
import { BottomNav } from '../ui'

/** Layout for the three top-level tabs: content plus the bottom nav. */
export function TabLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
