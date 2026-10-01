import { useParams, useSearchParams } from 'react-router'
import { PageTitle } from './PageTitle'

export function ExerciseScreen() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const session = params.get('session')
  return (
    <PageTitle title={`Gyakorlat ${id ?? ''}`}>
      {session ? <p className="text-base text-ink-muted">Edzés: {session}</p> : null}
    </PageTitle>
  )
}
