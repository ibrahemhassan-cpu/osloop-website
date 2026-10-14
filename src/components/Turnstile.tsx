import { useEffect, useRef } from 'react'
import { contact } from '../lib/content'

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

/**
 * The active site key: content.ts → VITE_TURNSTILE_SITE_KEY. While neither is set, the contact form
 * uses a simple math question instead (see MathCheck).
 */
export const turnstileKey: string = contact.turnstileSiteKey || (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || ''

let loader: Promise<void> | null = null
function loadScript() {
  loader ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('turnstile'))
    document.head.appendChild(s)
  })
  return loader
}

/**
 * Cloudflare Turnstile — usually invisible/one-click. Reports a token (or null when it
 * expires / fails). `resetKey` changes force a fresh challenge (e.g. after a failed submit).
 */
export function Turnstile({ onToken, theme, resetKey = 0 }: { onToken: (t: string | null) => void; theme: 'light' | 'dark'; resetKey?: number }) {
  const el = useRef<HTMLDivElement>(null)
  const cb = useRef(onToken)
  cb.current = onToken

  useEffect(() => {
    if (!turnstileKey) return
    let id: string | null = null
    let alive = true
    loadScript()
      .then(() => {
        if (!alive || !el.current || !window.turnstile) return
        id = window.turnstile.render(el.current, {
          sitekey: turnstileKey,
          theme,
          appearance: 'interaction-only',
          callback: (t: string) => cb.current(t),
          'expired-callback': () => cb.current(null),
          'error-callback': () => cb.current(null),
        })
      })
      .catch(() => cb.current(null))
    return () => {
      alive = false
      if (id && window.turnstile) window.turnstile.remove(id)
      cb.current(null)
    }
  }, [theme, resetKey])

  if (!turnstileKey) return null
  return <div className="turnstile" ref={el} />
}
