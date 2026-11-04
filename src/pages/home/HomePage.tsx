import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { useExperience } from '../../providers/Experience'
import { useSmoothScroll } from '../../providers/SmoothScroll'
import { useAutoReveal } from '../../lib/useAutoReveal'
import { ScrollTrigger } from '../../lib/gsap'
import { useI18n } from '../../lib/i18n'
import { Hero } from './Hero'
import { About, Ribbons } from './About'
import { Reel } from './Reel'
import { Services } from './Services'
import { Work } from './Work'
import { Process } from './Process'
import { Values } from './Values'
import { Testimonials } from './Testimonials'
import { Reach } from './Reach'
import { Contact } from './Contact'
import { trackForm } from '../../lib/tracking'
import './v1.css'
import './sections.css'

export default function HomePage() {
  const { ready } = useExperience()
  const { scrollTo } = useSmoothScroll()
  const { t } = useI18n()
  const { hash, search } = useLocation()
  const campaignOpened = useRef(false)
  const contactTarget = hash || (/request-your-video|consultation=/.test(search) ? '#contact' : '')
  const main = useRef<HTMLElement>(null)
  useAutoReveal(main, ready)

  // Arriving from another page with a #section — glide to it once the page is revealed.
  useEffect(() => {
    if (!ready || !contactTarget) return
    const id = window.setTimeout(() => {
      ScrollTrigger.refresh()
      scrollTo(contactTarget, { duration: 2 })
      if (contactTarget === '#contact' && !campaignOpened.current) {
        campaignOpened.current = true
        trackForm('form_open', 'webflow-form', { trigger: 'landing_link' })
      }
    }, 350)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, contactTarget])

  return (
    <>
      <Header links={t.nav} />
      <main className="v1" ref={main}>
        <Hero />
        <div className="v1-sheet">
          <Ribbons />
          <About />
          <Reel />
          <Services />
          <Work />
          <Process />
          <Values />
          <Testimonials />
          <Reach />
          {/* the Team section is removed for now (its code is kept in ./Team.tsx) */}
          <Contact />
          <Footer links={t.nav} />
        </div>
      </main>
    </>
  )
}
