import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { NAV } from '../lib/nav'
import legal from '../lib/legal-content.json'
import './legal.css'

export default function LegalPage({ page }: { page: keyof typeof legal }) {
  const content = legal[page]
  return <>
    <Header links={NAV} />
    <main className="legal-page">
      <h1>{content.title}</h1>
      <p>Last updated: 16 June 2026</p>
      <article dangerouslySetInnerHTML={{ __html: content.html }} />
    </main>
    <Footer links={NAV} />
  </>
}
