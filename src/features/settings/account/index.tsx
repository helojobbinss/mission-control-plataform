import { ContentSection } from '../components/content-section'
import { AccountForm } from './account-form'

export function SettingsAccount() {
  return (
    <ContentSection
      title='Conta'
      desc='Atualize as configurações da sua conta. Defina o idioma e o fuso horário de sua preferência.'
    >
      <AccountForm />
    </ContentSection>
  )
}
