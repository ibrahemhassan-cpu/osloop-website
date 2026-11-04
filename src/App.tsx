import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { SmoothScroll } from './providers/SmoothScroll'
import { ExperienceProvider } from './providers/Experience'
import { ThemeProvider } from './providers/Theme'
import { Cursor } from './components/Cursor'
import HomePage from './pages/home/HomePage'
import ProjectRoute from './pages/projects/ProjectPage'
import { SiteMetadata } from './components/SiteMetadata'
import LegalPage from './pages/LegalPage'
import { ScrollTrigger } from './lib/gsap'
import { langOf } from './lib/lang'
import './styles/rtl.css'

function Pages() {
  const { pathname } = useLocation()
  const lang = langOf(pathname)
  // set while rendering: the new page measures itself for its animations before any effect up here would run
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'

  // the Arabic faces change the height of everything, so the scroll positions are measured again once they're in
  useEffect(() => {
    if (lang !== 'ar') return
    let live = true
    void document.fonts.ready.then(() => live && ScrollTrigger.refresh())
    return () => {
      live = false
    }
  }, [lang])

  return (
    // a language is a whole new set of pages: nothing carries over from the other one
    <Routes key={lang}>
      <Route path="/" element={<HomePage />} />
      <Route path="/ar" element={<HomePage />} />
      {/* the All projects page is closed while it's being redesigned (pages/projects/ProjectsPage.tsx) */}
      <Route path="/projects/:slug" element={<ProjectRoute />} />
      <Route path="/ar/projects/:slug" element={<ProjectRoute />} />
      <Route path="/privacy-policy.html" element={<LegalPage page="privacy-policy.html" />} />
      <Route path="/terms-and-conditions.html" element={<LegalPage page="terms-and-conditions.html" />} />
      <Route path="/ar/*" element={<Navigate to="/ar/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <SmoothScroll>
        <ExperienceProvider>
          <SiteMetadata />
          <Pages />
          <Cursor />
          <div className="grain" aria-hidden />
        </ExperienceProvider>
      </SmoothScroll>
    </ThemeProvider>
  )
}
