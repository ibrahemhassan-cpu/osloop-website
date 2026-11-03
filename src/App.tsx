import { Navigate, Route, Routes } from 'react-router-dom'
import { SmoothScroll } from './providers/SmoothScroll'
import { ExperienceProvider } from './providers/Experience'
import { ThemeProvider } from './providers/Theme'
import { Cursor } from './components/Cursor'
import HomePage from './pages/home/HomePage'
import ProjectRoute from './pages/projects/ProjectPage'
import { SiteMetadata } from './components/SiteMetadata'
import LegalPage from './pages/LegalPage'

export default function App() {
  return (
    <ThemeProvider>
      <SmoothScroll>
        <ExperienceProvider>
          <SiteMetadata />
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* the All projects page is closed while it's being redesigned (pages/projects/ProjectsPage.tsx) */}
            <Route path="/projects/:slug" element={<ProjectRoute />} />
            <Route path="/privacy-policy.html" element={<LegalPage page="privacy-policy.html" />} />
            <Route path="/terms-and-conditions.html" element={<LegalPage page="terms-and-conditions.html" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Cursor />
          <div className="grain" aria-hidden />
        </ExperienceProvider>
      </SmoothScroll>
    </ThemeProvider>
  )
}
