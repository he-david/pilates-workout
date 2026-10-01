import { dayNameShort } from '../../domain/format'
import { Card, Icon } from '../../ui'

type Props = {
  trainingDays: readonly number[]
  time: string
  on: boolean
  onToggle: (on: boolean) => void
}

/** Monday-first short names: "H · Cs · Szo". */
function daysLabel(days: readonly number[]): string {
  return [...days]
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map(dayNameShort)
    .join(' · ')
}

export function ReminderCard({ trainingDays, time, on, onToggle }: Props) {
  return (
    <Card as="section" className="flex items-center gap-3.5 py-3.5!">
      <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-accent-soft text-accent-ink">
        <Icon name="bell" size={20} />
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="text-md font-bold">Emlékeztető</div>
        <div className="text-sm text-ink-muted">
          {daysLabel(trainingDays)}, {time}
        </div>
      </div>
      <button
        type="button"
        aria-pressed={on}
        aria-label={on ? 'Emlékeztető bekapcsolva' : 'Emlékeztető kikapcsolva'}
        onClick={() => onToggle(!on)}
        className={`flex h-8 min-w-[52px] touch-manipulation relative cursor-pointer rounded-full border-none p-[3px] after:absolute after:-inset-1.5 after:content-[''] ${
          on ? 'justify-end bg-accent' : 'justify-start bg-border-strong'
        }`}
      >
        <span className="block h-[26px] w-[26px] rounded-full bg-surface" />
      </button>
    </Card>
  )
}
