import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { Search } from '@/components/search'
import { Overview } from './components/overview'
import { RecentSales } from './components/recent-sales'
import { AnalyticsChart } from './components/analytics-chart'
import { Architecture } from './components/architecture'
import { TemplateGuide } from './components/template-guide'
import { Dependencies } from './components/dependencies'

export function Dashboard() {
  const { t } = useTranslation()

  const topNav = [
    {
      title: t('dashboard.overview'),
      href: '/dashboard/overview',
      isActive: true,
      disabled: false,
    },
    {
      title: t('dashboard.customers'),
      href: '/dashboard/customers',
      isActive: false,
      disabled: true,
    },
    {
      title: t('dashboard.products'),
      href: '/dashboard/products',
      isActive: false,
      disabled: true,
    },
    {
      title: t('dashboard.settings'),
      href: '/dashboard/settings',
      isActive: false,
      disabled: true,
    },
  ]

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header fixed>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main fixed>
        {/* 标题区域 - 简化版，无操作按钮 */}
        <div className='flex items-center gap-2'>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold tracking-tight'>
                {t('common.dashboard')}
              </h1>
              <Badge variant='secondary'>Dashboard</Badge>
            </div>
            <p className='text-muted-foreground'>
              {t('common.dashboardDescription')}
            </p>
          </div>
        </div>

        <Separator className='my-4 shadow-sm' />

        {/* 内容区域 - 标签页布局 */}
        <div className='faded-bottom no-scrollbar overflow-auto pb-16'>
          <Tabs
            defaultValue='overview'
            className='flex h-full flex-col'
          >
            {/* Tabs 列表 - 固定在顶部 */}
            <div className='sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
              <div className='w-full overflow-x-auto pb-2'>
                <TabsList className='h-10 gap-2 bg-transparent p-0'>
                  <TabsTrigger 
                    value='overview'
                    className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
                  >
                    {t('dashboard.overview')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value='architecture'
                    className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
                  >
                    {t('dashboard.architecture')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value='template'
                    className='relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
                  >
                    {t('dashboard.template')}
                    {/* Hot 效果 - 小文字 + 红点 */}
                    <span className='absolute -right-5 -top-1 flex items-center gap-1'>
                      <span className='text-[9px] font-bold text-red-500 animate-pulse'>HOT</span>
                      <span className='relative flex h-2 w-2'>
                        <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75'></span>
                        <span className='relative inline-flex h-2 w-2 rounded-full bg-red-500'></span>
                      </span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value='dependencies'
                    className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
                  >
                    {t('dashboard.dependencies')}
                  </TabsTrigger>
                </TabsList>
              </div>
              <Separator />
            </div>
            
            {/* Tabs 内容区域 - 可滚动 */}
            <div className='flex-1 overflow-auto'>
              <div className='grid gap-4 pt-4'>
            
            {/* ===== 概览 Tab ===== */}
            <TabsContent value='overview' className='space-y-6'>
              {/* 统计卡片 - 4 列对称布局 */}
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      {t('dashboard.totalRevenue')}
                    </CardTitle>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      className='h-4 w-4 text-muted-foreground'
                    >
                      <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>$45,231.89</div>
                    <p className='text-xs text-muted-foreground'>
                      +20.1% {t('dashboard.fromLastMonth')}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      {t('dashboard.subscriptions')}
                    </CardTitle>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      className='h-4 w-4 text-muted-foreground'
                    >
                      <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
                      <circle cx='9' cy='7' r='4' />
                      <path d='M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>+2350</div>
                    <p className='text-xs text-muted-foreground'>
                      +180.1% {t('dashboard.fromLastMonth')}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      {t('dashboard.sales')}
                    </CardTitle>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      className='h-4 w-4 text-muted-foreground'
                    >
                      <rect width='20' height='14' x='2' y='5' rx='2' />
                      <path d='M2 10h20' />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>+12,234</div>
                    <p className='text-xs text-muted-foreground'>
                      +19% {t('dashboard.fromLastMonth')}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      {t('dashboard.activeNow')}
                    </CardTitle>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      className='h-4 w-4 text-muted-foreground'
                    >
                      <path d='M22 12h-4l-3 9L9 3l-3 9H2' />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>+573</div>
                    <p className='text-xs text-muted-foreground'>
                      +201 {t('dashboard.sinceLastHour')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 主内容区 - 概览 + 销售 (4:3 比例) */}
              <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
                <Card className='col-span-1 lg:col-span-4'>
                  <CardHeader>
                    <CardTitle>{t('dashboard.overview')}</CardTitle>
                  </CardHeader>
                  <CardContent className='ps-2'>
                    <Overview />
                  </CardContent>
                </Card>
                <Card className='col-span-1 lg:col-span-3'>
                  <CardHeader>
                    <CardTitle>{t('dashboard.recentSales')}</CardTitle>
                    <CardDescription>
                      {t('dashboard.recentSalesDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentSales />
                  </CardContent>
                </Card>
              </div>

              {/* 分析数据 - 设备分布和推荐来源 */}
              <div className='grid gap-4 md:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>{t('dashboard.devices')}</CardTitle>
                    <CardDescription className='text-sm'>{t('dashboard.devicesDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <div className='space-y-1'>
                          <p className='text-sm font-medium'>Desktop</p>
                          <p className='text-xs text-muted-foreground'>65%</p>
                        </div>
                        <div className='w-24'>
                          <div className='h-2 rounded-full bg-primary/20'>
                            <div className='h-2 rounded-full bg-primary' style={{ width: '65%' }} />
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='space-y-1'>
                          <p className='text-sm font-medium'>Mobile</p>
                          <p className='text-xs text-muted-foreground'>30%</p>
                        </div>
                        <div className='w-24'>
                          <div className='h-2 rounded-full bg-primary/20'>
                            <div className='h-2 rounded-full bg-primary' style={{ width: '30%' }} />
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='space-y-1'>
                          <p className='text-sm font-medium'>Tablet</p>
                          <p className='text-xs text-muted-foreground'>5%</p>
                        </div>
                        <div className='w-24'>
                          <div className='h-2 rounded-full bg-primary/20'>
                            <div className='h-2 rounded-full bg-primary' style={{ width: '5%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>{t('dashboard.referrers')}</CardTitle>
                    <CardDescription className='text-sm'>{t('dashboard.referrersDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <div className='space-y-1'>
                          <p className='text-sm font-medium'>Google</p>
                          <p className='text-xs text-muted-foreground'>45%</p>
                        </div>
                        <div className='w-24'>
                          <div className='h-2 rounded-full bg-primary/20'>
                            <div className='h-2 rounded-full bg-primary' style={{ width: '45%' }} />
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='space-y-1'>
                          <p className='text-sm font-medium'>Direct</p>
                          <p className='text-xs text-muted-foreground'>30%</p>
                        </div>
                        <div className='w-24'>
                          <div className='h-2 rounded-full bg-primary/20'>
                            <div className='h-2 rounded-full bg-primary' style={{ width: '30%' }} />
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='space-y-1'>
                          <p className='text-sm font-medium'>Social</p>
                          <p className='text-xs text-muted-foreground'>25%</p>
                        </div>
                        <div className='w-24'>
                          <div className='h-2 rounded-full bg-primary/20'>
                            <div className='h-2 rounded-full bg-primary' style={{ width: '25%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 流量概览 - 只显示折线图 */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>{t('dashboard.trafficOverview')}</CardTitle>
                  <CardDescription className='text-sm'>{t('dashboard.trafficOverviewDesc')}</CardDescription>
                </CardHeader>
                <CardContent className='px-6'>
                  <AnalyticsChart />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== 架构 Tab ===== */}
            <TabsContent value='architecture' className='space-y-4'>
              <Architecture />
            </TabsContent>

            {/* ===== 模板 Tab ===== */}
            <TabsContent value='template' className='space-y-4'>
              <TemplateGuide />
            </TabsContent>

            {/* ===== 依赖 Tab ===== */}
            <TabsContent value='dependencies' className='space-y-4'>
              <Dependencies />
            </TabsContent>
            </div>
          </div>
        </Tabs>
        </div>
      </Main>
    </>
  )
}
