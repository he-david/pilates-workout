import { useParams } from 'react-router'
import { PageTitle } from './PageTitle'

export function PlayerScreen() {
  const { id } = useParams()
  return <PageTitle title={`Lejátszó ${id ?? ''}`} />
}
