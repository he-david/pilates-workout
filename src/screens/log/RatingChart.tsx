import type { RatingWeek, Trend } from '../../domain/stats'
import { Card } from '../../ui'

const WEEKS_SHOWN = 4

type Props = { weeks: readonly RatingWeek[]; trend: Trend }

export function RatingChart({ weeks, trend }: Props) {
  const shown = weeks.slice(-WEEKS_SHOWN)
  const lastWeek = shown[shown.length - 1]
  return (
    <Card as="section" className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-xl font-extrabold">Érzett nehézség</h2>
        <span className="text-sm text-ink-muted">
          edzésenként, 1 = nagyon könnyű, 5 = túl nehéz
        </span>
      </div>
      {shown.length === 0 ? (
        <p className="py-4 text-center text-base text-ink-muted">
          Az első mentett edzés után itt jelennek meg az értékelések.
        </p>
      ) : (
        <div role="img" aria-label="Érzett nehézség edzésenként" className="flex gap-2.5">
          {shown.map((w) => (
            <div
              key={w.week}
              style={{ flexGrow: w.ratings.length }}
              className="flex basis-0 flex-col gap-2"
            >
              <div className="flex h-[110px] items-end gap-2.5 border-b border-border pb-1">
                {w.ratings.map((r, i) => (
                  <div
                    key={i}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                  >
                    <span className="text-2xs font-bold text-ink-soft">{r}</span>
                    <div
                      style={{ height: r * 18 }}
                      className={`w-full rounded-t-[6px] rounded-b-[2px] ${
                        w === lastWeek && i === w.ratings.length - 1 ? 'bg-accent' : 'bg-accent/40'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <span className="text-xs text-ink-muted">{w.label}</span>
            </div>
          ))}
        </div>
      )}
      {shown.length > 0 && <p className="text-base leading-[1.45] text-ink-soft">{trend.text}</p>}
    </Card>
  )
}
