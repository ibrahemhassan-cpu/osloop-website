import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { Plugin } from 'vite'
import { projects } from '../src/lib/content.ts'
import { pageSeo, pageSchema, SITE } from '../src/lib/seo.ts'

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

export function staticSite(): Plugin {
  let output = ''
  return {
    name: 'osloop-apache-site',
    apply: 'build',
    configResolved(config) { output = resolve(config.root, config.build.outDir) },
    writeBundle() {
      const template = readFileSync(resolve(output, 'index.html'), 'utf8')
      const routes = ['/', ...projects.map((p) => `/projects/${p.slug}/`)]
      for (const route of routes) {
        const seo = pageSeo(route)
        let html = template.replace(/<title>.*?<\/title>/, `<title>${escape(seo.title)}</title>`)
        for (const [key, value] of Object.entries({ description: seo.description, 'og:title': seo.title, 'og:description': seo.description, 'og:url': seo.url, 'og:image': seo.image, 'og:image:alt': seo.imageAlt, 'twitter:title': seo.title, 'twitter:description': seo.description, 'twitter:image': seo.image, 'twitter:image:alt': seo.imageAlt })) {
          html = html.replace(new RegExp(`(<meta (?:name|property)="${key}" content=")[^"]*`), (_, prefix: string) => `${prefix}${escape(value)}`)
          // dev-1 also uses content-first meta attributes.
          html = html.replace(new RegExp(`<meta content="[^"]*" (name|property)="${key}"[^>]*>`), (_, attribute: string) => `<meta ${attribute}="${key}" content="${escape(value)}">`)
        }
        html = html.replace(/(<link rel="canonical" href=")[^"]*/, (_, prefix: string) => `${prefix}${seo.url}`)
        if (route !== '/') html = html.replace(/\s*<link rel="alternate"[^>]*>/g, '')
        html = html.replace('</head>', `<script id="osloop-page-schema" type="application/ld+json">${JSON.stringify(pageSchema(route)).replace(/</g, '\\u003c')}</script></head>`)
        const content = seo.project
          ? `<h1>${escape(seo.project.title)}</h1><p>${escape(seo.project.summary)}</p><p>${escape(seo.project.start)}</p>${seo.project.journey.map((step) => `<h2>${escape(step.stage)}</h2><p>${escape(step.text)}</p>`).join('')}<p>${escape(seo.project.end)}</p>`
          : `<h1>${escape(seo.title)}</h1><p>${escape(seo.description)}</p><h2>Our work</h2><ul>${projects.map((p) => `<li><a href="/projects/${p.slug}/">${escape(p.title)}</a>: ${escape(p.summary)}</li>`).join('')}</ul><p><a href="/ar/">Arabic website</a></p><p>Contact: osloop@outlook.com</p>`
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
        .map((route) => `  <url><loc>${SITE}${route}</loc></url>`).join('\n')
      writeFileSync(resolve(output, 'sitemap.xml'), originalSitemap.replace('</urlset>', `${projectEntries}\n</urlset>`))
      writeFileSync(resolve(output, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /formAction.php\nDisallow: /site-context.php\nDisallow: /ar/formAction.php\nSitemap: ${SITE}/sitemap.xml\n`)
      const llms = readFileSync('llms.txt', 'utf8')
      writeFileSync(resolve(output, 'llms.txt'), `${llms}\n## Selected work\n\n${projects.map((p) => `- [${p.title}](${SITE}/projects/${p.slug}/): ${p.summary}`).join('\n')}\n`)
    },
  }
}
