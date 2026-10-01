import type { ProgramProgress } from '../../domain/schedule'
import { Card, Ring } from '../../ui'

export function ProgressCard({ progress }: { progress: ProgramProgress }) {
  return (
    <Card as="section" className="flex items-center gap-4 !px-[18px] !py-4">
      <Ring progress={progress.total === 0 ? 0 : progress.done / progress.total} />
      <div className="flex flex-col gap-0.5">
        <div className="text-[24px] font-extrabold">
          {progress.done} / {progress.total}
        </div>
        <div className="text-base text-ink-muted">edzés teljesítve · {progress.percent}%</div>
      </div>
    </Card>
  )
}
