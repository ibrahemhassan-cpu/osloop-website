import { useEffect, useMemo, useRef, useState } from 'react'
import { AsYouType, getCountries, getCountryCallingCode, isValidPhoneNumber, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/max'
import { flag } from '../lib/flags'
import { useI18n } from '../lib/i18n'
import type { Lang } from '../lib/lang'
import './phone-field.css'

export type PhoneValue = { country: CountryCode; label: string; national: string; e164: string; valid: boolean }

const CODES = getCountries()
const nameIn = (lang: Lang) => {
  const names = new Intl.DisplayNames([lang], { type: 'region' })
  return (code: CountryCode) => names.of(code) ?? code
}
const NAME = { en: nameIn('en'), ar: nameIn('ar') }

/** Every country in a language's own order. Its English name stays searchable in Arabic too. */
const list = (lang: Lang) =>
  CODES.map((code) => ({ code, name: NAME[lang](code), english: NAME.en(code), dial: getCountryCallingCode(code) })).sort((a, b) =>
    a.name.localeCompare(b.name, lang),
  )

const TZ: Record<string, CountryCode> = {
  'Africa/Cairo': 'EG', 'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE', 'Asia/Kuwait': 'KW', 'Asia/Qatar': 'QA',
  'Asia/Bahrain': 'BH', 'Asia/Muscat': 'OM', 'Asia/Amman': 'JO', 'Asia/Beirut': 'LB', 'Asia/Baghdad': 'IQ',
  'Africa/Casablanca': 'MA', 'Africa/Tunis': 'TN', 'Africa/Algiers': 'DZ', 'Africa/Tripoli': 'LY', 'Africa/Khartoum': 'SD',
  'Europe/Istanbul': 'TR', 'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL', 'America/New_York': 'US', 'America/Chicago': 'US',
  'America/Denver': 'US', 'America/Los_Angeles': 'US', 'America/Toronto': 'CA', 'Australia/Sydney': 'AU',
  'Asia/Kolkata': 'IN', 'Asia/Karachi': 'PK', 'Asia/Singapore': 'SG', 'Asia/Tokyo': 'JP',
}

/** Best guess from the visitor's time zone, then browser language — no network calls. */
function detectCountry(): CountryCode {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (TZ[tz]) return TZ[tz]
    for (const lang of navigator.languages ?? [navigator.language]) {
      const region = new Intl.Locale(lang).maximize().region as CountryCode | undefined
      if (region && CODES.includes(region)) return region
    }
  } catch {
    /* fall through */
  }
  return 'EG'
}

export function describe(country: CountryCode, lang: Lang = 'en') {
  // the isolates keep "+20" reading the right way round inside Arabic text
  return `${NAME[lang](country)} (\u2066+${getCountryCallingCode(country)}\u2069)`
}

export function PhoneField({ onChange, error }: { onChange: (v: PhoneValue) => void; error?: string }) {
  const { lang, t } = useI18n()
  const countries = useMemo(() => list(lang), [lang])
  const [country, setCountry] = useState<CountryCode>(detectCountry)
  const [national, setNational] = useState('')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const box = useRef<HTMLDivElement>(null)
  const search = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const digits = national.replace(/\D/g, '')
    const parsed = digits ? parsePhoneNumberFromString(digits, country) : undefined
    onChange({
      country,
      label: describe(country, lang),
      national: digits,
      e164: parsed?.number ?? '',
      valid: !digits || isValidPhoneNumber(digits, country),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, national])

  useEffect(() => {
    if (!open) return
    search.current?.focus()
    const close = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '')
    if (!q) return countries
    return countries.filter((c) => c.name.toLowerCase().includes(q) || c.english.toLowerCase().includes(q) || c.dial.startsWith(q) || c.code.toLowerCase() === q)
  }, [query, countries])

  const pick = (code: CountryCode) => {
    setCountry(code)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className={`phone${error ? ' has-error' : ''}`} ref={box}>
      <div className="phone__row">
        <button
          type="button"
          className="phone__cc"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t.phone.code(describe(country, lang))}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="phone__flag" aria-hidden>
            {flag(country)}
          </span>
          <span dir="ltr">+{getCountryCallingCode(country)}</span>
          <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden>
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={t.phone.placeholder}
          dir="ltr"
          value={national}
          onChange={(e) => setNational(new AsYouType(country).input(e.target.value))}
          aria-invalid={!!error}
        />
      </div>
      {open && (
        <div className="phone__menu" data-lenis-prevent>
          <input
            ref={search}
            className="phone__search"
            placeholder={t.phone.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && matches[0] && (e.preventDefault(), pick(matches[0].code))}
          />
          <ul role="listbox" aria-label={t.phone.countries}>
            {matches.map((c) => (
              <li key={c.code}>
                <button type="button" role="option" aria-selected={c.code === country} onClick={() => pick(c.code)}>
                  <span className="phone__flag" aria-hidden>
                    {flag(c.code)}
                  </span>
                  <span className="phone__name">{c.name}</span>
                  <span className="phone__dial" dir="ltr">+{c.dial}</span>
                </button>
              </li>
            ))}
            {matches.length === 0 && <li className="phone__empty">{t.phone.none}</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
