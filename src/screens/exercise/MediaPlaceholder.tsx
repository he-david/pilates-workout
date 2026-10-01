import { Icon } from '../../ui'

/** Stand-in for the demo video: pink panel, play disc and caption (no real media yet). */
export function MediaPlaceholder() {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-2.5 bg-pink-tint">
      <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-surface text-accent-ink">
        <Icon name="play" size={26} />
      </div>
      <div className="text-sm font-bold text-ink-soft">[Bemutató videó helye]</div>
    </div>
  )
}
