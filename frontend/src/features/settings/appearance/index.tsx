import { ContentSection } from '../components/content-section'
import { AppearanceForm } from './appearance-form'

export function SettingsAppearance() {
  return (
    <ContentSection
      title='Aparência'
      desc='Personalize a aparência do aplicativo. Alterne automaticamente entre os temas diurno e noturno.'
    >
      <AppearanceForm />
    </ContentSection>
  )
}
