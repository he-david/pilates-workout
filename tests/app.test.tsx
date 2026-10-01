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
    ['/exercise/e1?session=s1', 'Gyakorlat e1'],
    ['/player/s1', 'Lejátszó s1'],
    ['/finish/s1', 'Kész s1'],
  ])('renders %s', (path, title) => {
    renderAt(path)
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
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
