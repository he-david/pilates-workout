import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { SessionScreen } from '../src/screens/SessionScreen'

function renderAt(path: string, entries = [path]) {
  render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <Routes>
        <Route path="/" element={<div>Kezdőlap</div>} />
        <Route path="/session/:id" element={<SessionScreen />} />
        <Route path="/exercise/:id" element={<div>Gyakorlat</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SessionScreen', () => {
  it('shows header, stats, block bar and three lists', () => {
    renderAt('/session/w03-b')
    expect(screen.getByText('3. hét · B edzés')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Core & gerinc' })).toBeInTheDocument()
    expect(screen.getByText('50 perc')).toBeInTheDocument()
    expect(screen.getByText('Nehézség 2 / 5')).toBeInTheDocument()
    expect(screen.getByText("Bemelegítés 8'")).toBeInTheDocument()
    expect(screen.getByText("Fő rész 34'")).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Bemelegítés',
      'Fő rész',
      'Levezetés',
    ])
  })

  it('renders doses and badges', () => {
    renderAt('/session/w03-b')
    expect(screen.getByText('100 számolás')).toBeInTheDocument()
    expect(screen.getByText('Új')).toBeInTheDocument()
    expect(screen.getByText('+5 mp')).toBeInTheDocument()
    expect(screen.getAllByText('8 perc').length).toBeGreaterThan(0)
  })

  it('links rows to the exercise with the session and buttons to preview and player', () => {
    renderAt('/session/w03-b')
    const row = screen.getByRole('link', { name: /Százas/ })
    expect(row).toHaveAttribute('href', '/exercise/hundred?session=w03-b')
    expect(screen.getByRole('link', { name: 'Előnézet' }).getAttribute('href')).toMatch(
      /^\/exercise\/.+\?session=w03-b$/,
    )
    expect(screen.getByRole('link', { name: /Indítás/ })).toHaveAttribute('href', '/player/w03-b')
  })

  it('goes back in history, falling back to home', async () => {
    const user = userEvent.setup()
    renderAt('/session/w03-b')
    await user.click(screen.getByRole('button', { name: 'Vissza' }))
    expect(screen.getByText('Kezdőlap')).toBeInTheDocument()
  })

  it('shows a not-found state for unknown ids', () => {
    renderAt('/session/nope')
    const main = screen.getByRole('main')
    expect(within(main).getByText('Nem található az edzés')).toBeInTheDocument()
    expect(within(main).getByRole('link', { name: 'Vissza a kezdőlapra' })).toHaveAttribute(
      'href',
      '/',
    )
  })
})
