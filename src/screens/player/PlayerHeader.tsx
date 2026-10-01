import type { BlockKey, BlockProgress } from '../../domain/player'
import { Icon } from '../../ui'

const BLOCK_LABEL: Record<BlockKey, string> = {
  warmup: 'Bemelegítés',
  main: 'Fő rész',
  cooldown: 'Levezetés',
}

const SEGMENT: Record<BlockProgress['segments'][number], string> = {
  done: 'bg-accent-deep',
  current: 'bg-ink',
  pending: 'bg-surface',
}

type Props = { progress: BlockProgress | undefined; onClose: () => void }

export function PlayerHeader({ progress, onClose }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Edzés bezárása"
        onClick={onClose}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface text-ink touch-manipulation"
      >
        <Icon name="close" />
      </button>
      {progress && (
        <div className="flex grow flex-col gap-1.5">
          <div className="flex justify-between text-sm font-bold text-ink-body">
            <span>{BLOCK_LABEL[progress.block]}</span>
            <span>
              {progress.position} / {progress.total}
            </span>
          </div>
          <div className="flex gap-[3px]" aria-hidden="true">
            {progress.segments.map((seg, i) => (
              <div key={i} className={`h-[5px] grow rounded-xs ${SEGMENT[seg]}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
