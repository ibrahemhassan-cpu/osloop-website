import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from '../lib/gsap'
import { useScrollListener } from '../providers/SmoothScroll'

/**
 * Infinite marquee whose speed and direction react to scroll velocity.
 * `speed` = percent of one copy per second.
 */
export function Marquee({
  children,
  speed = 2.2,
  reverse = false,
  className = '',
  skew = true,
}: {
  children: ReactNode
  speed?: number
  reverse?: boolean
  className?: string
  skew?: boolean
}) {
  const track = useRef<HTMLDivElement>(null)
  const target = useRef(1)
  const vel = useRef(0)

  useScrollListener(({ velocity, direction }) => {
    if (direction !== 0) target.current = direction * (1 + Math.min(Math.abs(velocity) * 0.12, 5))
    vel.current = velocity
  })

  useEffect(() => {
    const el = track.current!
    let x = 0
    let current = 1
    let sk = 0
    const wrap = gsap.utils.wrap(-50, 0)
    const setX = gsap.quickSetter(el, 'xPercent')
    const setSkew = gsap.quickSetter(el, 'skewX', 'deg')
    const tick = (_t: number, dt: number) => {
      const settle = Math.sign(target.current) || 1
      target.current += (settle - target.current) * 0.04 // ease boost back to base speed
      current += (target.current - current) * 0.08
      x = wrap(x - (reverse ? -1 : 1) * speed * current * (dt / 1000) * 0.5)
      setX(x)
      if (skew) {
        sk += (gsap.utils.clamp(-8, 8, -vel.current * 0.35) - sk) * 0.1
        vel.current *= 0.9
        setSkew(sk)
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [speed, reverse, skew])

  return (
    <div className={`marquee ${className}`}>
      <div className="marquee__track" ref={track}>
        <div className="marquee__copy">{children}</div>
        <div className="marquee__copy" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}
