import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { useExperience } from '../../providers/Experience'
import { useSmoothScroll } from '../../providers/SmoothScroll'
import { useAutoReveal } from '../../lib/useAutoReveal'
import { ScrollTrigger } from '../../lib/gsap'
import { NAV } from '../../lib/nav'
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
import './v1.css'
import './sections.css'

export default function HomePage() {
  const { ready } = useExperience()
  const { scrollTo } = useSmoothScroll()
  const { hash } = useLocation()
  const main = useRef<HTMLElement>(null)
  useAutoReveal(main, ready)

  // Arriving from another page with a #section — glide to it once the page is revealed.
  useEffect(() => {
    if (!ready || !hash) return
    const id = window.setTimeout(() => {
      ScrollTrigger.refresh()
      scrollTo(hash, { duration: 2 })
    }, 350)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, hash])

  return (
    <>
      <Header links={NAV} />
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
          <Footer links={NAV} />
        </div>
      </main>
    </>
  )
}
