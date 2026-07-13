import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Search } from '@/components/search'
import { TopNav } from '@/components/layout/top-nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TopNavLayout() {
  const { t } = useTranslation()

  const topNav = [
    {
      title: t('common.overview'),
      href: '/dashboard/overview',
      isActive: true,
      disabled: false,
    },
    {
      title: t('common.analytics'),
      href: '/dashboard/analytics',
      isActive: false,
      disabled: false,
    },
    {
      title: t('common.reports'),
      href: '/dashboard/reports',
      isActive: false,
      disabled: true,
    },
    {
      title: t('common.settings'),
      href: '/dashboard/settings',
      isActive: false,
      disabled: false,
    },
  ]

  return (
    <>
      {/* ===== Top Heading with TopNav ===== */}
      <Header fixed>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main Content ===== */}
      <Main fixed className='pb-6'>
        {/* 标题和按钮左右排列 */}
        <div className='flex items-center justify-between gap-2'>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold tracking-tight'>
                {t('templates.topNavLayout')}
              </h1>
              <Badge variant='secondary'>Layout</Badge>
            </div>
            <p className='text-muted-foreground'>
              {t('templates.topNavLayoutDesc')}
            </p>
          </div>
          {/* 右侧主要操作按钮 */}
          <div className='flex gap-2'>
            <Button variant='outline' className='space-x-1'>
              <span>{t('common.export')}</span>
              <Download size={18} />
            </Button>
            <Button className='space-x-1'>
              <span>{t('common.download')}</span>
              <Download size={18} />
            </Button>
          </div>
        </div>

        <Separator className='my-4 shadow-sm' />

        {/* Content Area - Scrollable */}
        <div className='faded-bottom no-scrollbar grid gap-4 overflow-auto pb-16'>
          {/* Stat Cards Grid */}
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>{t('templates.totalRevenue')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>$45,231.89</div>
                <p className='text-xs text-muted-foreground'>+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>{t('templates.subscriptions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>+2350</div>
                <p className='text-xs text-muted-foreground'>+180.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>{t('templates.sales')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>+12,234</div>
                <p className='text-xs text-muted-foreground'>+19% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>{t('templates.activeNow')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>+573</div>
                <p className='text-xs text-muted-foreground'>+201 since last hour</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
            <Card className='lg:col-span-4'>
              <CardHeader>
                <CardTitle>{t('common.overview')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex h-[300px] items-center justify-center rounded-md border bg-muted/20'>
                  <p className='text-muted-foreground'>Chart placeholder - Add your chart component here</p>
                </div>
              </CardContent>
            </Card>
            <Card className='lg:col-span-3'>
              <CardHeader>
                <CardTitle>{t('templates.recentSales')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {[
                    { name: 'Olivia Martin', email: 'olivia.martin@email.com', amount: '+$1,999.00' },
                    { name: 'Jackson Lee', email: 'jackson.lee@email.com', amount: '+$39.00' },
                    { name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', amount: '+$299.00' },
                    { name: 'William Kim', email: 'will.kim@email.com', amount: '+$99.00' },
                    { name: 'Sofia Davis', email: 'sofia.davis@email.com', amount: '+$39.00' },
                  ].map((sale, i) => (
                    <div key={i} className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center'>
                          <span className='text-xs font-medium text-primary'>
                            {sale.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className='text-sm font-medium leading-none'>{sale.name}</p>
                          <p className='text-xs text-muted-foreground'>{sale.email}</p>
                        </div>
                      </div>
                      <span className='text-sm font-medium'>{sale.amount}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
