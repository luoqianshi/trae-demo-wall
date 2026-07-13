import { ContentSection } from '../components/content-section'
import { AppearanceForm } from './appearance-form'
import { useTranslation } from 'react-i18next'

export function SettingsAppearance() {
  const { t } = useTranslation()
  return (
    <ContentSection
      title={t('common.appearance')}
      desc={t('common.customizeTheAppearanceOfTheAppAutomaticallySwitchBetweenDayAndNightThemes')}
    >
      <AppearanceForm />
    </ContentSection>
  )
}
