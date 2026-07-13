import { ContentSection } from '../components/content-section'
import { AccountForm } from './account-form'
import { useTranslation } from 'react-i18next'

export function SettingsAccount() {
  const { t } = useTranslation()
  return (
    <ContentSection
      title={t('common.account')}
      desc={t('common.updateAccountSettingsDesc')}
    >
      <AccountForm />
    </ContentSection>
  )
}
