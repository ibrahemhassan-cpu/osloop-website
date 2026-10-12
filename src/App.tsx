import { Navigate, Route, Routes } from 'react-router-dom'
import { SmoothScroll } from './providers/SmoothScroll'
import { ExperienceProvider } from './providers/Experience'
import { ThemeProvider } from './providers/Theme'
import { Cursor } from './components/Cursor'
import HomePage from './pages/home/HomePage'
import ProjectsPage from './pages/projects/ProjectsPage'
import ProjectRoute from './pages/projects/ProjectPage'
import LoadersPage from './pages/loaders/LoadersPage'

export default function App() {
  return (
    <ThemeProvider>
      <SmoothScroll>
        <ExperienceProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:slug" element={<ProjectRoute />} />
            {/* lab: compare the loading screens (not linked from the navigation) */}
            <Route path="/loaders" element={<LoadersPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Cursor />
          <div className="grain" aria-hidden />
        </ExperienceProvider>
      </SmoothScroll>
    </ThemeProvider>
  )
}
