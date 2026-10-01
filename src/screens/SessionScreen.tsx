import { useParams } from 'react-router'
import { PageTitle } from './PageTitle'

export function SessionScreen() {
  const { id } = useParams()
  return <PageTitle title={`Edzés ${id ?? ''}`} />
}
