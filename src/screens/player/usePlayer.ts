import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { clearSnapshot, saveSnapshot, useSnapshot } from '../../data/player'
import {
  createPlayer,
  currentStep,
  finishSummary,
  playerReducer,
  remainingMs,
  toSnapshot,
  type PlayerAction,
} from '../../domain/player'
import type { ProgramSession } from '../../domain/types'
import { beep, chime, unlockAudio } from '../../platform/sound'
import { onHidden, onVisible } from '../../platform/visibility'
import { useWakeLock } from '../../platform/useWakeLock'

type Simple = Exclude<PlayerAction, { type: 'restore' }>['type']

/**
 * Player state machine wired to the clock, snapshot storage, sound and wake lock.
 * The only place (with the Player screen) that touches platform/.
 */
export function usePlayer(session: ProgramSession) {
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(playerReducer, session, createPlayer)
  const [now, setNow] = useState(() => Date.now())
  const snapshot = useSnapshot()
  const ready = snapshot !== undefined
  const restoredRef = useRef(false)

  // Resume in place: a saved snapshot for this session lands the player paused.
  useEffect(() => {
    if (snapshot === undefined || restoredRef.current) return
    restoredRef.current = true
    if (snapshot && snapshot.sessionId === session.id) {
      dispatch({ type: 'restore', snapshot, now: Date.now() })
    }
  }, [snapshot, session.id])

  const active = state.phase === 'running' || state.phase === 'transition'
  useWakeLock(state.phase !== 'idle' && state.phase !== 'finished')

  const tick = useCallback(() => {
    const n = Date.now()
    setNow(n)
    dispatch({ type: 'tick', now: n })
  }, [])

  // 250 ms redraw; the timer itself is the endsAt timestamp, never a counter.
  useEffect(() => {
    if (!active) return
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [active, tick])

  useEffect(() => onVisible(tick), [tick])

  // Persist on every real state change (an unchanged tick returns the same state object).
  useEffect(() => {
    if (state.phase === 'finished') {
      void clearSnapshot()
      return
    }
    const snap = toSnapshot(state, Date.now())
    if (snap) void saveSnapshot(snap)
  }, [state])

  useEffect(
    () =>
      onHidden(() => {
        const snap = toSnapshot(state, Date.now())
        if (snap) void saveSnapshot(snap)
      }),
    [state],
  )

  // Hand over to the finish screen with everything the log needs.
  useEffect(() => {
    if (state.phase !== 'finished') return
    navigate(`/finish/${session.id}`, {
      replace: true,
      state: finishSummary(state, Date.now()),
    })
  }, [state, navigate, session.id])

  // Cues: chime when a step ends, "go" beep when a transition ends.
  const prevPhase = useRef(state.phase)
  useEffect(() => {
    const prev = prevPhase.current
    prevPhase.current = state.phase
    if (prev === 'running' && (state.phase === 'transition' || state.phase === 'finished')) chime()
    else if (prev === 'transition' && state.phase === 'running') beep('go')
  }, [state.phase])

  // 3-2-1 beeps, each fired once.
  const step = currentStep(state)
  const secondsLeft = Math.ceil(remainingMs(state, now) / 1000)
  const firedRef = useRef('')
  useEffect(() => {
    const counting =
      state.phase === 'transition' || (state.phase === 'running' && step?.kind === 'time')
    if (!counting || secondsLeft < 1 || secondsLeft > 3) return
    const key = `${state.phase}-${state.index}-${secondsLeft}`
    if (firedRef.current === key) return
    firedRef.current = key
    beep('tick')
  }, [secondsLeft, state.phase, state.index, step?.kind])

  const send = useCallback((type: Simple) => {
    const n = Date.now()
    setNow(n)
    dispatch({ type, now: n })
  }, [])

  /** First tap: unlock audio inside the user gesture, then start or resume. */
  const play = useCallback(() => {
    void unlockAudio()
    send(state.phase === 'idle' ? 'start' : 'resume')
  }, [send, state.phase])

  /** Leave mid-session: save a paused snapshot synchronously, then go to Today. */
  const close = useCallback(() => {
    const paused = playerReducer(state, { type: 'pause', now: Date.now() })
    const snap = toSnapshot(paused, Date.now())
    if (snap) void saveSnapshot(snap).then(() => navigate('/'))
    else navigate('/')
  }, [state, navigate])

  return { state, now, ready, secondsLeft, send, play, close }
}
