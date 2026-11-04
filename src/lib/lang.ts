export type Lang = 'en' | 'ar'

/** a page's language comes from its address: the Arabic site lives under /ar */
export const langOf = (pathname: string): Lang => (/^\/ar(\/|$)/.test(pathname) ? 'ar' : 'en')

/** an address without the trailing slash the static pages are served with */
export const tidy = (pathname: string) => pathname.replace(/\/+$/, '') || '/'

export const isHome = (pathname: string) => ['/', '/ar'].includes(tidy(pathname))

/** the page behind an address, whatever its language: '/ar/projects/x' → '/projects/x' */
export const baseOf = (pathname: string) => pathname.replace(/^\/ar(?=\/|$)/, '') || '/'

/**
 * A site address in a language: '/' → '/ar/', '/#work' → '/ar/#work', '/projects/x' → '/ar/projects/x'.
 * The policy pages exist in English only, and outside links stay as they are.
 */
export const localize = (to: string, lang: Lang) =>
  lang === 'ar' && to.startsWith('/') && !to.endsWith('.html') && langOf(to) !== 'ar' ? `/ar${to}` : to

/** the same page in the other language */
export const otherLangPath = (pathname: string) => {
  if (langOf(pathname) === 'ar') return baseOf(pathname)
  return pathname.endsWith('.html') ? '/ar/' : `/ar${pathname}`
}
