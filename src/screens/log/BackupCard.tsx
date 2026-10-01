import { useRef, useState } from 'react'
import { exportBackup, importBackup } from '../../data'
import { needsBackupNudge } from '../../domain/backup'
import { Button, Card } from '../../ui'

type Props = { lastBackupAt?: string; logCount: number; now: Date }

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}.`
}

export function BackupCard({ lastBackupAt, logCount, now }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<File | null>(null)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)
  const nudge = needsBackupNudge(lastBackupAt, logCount, now)

  async function onExport() {
    try {
      const done = await exportBackup(new Date())
      setMessage(done ? { text: 'Mentés kész.', error: false } : null)
    } catch {
      setMessage({ text: 'A mentés nem sikerült.', error: true })
    }
  }

  async function onConfirmImport() {
    if (!pending) return
    const file = pending
    setPending(null)
    try {
      const result = await importBackup(await file.text())
      setMessage(
        result.ok
          ? { text: `Visszaállítva: ${result.count} edzés.`, error: false }
          : { text: result.error, error: true },
      )
    } catch {
      setMessage({ text: 'A visszaállítás nem sikerült.', error: true })
    }
  }

  return (
    <Card as="section" className="flex flex-col gap-3">
      <h2 className="text-xl font-extrabold">Mentés</h2>
      <p className="text-base leading-[1.45] text-ink-muted">
        {lastBackupAt
          ? `Utolsó mentés: ${formatDate(lastBackupAt)}`
          : 'Még nem mentettél. Az adataid csak ezen a telefonon vannak.'}
      </p>
      {nudge && (
        <p className="rounded-xl bg-pink-tint px-3.5 py-2.5 text-base leading-[1.45] font-bold text-warn-ink">
          Ideje menteni az edzésnaplódat.
        </p>
      )}
      <Button onClick={onExport}>Mentés exportálása</Button>
      <Button variant="secondary" onClick={() => fileInput.current?.click()}>
        Visszaállítás
      </Button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        data-testid="backup-file"
        onChange={(e) => {
          setPending(e.target.files?.[0] ?? null)
          setMessage(null)
          e.target.value = ''
        }}
      />
      {pending && (
        <div role="alertdialog" className="flex flex-col gap-2 rounded-xl bg-bg-tint p-3.5">
          <p className="text-base leading-[1.45] font-bold">
            Ez felülírja a jelenlegi naplót és beállításokat. Biztosan visszaállítod?
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="grow" onClick={() => setPending(null)}>
              Mégse
            </Button>
            <Button className="grow" onClick={onConfirmImport}>
              Felülírás
            </Button>
          </div>
        </div>
      )}
      {message && (
        <p
          role="status"
          className={`text-base font-bold ${message.error ? 'text-warn-ink' : 'text-accent-ink'}`}
        >
          {message.text}
        </p>
      )}
    </Card>
  )
}
