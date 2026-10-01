type UpdateBannerProps = { visible: boolean; onUpdate: () => void }

/** Shown at the top of the screen when a new service worker is waiting. */
export function UpdateBanner({ visible, onUpdate }: UpdateBannerProps) {
  if (!visible) return null
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[calc(env(safe-area-inset-top)+8px)]"
    >
      <button
        type="button"
        onClick={onUpdate}
        className="flex min-h-11 w-full max-w-[420px] items-center justify-center rounded-xl bg-ink px-4 text-md font-bold text-surface touch-manipulation"
      >
        Új verzió – frissítés
      </button>
    </div>
  )
}
