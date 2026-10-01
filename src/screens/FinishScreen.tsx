import { useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { getSession } from '../content/program'
import { saveLog, useLogs, useSettings, useToday } from '../data'
import { clearSnapshot } from '../data/player'
import { durationLabel } from '../domain/format'
import { buildLog, DEFAULT_RATING, exerciseCount, streakWithPending } from '../domain/finish'
import type { FinishSummary } from '../domain/player'
import type { Rating } from '../domain/types'
import { Button, Icon } from '../ui'
import { AreaChips } from './finish/AreaChips'
import { MeasureFields } from './finish/MeasureFields'
import { RatingPicker } from './finish/RatingPicker'
import { StatTile } from './finish/StatTile'

function isSummary(v: unknown): v is FinishSummary {
  const s = v as Partial<FinishSummary> | null
  return (
    !!s &&
    typeof s.sessionId === 'string' &&
    typeof s.startedAt === 'number' &&
    typeof s.finishedAt === 'number' &&
    typeof s.durationSec === 'number' &&
    Array.isArray(s.completed) &&
    Array.isArray(s.usedEasier)
  )
}

/** Without router state (reload, direct entry) there is nothing to log: back to Today. */
export function FinishScreen() {
  const { state } = useLocation()
  const { id } = useParams()
  if (!isSummary(state) || state.sessionId !== id) return <Navigate to="/" replace />
  return <FinishForm summary={state} />
}

function FinishForm({ summary }: { summary: FinishSummary }) {
  const navigate = useNavigate()
  const today = useToday()
  const settings = useSettings(today)
  const logs = useLogs(today)
  const session = getSession(summary.sessionId)
  const [rating, setRating] = useState<Rating>(DEFAULT_RATING)
  const [areas, setAreas] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [plankSec, setPlankSec] = useState('')
  const [rollUpReps, setRollUpReps] = useState('')
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const busy = useRef(false)

  const assessment = session?.isAssessment === true
  const form = assessment ? { rating, areas, note, plankSec, rollUpReps } : { rating, areas, note }
  const pending = buildLog(summary, form)
  const streak = logs ? streakWithPending(settings, logs, pending, today) : undefined

  const toggleArea = (a: string) =>
    setAreas((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]))

  async function save() {
    if (busy.current) return
    busy.current = true
    setSaving(true)
    setFailed(false)
    try {
      await saveLog(buildLog(summary, form))
      await clearSnapshot()
      navigate('/', { replace: true })
    } catch {
      busy.current = false
      setSaving(false)
      setFailed(true)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col gap-[22px] px-5 pt-[max(36px,env(safe-area-inset-top))] pb-[max(32px,env(safe-area-inset-bottom))]">
      <header className="flex flex-col items-center gap-2.5 text-center">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent text-ink">
          <Icon name="check" size={34} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight-display">Szép munka!</h1>
        {session && (
          <p className="text-md text-ink-muted">
            {session.title} · {session.week}. hét · {session.slot} edzés
          </p>
        )}
      </header>

      <section className="grid grid-cols-3 gap-2">
        <StatTile value={durationLabel(summary.durationSec)} label="időtartam" />
        <StatTile
          value={`${summary.completed.length} / ${session ? exerciseCount(session) : summary.completed.length}`}
          label="gyakorlat"
        />
        <StatTile
          value={streak === undefined ? '–' : String(streak)}
          label="edzés sorozat"
          tone="streak"
        />
      </section>

      <RatingPicker value={rating} onChange={setRating} />
      <AreaChips selected={areas} onToggle={toggleArea} />
      {assessment && (
        <MeasureFields
          plankSec={plankSec}
          rollUpReps={rollUpReps}
          onPlankSec={setPlankSec}
          onRollUpReps={setRollUpReps}
        />
      )}

      <section className="flex flex-col gap-2">
        <label htmlFor="jegyzet" className="text-xl font-extrabold">
          Jegyzet
        </label>
        <textarea
          id="jegyzet"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Pl. a felgördülésnél a 3. ismétléstől kellett a könnyítés…"
          className="box-border w-full resize-none rounded-xl border border-border-strong bg-surface px-3.5 py-3 font-sans text-[16px] text-ink"
        />
      </section>

      {failed && (
        <p role="alert" className="text-center text-base font-bold text-warn-ink">
          A mentés nem sikerült. Próbáld újra.
        </p>
      )}
      <Button
        className="mt-auto h-14 rounded-xl disabled:opacity-60"
        disabled={saving}
        onClick={save}
      >
        Mentés a naplóba
      </Button>
    </main>
  )
}
