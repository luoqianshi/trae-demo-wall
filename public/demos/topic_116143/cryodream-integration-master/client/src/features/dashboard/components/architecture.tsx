import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export function Architecture() {
  const { t } = useTranslation()

  return (
    <div className='space-y-6'>
      {/* 架构说明卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            {t('dashboard.architectureTitle')}
            <Badge variant='secondary'>v1.0</Badge>
          </CardTitle>
          <CardDescription>
            {t('dashboard.architectureDesc')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 架构图 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.systemArchitecture')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            {/* 第一层：用户界面层 */}
            <div className='rounded-lg border-2 border-primary/20 bg-primary/5 p-4'>
              <h3 className='mb-3 text-center font-semibold text-primary'>
                {t('dashboard.uiLayer')}
              </h3>
              <div className='flex flex-wrap justify-center gap-3'>
                <div className='rounded-md border bg-card p-3 text-center shadow-sm min-w-[120px]'>
                  <p className='font-medium'>Dashboard</p>
                  <p className='text-xs text-muted-foreground'>仪表盘</p>
                </div>
                <div className='rounded-md border bg-card p-3 text-center shadow-sm min-w-[120px]'>
                  <p className='font-medium'>Templates</p>
                  <p className='text-xs text-muted-foreground'>模板系统</p>
                </div>
                <div className='rounded-md border bg-card p-3 text-center shadow-sm min-w-[120px]'>
                  <p className='font-medium'>Components</p>
                  <p className='text-xs text-muted-foreground'>组件库</p>
                </div>
                <div className='rounded-md border bg-card p-3 text-center shadow-sm min-w-[120px]'>
                  <p className='font-medium'>Settings</p>
                  <p className='text-xs text-muted-foreground'>设置</p>
                </div>
              </div>
            </div>

            {/* 箭头 */}
            <div className='flex justify-center'>
              <svg className='h-6 w-6 text-muted-foreground' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' />
              </svg>
            </div>

            {/* 第二层：核心功能层 */}
            <div className='rounded-lg border-2 border-blue-500/20 bg-blue-500/5 p-4'>
              <h3 className='mb-3 text-center font-semibold text-blue-600 dark:text-blue-400'>
                {t('dashboard.coreLayer')}
              </h3>
              <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
                <div className='rounded-md border bg-card p-3 text-center shadow-sm'>
                  <p className='font-medium'>Layout System</p>
                  <p className='text-xs text-muted-foreground'>布局系统</p>
                </div>
                <div className='rounded-md border bg-card p-3 text-center shadow-sm'>
                  <p className='font-medium'>Navigation</p>
                  <p className='text-xs text-muted-foreground'>导航系统</p>
                </div>
                <div className='rounded-md border bg-card p-3 text-center shadow-sm'>
                  <p className='font-medium'>State Management</p>
                  <p className='text-xs text-muted-foreground'>状态管理</p>
                </div>
                <div className='rounded-md border bg-card p-3 text-center shadow-sm'>
                  <p className='font-medium'>Data Fetching</p>
                  <p className='text-xs text-muted-foreground'>数据获取</p>
                </div>
              </div>
            </div>

            {/* 箭头 */}
            <div className='flex justify-center'>
              <svg className='h-6 w-6 text-muted-foreground' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' />
              </svg>
            </div>

            {/* 第三层：基础设施层 */}
            <div className='rounded-lg border-2 border-green-500/20 bg-green-500/5 p-4'>
              <h3 className='mb-3 text-center font-semibold text-green-600 dark:text-green-400'>
                {t('dashboard.infrastructureLayer')}
              </h3>
              <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
                <div className='rounded-md border bg-card p-3 text-center shadow-sm'>
                  <p className='font-medium'>TanStack Router</p>
                  <p className='text-xs text-muted-foreground'>路由系统</p>
                </div>
                <div className='rounded-md border bg-card p-3 text-center shadow-sm'>
                  <p className='font-medium'>shadcn/ui</p>
                  <p className='text-xs text-muted-foreground'>UI 组件库</p>
                </div>
                <div className='rounded-md border bg-card p-3 text-center shadow-sm'>
                  <p className='font-medium'>i18next</p>
                  <p className='text-xs text-muted-foreground'>国际化</p>
                </div>
                <div className='rounded-md border bg-card p-3 text-center shadow-sm'>
                  <p className='font-medium'>Vite</p>
                  <p className='text-xs text-muted-foreground'>构建工具</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 核心功能说明 */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>{t('dashboard.layoutSystem')}</CardTitle>
            <CardDescription>{t('dashboard.layoutSystemDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className='space-y-2 text-sm'>
              <li className='flex items-center gap-2'>
                <div className='h-2 w-2 rounded-full bg-primary' />
                <span>Standard Layout (标准布局)</span>
              </li>
              <li className='flex items-center gap-2'>
                <div className='h-2 w-2 rounded-full bg-primary' />
                <span>Top Nav Layout (顶部导航)</span>
              </li>
              <li className='flex items-center gap-2'>
                <div className='h-2 w-2 rounded-full bg-primary' />
                <span>Tab Layout (标签页布局)</span>
              </li>
              <li className='flex items-center gap-2'>
                <div className='h-2 w-2 rounded-full bg-primary' />
                <span>Standard List Layout (列表布局)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>{t('dashboard.navigationSystem')}</CardTitle>
            <CardDescription>{t('dashboard.navigationSystemDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className='space-y-2 text-sm'>
              <li className='flex items-center gap-2'>
                <div className='h-2 w-2 rounded-full bg-primary' />
                <span>Sidebar Navigation (侧边栏)</span>
              </li>
              <li className='flex items-center gap-2'>
                <div className='h-2 w-2 rounded-full bg-primary' />
                <span>Top Navigation (顶部导航)</span>
              </li>
              <li className='flex items-center gap-2'>
                <div className='h-2 w-2 rounded-full bg-primary' />
                <span>Breadcrumb (面包屑)</span>
              </li>
              <li className='flex items-center gap-2'>
                <div className='h-2 w-2 rounded-full bg-primary' />
                <span>Command Menu (命令菜单)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>{t('dashboard.internationalization')}</CardTitle>
            <CardDescription>{t('dashboard.internationalizationDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className='space-y-2 text-sm'>
              <li className='flex items-center gap-2'>
                <div className='h-2 w-2 rounded-full bg-primary' />
                <span>Chinese (简体中文)</span>
              </li>
              <li className='flex items-center gap-2'>
                <div className='h-2 w-2 rounded-full bg-primary' />
                <span>English (English)</span>
              </li>
              <li className='flex items-center gap-2'>
                <div className='h-2 w-2 rounded-full bg-primary' />
                <span>Namespace Support</span>
              </li>
              <li className='flex items-center gap-2'>
                <div className='h-2 w-2 rounded-full bg-primary' />
                <span>Dynamic Translation</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* 数据流说明 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.dataFlow')}</CardTitle>
          <CardDescription>{t('dashboard.dataFlowDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center space-y-4 py-8'>
            <div className='flex items-center gap-4'>
              <div className='rounded-md border bg-card px-6 py-3 text-center shadow-sm'>
                <p className='font-medium'>User Action</p>
                <p className='text-xs text-muted-foreground'>用户操作</p>
              </div>
              <svg className='h-6 w-6 text-muted-foreground' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 8l4 4m0 0l-4 4m4-4H3' />
              </svg>
              <div className='rounded-md border bg-card px-6 py-3 text-center shadow-sm'>
                <p className='font-medium'>State Update</p>
                <p className='text-xs text-muted-foreground'>状态更新</p>
              </div>
              <svg className='h-6 w-6 text-muted-foreground' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 8l4 4m0 0l-4 4m4-4H3' />
              </svg>
              <div className='rounded-md border bg-card px-6 py-3 text-center shadow-sm'>
                <p className='font-medium'>UI Re-render</p>
                <p className='text-xs text-muted-foreground'>UI 重渲染</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
