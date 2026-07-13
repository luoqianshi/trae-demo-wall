import { ContentSection } from '../components/content-section'
import { DisplayForm } from './display-form'
import { useTranslation } from 'react-i18next'

export function SettingsDisplay() {
  const { t } = useTranslation()
  return (
    <ContentSection
      title={t('common.display')}
      desc={t('common.turnItemsOnOrOffToControlWhatsDisplayedInTheApp')}
    >
      <DisplayForm />
    </ContentSection>
  )
}
