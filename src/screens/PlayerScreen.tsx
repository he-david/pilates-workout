import { useState } from 'react'
import { useParams } from 'react-router'
import { getExercise } from '../content/exercises'
import { getSession } from '../content/program'
import { blockProgress, currentStep, upNext } from '../domain/player'
import type { ProgramSession } from '../domain/types'
import { Button, ButtonLink } from '../ui'
import { PlayerBody } from './player/PlayerBody'
import { PlayerControls } from './player/PlayerControls'
import { PlayerHeader } from './player/PlayerHeader'
import { usePlayer } from './player/usePlayer'

function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col gap-[18px] bg-bg-tint px-5 pt-[max(20px,env(safe-area-inset-top))] pb-6">
      <h1 className="text-3xl font-extrabold tracking-tight-display">Nem található az edzés</h1>
      <ButtonLink to="/" variant="secondary">
        Vissza a kezdőlapra
      </ButtonLink>
    </main>
  )
}

function Player({ session }: { session: ProgramSession }) {
  const { state, now, ready, secondsLeft, send, play, close } = usePlayer(session)
  const [confirming, setConfirming] = useState(false)
  const step = currentStep(state)
  const next = upNext(state)
  const inTransition =
    state.phase === 'transition' || (state.phase === 'paused' && state.pausedIn === 'transition')
  const isRepStep = step?.kind === 'reps' && !inTransition && state.phase !== 'idle'

  if (!step) return <NotFound />

  const toggle = () =>
    state.phase === 'running' || state.phase === 'transition' ? send('pause') : play()
  const askFinish = () => {
    if (state.phase === 'running' || state.phase === 'transition') send('pause')
    setConfirming(true)
  }

  return (
    <div className="flex min-h-dvh flex-col gap-[18px] bg-bg-tint px-5 pt-[max(20px,env(safe-area-inset-top))] pb-[max(32px,env(safe-area-inset-bottom))] text-ink">
      <PlayerHeader progress={blockProgress(state)} onClose={close} />
      <PlayerBody state={state} step={step} now={now} secondsLeft={secondsLeft} />
      {isRepStep && <Button onClick={() => send('done')}>Kész</Button>}
      <PlayerControls
        phase={state.phase}
        onPrev={() => send('prev')}
        onToggle={ready ? toggle : () => undefined}
        onNext={() => send('skip')}
      />
      <div className="mt-auto border-t border-divider pt-3.5">
        {confirming ? (
          <div className="flex flex-col gap-3">
            <p className="text-md font-semibold">
              Befejezed az edzést? A még nem kész gyakorlatok kimaradnak a naplóból.
            </p>
            <div className="flex gap-2.5">
              <Button variant="secondary" className="grow" onClick={() => setConfirming(false)}>
                Mégsem
              </Button>
              <Button className="grow" onClick={() => send('finish')}>
                Befejezés
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              {next && !inTransition && (
                <>
                  <span className="text-xs font-bold tracking-label text-ink-body uppercase">
                    Következő
                  </span>
                  <span className="text-md font-bold">
                    {getExercise(next.exerciseId)?.nameHu ?? next.exerciseId}
                  </span>
                </>
              )}
            </div>
            {
              <button
                type="button"
                onClick={state.phase === 'idle' ? close : askFinish}
                className="flex min-h-11 items-center text-base font-bold text-ink-body underline touch-manipulation"
              >
                Edzés befejezése
              </button>
            }
          </div>
        )}
      </div>
    </div>
  )
}

export function PlayerScreen() {
  const { id = '' } = useParams()
  const session = getSession(id)
  return session ? <Player key={session.id} session={session} /> : <NotFound />
}
