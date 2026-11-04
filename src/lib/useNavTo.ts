import { useLocation } from 'react-router-dom'
import { isHome, langOf, localize } from './lang'
import { useExperience } from '../providers/Experience'
import { useSmoothScroll } from '../providers/SmoothScroll'

/**
 * One way to follow any site link:
 *  - "#section" scrolls on the home page, or travels home then scrolls from other pages
 *  - "/route" plays the curtain transition
 * Both stay in the page's language.
 */
export function useNavTo() {
  const { pathname } = useLocation()
  const { go } = useExperience()
  const { scrollTo } = useSmoothScroll()
  const lang = langOf(pathname)
  return (target: string, label?: string) => {
    if (target.startsWith('#')) {
      if (isHome(pathname)) scrollTo(target, { duration: 2 })
      else go(localize('/' + target, lang), label)
    } else go(localize(target, lang), label)
  }
}
