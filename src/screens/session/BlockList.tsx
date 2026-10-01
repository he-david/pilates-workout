import { Link } from 'react-router'
import type { OverviewBlock } from '../../domain/sessionOverview'
import { Chip } from '../../ui'

type Props = { block: OverviewBlock; sessionId: string }

export function BlockList({ block, sessionId }: Props) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-md font-extrabold text-ink-muted">{block.title}</h2>
      <ul className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
        {block.rows.map((row) => (
          <li key={row.exerciseId} className="border-b border-surface-muted last:border-b-0">
            <Link
              to={`/exercise/${row.exerciseId}?session=${sessionId}`}
              className="flex min-h-11 items-center gap-3 px-3.5 py-3 text-ink no-underline"
            >
              <span className="w-[26px] text-base font-extrabold text-ink-faint">{row.n}</span>
              <span className="flex grow flex-col gap-px">
                <span className="flex items-center gap-2 text-md font-bold">
                  <span>{row.nameHu}</span>
                  {row.badge && <Chip tone="pink">{row.badge}</Chip>}
                </span>
                <span className="text-xs text-ink-muted">{row.nameEn}</span>
              </span>
              <span className="text-right text-sm font-bold text-ink-soft">{row.dose}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
