import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { getExercise, exercises } from '../content/exercises'
import { getSession, program } from '../content/program'
import { useLogs, useToday } from '../data'
import { effectiveSession } from '../domain/effectiveSession'
import { buildExerciseContext, lastTimeText } from '../domain/exerciseDetail'
import { equipmentLabel } from '../domain/todaySummary'
import { ButtonLink, Icon } from '../ui'
import { MediaPlaceholder } from './exercise/MediaPlaceholder'
import { Steps } from './exercise/Steps'

const BACK_BUTTON =
  'flex h-11 w-11 items-center justify-center rounded-lg bg-surface text-ink touch-manipulation'

function BackButton() {
  const navigate = useNavigate()
  const { key } = useLocation()
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-3">
      <span className="text-xs font-semibold text-ink-muted">{label}</span>
      <span className="text-base font-extrabold">{value}</span>
    </div>
  )
}

function Variant({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-surface p-3.5">
      <div className="text-xs font-extrabold tracking-label uppercase text-ink-muted">{label}</div>
      <div className="text-base leading-snug">{text}</div>
    </div>
  )
}

function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col gap-[18px] px-5 pt-[max(20px,env(safe-area-inset-top))] pb-6">
      <BackButton />
      <h1 className="text-3xl font-extrabold tracking-tight-display">Nem található a gyakorlat</h1>
      <p className="text-md text-ink-muted">Ez a gyakorlat nem létezik a programban.</p>
      <ButtonLink to="/" variant="secondary">
        Vissza a kezdőlapra
      </ButtonLink>
    </main>
  )
}

export function ExerciseScreen() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const today = useToday()
  const logs = useLogs(today)
  const exercise = getExercise(id)
  if (!exercise) return <NotFound />
  if (!logs) return null

  const sessionId = params.get('session') ?? ''
  const session = getSession(sessionId)
  const rx = session ? effectiveSession(program, session.id, logs) : undefined
  const ctx = session
    ? buildExerciseContext(exercise, rx?.session ?? session, program, exercises, rx)
    : undefined
  const last = lastTimeText(exercise, logs, program)
  const href = (to: string) => `/exercise/${to}?session=${sessionId}`

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="relative">
        <MediaPlaceholder />
        <div className="absolute top-[max(20px,env(safe-area-inset-top))] left-5">
          <BackButton />
        </div>
      </div>
      <main className="flex grow flex-col gap-[22px] px-5 pt-[22px] pb-7">
        <header className="flex flex-col gap-2">
          {ctx && (
            <div className="flex items-center gap-2">
              {ctx.badge && (
                <span className="rounded-full bg-pink-soft px-[9px] py-[3px] text-xs font-extrabold text-warn-ink">
                  {ctx.badge}
                </span>
              )}
              <span className="text-sm font-semibold text-ink-muted">
                Gyakorlat {ctx.n} / {ctx.total}
              </span>
            </div>
          )}
          <h1 className="text-4xl font-extrabold tracking-tight-display">{exercise.nameHu}</h1>
          <div className="text-md font-semibold text-ink-muted">
            {[exercise.nameEn, ctx?.dose, ctx?.duration].filter(Boolean).join(' · ')}
          </div>
        </header>

        <section className="grid grid-cols-3 gap-2">
          <Fact label="Fókusz" value={exercise.focus.join(', ')} />
          <Fact label="Tempó" value={exercise.tempo ?? '–'} />
          <Fact label="Eszköz" value={equipmentLabel(exercise.equipment)} />
        </section>

        <Steps steps={exercise.steps} />

        <section className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-lg font-extrabold text-warn-ink">Figyelj rá</h2>
          <ul className="flex flex-col gap-1.5 pl-5 text-base leading-snug text-ink-soft">
            {exercise.mistakes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>

        <section className="grid grid-cols-2 gap-2.5">
          <Variant label="Könnyítés" text={exercise.easier} />
          <Variant label="Nehezítés" text={exercise.harder} />
        </section>

        {last && (
          <section className="flex flex-col gap-1 rounded-2xl bg-accent-soft p-4">
            <div className="text-sm font-extrabold text-accent-ink">Te legutóbb</div>
            <div className="text-md leading-snug">{last}</div>
          </section>
        )}

        {ctx && (ctx.prevId || ctx.nextId) && (
          <nav className="flex gap-2.5">
            {ctx.prevId && (
              <ButtonLink to={href(ctx.prevId)} variant="secondary" className="grow">
                Előző
              </ButtonLink>
            )}
            {ctx.nextId && (
              <ButtonLink to={href(ctx.nextId)} variant="secondary" className="grow">
                Következő
              </ButtonLink>
            )}
          </nav>
        )}
        {session && (
          <Link
            to={`/session/${session.id}`}
            className="-my-3 flex min-h-11 items-center justify-center text-md font-bold text-link"
          >
            Vissza az edzéshez
          </Link>
        )}
      </main>
    </div>
  )
}
