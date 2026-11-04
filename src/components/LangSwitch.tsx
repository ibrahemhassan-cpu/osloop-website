import { useLocation } from 'react-router-dom'
import { prepareArabic, useI18n } from '../lib/i18n'
import { otherLangPath } from '../lib/lang'
import { useExperience } from '../providers/Experience'

/** Goes to the same page in the other language, with the curtain. */
export function LangSwitch({ className, full = false, tabIndex }: { className: string; full?: boolean; tabIndex?: number }) {
  const { pathname } = useLocation()
  const { go } = useExperience()
  const { lang, t } = useI18n()
  const to = otherLangPath(pathname)
  return (
    <a
      className={className}
      href={to}
      hrefLang={lang === 'ar' ? 'en' : 'ar'}
      lang={lang === 'ar' ? 'en' : 'ar'}
      title={t.lang.title}
      tabIndex={tabIndex}
      // what the Arabic page needs starts coming as soon as the visitor heads for the switch
      onPointerEnter={lang === 'ar' ? undefined : () => void prepareArabic()}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        void prepareArabic().finally(() => go(to, ''))
      }}
    >
      {full ? t.lang.full : t.lang.short}
    </a>
  )
}
