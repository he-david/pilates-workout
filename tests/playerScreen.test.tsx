import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { vi } from 'vitest'
import { getExercise } from '../src/content/exercises'
import { getSession } from '../src/content/program'
import { buildSteps } from '../src/domain/player'
import type { PlayerSnapshot } from '../src/domain/types'
import { PlayerScreen } from '../src/screens/PlayerScreen'

const mocks = vi.hoisted(() => ({
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
})
