import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 静态导入翻译文件
import zhTranslation from './locales/zh.json'
import enTranslation from './locales/en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh',
    lng: 'zh',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false, // 禁用 Suspense 避免加载问题
    },
    // 将所有翻译合并到一个默认命名空间 'translation'
    // 这样 t('common.xxx') 会正确查找 zh.common.xxx
    resources: {
      zh: {
        translation: zhTranslation,
      },
      en: {
        translation: enTranslation,
      },
    },
  })

export default i18n
