import { useTranslation } from 'react-i18next'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { type User } from '../data/schema'
import { roles } from '../data/data'

interface UsersCardViewProps {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

export function UsersCardView({ users, onEdit, onDelete }: UsersCardViewProps) {
  const { t } = useTranslation()

  const getStatusVariant = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'invited':
        return 'outline'
      case 'suspended':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getRoleIcon = (role: User['role']) => {
    const roleItem = roles.find((r) => r.value === role)
    const IconComponent = roleItem?.icon
    return IconComponent ? <IconComponent className="h-3 w-3" /> : null
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
      {users.map((user) => (
        <Card key={user.id} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-3">
              {/* Name and Actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="font-semibold leading-none tracking-tight">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      {t('common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(user)}
                    >
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs">{t('users.email')}:</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs">{t('users.phoneNumber')}:</span>
                    <span className="font-medium">{user.phoneNumber}</span>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={getStatusVariant(user.status)}
                  className="gap-1"
                >
                  <span>{t(`users.userStatus${user.status}`)}</span>
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  {getRoleIcon(user.role)}
                  <span className="hidden xs:inline">
                    {t(`users.userRole${user.role}`)}
                  </span>
                </Badge>
              </div>

              {/* Footer Info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span>{t('users.createdAt')}:</span>
                  <span className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
