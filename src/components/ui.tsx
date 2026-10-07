import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { gsap, isTouch } from '../lib/gsap'

/** Text that rolls to a duplicate of itself on hover of the closest `.roll-host`. */
export function RollText({ text, className = '' }: { text: string; className?: string }) {
  const chars = Array.from(text)
  const row = (clone: boolean) => (
    <span className={`roll__row${clone ? ' roll__row--clone' : ''}`} aria-hidden>
      {chars.map((c, i) => (
        <span className="roll__char" style={{ '--i': i } as CSSProperties} key={i}>
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </span>
  )
  return (
    <span className={`roll ${className}`}>
      <span className="visually-hidden">{text}</span>
      {row(false)}
      {row(true)}
    </span>
  )
}

/** Pulls its child towards the pointer, springs back on leave. */
export function Magnetic({
  children,
  strength = 0.35,
  className = '',
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (isTouch()) return
    const el = ref.current!
    const xTo = gsap.quickTo(el, 'x', { duration: 1, ease: 'elastic.out(1, 0.45)' })
    const yTo = gsap.quickTo(el, 'y', { duration: 1, ease: 'elastic.out(1, 0.45)' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2 - (gsap.getProperty(el, 'x') as number)
      const cy = r.top + r.height / 2 - (gsap.getProperty(el, 'y') as number)
      xTo((e.clientX - cx) * strength)
      yTo((e.clientY - cy) * strength)
    }
    const leave = () => {
      xTo(0)
      yTo(0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [strength])
  return (
    <div ref={ref} className={`magnetic ${className}`} style={{ display: 'inline-flex' }}>
      {children}
    </div>
  )
}

export function Arrow({ size = 14, rotate = 0 }: { size?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ transform: `rotate(${rotate}deg)` }} aria-hidden>
      <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type BtnProps = {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'light' | 'blue' | 'ghost'
  cursor?: string
  external?: boolean
}

export function Button({ label, href, onClick, variant = 'light', cursor, external }: BtnProps) {
  const cls = `btn roll-host ${variant === 'blue' ? 'btn--blue' : variant === 'ghost' ? 'btn--ghost' : ''}`
  const inner = (
    <>
      <RollText text={label} />
      <span className="btn__icon">
        <Arrow />
      </span>
    </>
  )
  return (
    <Magnetic strength={0.25}>
      {href ? (
        <a
          className={cls}
          href={href}
          data-cursor={cursor}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
          onClick={
            onClick
              ? (e) => {
                  e.preventDefault()
                  onClick()
                }
              : undefined
          }
        >
          {inner}
        </a>
      ) : (
        <button className={cls} onClick={onClick} data-cursor={cursor}>
          {inner}
        </button>
      )}
    </Magnetic>
  )
}
