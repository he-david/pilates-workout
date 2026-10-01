import { RATING_OPTIONS } from '../../domain/finish'
import type { Rating } from '../../domain/types'

type Props = { value: Rating; onChange: (r: Rating) => void }

export function RatingPicker({ value, onChange }: Props) {
  const chosen = RATING_OPTIONS.find((o) => o.value === value) ?? RATING_OPTIONS[2]
  return (
    <section className="flex flex-col gap-3.5 rounded-3xl border border-border bg-surface p-[18px]">
      <h2 className="text-xl font-extrabold">Mennyire volt nehéz?</h2>
      <div role="radiogroup" aria-label="Érzett nehézség" className="grid grid-cols-5 gap-1.5">
        {RATING_OPTIONS.map((o) => {
          const on = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={`flex h-16 flex-col items-center justify-center gap-0.5 rounded-lg border-2 text-ink touch-manipulation ${
                on ? 'border-accent bg-accent' : 'border-border bg-surface'
              }`}
            >
              <span className="text-[18px] font-extrabold">{o.value}</span>
              <span className="text-2xs font-bold">{o.short}</span>
            </button>
          )
        })}
      </div>
      {chosen && (
        <div className="flex flex-col gap-0.5 rounded-lg bg-accent-soft px-3.5 py-3">
          <div className="text-base font-extrabold">{chosen.label}</div>
          <div className="text-base leading-[1.45] text-ink-soft">{chosen.hint}</div>
        </div>
      )}
    </section>
  )
}
