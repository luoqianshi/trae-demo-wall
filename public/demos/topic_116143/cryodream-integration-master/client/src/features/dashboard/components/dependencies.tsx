import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BookOpen, Package, Palette, Terminal, Globe, BarChart3, Layers, Shield, Zap, Database } from 'lucide-react'

export function Dependencies() {
  const { t } = useTranslation()

  return (
    <div className='space-y-6'>
      {/* 说明卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Package className='h-5 w-5' />
            {t('dashboard.dependenciesTitle')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.dependenciesDesc')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 核心技术栈 */}
      <Card className='border-blue-500/20 bg-blue-500/5'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Zap className='h-5 w-5 text-blue-600' />
            {t('dashboard.coreStack')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.coreStackDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='mb-3 flex items-center gap-2'>
                <div className='flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10'>
                  <Globe className='h-4 w-4 text-blue-600' />
                </div>
                <div>
                  <h4 className='font-semibold'>React 18</h4>
                  <p className='text-xs text-muted-foreground'>UI 框架</p>
                </div>
              </div>
              <p className='text-sm text-muted-foreground'>
                {t('dashboard.reactDesc')}
              </p>
            </div>

            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='mb-3 flex items-center gap-2'>
                <div className='flex h-8 w-8 items-center justify-center rounded-md bg-orange-500/10'>
                  <Terminal className='h-4 w-4 text-orange-600' />
                </div>
                <div>
                  <h4 className='font-semibold'>TypeScript</h4>
                  <p className='text-xs text-muted-foreground'>类型系统</p>
                </div>
              </div>
              <p className='text-sm text-muted-foreground'>
                {t('dashboard.tsDesc')}
              </p>
            </div>

            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='mb-3 flex items-center gap-2'>
                <div className='flex h-8 w-8 items-center justify-center rounded-md bg-green-500/10'>
                  <Layers className='h-4 w-4 text-green-600' />
                </div>
                <div>
                  <h4 className='font-semibold'>TanStack Router</h4>
                  <p className='text-xs text-muted-foreground'>路由系统</p>
                </div>
              </div>
              <p className='text-sm text-muted-foreground'>
                {t('dashboard.routerDesc')}
              </p>
            </div>

            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='mb-3 flex items-center gap-2'>
                <div className='flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/10'>
                  <Palette className='h-4 w-4 text-purple-600' />
                </div>
                <div>
                  <h4 className='font-semibold'>Tailwind CSS</h4>
                  <p className='text-xs text-muted-foreground'>CSS 框架</p>
                </div>
              </div>
              <p className='text-sm text-muted-foreground'>
                {t('dashboard.tailwindDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UI 组件库 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Palette className='h-5 w-5' />
            {t('dashboard.uiLibs')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.uiLibsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='mb-3 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Badge variant='secondary'>核心</Badge>
                  <h4 className='font-semibold'>shadcn/ui</h4>
                </div>
                <Badge variant='outline'>UI Components</Badge>
              </div>
              <p className='text-sm text-muted-foreground mb-3'>
                {t('dashboard.shadcnDesc')}
              </p>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='outline'>Button</Badge>
                <Badge variant='outline'>Card</Badge>
                <Badge variant='outline'>Dialog</Badge>
                <Badge variant='outline'>Table</Badge>
                <Badge variant='outline'>Form</Badge>
                <Badge variant='outline'>Tabs</Badge>
                <Badge variant='outline'>Dropdown</Badge>
              </div>
            </div>

            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='mb-3 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Badge variant='secondary'>图标</Badge>
                  <h4 className='font-semibold'>Lucide React</h4>
                </div>
                <Badge variant='outline'>Icons</Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                {t('dashboard.lucideDesc')}
              </p>
            </div>

            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='mb-3 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Badge variant='secondary'>图表</Badge>
                  <h4 className='font-semibold'>Recharts</h4>
                </div>
                <Badge variant='outline'>Charts</Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                {t('dashboard.rechartsDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 功能库 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BookOpen className='h-5 w-5' />
            {t('dashboard.funcLibs')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.funcLibsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='mb-3 flex items-center gap-2'>
                <Globe className='h-4 w-4 text-blue-600' />
                <h4 className='font-semibold'>react-i18next</h4>
              </div>
              <p className='text-sm text-muted-foreground mb-2'>
                {t('dashboard.i18nDesc')}
              </p>
              <Badge variant='outline'>国际化</Badge>
            </div>

            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='mb-3 flex items-center gap-2'>
                <Shield className='h-4 w-4 text-green-600' />
                <h4 className='font-semibold'>Zod</h4>
              </div>
              <p className='text-sm text-muted-foreground mb-2'>
                {t('dashboard.zodDesc')}
              </p>
              <Badge variant='outline'>验证</Badge>
            </div>

            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='mb-3 flex items-center gap-2'>
                <Database className='h-4 w-4 text-purple-600' />
                <h4 className='font-semibold'>TanStack Query</h4>
              </div>
              <p className='text-sm text-muted-foreground mb-2'>
                {t('dashboard.queryDesc')}
              </p>
              <Badge variant='outline'>数据获取</Badge>
            </div>

            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='mb-3 flex items-center gap-2'>
                <BarChart3 className='h-4 w-4 text-orange-600' />
                <h4 className='font-semibold'>date-fns</h4>
              </div>
              <p className='text-sm text-muted-foreground mb-2'>
                {t('dashboard.datefnsDesc')}
              </p>
              <Badge variant='outline'>日期处理</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 开发工具 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Terminal className='h-5 w-5' />
            {t('dashboard.devTools')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.devToolsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='mb-3 flex items-center justify-between'>
                <h4 className='font-semibold'>Vite</h4>
                <Badge variant='outline'>构建工具</Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                {t('dashboard.viteDesc')}
              </p>
            </div>

            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='mb-3 flex items-center justify-between'>
                <h4 className='font-semibold'>ESLint + Prettier</h4>
                <Badge variant='outline'>代码质量</Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                {t('dashboard.lintDesc')}
              </p>
            </div>

            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='mb-3 flex items-center justify-between'>
                <h4 className='font-semibold'>Husky + lint-staged</h4>
                <Badge variant='outline'>Git Hooks</Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                {t('dashboard.huskyDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 依赖关系图 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.dependencyGraph')}</CardTitle>
          <CardDescription>{t('dashboard.dependencyGraphDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center space-y-4 py-8'>
            <div className='rounded-lg border-2 border-primary/20 bg-primary/5 p-6'>
              <h4 className='mb-4 text-center font-semibold text-primary'>
                {t('dashboard.appLayer')}
              </h4>
              <div className='flex flex-wrap justify-center gap-2'>
                <Badge variant='secondary'>Dashboard</Badge>
                <Badge variant='secondary'>Templates</Badge>
                <Badge variant='secondary'>Components</Badge>
              </div>
            </div>

            <svg className='h-6 w-6 text-muted-foreground' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' />
            </svg>

            <div className='rounded-lg border-2 border-blue-500/20 bg-blue-500/5 p-6'>
              <h4 className='mb-4 text-center font-semibold text-blue-600 dark:text-blue-400'>
                {t('dashboard.frameworkLayer')}
              </h4>
              <div className='grid grid-cols-3 gap-3'>
                <div className='text-center'>
                  <Globe className='mx-auto mb-1 h-4 w-4 text-blue-600' />
                  <p className='text-xs font-medium'>React</p>
                </div>
                <div className='text-center'>
                  <Terminal className='mx-auto mb-1 h-4 w-4 text-orange-600' />
                  <p className='text-xs font-medium'>TypeScript</p>
                </div>
                <div className='text-center'>
                  <Layers className='mx-auto mb-1 h-4 w-4 text-green-600' />
                  <p className='text-xs font-medium'>TanStack</p>
                </div>
              </div>
            </div>

            <svg className='h-6 w-6 text-muted-foreground' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' />
            </svg>

            <div className='rounded-lg border-2 border-purple-500/20 bg-purple-500/5 p-6'>
              <h4 className='mb-4 text-center font-semibold text-purple-600 dark:text-purple-400'>
                {t('dashboard.uiLayer')}
              </h4>
              <div className='flex flex-wrap justify-center gap-2'>
                <Badge variant='outline'>shadcn/ui</Badge>
                <Badge variant='outline'>Tailwind CSS</Badge>
                <Badge variant='outline'>Lucide Icons</Badge>
                <Badge variant='outline'>Recharts</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 版本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.versionInfo')}</CardTitle>
          <CardDescription>{t('dashboard.versionInfoDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-3 md:grid-cols-3 lg:grid-cols-6'>
            <div className='rounded-md border bg-card p-3 text-center shadow-sm'>
              <p className='text-xs text-muted-foreground'>React</p>
              <p className='font-mono text-sm font-semibold'>18.3.1</p>
            </div>
            <div className='rounded-md border bg-card p-3 text-center shadow-sm'>
              <p className='text-xs text-muted-foreground'>TypeScript</p>
              <p className='font-mono text-sm font-semibold'>5.4.5</p>
            </div>
            <div className='rounded-md border bg-card p-3 text-center shadow-sm'>
              <p className='text-xs text-muted-foreground'>Vite</p>
              <p className='font-mono text-sm font-semibold'>7.3.0</p>
            </div>
            <div className='rounded-md border bg-card p-3 text-center shadow-sm'>
              <p className='text-xs text-muted-foreground'>Tailwind</p>
              <p className='font-mono text-sm font-semibold'>3.4.0</p>
            </div>
            <div className='rounded-md border bg-card p-3 text-center shadow-sm'>
              <p className='text-xs text-muted-foreground'>TanStack Router</p>
              <p className='font-mono text-sm font-semibold'>1.45.0</p>
            </div>
            <div className='rounded-md border bg-card p-3 text-center shadow-sm'>
              <p className='text-xs text-muted-foreground'>shadcn/ui</p>
              <p className='font-mono text-sm font-semibold'>latest</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
