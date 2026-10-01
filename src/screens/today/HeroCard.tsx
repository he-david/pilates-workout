import { Link } from 'react-router'
import { exercises, getExercise } from '../../content/exercises'
import { program } from '../../content/program'
import { minutesLabel } from '../../domain/format'
import {
  equipmentLabel,
  previousSameSlot,
  sessionEquipment,
  sessionItems,
  sessionSeconds,
  slotNumber,
  whatsNewText,
} from '../../domain/todaySummary'
import type { ProgramSession } from '../../domain/types'
import { Icon } from '../../ui'

const nameOf = (id: string) => getExercise(id)?.nameHu ?? id

/** `resume`: a saved player snapshot exists for this session, so the main action is "Folytatás". */
export function HeroCard({
  session,
  resume = false,
}: {
  session: ProgramSession
  resume?: boolean
}) {
  const news = whatsNewText(session, previousSameSlot(program, session), nameOf)
  return (
    <section className="flex flex-col gap-3.5 rounded-4xl bg-accent p-[22px] text-ink">
      <div className="text-sm font-bold tracking-label-wide uppercase opacity-85">
        {session.week}. hét · {session.slot} edzés · {slotNumber(session)}/3
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-4xl font-extrabold tracking-tight-display">{session.title}</h2>
        <p className="text-md leading-[1.45] opacity-92">{news}</p>
      </div>
      <div className="flex gap-[18px] text-base font-semibold">
        <div className="flex items-center gap-1.5">
          <Icon name="clock" size={18} />
          <span>{minutesLabel(sessionSeconds(session))}</span>
        </div>
        <div>{sessionItems(session).length} gyakorlat</div>
        <div>{equipmentLabel(sessionEquipment(session, exercises))}</div>
      </div>
      {resume && (
        <Link
          to={`/player/${session.id}`}
          className="flex h-[52px] touch-manipulation items-center justify-center gap-2 rounded-xl bg-surface text-lg font-extrabold text-accent-ink no-underline"
        >
          <Icon name="play" size={18} />
          <span>Folytatás</span>
        </Link>
      )}
      <Link
        to={`/session/${session.id}`}
        className={
          resume
            ? 'flex min-h-11 touch-manipulation items-center justify-center text-md font-bold text-ink underline'
            : 'flex h-[52px] touch-manipulation items-center justify-center gap-2 rounded-xl bg-surface text-lg font-extrabold text-accent-ink no-underline'
        }
      >
        {!resume && <Icon name="play" size={18} />}
        <span>Edzés megnyitása</span>
      </Link>
    </section>
  )
}
