let country: { Country?: string; CountryName?: string } = {}
let requested = false

export function loadSiteContext() {
  if (requested) return
  requested = true
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 2000)
  fetch('/site-context.php', { cache: 'no-store', signal: controller.signal })
    .then((r) => r.ok ? r.json() : null)
    .then((data: unknown) => {
      const code = data && typeof data === 'object' && 'country' in data ? data.country : null
      if (typeof code !== 'string' || !/^[A-Z]{2}$/.test(code) || code === 'XX') return
      country = { Country: code }
      if (typeof Intl.DisplayNames === 'function') country.CountryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(code)
    })
    .catch(() => {})
    .finally(() => window.clearTimeout(timeout))
}

export function siteContext() { return country }
