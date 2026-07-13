import { ContentSection } from '../components/content-section'
import { ProfileForm } from './profile-form'
import { useTranslation } from 'react-i18next'

export function SettingsProfile() {
  const { t } = useTranslation()
  return (
    <ContentSection
      title={t('common.profile')}
      desc={t('common.thisIsHowOthersWillSeeYouOnTheSite')}
    >
      <ProfileForm />
    </ContentSection>
  )
}
