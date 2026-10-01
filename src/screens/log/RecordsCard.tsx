import type { RecordRow } from '../../domain/stats'
import { Card, Icon } from '../../ui'

export function RecordsCard({ records }: { records: readonly RecordRow[] }) {
  return (
    <Card as="section" className="flex flex-col gap-1">
      <h2 className="mb-2 text-xl font-extrabold">Fejlődés</h2>
      {records.length === 0 ? (
        <p className="border-t border-surface-muted pt-3 text-base leading-[1.45] text-ink-muted">
          A 4., 8. és 12. héten felmérjük az alkartámasz és a felgördülés eredményed — itt látod
          majd, mennyit fejlődtél.
        </p>
      ) : (
        records.map((r) => (
          <div key={r.en} className="flex items-center gap-3 border-t border-surface-muted py-2.5">
            <div className="flex grow flex-col gap-px">
              <span className="text-md font-bold">{r.name}</span>
              <span className="text-xs text-ink-muted">{r.en}</span>
            </div>
            <div className="flex items-center gap-1.5 text-base">
              <span className="text-ink-muted">{r.from}</span>
              <Icon name="arrowRight" size={14} />
              <span className="font-extrabold text-accent-ink">{r.to}</span>
            </div>
          </div>
        ))
      )}
    </Card>
  )
}
