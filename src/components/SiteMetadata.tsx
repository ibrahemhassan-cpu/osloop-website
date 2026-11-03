import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { pageSeo, pageSchema } from '../lib/seo'

export function SiteMetadata() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    const seo = pageSeo(pathname)
    document.title = seo.title
    const set = (selector: string, value: string) => document.querySelector(selector)?.setAttribute('content', value)
    set('meta[name="description"]', seo.description)
    for (const prefix of ['og', 'twitter']) {
      set(`meta[property="${prefix}:title"]`, seo.title)
      set(`meta[property="${prefix}:description"]`, seo.description)
      set(`meta[property="${prefix}:image"]`, seo.image)
      set(`meta[property="${prefix}:image:alt"]`, seo.imageAlt)
    }
    set('meta[property="og:url"]', seo.url)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', seo.url)
    let schema = document.querySelector<HTMLScriptElement>('#osloop-page-schema')
    if (!schema) {
      schema = document.createElement('script')
      schema.id = 'osloop-page-schema'
      schema.type = 'application/ld+json'
      document.head.append(schema)
    }
    schema.textContent = JSON.stringify(pageSchema(pathname))
    if (pathname !== '/') document.querySelectorAll('link[hreflang]').forEach((link) => link.remove())
    if (pathname === '/' && !document.querySelector('link[hreflang]')) {
      for (const [lang, href] of [['en', '/'], ['ar', '/ar/'], ['x-default', '/']]) {
        const link = document.createElement('link')
        link.rel = 'alternate'
        link.hreflang = lang
        link.href = `https://agency.osloop.com${href}`
        document.head.append(link)
      }
    }
  }, [pathname])
  return null
}
