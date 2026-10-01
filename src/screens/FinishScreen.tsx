import { useParams } from 'react-router'
import { PageTitle } from './PageTitle'

export function FinishScreen() {
  const { id } = useParams()
  return <PageTitle title={`Kész ${id ?? ''}`} />
}
