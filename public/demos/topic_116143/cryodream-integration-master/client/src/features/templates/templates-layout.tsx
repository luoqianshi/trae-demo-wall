import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Search } from '@/components/search'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function TemplatesLayout() {
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
        {/* 页面标题 */}
        <div className='mb-6'>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold tracking-tight'>
              {t('templates.title')}
            </h1>
            <Badge variant='secondary'>UI Kit</Badge>
          </div>
          <p className='text-muted-foreground'>
            {t('templates.description')}
          </p>
        </div>

        {/* 模板卡片网格 */}
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {/* Top Nav Layout Template Card */}
          <TemplateCard
            title={t('templates.topNavLayout')}
            description={t('templates.topNavLayoutDesc')}
            href='/templates/layout/top-nav-layout'
            tags={['Dashboard', 'TopNav', 'Tabs']}
          />

          {/* Tab Layout Template Card */}
          <TemplateCard
            title={t('templates.tabLayout')}
            description={t('templates.tabLayoutDesc')}
            href='/templates/layout/tab-layout'
            tags={['Dashboard', 'TitleNav', 'Toolbar']}
          />

          {/* User Search Component Card */}
          <TemplateCard
            title={t('templates.userSearchExample')}
            description={t('templates.userSearchExampleDesc')}
            href='/templates/components/user-search'
            tags={['Component', 'Search', 'MultiSelect']}
          />

          {/* Coming Soon Template Cards */}
          <TemplateCard
            title='Standard Page Template'
            description='Standard page layout with fixed header and scrollable content'
            href='#'
            tags={['Standard', 'Page']}
            disabled
          />

          <TemplateCard
            title='Table Page Template'
            description='Table layout with pagination, filters, and bulk actions'
            href='#'
            tags={['Table', 'Pagination']}
            disabled
          />

          <TemplateCard
            title='Editor Page Template'
            description='Editor layout with back button and action buttons'
            href='#'
            tags={['Editor', 'Form']}
            disabled
          />

          <TemplateCard
            title='Settings Page Template'
            description='Settings layout with sidebar navigation'
            href='#'
            tags={['Settings', 'Sidebar']}
            disabled
          />
        </div>
      </Main>
    </>
  )
}

interface TemplateCardProps {
  title: string
  description: string
  href: string
  tags: string[]
  disabled?: boolean
}

function TemplateCard({ title, description, href, tags, disabled }: TemplateCardProps) {
  return (
    <Card 
      className={`group relative overflow-hidden transition-all hover:shadow-lg ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
      onClick={() => !disabled && (window.location.href = href)}
    >
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div>
            <CardTitle className='text-lg'>{title}</CardTitle>
            <CardDescription className='mt-1'>
              {description}
            </CardDescription>
          </div>
          {disabled && <Badge variant='outline'>Coming Soon</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex flex-wrap gap-1'>
          {tags.map((tag) => (
            <Badge key={tag} variant='secondary' className='text-xs'>
              {tag}
            </Badge>
          ))}
        </div>
        
        {/* 预览占位区域 */}
        <div className='mt-4 h-32 w-full rounded-md border bg-muted/50 p-4'>
          <div className='flex h-full items-center justify-center text-muted-foreground'>
            <div className='text-center'>
              <div className='text-sm font-medium'>Template Preview</div>
              <div className='text-xs'>Layout Structure Only</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
