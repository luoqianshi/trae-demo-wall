import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation()

  const currentLanguage = i18n.language

  const languages = [
    { label: '中文', value: 'zh' },
    { label: 'English', value: 'en' },
  ] as const

  const handleChangeLanguage = (language: string) => {
    i18n.changeLanguage(language)
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {languages.map((lang) => (
        <button
          key={lang.value}
          onClick={() => handleChangeLanguage(lang.value)}
          className={cn(
            'px-2 py-1 rounded-md text-xs font-medium transition-colors',
            currentLanguage === lang.value
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
