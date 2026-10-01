import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { vi } from 'vitest'
import { getExercise } from '../src/content/exercises'
import { getSession } from '../src/content/program'
import { buildSteps } from '../src/domain/player'
import type { PlayerSnapshot, SessionLog } from '../src/domain/types'
import { PlayerScreen } from '../src/screens/PlayerScreen'

const mocks = vi.hoisted(() => ({
  logs: [] as SessionLog[],
  snapshot: null as PlayerSnapshot | null | undefined,
  save: vi.fn(),
  clear: vi.fn(),
}))

vi.mock('../src/data/player', () => ({
  useSnapshot: () => mocks.snapshot,
  saveSnapshot: (s: PlayerSnapshot) => {
    mocks.save(s)
    return Promise.resolve()
  },
  clearSnapshot: () => {
    mocks.clear()
    return Promise.resolve()
  },
}))
vi.mock('../src/data/useLogs', () => ({ useLogs: () => mocks.logs }))
vi.mock('../src/platform/sound', () => ({
  unlockAudio: vi.fn(() => Promise.resolve(true)),
  beep: vi.fn(),
  chime: vi.fn(),
}))
vi.mock('../src/platform/useWakeLock', () => ({ useWakeLock: vi.fn() }))

const SESSION_ID = 'w01-a'
const session = getSession(SESSION_ID)
if (!session) throw new Error('missing session')
const steps = buildSteps(session)
const name = (i: number) => getExercise(steps[i]?.exerciseId ?? '')?.nameHu ?? ''

function Where() {
  const { pathname, state } = useLocation()
  return <div data-testid="where">{pathname + (state ? ' +state' : '')}</div>
}

