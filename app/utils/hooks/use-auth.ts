import { useSubmit } from '@remix-run/react'

import { UserRole } from '~/utils/enums'
import { useRootData } from '~/utils/hooks/use-root-data'

export function useUser() {
  const { user } = useRootData()

  if (!user) {
    throw new Error('No user found')
  }

  return user
}

export const useAuth = () => {
  const submit = useSubmit()
  const user = useUser()

  const isStudent = user.role === UserRole.USER
  const isAdmin = user.role === UserRole.ADMIN

  const signOut = () => {
    return submit(null, {
      action: '/logout',
      method: 'POST',
      navigate: false,
    })
  }

  return {
    signOut,
    isStudent,
    isAdmin,
    user: {
      ...user,
      name: `${user.firstName} ${user.lastName}`,
    },
  }
}
