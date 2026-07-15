import { useUserStore } from '@/stores/user'

export function hasPermission(permission) {
  const userStore = useUserStore()
  const permissions = userStore.permissions || []
  
  if (!permission) return true
  if (permissions.includes('*')) return true
  
  if (Array.isArray(permission)) {
    return permission.some(p => permissions.includes(p))
  }
  
  return permissions.includes(permission)
}

export function hasRole(role) {
  const userStore = useUserStore()
  const roles = userStore.roles || []
  
  if (!role) return true
  if (roles.includes('admin')) return true
  
  if (Array.isArray(role)) {
    return role.some(r => roles.includes(r))
  }
  
  return roles.includes(role)
}
