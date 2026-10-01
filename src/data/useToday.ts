import { useState } from 'react'

/** The current moment, read once per mount (screens pass it into domain functions). */
export function useToday(): Date {
  const [now] = useState(() => new Date())
  return now
}
