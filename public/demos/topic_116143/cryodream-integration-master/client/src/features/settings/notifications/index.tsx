import { ContentSection } from '../components/content-section'
import { NotificationsForm } from './notifications-form'
import { useTranslation } from 'react-i18next'

export function SettingsNotifications() {
  const { t } = useTranslation()
  return (
    <ContentSection
      title={t('common.notifications')}
      desc={t('common.configureHowYouReceiveNotifications')}
    >
      <NotificationsForm />
    </ContentSection>
  )
}
