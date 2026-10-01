import type { DayStatus } from '../../domain/schedule'

/** Big heading of the Today screen from today's status in the week view. */
export function headline(status: DayStatus | undefined, programComplete: boolean): string {
  if (programComplete) return 'Végigcsináltad a programot'
  if (status === 'today') return 'Ma este edzésnap van'
  if (status === 'done') return 'Mára megvagy, szép munka'
  return 'Ma pihenőnap van'
}
