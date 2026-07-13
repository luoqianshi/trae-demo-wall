import { SlidersHorizontal, ArrowUpAZ, ArrowDownAZ, Download, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Search } from '@/components/search'

export default function TabLayout() {
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
        {/* Tabs 组件 - 包含所有 TabsList 和 TabsContent */}
        <Tabs defaultValue='today' className='flex h-full flex-col'>
          {/* 固定区域 - 标题、按钮、TabsList */}
          <div className='shrink-0 space-y-4'>
            {/* 标题和按钮 */}
            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <h1 className='text-2xl font-bold tracking-tight'>
                  {t('templates.tabLayout')}
                </h1>
                <Badge variant='secondary'>Layout</Badge>
              </div>
                <p className='text-muted-foreground'>
                  {t('templates.tabLayoutDesc')}
                </p>
              {/* 右侧主要操作按钮 */}
              <div className='flex gap-2'>
                <Button variant='outline' className='space-x-1'>
                  <span>{t('common.import')}</span>
                  <Download size={18} />
                </Button>
                <Button className='space-x-1'>
                  <span>{t('common.create')}</span>
                  <Plus size={18} />
                </Button>
              </div>
            </div>

            {/* TabsList */}
            <TabsList className='grid w-full max-w-md grid-cols-4'>
              <TabsTrigger value='today'>{t('common.today')}</TabsTrigger>
              <TabsTrigger value='week'>{t('common.thisWeek')}</TabsTrigger>
              <TabsTrigger value='month'>{t('common.thisMonth')}</TabsTrigger>
              <TabsTrigger value='year'>{t('common.thisYear')}</TabsTrigger>
            </TabsList>
          </div>

          {/* 可滚动区域 - TabsContent */}
          <div className='faded-bottom no-scrollbar flex-1 overflow-auto pt-4 pb-16'>
            <TabsContent value='today' className='space-y-4'>
              {/* 工具栏区域（搜索、筛选、排序） */}
              <div className='flex items-end justify-between sm:items-center'>
                <div className='flex flex-col gap-4 sm:flex-row'>
                  <Input
                    placeholder={t('common.search')}
                    className='h-9 w-40 lg:w-[250px]'
                  />
                  <Select>
                    <SelectTrigger className='w-36'>
                      <SelectValue placeholder={t('common.filterBy')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>{t('common.all')}</SelectItem>
                      <SelectItem value='active'>{t('common.active')}</SelectItem>
                      <SelectItem value='inactive'>{t('common.inactive')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Select>
                  <SelectTrigger className='w-16'>
                    <SelectValue>
                      <SlidersHorizontal size={18} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align='end'>
                    <SelectItem value='asc'>
                      <div className='flex items-center gap-4'>
                        <ArrowUpAZ size={16} />
                        <span>{t('common.ascending')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value='desc'>
                      <div className='flex items-center gap-4'>
                        <ArrowDownAZ size={16} />
                        <span>{t('common.descending')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className='shadow-sm' />

              {/* Content Grid */}
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                <PlaceholderCard title='Metric 1' value='0' change='+0%' />
                <PlaceholderCard title='Metric 2' value='0' change='+0%' />
                <PlaceholderCard title='Metric 3' value='0' change='+0%' />
                <PlaceholderCard title='Metric 4' value='0' change='+0%' />
                <PlaceholderCard title='Metric 5' value='0' change='+0%' />
                <PlaceholderCard title='Metric 6' value='0' change='+0%' />
                <PlaceholderCard title='Metric 7' value='0' change='+0%' />
                <PlaceholderCard title='Metric 8' value='0' change='+0%' />
                <PlaceholderCard title='Metric 9' value='0' change='+0%' />
              </div>
            </TabsContent>

            <TabsContent value='week' className='space-y-4'>
              {/* 工具栏区域 */}
              <div className='flex items-end justify-between sm:items-center'>
                <div className='flex flex-col gap-4 sm:flex-row'>
                  <Input
                    placeholder={t('common.search')}
                    className='h-9 w-40 lg:w-[250px]'
                  />
                  <Select>
                    <SelectTrigger className='w-36'>
                      <SelectValue placeholder={t('common.filterBy')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>{t('common.all')}</SelectItem>
                      <SelectItem value='active'>{t('common.active')}</SelectItem>
                      <SelectItem value='inactive'>{t('common.inactive')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Select>
                  <SelectTrigger className='w-16'>
                    <SelectValue>
                      <SlidersHorizontal size={18} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align='end'>
                    <SelectItem value='asc'>
                      <div className='flex items-center gap-4'>
                        <ArrowUpAZ size={16} />
                        <span>{t('common.ascending')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value='desc'>
                      <div className='flex items-center gap-4'>
                        <ArrowDownAZ size={16} />
                        <span>{t('common.descending')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className='shadow-sm' />

              <PlaceholderGrid />
            </TabsContent>

            <TabsContent value='month' className='space-y-4'>
              {/* 工具栏区域 */}
              <div className='flex items-end justify-between sm:items-center'>
                <div className='flex flex-col gap-4 sm:flex-row'>
                  <Input
                    placeholder={t('common.search')}
                    className='h-9 w-40 lg:w-[250px]'
                  />
                  <Select>
                    <SelectTrigger className='w-36'>
                      <SelectValue placeholder={t('common.filterBy')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>{t('common.all')}</SelectItem>
                      <SelectItem value='active'>{t('common.active')}</SelectItem>
                      <SelectItem value='inactive'>{t('common.inactive')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Select>
                  <SelectTrigger className='w-16'>
                    <SelectValue>
                      <SlidersHorizontal size={18} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align='end'>
                    <SelectItem value='asc'>
                      <div className='flex items-center gap-4'>
                        <ArrowUpAZ size={16} />
                        <span>{t('common.ascending')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value='desc'>
                      <div className='flex items-center gap-4'>
                        <ArrowDownAZ size={16} />
                        <span>{t('common.descending')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className='shadow-sm' />

              <PlaceholderGrid />
            </TabsContent>

            <TabsContent value='year' className='space-y-4'>
              {/* 工具栏区域 */}
              <div className='flex items-end justify-between sm:items-center'>
                <div className='flex flex-col gap-4 sm:flex-row'>
                  <Input
                    placeholder={t('common.search')}
                    className='h-9 w-40 lg:w-[250px]'
                  />
                  <Select>
                    <SelectTrigger className='w-36'>
                      <SelectValue placeholder={t('common.filterBy')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>{t('common.all')}</SelectItem>
                      <SelectItem value='active'>{t('common.active')}</SelectItem>
                      <SelectItem value='inactive'>{t('common.inactive')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Select>
                  <SelectTrigger className='w-16'>
                    <SelectValue>
                      <SlidersHorizontal size={18} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align='end'>
                    <SelectItem value='asc'>
                      <div className='flex items-center gap-4'>
                        <ArrowUpAZ size={16} />
                        <span>{t('common.ascending')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value='desc'>
                      <div className='flex items-center gap-4'>
                        <ArrowDownAZ size={16} />
                        <span>{t('common.descending')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className='shadow-sm' />

              <PlaceholderGrid />
            </TabsContent>
          </div>
        </Tabs>
      </Main>
    </>
  )
}

interface PlaceholderCardProps {
  title: string
  value: string
  change?: string
  className?: string
}

function PlaceholderCard({ title, value, change, className }: PlaceholderCardProps) {
  return (
    <Card className={className}>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex h-32 items-center justify-center rounded-md border-2 border-dashed bg-muted/20'>
          <div className='text-center'>
            <div className='text-3xl font-bold text-muted-foreground'>{value}</div>
            {change && (
              <p className='mt-1 text-sm text-green-600'>{change}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PlaceholderGrid() {
  return (
    <div className='faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 pb-16 md:grid-cols-2 lg:grid-cols-3'>
      <PlaceholderCard title='Metric 1' value='0' change='+0%' />
      <PlaceholderCard title='Metric 2' value='0' change='+0%' />
      <PlaceholderCard title='Metric 3' value='0' change='+0%' />
      <PlaceholderCard title='Metric 4' value='0' change='+0%' />
      <PlaceholderCard title='Metric 5' value='0' change='+0%' />
      <PlaceholderCard title='Metric 6' value='0' change='+0%' />
    </div>
  )
}
