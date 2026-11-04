import { useLocation } from 'react-router-dom'
import { brand, contact, industries, legal, marqueeA, marqueeB, pipeline, projects, reach, services, socials, testimonials, values } from './content'
import { en, type Strings } from './strings'
import { langOf, localize } from './lang'
import type { SeoCopy } from './seo'

const english = { brand, services, pipeline, marqueeA, marqueeB, values, testimonials, reach, legal, socials, contact, industries, projects }
export type Content = typeof english
export type Arabic = { content: Content; strings: Strings; seo: SeoCopy }

/* The Arabic copy is its own chunk: only Arabic pages and the language switch fetch it. */
let arabic: Arabic | null = null
let fetching: Promise<void> | null = null
const loadArabic = () =>
  (fetching ??= import('./arabic').then((m) => {
    arabic = m.arabic
  }))

/** the Arabic copy, once it has been fetched */
export const arabicCopy = () => arabic

/** the faces the Arabic pages show first, so their first layout measures the real letters */
const FACES = [
  ['1em TROX', 'ع'],
  ['1em Cairo', 'ع'],
  ['1em Cairo', '.'],
  ['1em "Inter Tight Variable"', 'a'],
]
let preparing: Promise<unknown> | null = null

/** Fetches what an Arabic page needs: its copy, and its fonts (a slow connection isn't kept waiting for those). */
export const prepareArabic = () =>
  (preparing ??= Promise.all([
    loadArabic(),
    Promise.race([
      Promise.all(FACES.map(([face, letter]) => document.fonts.load(face, letter))),
      new Promise((resolve) => window.setTimeout(resolve, 1200)),
    ]).catch(() => {}),
  ]))

/** The current language: `t` the interface's words, `c` the site's content, `path` an address in this language. */
export function useI18n() {
  const { pathname } = useLocation()
  const lang = langOf(pathname)
  const pack = lang === 'ar' ? arabic : null
  return {
    lang,
    rtl: lang === 'ar',
    t: pack?.strings ?? en,
    c: pack?.content ?? english,
    path: (to: string) => localize(to, lang),
  }
}
