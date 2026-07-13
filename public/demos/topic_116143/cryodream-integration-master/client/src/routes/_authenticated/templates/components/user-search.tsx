import { createFileRoute } from '@tanstack/react-router'
import UserSearch from '../../../../features/templates/components/user-search'

export const Route = createFileRoute('/_authenticated/templates/components/user-search')({
  component: UserSearchRoute,
})

function UserSearchRoute() {
  return <UserSearch />
}
