type Props = {
  plankSec: string
  rollUpReps: string
  onPlankSec: (v: string) => void
  onRollUpReps: (v: string) => void
}

const INPUT =
  'box-border h-12 w-full rounded-xl border border-border-strong bg-surface px-3.5 font-sans text-[16px] text-ink'

/** Assessment-week measurements (optional): they feed the "Fejlődés" list on the Log screen. */
export function MeasureFields({ plankSec, rollUpReps, onPlankSec, onRollUpReps }: Props) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-[18px]">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-xl font-extrabold">Felmérő eredmények</h2>
        <p className="text-sm text-ink-muted">Opcionális — a Napló „Fejlődés” listájában látod.</p>
      </div>
      <label className="flex flex-col gap-1.5 text-base font-bold" htmlFor="plank-mp">
        Plank tartás (mp)
        <input
          id="plank-mp"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={plankSec}
          onChange={(e) => onPlankSec(e.target.value)}
          className={INPUT}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-base font-bold" htmlFor="rollup-ism">
        Tiszta Roll Up ismétlés
        <input
          id="rollup-ism"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={rollUpReps}
          onChange={(e) => onRollUpReps(e.target.value)}
          className={INPUT}
        />
      </label>
    </section>
  )
}
