import type { Stats } from '../../domain/stats'

export function StatTiles({ stats }: { stats: Stats }) {
  return (
    <section className="grid grid-cols-2 gap-2.5">
      <div className="flex flex-col gap-1 rounded-2xl bg-pink-soft p-4 text-warn-deep">
        <span className="text-sm font-bold opacity-[0.88]">Sorozat</span>
        <span className="text-3xl font-extrabold">{stats.streak} edzés</span>
        <span className="text-xs opacity-[0.88]">
          {stats.streak > 0 ? 'egyet sem hagyott ki' : 'az első edzés elindítja'}
        </span>
      </div>
      <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4">
        <span className="text-sm font-bold text-ink-muted">Összes idő</span>
        <span className="text-3xl font-extrabold">{stats.totalLabel}</span>
        <span className="text-xs text-ink-muted">
          {stats.done} / {stats.total} edzés
        </span>
      </div>
    </section>
  )
}
