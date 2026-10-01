import { AREA_OPTIONS } from '../../domain/finish'

type Props = { selected: readonly string[]; onToggle: (area: string) => void }

export function AreaChips({ selected, onToggle }: Props) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-[18px]">
      <h2 className="text-xl font-extrabold">Hol érezted leginkább?</h2>
      <div className="flex flex-wrap gap-2">
        {AREA_OPTIONS.map((a) => {
          const on = selected.includes(a)
          return (
            <button
              key={a}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(a)}
              className={`min-h-11 rounded-full border-[1.5px] px-4 text-base font-bold text-ink touch-manipulation ${
                on ? 'border-accent bg-accent-soft' : 'border-border-strong bg-surface'
              }`}
            >
              {a}
            </button>
          )
        })}
      </div>
    </section>
  )
}
