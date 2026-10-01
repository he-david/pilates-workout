import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { TodayScreen } from '../src/screens/TodayScreen'
import { headline } from '../src/screens/today/headline'

function renderToday(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <TodayScreen />
    </MemoryRouter>,
  )
}

describe('TodayScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 1, 12)) // Thursday
  })
  afterEach(() => vi.useRealTimers())

  it('shows week 1 A with no logs', () => {
    renderToday()
    expect(screen.getByText('Csütörtök, október 1.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ma este edzésnap van')
    expect(screen.getByText(/1\. hét · A edzés · 1\/3/)).toBeInTheDocument()
    expect(screen.getByText('0 / 36 edzés')).toBeInTheDocument()
    expect(screen.getByText('0 / 3 kész')).toBeInTheDocument()
    expect(screen.getByText('H · Cs · Szo, 18:30')).toBeInTheDocument()
    expect(screen.queryByLabelText(/sorozat/)).toBeNull()
  })

  it('links the hero to the next session', () => {
    renderToday()
    expect(screen.getByRole('link', { name: 'Edzés megnyitása' })).toHaveAttribute(
      'href',
      '/session/w01-a',
    )
  })

  it('renders seven week days with today marked', () => {
    renderToday()
    const today = screen.getByLabelText('Csütörtök, ma')
    expect(within(today).getByText('1')).toBeInTheDocument()
    expect(screen.getByLabelText('Szombat, tervezett edzés')).toBeInTheDocument()
  })

  it('previews week 3 B in dev with ?devDone=7', () => {
    renderToday('/?devDone=7')
    expect(screen.getByText(/3\. hét · B edzés · 2\/3/)).toBeInTheDocument()
    expect(screen.getByText('7 / 36 edzés')).toBeInTheDocument()
    expect(screen.getByText('3. hét a 12-ből')).toBeInTheDocument()
    expect(screen.getByText('1 / 3 kész')).toBeInTheDocument()
    expect(screen.getByLabelText('7 edzésnapos sorozat')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edzés megnyitása' })).toHaveAttribute(
      'href',
      '/session/w03-b',
    )
    expect(screen.getByText(/Következő: szombat/)).toBeInTheDocument()
    expect(screen.getByText(/A 4\. hét felmérő hét/)).toBeInTheDocument()
  })

  it('toggles the reminder', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    vi.useRealTimers()
    renderToday()
    const toggle = screen.getByRole('button', { name: 'Emlékeztető bekapcsolva' })
    await userEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Emlékeztető kikapcsolva' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})

describe('headline', () => {
  it.each([
    ['today', false, 'Ma este edzésnap van'],
    ['done', false, 'Mára megvagy, szép munka'],
    ['rest', false, 'Ma pihenőnap van'],
    ['today', true, 'Végigcsináltad a programot'],
  ] as const)('%s / complete=%s', (status, complete, text) => {
    expect(headline(status, complete)).toBe(text)
  })
})
