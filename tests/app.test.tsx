import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { App } from '../src/app'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App routes', () => {
  it.each([
    ['/', /^Ma/],
    ['/program', '12 hetes program'],
    ['/log', 'Napló'],
    ['/session/w03-b', 'Core & gerinc'],
    ['/exercise/roll-up?session=w03-b', 'Felgördülés'],
    ['/player/nope', 'Nem található az edzés'],
    ['/finish/s1', 'Kész s1'],
  ])('renders %s', async (path, title) => {
    renderAt(path)
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument()
  })

  it('shows bottom nav on tabs only', () => {
    renderAt('/log')
    expect(screen.getByRole('navigation', { name: 'Fő navigáció' })).toBeInTheDocument()
  })

  it('hides bottom nav on the player', () => {
    renderAt('/player/s1')
    expect(screen.queryByRole('navigation')).toBeNull()
  })
})
