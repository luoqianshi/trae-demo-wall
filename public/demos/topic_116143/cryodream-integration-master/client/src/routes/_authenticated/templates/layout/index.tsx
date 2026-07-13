import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LayoutDashboard, List, Columns, PanelTop } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/templates/layout/')({
  component: TemplatesLayoutIndex,
})

function TemplatesLayoutIndex() {
  const { t } = useTranslation()

  const layouts = [
    {
      title: t('templates.standardLayout'),
      description: t('templates.standardLayoutDesc'),
      icon: LayoutDashboard,
      url: '/templates/layout/standard-layout',
    },
    {
      title: t('templates.standardListLayout'),
      description: t('templates.standardListLayoutDesc'),
      icon: List,
      url: '/templates/layout/standard-list-layout',
    },
    {
      title: t('templates.topNavLayout'),
      description: t('templates.topNavLayoutDesc'),
      icon: PanelTop,
      url: '/templates/layout/top-nav-layout',
    },
    {
      title: t('templates.tabLayout'),
      description: t('templates.tabLayoutDesc'),
      icon: Columns,
      url: '/templates/layout/tab-layout',
    },
  ]

  return (
    <div className='container mx-auto py-6'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold tracking-tight'>
          {t('templates.layoutTitle')}
        </h1>
        <p className='text-muted-foreground'>
          {t('templates.layoutDescription')}
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {layouts.map((layout) => (
          <Card
            key={layout.url}
            className='cursor-pointer transition-shadow hover:shadow-md'
            onClick={() => (window.location.href = layout.url)}
          >
            <CardHeader>
              <div className='mb-2 flex items-center gap-2'>
                <layout.icon className='h-5 w-5 text-primary' />
                <CardTitle className='text-xl'>{layout.title}</CardTitle>
              </div>
              <CardDescription>{layout.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>
                  {t('templates.clickToPreview')}
                </span>
                <span className='text-sm font-medium text-primary'>
                  {t('templates.view')} →
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
