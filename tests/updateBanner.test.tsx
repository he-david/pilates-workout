import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpdateBanner } from '../src/ui'

describe('UpdateBanner', () => {
  it('renders nothing when no update is waiting', () => {
    render(<UpdateBanner visible={false} onUpdate={() => {}} />)
    expect(screen.queryByText('Új verzió – frissítés')).toBeNull()
  })

  it('shows the banner and calls onUpdate on tap', async () => {
    const onUpdate = vi.fn()
    render(<UpdateBanner visible onUpdate={onUpdate} />)
    await userEvent.click(screen.getByRole('button', { name: 'Új verzió – frissítés' }))
    expect(onUpdate).toHaveBeenCalledOnce()
  })
})
