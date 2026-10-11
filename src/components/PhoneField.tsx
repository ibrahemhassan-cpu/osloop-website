import { useEffect, useMemo, useRef, useState } from 'react'
import { AsYouType, getCountries, getCountryCallingCode, isValidPhoneNumber, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/max'
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'
import './phone-field.css'

// Windows has no flag emoji — load a tiny self-hosted flag font only where needed.
polyfillCountryFlagEmojis('Twemoji Country Flags', '/fonts/TwemojiCountryFlags.woff2')

export type PhoneValue = { country: CountryCode; label: string; national: string; e164: string; valid: boolean }

const flag = (cc: string) => String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))

const names = new Intl.DisplayNames(['en'], { type: 'region' })
const COUNTRIES = getCountries()
  .map((code) => ({ code, name: names.of(code) ?? code, dial: getCountryCallingCode(code) }))
  .sort((a, b) => a.name.localeCompare(b.name))

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
      if (region && COUNTRIES.some((c) => c.code === region)) return region
    }
  } catch {
    /* fall through */
  }
  return 'EG'
}

export function describe(country: CountryCode) {
  return `${names.of(country) ?? country} (+${getCountryCallingCode(country)})`
}

export function PhoneField({ onChange, error }: { onChange: (v: PhoneValue) => void; error?: string }) {
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
      label: describe(country),
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

  const list = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '')
    if (!q) return COUNTRIES
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.dial.startsWith(q) || c.code.toLowerCase() === q)
  }, [query])

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
          aria-label={`Country code: ${describe(country)}`}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="phone__flag" aria-hidden>
            {flag(country)}
          </span>
          +{getCountryCallingCode(country)}
          <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden>
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="Phone number"
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
            placeholder="Search country or code"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && list[0] && (e.preventDefault(), pick(list[0].code))}
          />
          <ul role="listbox" aria-label="Countries">
            {list.map((c) => (
              <li key={c.code}>
                <button type="button" role="option" aria-selected={c.code === country} onClick={() => pick(c.code)}>
                  <span className="phone__flag" aria-hidden>
                    {flag(c.code)}
                  </span>
                  <span className="phone__name">{c.name}</span>
                  <span className="phone__dial">+{c.dial}</span>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="phone__empty">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