function renderPlayer() {
  render(
    <MemoryRouter initialEntries={[`/player/${SESSION_ID}`]}>
      <Routes>
        <Route path="/player/:id" element={<PlayerScreen />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  )
}

const timeText = () => screen.getByRole('timer').textContent

describe('PlayerScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 1, 12))
    mocks.snapshot = null
    mocks.logs = []
    mocks.save.mockClear()
    mocks.clear.mockClear()
  })
  afterEach(() => vi.useRealTimers())

  it('starts idle on the first step and begins on tap', () => {
    renderPlayer()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(name(0))
    fireEvent.click(screen.getByRole('button', { name: 'Indítás' }))
    expect(screen.getByRole('button', { name: 'Szünet' })).toBeInTheDocument()
  })

  it('counts down from endsAt and freezes while paused', () => {
    renderPlayer()
    fireEvent.click(screen.getByRole('button', { name: 'Indítás' }))
    const before = timeText()
    act(() => void vi.advanceTimersByTime(5000))
    const after = timeText()
    expect(after).not.toBe(before)
    fireEvent.click(screen.getByRole('button', { name: 'Szünet' }))
    expect(screen.getByText(/szünetel/)).toBeInTheDocument()
    act(() => void vi.advanceTimersByTime(10_000))
    expect(timeText()).toBe(after)
    fireEvent.click(screen.getByRole('button', { name: 'Folytatás' }))
    act(() => void vi.advanceTimersByTime(2000))
    expect(timeText()).not.toBe(after)
  })

  it('Kész advances from a rep step to the transition, then the next step', () => {
    renderPlayer()
    fireEvent.click(screen.getByRole('button', { name: 'Indítás' }))
    const k = steps.findIndex((s) => s.kind === 'reps')
    for (let i = 0; i < k; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Következő gyakorlat' }))
      fireEvent.click(screen.getByRole('button', { name: 'Következő gyakorlat' }))
    }
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(name(k))
    fireEvent.click(screen.getByRole('button', { name: 'Kész' }))
    expect(screen.getByText(/Pihenő/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(name(k + 1))
    act(() => void vi.advanceTimersByTime(10_500))
    expect(screen.queryByText(/Pihenő/)).toBeNull()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(name(k + 1))
  })

  it('saves a snapshot on pause', () => {
    renderPlayer()
    fireEvent.click(screen.getByRole('button', { name: 'Indítás' }))
    fireEvent.click(screen.getByRole('button', { name: 'Szünet' }))
    const last = mocks.save.mock.calls.at(-1)?.[0] as PlayerSnapshot
    expect(last.sessionId).toBe(SESSION_ID)
    expect(last.pausedRemaining).toBeGreaterThan(0)
  })

  it('restores a snapshot paused in place', () => {
    mocks.snapshot = {
      sessionId: SESSION_ID,
      index: 2,
      at: 'step',
      pausedRemaining: 12_000,
      doneSteps: [0, 1],
      usedEasier: [],
      elapsedMs: 60_000,
    }
    renderPlayer()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(name(2))
    expect(timeText()).toBe('0:12')
    expect(screen.getByRole('button', { name: 'Folytatás' })).toBeInTheDocument()
  })

  it('restores a transition snapshot like the live transition (no Kész)', () => {
    mocks.snapshot = {
      sessionId: SESSION_ID,
      index: 1,
      at: 'transition',
      pausedRemaining: 7000,
      doneSteps: [0],
      usedEasier: [],
      elapsedMs: 30_000,
    }
    renderPlayer()
    expect(screen.getByText(/Pihenő/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(name(1))
    expect(screen.queryByRole('button', { name: 'Kész' })).toBeNull()
    expect(timeText()).toBe('0:07')
  })

  it('a time step that runs out moves to the transition, then auto-starts the next', () => {
    renderPlayer()
    fireEvent.click(screen.getByRole('button', { name: 'Indítás' }))
    const k = steps.findIndex((s) => s.kind === 'time')
    for (let i = 0; i < k; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Következő gyakorlat' }))
      fireEvent.click(screen.getByRole('button', { name: 'Következő gyakorlat' }))
    }
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(name(k))
    act(() => void vi.advanceTimersByTime((steps[k]?.durationMs ?? 0) + 500))
    expect(screen.getByText(/Pihenő/)).toBeInTheDocument()
    act(() => void vi.advanceTimersByTime(10_500))
    expect(screen.queryByText(/Pihenő/)).toBeNull()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(name(k + 1))
  })

  it('shows the finish link even while idle', () => {
    renderPlayer()
    expect(screen.getByRole('button', { name: 'Edzés befejezése' })).toBeInTheDocument()
  })

  it('finishing asks first, then goes to the finish screen with a summary', () => {
    renderPlayer()
    fireEvent.click(screen.getByRole('button', { name: 'Indítás' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edzés befejezése' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mégsem' }))
    expect(screen.queryByTestId('where')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Edzés befejezése' }))
    fireEvent.click(screen.getByRole('button', { name: 'Befejezés' }))
    expect(screen.getByTestId('where')).toHaveTextContent(`/finish/${SESSION_ID} +state`)
    expect(mocks.clear).toHaveBeenCalled()
  })

  it('shows not found for an unknown session', () => {
    render(
      <MemoryRouter initialEntries={['/player/nope']}>
        <Routes>
          <Route path="/player/:id" element={<PlayerScreen />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Nem található az edzés')).toBeInTheDocument()
  })

  it('shows the easier variant when the prescription pre-selected it', () => {
    // w01-a rated 4 (hard): the new exercises of w01-b get the easier variant
    mocks.logs = [
      {
        sessionId: 'w01-a',
        startedAt: '2026-09-30T10:00:00.000Z',
        finishedAt: '2026-09-30T10:50:00.000Z',
        durationSec: 3000,
        completed: [],
        usedEasier: [],
        rating: 4,
        areas: [],
      },
    ]
    const b = getSession('w01-b')
    const firstNew = b?.main.find((i) => i.isNew)
    if (!b || !firstNew) throw new Error('fixture')
    const bSteps = buildSteps(b)
    render(
      <MemoryRouter initialEntries={['/player/w01-b']}>
        <Routes>
          <Route path="/player/:id" element={<PlayerScreen />} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Indítás' }))
    const k = bSteps.findIndex((s) => s.exerciseId === firstNew.exerciseId)
    expect(screen.queryByText('Könnyítés')).toBeNull()
    for (let i = 0; i < k; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Következő gyakorlat' }))
      fireEvent.click(screen.getByRole('button', { name: 'Következő gyakorlat' }))
    }
    expect(screen.getByText('Könnyítés')).toBeInTheDocument()
    expect(screen.getByText(getExercise(firstNew.exerciseId)?.easier ?? '')).toBeInTheDocument()
  })

  it('shows the harder variant on pulled-forward items', () => {
    const mkLog = (sessionId: string, rating: 2 | 3, day: number): SessionLog => ({
      sessionId,
      startedAt: `2026-09-${day}T10:00:00.000Z`,
      finishedAt: `2026-09-${day}T10:50:00.000Z`,
      durationSec: 3000,
      completed: [],
      usedEasier: [],
      rating,
      areas: [],
    })
    mocks.logs = [
      mkLog('w01-a', 3, 10),
      mkLog('w01-b', 3, 11),
      mkLog('w01-c', 3, 12),
      mkLog('w02-a', 2, 13),
      mkLog('w02-b', 2, 14),
    ]
    const c = getSession('w02-c')
    const target = c?.main.find((i) => !i.isNew)
    if (!c || !target) throw new Error('fixture')
    const cSteps = buildSteps(c)
    render(
      <MemoryRouter initialEntries={['/player/w02-c']}>
        <Routes>
          <Route path="/player/:id" element={<PlayerScreen />} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Indítás' }))
    const k = cSteps.findIndex((s) => s.exerciseId === target.exerciseId)
    expect(screen.queryByText('Nehezítés')).toBeNull()
    for (let i = 0; i < k; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Következő gyakorlat' }))
      fireEvent.click(screen.getByRole('button', { name: 'Következő gyakorlat' }))
    }
    expect(screen.getByText('Nehezítés')).toBeInTheDocument()
    expect(screen.getByText(getExercise(target.exerciseId)?.harder ?? '')).toBeInTheDocument()
  })
})
