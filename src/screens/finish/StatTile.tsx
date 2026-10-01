type StatTileProps = { value: string; label: string; tone?: 'default' | 'streak' }

export function StatTile({ value, label, tone = 'default' }: StatTileProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl border border-border bg-surface px-2.5 py-3.5">
      <span
        className={`text-2xl font-extrabold ${tone === 'streak' ? 'text-streak-ink' : 'text-ink'}`}
      >
        {value}
      </span>
      <span className="text-xs font-semibold text-ink-muted">{label}</span>
    </div>
  )
}
