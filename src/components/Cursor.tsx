import { useEffect, useRef } from 'react'
import { gsap, isTouch } from '../lib/gsap'
import './cursor.css'

/** Let non-DOM targets (e.g. the WebGL loop) drive the cursor label. */
export function setCursorLabel(label: string | null) {
  window.dispatchEvent(new CustomEvent('cursor:label', { detail: label }))
}

/**
 * Two-part cursor: a precise dot + a lagging ring.
 * Add `data-cursor="Label"` to any element to morph the ring into a labelled bubble.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (isTouch()) return
    document.documentElement.classList.add('has-cursor')
    const d = dot.current!
    const r = ring.current!
    gsap.set([d, r], { xPercent: -50, yPercent: -50 })
    const dx = gsap.quickTo(d, 'x', { duration: 0.12, ease: 'power3' })
    const dy = gsap.quickTo(d, 'y', { duration: 0.12, ease: 'power3' })
    const rx = gsap.quickTo(r, 'x', { duration: 0.55, ease: 'power3' })
    const ry = gsap.quickTo(r, 'y', { duration: 0.55, ease: 'power3' })

    let visible = false
    let forced: string | null = null
    const move = (e: PointerEvent) => {
      if (!visible) {
        visible = true
        gsap.to([d, r], { autoAlpha: 1, duration: 0.3 })
      }
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
    }
    const over = (e: PointerEvent) => {
      if (forced) return
      const t = e.target as HTMLElement
      const labelled = t.closest<HTMLElement>('[data-cursor]')
      const interactive = t.closest('a, button, [role="button"], input, textarea, label')
      if (labelled) {
        label.current!.textContent = labelled.dataset.cursor ?? ''
        r.dataset.state = 'label'
      } else if (interactive) {
        r.dataset.state = 'hover'
      } else {
        r.dataset.state = ''
      }
    }
    const leave = () => {
      visible = false
      gsap.to([d, r], { autoAlpha: 0, duration: 0.3 })
    }
    const onLabel = (e: Event) => {
      forced = (e as CustomEvent<string | null>).detail
      if (forced) {
        label.current!.textContent = forced
        r.dataset.state = 'label'
      } else r.dataset.state = ''
    }
    const down = () => r.classList.add('is-down')
    const up = () => r.classList.remove('is-down')

    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerover', over, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('cursor:label', onLabel)
    return () => {
      window.removeEventListener('cursor:label', onLabel)
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', over)
      document.documentElement.removeEventListener('pointerleave', leave)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  return (
    <>
      <div className="cursor-ring" ref={ring} aria-hidden>
        <span ref={label} className="cursor-ring__label" />
      </div>
      <div className="cursor-dot" ref={dot} aria-hidden />
    </>
  )
}
