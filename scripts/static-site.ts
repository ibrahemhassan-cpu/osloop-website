import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { Plugin } from 'vite'
import { projects } from '../src/lib/content.ts'
import { arabic } from '../src/lib/arabic.ts'
import { pageSeo, pageSchema, SITE } from '../src/lib/seo.ts'

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

/** the faces an Arabic page shows first, requested as early as the page itself */
const ARABIC_FONTS = ['trox', 'cairo-arabic', 'cairo-latin']
  .map((file) => `<link rel="preload" href="/fonts/ar/${file}.woff2" as="font" type="font/woff2" crossorigin>`)
  .join('')

export function staticSite(): Plugin {
  let output = ''
  return {
    name: 'osloop-apache-site',
    apply: 'build',
    configResolved(config) { output = resolve(config.root, config.build.outDir) },
    writeBundle() {
      const template = readFileSync(resolve(output, 'index.html'), 'utf8')
      const routes = ['/', ...projects.map((p) => `/projects/${p.slug}/`)]
      for (const route of [...routes, ...routes.map((r) => `/ar${r}`)]) {
        const seo = pageSeo(route, arabic.seo)
        const isArabic = seo.lang === 'ar'
        let html = template.replace(/<title>.*?<\/title>/, `<title>${escape(seo.title)}</title>`)
        for (const [key, value] of Object.entries({ description: seo.description, 'og:title': seo.title, 'og:description': seo.description, 'og:url': seo.url, 'og:image': seo.image, 'og:image:alt': seo.imageAlt, 'twitter:title': seo.title, 'twitter:description': seo.description, 'twitter:image': seo.image, 'twitter:image:alt': seo.imageAlt })) {
          html = html.replace(new RegExp(`(<meta (?:name|property)="${key}" content=")[^"]*`), (_, prefix: string) => `${prefix}${escape(value)}`)
          // dev-1 also uses content-first meta attributes.
          html = html.replace(new RegExp(`<meta content="[^"]*" (name|property)="${key}"[^>]*>`), (_, attribute: string) => `<meta ${attribute}="${key}" content="${escape(value)}">`)
        }
        html = html.replace(/(<link rel="canonical" href=")[^"]*/, (_, prefix: string) => `${prefix}${seo.url}`)
        // every page names its twin in the other language
        html = html.replace(/\s*<link rel="alternate"[^>]*>/g, '')
        if (seo.alternates) html = html.replace('</head>', `<link rel="alternate" hreflang="en" href="${seo.alternates.en}"><link rel="alternate" hreflang="ar" href="${seo.alternates.ar}"><link rel="alternate" hreflang="x-default" href="${seo.alternates.en}"></head>`)
        if (isArabic) {
          html = html.replace('<html lang="en">', '<html lang="ar" dir="rtl">')
          html = html.replace('</head>', `<meta property="og:locale" content="ar_AR">${ARABIC_FONTS}</head>`)
        }
        html = html.replace('</head>', `<script id="osloop-page-schema" type="application/ld+json">${JSON.stringify(pageSchema(route, arabic.seo)).replace(/</g, '\\u003c')}</script></head>`)
        const list = isArabic ? arabic.seo.projects : projects
        const prefix = isArabic ? '/ar' : ''
        const content = seo.project
          ? `<h1>${escape(seo.project.title)}</h1><p>${escape(seo.project.summary)}</p><p>${escape(seo.project.start)}</p>${seo.project.journey.map((step) => `<h2>${escape(step.stage)}</h2><p>${escape(step.text)}</p>`).join('')}<p>${escape(seo.project.end)}</p>`
          : `<h1>${escape(seo.title)}</h1><p>${escape(seo.description)}</p><h2>${isArabic ? 'أعمالنا' : 'Our work'}</h2><ul>${list.map((p) => `<li><a href="${prefix}/projects/${p.slug}/">${escape(p.title)}</a>: ${escape(p.summary)}</li>`).join('')}</ul><p>${isArabic ? '<a href="/">English website</a>' : '<a href="/ar/">Arabic website</a>'}</p><p>${isArabic ? 'تواصل معنا' : 'Contact'}: osloop@outlook.com</p>`
        html = html.replace('</body>', `<noscript><main>${content}</main></noscript></body>`)
        const destination = resolve(output, route === '/' ? 'index.html' : route.endsWith('/') ? `${route.slice(1)}index.html` : route.slice(1))
        mkdirSync(dirname(destination), { recursive: true })
        writeFileSync(destination, html)
      }
      for (const file of ['ar', 'formAction.php', 'site-context.php', 'countryLookup.php', '.htaccess', 'llms.txt', 'get-free-consultation.html', 'get-free-healthcare-consultation.html', 'get-free-real-estate-consultation.html', 'privacy-policy.html', 'terms-and-conditions.html']) {
        if (!existsSync(file)) throw new Error(`Required upload file is missing: ${file}`)
        cpSync(file, resolve(output, file), { recursive: true })
      }
      const originalSitemap = readFileSync('sitemap.xml', 'utf8')
      const projectEntries = routes.filter((route) => route.startsWith('/projects/'))
        .flatMap((route) => [route, `/ar${route}`].map((loc) => `  <url>
    <loc>${SITE}${loc}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${route}" />
    <xhtml:link rel="alternate" hreflang="ar" href="${SITE}/ar${route}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${route}" />
  </url>`)).join('\n')
      writeFileSync(resolve(output, 'sitemap.xml'), originalSitemap.replace('</urlset>', `${projectEntries}\n</urlset>`))
      writeFileSync(resolve(output, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /formAction.php\nDisallow: /site-context.php\nDisallow: /ar/formAction.php\nSitemap: ${SITE}/sitemap.xml\n`)
      const llms = readFileSync('llms.txt', 'utf8')
      writeFileSync(resolve(output, 'llms.txt'), `${llms}\n## Selected work\n\n${projects.map((p) => `- [${p.title}](${SITE}/projects/${p.slug}/): ${p.summary}`).join('\n')}\n\n## أعمال مختارة\n\n${arabic.seo.projects.map((p) => `- [${p.title}](${SITE}/ar/projects/${p.slug}/): ${p.summary}`).join('\n')}\n`)
    },
  }
}
