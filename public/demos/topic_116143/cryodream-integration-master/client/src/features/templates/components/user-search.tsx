'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Settings, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserSearch as UserSearchComponent, type User } from '@/components/user-search'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Search } from '@/components/search'

// 模拟用户数据
const mockUsers: User[] = [
  {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
    role: '管理员',
  },
  {
    id: '2',
    name: '李四',
    email: 'lisi@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
    role: '用户',
  },
  {
    id: '3',
    name: '王五',
    email: 'wangwu@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
    role: '编辑',
  },
  {
    id: '4',
    name: '赵六',
    email: 'zhaoliu@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao',
    role: '管理员',
  },
  {
    id: '5',
    name: '钱七',
    email: 'qianqi@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qian',
    role: '用户',
  },
  {
    id: '6',
    name: '孙八',
    email: 'sunba@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun',
    role: '编辑',
  },
  {
    id: '7',
    name: '吴十',
    email: 'wushi@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wu',
    role: '编辑',
  },
  {
    id: '8',
    name: '郑九',
    email: 'zhengjiu@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zheng',
    role: '用户',
  },
]

export default function UserSearch() {
  const { t } = useTranslation()
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUserSingle, setSelectedUserSingle] = useState<string[]>([])

  const handleUserSelect = (userId: string) => {
    console.log('User selected:', userId)
  }

  // 模拟用户数据

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main Content ===== */}
      <Main fixed>
        {/* 固定区域：标题和按钮 */}
        <div className='shrink-0 space-y-4'>
          {/* 页面标题和右侧按钮 */}
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold tracking-tight'>
                {t('templates.userSearchExample')}
              </h1>
              <Badge variant='secondary'>Component</Badge>
            </div>
            {/* 右侧主要操作按钮 */}
            <div className='flex gap-2'>
              <Button variant='outline' size='icon'>
                <Bell className='h-4 w-4' />
              </Button>
              <Button variant='outline' size='icon'>
                <Settings className='h-4 w-4' />
              </Button>
              <Button className='space-x-1'>
                <span>{t('common.create')}</span>
                <Plus size={18} />
              </Button>
            </div>
          </div>

          <p className='text-muted-foreground'>
            {t('templates.userSearchExampleDesc')}
          </p>

          {/* 分隔线 */}
          <Separator className='shadow-sm' />
        </div>

        {/* 可滚动区域：组件内容 */}
        <div className='faded-bottom no-scrollbar flex-1 overflow-auto pt-4 pb-16'>
          <div className='grid gap-6 md:grid-cols-2'>
            {/* 多选示例 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('templates.userSearchMultiSelect')}</CardTitle>
                <CardDescription>
                  {t('templates.userSearchMultiSelectDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <UserSearchComponent
                  users={mockUsers}
                  selectedUserIds={selectedUsers}
                  onUserSelect={(userId) => {
                    setSelectedUsers((prev) => {
                      if (prev.includes(userId)) {
                        return prev.filter((id) => id !== userId)
                      }
                      return [...prev, userId]
                    })
                    handleUserSelect(userId)
                  }}
                  placeholder={t('components.userSearch.selectUsers')}
                  multiple={true}
                  showSelectedBadges={true}
                />
                <div className='space-y-2'>
                  <p className='text-sm font-medium'>{t('templates.userSearchSelectedUsers')}</p>
                  <div className='flex flex-wrap gap-2'>
                    {selectedUsers.length === 0 ? (
                      <span className='text-sm text-muted-foreground'>{t('templates.userSearchNoSelection')}</span>
                    ) : (
                      mockUsers
                        .filter((user) => selectedUsers.includes(user.id))
                        .map((user) => (
                          <Badge key={user.id} variant='secondary'>
                            {user.name} ({user.email})
                          </Badge>
                        ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 单选示例 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('templates.userSearchSingleSelect')}</CardTitle>
                <CardDescription>
                  {t('templates.userSearchSingleSelectDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <UserSearchComponent
                  users={mockUsers}
                  selectedUserIds={selectedUserSingle}
                  onUserSelect={(userId) => {
                    setSelectedUserSingle((prev) => {
                      if (prev.includes(userId)) {
                        return []
                      }
                      return [userId]
                    })
                    handleUserSelect(userId)
                  }}
                  placeholder={t('components.userSearch.selectUsers')}
                  multiple={false}
                  showSelectedBadges={true}
                />
                <div className='space-y-2'>
                  <p className='text-sm font-medium'>{t('templates.userSearchSelectedUsers')}</p>
                  <div className='flex flex-wrap gap-2'>
                    {selectedUserSingle.length === 0 ? (
                      <span className='text-sm text-muted-foreground'>{t('templates.userSearchNoSelection')}</span>
                    ) : (
                      mockUsers
                        .filter((user) => selectedUserSingle.includes(user.id))
                        .map((user) => (
                          <Badge key={user.id} variant='secondary'>
                            {user.name} - {user.role}
                          </Badge>
                        ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 自定义筛选示例 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('templates.userSearchCustomFilter')}</CardTitle>
                <CardDescription>
                  {t('templates.userSearchCustomFilterDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <UserSearchComponent
                  users={mockUsers}
                  selectedUserIds={[]}
                  onUserSelect={handleUserSelect}
                  placeholder={t('components.userSearch.searchPlaceholder')}
                  filterFn={(user) => user.role === '管理员'}
                  multiple={true}
                  showSelectedBadges={false}
                />
                <div className='rounded-md bg-muted p-4'>
                  <p className='text-sm text-muted-foreground'>
                    {t('templates.userSearchAdminOnly')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 禁用状态示例 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('templates.userSearchDisabled')}</CardTitle>
                <CardDescription>
                  {t('templates.userSearchDisabledDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserSearchComponent
                  users={mockUsers}
                  selectedUserIds={selectedUsers}
                  onUserSelect={handleUserSelect}
                  placeholder={t('components.userSearch.searchPlaceholder')}
                  disabled={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* API 文档 */}
          <Card className='mt-6'>
            <CardHeader>
              <CardTitle>{t('templates.userSearchApiDoc')}</CardTitle>
              <CardDescription>{t('templates.userSearchApiDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b'>
                      <th className='py-2 text-left font-medium'>{t('templates.userSearchApiProp')}</th>
                      <th className='py-2 text-left font-medium'>{t('templates.userSearchApiType')}</th>
                      <th className='py-2 text-left font-medium'>{t('templates.userSearchApiDefault')}</th>
                      <th className='py-2 text-left font-medium'>{t('templates.userSearchApiDesc2')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className='border-b'>
                      <td className='py-2 font-mono'>users</td>
                      <td className='py-2 font-mono'>User[]</td>
                      <td className='py-2 font-mono'>[]</td>
                      <td className='py-2'>{t('templates.userSearchPropUsers')}</td>
                    </tr>
                    <tr className='border-b'>
                      <td className='py-2 font-mono'>selectedUserIds</td>
                      <td className='py-2 font-mono'>string[]</td>
                      <td className='py-2 font-mono'>[]</td>
                      <td className='py-2'>{t('templates.userSearchPropSelectedIds')}</td>
                    </tr>
                    <tr className='border-b'>
                      <td className='py-2 font-mono'>onUserSelect</td>
                      <td className='py-2 font-mono'>(userId: string) =&gt; void</td>
                      <td className='py-2 font-mono'>-</td>
                      <td className='py-2'>{t('templates.userSearchPropOnSelect')}</td>
                    </tr>
                    <tr className='border-b'>
                      <td className='py-2 font-mono'>multiple</td>
                      <td className='py-2 font-mono'>boolean</td>
                      <td className='py-2 font-mono'>true</td>
                      <td className='py-2'>{t('templates.userSearchPropMultiple')}</td>
                    </tr>
                    <tr className='border-b'>
                      <td className='py-2 font-mono'>showSelectedBadges</td>
                      <td className='py-2 font-mono'>boolean</td>
                      <td className='py-2 font-mono'>true</td>
                      <td className='py-2'>{t('templates.userSearchPropShowBadges')}</td>
                    </tr>
                    <tr className='border-b'>
                      <td className='py-2 font-mono'>filterFn</td>
                      <td className='py-2 font-mono'>(user, search) =&gt; boolean</td>
                      <td className='py-2 font-mono'>-</td>
                      <td className='py-2'>{t('templates.userSearchPropFilterFn')}</td>
                    </tr>
                    <tr className='border-b'>
                      <td className='py-2 font-mono'>disabled</td>
                      <td className='py-2 font-mono'>boolean</td>
                      <td className='py-2 font-mono'>false</td>
                      <td className='py-2'>{t('templates.userSearchPropDisabled')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
