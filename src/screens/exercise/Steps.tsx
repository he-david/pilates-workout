import { parseStep } from '../../domain/exerciseDetail'

export function Steps({ steps }: { steps: readonly string[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[18px] font-extrabold">Kivitelezés</h2>
      <ol className="flex list-none flex-col gap-3 p-0">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-extrabold text-ink">
              {i + 1}
            </span>
            <span className="text-md leading-normal">
              {parseStep(step).map((part, j) =>
                part.bold ? <b key={j}>{part.text}</b> : <span key={j}>{part.text}</span>,
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
