import { useEffect, useId, useRef, useState } from 'react'
import './math-check.css'

export type MathState = 'empty' | 'right' | 'wrong'

function makeQuestion() {
  const plus = Math.random() < 0.6
  let a = 2 + Math.floor(Math.random() * 8) // 2–9
  let b = 1 + Math.floor(Math.random() * 8) // 1–8
  if (!plus && b > a) [a, b] = [b, a]
  return {
    text: `${a} ${plus ? '+' : '−'} ${b}`,
    spoken: `${a} ${plus ? 'plus' : 'minus'} ${b}`,
    answer: plus ? a + b : a - b,
  }
}

/** Arabic-Indic and Persian digits → 0-9, so "١١" counts as 11. */
const toLatinDigits = (s: string) =>
  s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))

/**
 * A simple human check — a small sum to answer. Used until the Cloudflare Turnstile keys are added
 * (then Turnstile replaces it automatically). Give it a new `key` to ask a fresh question.
 */
export function MathCheck({ error, onChange }: { error?: string; onChange: (state: MathState) => void }) {
  const id = useId()
  const [q, setQ] = useState(makeQuestion)
  const [value, setValue] = useState('')
  const cb = useRef(onChange)
  cb.current = onChange

  const fresh = () => {
    setQ(makeQuestion())
    setValue('')
  }

  useEffect(() => {
    const v = toLatinDigits(value).trim()
    cb.current(v === '' ? 'empty' : Number(v) === q.answer ? 'right' : 'wrong')
  }, [value, q])

  return (
    <div className={`cfield cmath${error ? ' has-error' : ''}`}>
      <label className="mono" htmlFor={id}>
        Quick check *
      </label>
      <div className="cmath__row">
        <span className="cmath__q" aria-hidden>
          {q.text} =
        </span>
        <input
          id={id}
          className="cmath__input"
          inputMode="numeric"
          autoComplete="off"
          maxLength={3}
          placeholder="?"
          aria-label={`What is ${q.spoken}?`}
          aria-invalid={!!error}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="button" className="cmath__new" onClick={fresh} aria-label="Give me a different question" title="New question">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 11a8 8 0 1 0-2.3 5.7" />
            <path d="M20 4v7h-7" />
          </svg>
        </button>
      </div>
      {error && <em>{error}</em>}
    </div>
  )
}
