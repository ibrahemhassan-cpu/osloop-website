import { projects, type Project } from './content.ts'
import { baseOf, langOf } from './lang.ts'
import legal from './legal-content.json' with { type: 'json' }

export const SITE = 'https://agency.osloop.com'
export const HOME_TITLE = 'Video Production & Animation Agency | Osloop'
export const HOME_DESCRIPTION = 'Osloop creates explainer videos, motion graphics, 3D animation, product videos, VFX, UI/UX design, and animated websites that bring brand stories to life.'
export const HOME_IMAGE = `${SITE}/images/showreel-thumbnail.png`

export type SeoCopy = { title: string; description: string; imageAlt: string; suffix: string; projects: Project[] }

const ENGLISH: SeoCopy = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  imageAlt: 'Osloop showreel featuring animation and video production work',
  suffix: 'OsLoop Media Production',
  projects,
}

/** `arabic` is the Arabic copy (lib/arabic.ts), which only Arabic pages fetch */
export function pageSeo(pathname: string, arabic?: SeoCopy) {
  const lang = langOf(pathname)
  const copy = lang === 'ar' && arabic ? arabic : ENGLISH
  const base = baseOf(pathname)
  const project = copy.projects.find((p) => base.replace(/\/$/, '') === `/projects/${p.slug}`)
  const policy = legal[base.slice(1) as keyof typeof legal]
  const route = project ? `/projects/${project.slug}/` : policy ? base : '/'
  const en = `${SITE}${route}`
  const ar = `${SITE}/ar${route}`
  return {
    lang,
    title: project ? `${project.title} | ${copy.suffix}` : policy ? `${policy.title} | ${copy.suffix}` : copy.title,
    description: project ? project.summary : policy ? policy.description : copy.description,
    url: lang === 'ar' ? ar : en,
    /** the page in each language; the policies are in English only */
    alternates: policy ? null : { en, ar },
    image: project?.cover ? new URL(project.cover, SITE).href : HOME_IMAGE,
    imageAlt: project ? project.title : copy.imageAlt,
    project,
  }
}

export function pageSchema(pathname: string, arabic?: SeoCopy) {
  const seo = pageSeo(pathname, arabic)
  return {
    '@context': 'https://schema.org',
    '@type': seo.project ? 'CreativeWork' : 'WebPage',
    name: seo.title,
    description: seo.description,
    url: seo.url,
    image: seo.image,
    inLanguage: seo.lang,
    ...(seo.project ? { creator: { '@type': 'Organization', name: 'Osloop Media Production', url: `${SITE}/` } } : {}),
  }
}
