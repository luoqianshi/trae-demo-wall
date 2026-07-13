import { useTranslation } from 'react-i18next'
import { Bell, Settings, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Search } from '@/components/search'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function StandardLayout() {
  const { t } = useTranslation()

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
                {t('templates.standardLayout')}
              </h1>
              <Badge variant='secondary'>Layout</Badge>
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
            {t('templates.standardLayoutDesc')}
          </p>

          {/* 分隔线 */}
          <Separator className='shadow-sm' />
        </div>

        {/* 可滚动区域：布局框架说明 */}
        <div className='faded-bottom no-scrollbar flex-1 overflow-auto pt-4 pb-16'>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>固定顶部栏</CardTitle>
                <CardDescription>
                  Header 组件固定在顶部
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  包含搜索、主题切换、配置和头像下拉
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-base'>可滚动内容区</CardTitle>
                <CardDescription>
                  Main 组件提供可滚动区域
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  用于放置页面主要内容，支持固定和滚动两种模式
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-base'>响应式设计</CardTitle>
                <CardDescription>
                  适配不同屏幕尺寸
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  自动适配桌面、平板和手机，提供最佳浏览体验
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
