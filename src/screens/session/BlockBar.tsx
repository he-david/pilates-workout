import type { OverviewBlock } from '../../domain/sessionOverview'

const COLORS = ['bg-pink-bar', 'bg-accent', 'bg-bar-empty']

export function BlockBar({ blocks }: { blocks: OverviewBlock[] }) {
  return (
    <section aria-label="Időbeosztás" className="flex flex-col gap-2">
      <div className="flex h-2.5 gap-1">
        {blocks.map((b, i) => (
          <div
            key={b.key}
            className={`rounded-[5px] ${COLORS[i] ?? ''}`}
            style={{ flexGrow: b.seconds, flexBasis: 0 }}
          />
        ))}
      </div>
      <div className="flex justify-between text-sm font-semibold text-ink-muted">
        {blocks.map((b) => (
          <span key={b.key}>
            {b.title} {b.short}
          </span>
        ))}
      </div>
    </section>
  )
}
