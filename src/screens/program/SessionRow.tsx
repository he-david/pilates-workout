import { Link } from 'react-router'
import type { SessionStatus } from '../../domain/schedule'
import type { ProgramSession } from '../../domain/types'

type Props = {
  session: ProgramSession
  status: SessionStatus
  /** weekday letter(s) of the planned day */
  day?: string
  isToday: boolean
}

const TONE: Record<SessionStatus, string> = {
  done: 'text-ink-muted',
  next: 'font-extrabold text-accent-ink',
  upcoming: 'text-ink',
}

export function SessionRow({ session, status, day, isToday }: Props) {
  const suffix = status === 'next' ? (isToday ? ' → ma' : ' → következő') : ''
  return (
    <Link
      to={`/session/${session.id}`}
      className={`flex min-h-11 items-center justify-between text-base no-underline ${TONE[status]}`}
    >
      <span>
        <span className={status === 'done' ? 'line-through' : undefined}>
          {session.slot} · {session.title}
        </span>
        {suffix}
      </span>
      <span>{day}</span>
    </Link>
  )
}
