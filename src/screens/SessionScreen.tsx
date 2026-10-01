import { useLocation, useNavigate, useParams } from 'react-router'
import { exercises } from '../content/exercises'
import { getSession, program } from '../content/program'
import { useLogs, useToday } from '../data'
import { shortDate } from '../domain/format'
import { lastLogOf } from '../domain/schedule'
import { buildOverview } from '../domain/sessionOverview'
import { previousSameSlot } from '../domain/todaySummary'
import { ButtonLink, Chip, Icon } from '../ui'
import { BlockBar } from './session/BlockBar'
import { BlockList } from './session/BlockList'

const BACK_BUTTON =
  'flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-ink touch-manipulation'

function BackButton() {
  const navigate = useNavigate()
  const { key } = useLocation()
  // "default" key = first entry of the history stack, so there is nothing to go back to
  return (
    <button
      type="button"
      aria-label="Vissza"
      className={BACK_BUTTON}
      onClick={() => (key === 'default' ? navigate('/', { replace: true }) : navigate(-1))}
    >
      <Icon name="back" />
    </button>
  )
}

function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col gap-[18px] px-5 pt-[max(20px,env(safe-area-inset-top))] pb-6">
      <BackButton />
      <h1 className="text-3xl font-extrabold tracking-tight-display">Nem található az edzés</h1>
      <p className="text-md text-ink-muted">Ez az edzés nem létezik a programban.</p>
      <ButtonLink to="/" variant="secondary">
        Vissza a kezdőlapra
      </ButtonLink>
    </main>
  )
}

export function SessionScreen() {
  const { id = '' } = useParams()
  const session = getSession(id)
  const today = useToday()
  const logs = useLogs(today)
  if (!session) return <NotFound />
  if (!logs) return null
  const doneLog = lastLogOf(session.id, logs)

  const o = buildOverview(session, previousSameSlot(program, session), exercises)
  const firstId = o.blocks[0]?.rows[0]?.exerciseId

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex grow flex-col gap-[18px] px-5 pt-[max(20px,env(safe-area-inset-top))] pb-6">
        <BackButton />
        <header className="flex flex-col gap-1.5">
          <div className="text-sm font-extrabold tracking-label-wide text-accent-ink uppercase">
            {o.kicker}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight-display">{o.title}</h1>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {doneLog && (
              <Chip tone="pink">
                <Icon name="check" size={12} />
                <span className="ml-1">Kész · {shortDate(new Date(doneLog.finishedAt))}</span>
              </Chip>
            )}
            <Chip>{o.minutes}</Chip>
            <Chip>{o.exerciseCount} gyakorlat</Chip>
            <Chip>Nehézség {o.difficulty} / 5</Chip>
            <Chip>{o.equipment}</Chip>
          </div>
        </header>
        <BlockBar blocks={o.blocks} />
        {o.blocks.map((b) => (
          <BlockList key={b.key} block={b} sessionId={session.id} />
        ))}
      </main>
      <div className="sticky bottom-0 flex gap-2.5 border-t border-border bg-surface px-5 pt-3.5 pb-[max(28px,env(safe-area-inset-bottom))]">
        {firstId && (
          <ButtonLink
            to={`/exercise/${firstId}?session=${session.id}`}
            variant="secondary"
            className="grow"
          >
            Előnézet
          </ButtonLink>
        )}
        <ButtonLink to={`/player/${session.id}`} className="grow-[2]">
          <Icon name="play" size={18} />
          <span>{doneLog ? 'Újra' : 'Indítás'}</span>
        </ButtonLink>
      </div>
    </div>
  )
}
