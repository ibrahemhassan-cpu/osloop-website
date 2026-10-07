import type { CSSProperties } from 'react'
import './value-visual.css'

/** Small looping illustrations for the four OsLoop values (0–3). */
export function ValueVisual({ i }: { i: number }) {
  if (i === 0)
    return (
      <div className="vv vv--orbit" aria-hidden>
        <div className="vv__core">Your industry</div>
        {['Healthcare', 'Crypto', 'Food', 'SaaS'].map((w, k) => (
          <span key={w} className="vv__sat" style={{ '--k': k } as CSSProperties}>
            <span>{w}</span>
          </span>
        ))}
      </div>
    )
  if (i === 1)
    return (
      <div className="vv vv--blob" aria-hidden>
        <div className="vv__blob" />
        <div className="vv__blob vv__blob--2" />
      </div>
    )
  if (i === 2)
    return (
      <div className="vv vv--gem" aria-hidden>
        <svg viewBox="0 0 200 200">
          <defs>
            <linearGradient id="gemg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#9db7ff" />
              <stop offset="0.5" stopColor="#2c5bff" />
              <stop offset="1" stopColor="#050b24" />
            </linearGradient>
          </defs>
          <g className="vv__gem">
            <polygon points="100,18 172,72 100,182 28,72" fill="url(#gemg)" />
            <polygon points="100,18 128,72 100,182 72,72" fill="rgba(255,255,255,.18)" />
            <polyline points="28,72 172,72" stroke="rgba(255,255,255,.5)" strokeWidth="1.2" fill="none" />
          </g>
        </svg>
        <span className="vv__shine" />
      </div>
    )
  return (
    <div className="vv vv--waves" aria-hidden>
      {[0, 1, 2, 3].map((k) => (
        <span key={k} className="vv__wave" style={{ '--k': k } as CSSProperties} />
      ))}
      <div className="vv__bubble">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

