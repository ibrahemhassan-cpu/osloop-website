import { projects } from './content.ts'
import legal from './legal-content.json' with { type: 'json' }

export const SITE = 'https://agency.osloop.com'
export const HOME_TITLE = 'Video Production & Animation Agency | Osloop'
export const HOME_DESCRIPTION = 'Osloop creates explainer videos, motion graphics, 3D animation, product videos, VFX, UI/UX design, and animated websites that bring brand stories to life.'
export const HOME_IMAGE = `${SITE}/images/showreel-thumbnail.png`

export function pageSeo(pathname: string) {
  const project = projects.find((p) => pathname.replace(/\/$/, '') === `/projects/${p.slug}`)
  const policy = legal[pathname.slice(1) as keyof typeof legal]
  return {
    title: project ? `${project.title} | OsLoop Media Production` : policy ? `${policy.title} | OsLoop Media Production` : HOME_TITLE,
    description: project ? project.summary : policy ? policy.description : HOME_DESCRIPTION,
    url: `${SITE}${project ? `/projects/${project.slug}/` : policy ? pathname : '/'}`,
    image: project?.cover ? new URL(project.cover, SITE).href : HOME_IMAGE,
    imageAlt: project ? project.title : 'Osloop showreel featuring animation and video production work',
    project,
  }
}

export function pageSchema(pathname: string) {
  const seo = pageSeo(pathname)
  return {
    '@context': 'https://schema.org',
    '@type': seo.project ? 'CreativeWork' : 'WebPage',
    name: seo.title,
    description: seo.description,
    url: seo.url,
    image: seo.image,
    inLanguage: 'en',
    ...(seo.project ? { creator: { '@type': 'Organization', name: 'Osloop Media Production', url: `${SITE}/` } } : {}),
  }
}
