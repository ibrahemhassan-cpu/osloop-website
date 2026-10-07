import { useLocation } from 'react-router-dom'
import { useExperience } from '../providers/Experience'
import { useSmoothScroll } from '../providers/SmoothScroll'

/**
 * One way to follow any site link:
 *  - "#section" scrolls on the home page, or travels home then scrolls from other pages
 *  - "/route" plays the curtain transition
 */
export function useNavTo() {
  const { pathname } = useLocation()
  const { go } = useExperience()
  const { scrollTo } = useSmoothScroll()
  return (target: string, label?: string) => {
    if (target.startsWith('#')) {
      if (pathname === '/') scrollTo(target, { duration: 2 })
      else go('/' + target, label)
    } else go(target, label)
  }
}
