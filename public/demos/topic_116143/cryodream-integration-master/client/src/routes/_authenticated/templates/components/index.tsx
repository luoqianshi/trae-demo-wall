import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_authenticated/templates/components/')({
  component: TemplatesComponentsIndex,
})

function TemplatesComponentsIndex() {
  const { t } = useTranslation()

  const components = [
    {
      title: t('components.buttons'),
      description: t('components.buttonsDesc'),
      url: '/templates/components/buttons',
    },
    {
      title: t('components.forms'),
      description: t('components.formsDesc'),
      url: '/templates/components/forms',
    },
    {
      title: t('components.tables'),
      description: t('components.tablesDesc'),
      url: '/templates/components/tables',
    },
    {
      title: t('components.dialogs'),
      description: t('components.dialogsDesc'),
      url: '/templates/components/dialogs',
    },
  ]

  return (
    <div className='container mx-auto py-6'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold tracking-tight'>
          {t('templates.componentTitle')}
        </h1>
        <p className='text-muted-foreground'>
          {t('templates.componentDescription')}
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {components.map((component) => (
          <Card
            key={component.url}
            className='cursor-pointer transition-shadow hover:shadow-md'
            onClick={() => (window.location.href = component.url)}
          >
            <CardHeader>
              <CardTitle className='text-xl'>{component.title}</CardTitle>
              <CardDescription>{component.description}</CardDescription>
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
