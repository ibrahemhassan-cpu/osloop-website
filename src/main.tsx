import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/global.css'
import './lib/gsap'
import App from './App'
import { prepareArabic } from './lib/i18n'
import { langOf } from './lib/lang'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

const start = () =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )

if (langOf(location.pathname) === 'ar') void prepareArabic().finally(start)
else start()
