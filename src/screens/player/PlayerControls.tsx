import type { PlayerPhase } from '../../domain/player'
import { Icon } from '../../ui'

const SIDE =
  'flex h-14 w-14 items-center justify-center rounded-full bg-surface text-ink touch-manipulation disabled:opacity-40'

type Props = {
  phase: PlayerPhase
  onPrev: () => void
  onToggle: () => void
  onNext: () => void
}

export function PlayerControls({ phase, onPrev, onToggle, onNext }: Props) {
  const running = phase === 'running' || phase === 'transition'
  const idle = phase === 'idle'
  return (
    <div className="flex items-center justify-center gap-7">
      <button
        type="button"
        aria-label="Előző gyakorlat"
        disabled={idle}
        onClick={onPrev}
        className={SIDE}
      >
        <Icon name="skipPrev" size={22} />
      </button>
      <button
        type="button"
        aria-label={running ? 'Szünet' : idle ? 'Indítás' : 'Folytatás'}
        onClick={onToggle}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-ink touch-manipulation"
      >
        <Icon name={running ? 'pause' : 'play'} size={30} />
      </button>
      <button
        type="button"
        aria-label="Következő gyakorlat"
        disabled={idle}
        onClick={onNext}
        className={SIDE}
      >
        <Icon name="skipNext" size={22} />
      </button>
    </div>
  )
}
