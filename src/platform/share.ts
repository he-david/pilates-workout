export type ShareResult = 'shared' | 'downloaded' | 'cancelled'

function download(file: File): void {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Share a file via the Web Share sheet when possible, else download it. A cancelled share is not an error. */
export async function shareFile(file: File): Promise<ShareResult> {
  const data = { files: [file] }
  if (typeof navigator.share === 'function' && navigator.canShare?.(data)) {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      throw e
    }
  }
  download(file)
  return 'downloaded'
}
