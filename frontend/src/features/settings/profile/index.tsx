import { ContentSection } from '../components/content-section'
import { ProfileForm } from './profile-form'

export function SettingsProfile() {
  return (
    <ContentSection
      title='Perfil'
      desc='É assim que os outros verão você no site.'
    >
      <ProfileForm />
    </ContentSection>
  )
}
