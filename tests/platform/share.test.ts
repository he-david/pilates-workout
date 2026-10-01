import { vi } from 'vitest'
import { shareFile } from '../../src/platform/share'

const file = new File(['{}'], 'x.json', { type: 'application/json' })

afterEach(() => {
  vi.restoreAllMocks()
  Reflect.deleteProperty(navigator, 'share')
  Reflect.deleteProperty(navigator, 'canShare')
})

describe('shareFile', () => {
  it('uses the share sheet when files can be shared', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { share, canShare: () => true })
    expect(await shareFile(file)).toBe('shared')
    expect(share).toHaveBeenCalledWith({ files: [file] })
  })

  it('treats AbortError as cancelled', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('x', 'AbortError'))
    Object.assign(navigator, { share, canShare: () => true })
    expect(await shareFile(file)).toBe('cancelled')
  })

  it('rethrows other share errors', async () => {
    Object.assign(navigator, {
      share: vi.fn().mockRejectedValue(new Error('boom')),
      canShare: () => true,
    })
    await expect(shareFile(file)).rejects.toThrow('boom')
  })

  it('downloads when sharing files is unsupported', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    expect(await shareFile(file)).toBe('downloaded')
    expect(click).toHaveBeenCalled()
  })
})
