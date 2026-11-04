import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { arabicCopy } from '../lib/i18n'
import { pageSeo, pageSchema } from '../lib/seo'

export function SiteMetadata() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    const arabic = arabicCopy()?.seo
    const seo = pageSeo(pathname, arabic)
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
    schema.textContent = JSON.stringify(pageSchema(pathname, arabic))
    document.querySelectorAll('link[hreflang]').forEach((link) => link.remove())
    if (seo.alternates) {
      for (const [lang, href] of [['en', seo.alternates.en], ['ar', seo.alternates.ar], ['x-default', seo.alternates.en]]) {
        const link = document.createElement('link')
        link.rel = 'alternate'
        link.hreflang = lang
        link.href = href
        document.head.append(link)
      }
    }
  }, [pathname])
  return null
}
