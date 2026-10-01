import { Link } from 'react-router'
import { ASSESSMENT_WEEKS, phases, WEEKS } from '../../content/program'
import { phaseHint } from '../../domain/todaySummary'
import type { ProgramProgress } from '../../domain/schedule'
import { Card } from '../../ui'

type Props = { progress: ProgramProgress; fractions: readonly number[] }

export function PhaseCard({ progress, fractions }: Props) {
  const info = phases.find((p) => p.phase === progress.currentPhase) ?? phases[0]
  if (!info) return null
  return (
    <Card as="section" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-extrabold">
          {info.phase}. fázis · {info.title}
        </h3>
        <Link to="/program" className="-my-3.5 py-3.5 text-base font-bold text-link no-underline">
          Program
        </Link>
      </div>
      <div className="grid grid-cols-12 gap-1" aria-hidden="true">
        {fractions.map((f, i) => (
          <div
            key={i}
            className={`h-2 rounded-sm ${(i + 1) % 4 === 1 && i > 0 ? 'ml-1' : ''}`}
            style={{
              background:
                f >= 1
                  ? 'var(--color-accent)'
                  : f <= 0
                    ? 'var(--color-border)'
                    : `linear-gradient(90deg, var(--color-accent) ${Math.round(f * 100)}%, var(--color-border) ${Math.round(f * 100)}%)`,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-sm font-semibold text-ink-muted">
        <span>
          {progress.done} / {progress.total} edzés
        </span>
        <span>
          {progress.currentWeek}. hét a {WEEKS}-ből
        </span>
      </div>
      <p className="text-base leading-[1.45] text-ink-soft">
        {phaseHint(progress.currentWeek, info, ASSESSMENT_WEEKS)}
      </p>
    </Card>
  )
}
