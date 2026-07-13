'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, User, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
}

interface UserSearchProps {
  /** 已选中的用户 ID 列表 */
  selectedUserIds?: string[]
  /** 用户列表 */
  users?: User[]
  /** 选择变更回调 */
  onUserSelect?: (userId: string) => void
  /** 占位符文本 */
  placeholder?: string
  /** 无结果提示 */
  noResultsText?: string
  /** 是否支持多选 */
  multiple?: boolean
  /** 自定义筛选函数 */
  filterFn?: (user: User, search: string) => boolean
  /** 是否显示已选择的用户标签 */
  showSelectedBadges?: boolean
  /** 组件类名 */
  className?: string
  /** 弹窗类名 */
  contentClassName?: string
  /** 禁用状态 */
  disabled?: boolean
}

/**
 * 用户搜索选择组件
 * 支持搜索、筛选、多选，显示用户头像和信息
 */
export function UserSearch({
  selectedUserIds = [],
  users = [],
  onUserSelect,
  placeholder,
  noResultsText,
  multiple = true,
  filterFn,
  showSelectedBadges = true,
  className,
  contentClassName,
  disabled = false,
}: UserSearchProps) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')
  const [selectedIds, setSelectedIds] = React.useState<string[]>(selectedUserIds)

  // 同步外部 selectedUserIds 变化
  React.useEffect(() => {
    setSelectedIds(selectedUserIds)
  }, [selectedUserIds])

  // 默认翻译文本
  const defaultPlaceholder = placeholder || t('components.userSearch.selectUsers')
  const defaultNoResults = noResultsText || t('components.userSearch.noUsersFound')

  // 自定义筛选逻辑（支持中文搜索）
  const defaultFilterFn = (user: User, search: string) => {
    const searchLower = search.toLowerCase()
    const nameLower = user.name.toLowerCase()
    const emailLower = user.email.toLowerCase()
    const roleLower = user.role?.toLowerCase() || ''
    
    return (
      nameLower.includes(searchLower) ||
      emailLower.includes(searchLower) ||
      roleLower.includes(searchLower) ||
      // 中文拼音或直接包含匹配
      user.name.includes(search) ||
      user.email.includes(search) ||
      (user.role && user.role.includes(search))
    )
  }

  const effectiveFilterFn = filterFn || defaultFilterFn

  // 筛选用户列表
  const filteredUsers = React.useMemo(() => {
    if (!searchValue) return users
    return users.filter((user) => effectiveFilterFn(user, searchValue))
  }, [users, searchValue, effectiveFilterFn])

  // 处理用户选择
  const handleSelect = (userId: string) => {
    if (multiple) {
      const newSelectedIds = selectedIds.includes(userId)
        ? selectedIds.filter((id) => id !== userId)
        : [...selectedIds, userId]
      setSelectedIds(newSelectedIds)
      onUserSelect?.(userId)
    } else {
      const newSelectedIds = selectedIds.includes(userId) ? [] : [userId]
      setSelectedIds(newSelectedIds)
      onUserSelect?.(userId)
      if (!selectedIds.includes(userId)) {
        setOpen(false)
      }
    }
  }

  // 移除已选用户
  const handleRemoveUser = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    const newSelectedIds = selectedIds.filter((id) => id !== userId)
    setSelectedIds(newSelectedIds)
    onUserSelect?.(userId)
  }

  // 获取已选用户对象
  const selectedUsers = React.useMemo(() => {
    return users.filter((user) => selectedIds.includes(user.id))
  }, [users, selectedIds])

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            aria-label={defaultPlaceholder}
            className={cn(
              'w-full justify-between',
              showSelectedBadges && selectedIds.length > 0 && 'h-auto min-h-10 py-2'
            )}
            disabled={disabled}
          >
            <div className='flex flex-1 flex-wrap gap-1'>
              {showSelectedBadges && selectedIds.length > 0 ? (
                selectedUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant='secondary'
                    className='gap-1 pr-1'
                  >
                    <Avatar className='h-4 w-4'>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className='text-[8px]'>
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user.name}
                    <button
                      onClick={(e) => handleRemoveUser(e, user.id)}
                      className='ml-0.5 rounded-full hover:bg-muted'
                      type='button'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className='text-muted-foreground'>{defaultPlaceholder}</span>
              )}
            </div>
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn('w-[--radix-popover-trigger-width] p-0', contentClassName)}
          align='start'
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('components.userSearch.searchPlaceholder')}
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>{defaultNoResults}</CommandEmpty>
              <CommandGroup>
                {filteredUsers.map((user) => {
                  const isSelected = selectedIds.includes(user.id)
                  return (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => handleSelect(user.id)}
                      className='flex items-center gap-2'
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <Check className='h-3 w-3' />
                      </div>
                      <Avatar className='h-8 w-8'>
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex flex-1 flex-col'>
                        <span className='text-sm font-medium'>{user.name}</span>
                        <span className='text-xs text-muted-foreground'>
                          {user.email}
                        </span>
                      </div>
                      {user.role && (
                        <Badge variant='outline' className='ml-2'>
                          {user.role}
                        </Badge>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              {selectedIds.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setSelectedIds([])
                        onUserSelect?.('')
                      }}
                      className='justify-center text-center'
                    >
                      <X className='mr-2 h-4 w-4' />
                      {t('components.userSearch.clearAll')}
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
