import { Navigate, Route, Routes } from 'react-router-dom'
import { SmoothScroll } from './providers/SmoothScroll'
import { ExperienceProvider } from './providers/Experience'
import { ThemeProvider } from './providers/Theme'
import { Cursor } from './components/Cursor'
import HomePage from './pages/home/HomePage'
import ProjectRoute from './pages/projects/ProjectPage'

export default function App() {
  return (
    <ThemeProvider>
      <SmoothScroll>
        <ExperienceProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* the All projects page is closed while it's being redesigned (pages/projects/ProjectsPage.tsx) */}
            <Route path="/projects/:slug" element={<ProjectRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Cursor />
          <div className="grain" aria-hidden />
        </ExperienceProvider>
      </SmoothScroll>
    </ThemeProvider>
  )
}
