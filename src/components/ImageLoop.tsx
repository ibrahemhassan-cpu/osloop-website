import { useEffect, useRef, useState } from 'react'
import './image-loop.css'

/**
 * Crossfading still loop. One image stays static; 2+ images advance every `interval` ms
 * with a ~600ms crossfade — only while the element is on screen. `dots` adds Swiper-style
 * pagination: it shows which image is on, and clicking a dot jumps to that image.
 */
export function ImageLoop({
  images,
  alt,
  interval = 3000,
  offset = 0,
  className = '',
  dots = false,
}: {
  images: string[]
  alt: string
  interval?: number
  /** delays the first switch so neighbouring cards don't change in sync */
  offset?: number
  className?: string
  dots?: boolean
}) {
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(false)
  // bumps when a dot is clicked, so autoplay waits a full interval before moving on (like Swiper)
  const [kick, setKick] = useState(0)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 })
    io.observe(root.current!)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || images.length < 2) return
    let id = 0
    const first = window.setTimeout(
      () => {
        setActive((a) => (a + 1) % images.length)
        id = window.setInterval(() => setActive((a) => (a + 1) % images.length), interval)
      },
      kick ? interval : interval + offset,
    )
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [visible, images.length, interval, offset, kick])

  const go = (i: number) => {
    setActive(i)
    setKick((k) => k + 1)
  }

  return (
    <div className={`iloop ${className}`} ref={root}>
      {/* the stills move as one layer (parallax); the dots stay put on top */}
      <div className="iloop__track">
        {images.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt={i === active ? alt : ''}
            aria-hidden={i !== active}
            className={i === active ? 'is-on' : ''}
            // the first image loads eagerly; the rest only once the card has been seen
            loading={i === 0 ? 'lazy' : visible ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
          />
        ))}
      </div>
      {dots && images.length > 1 && (
        <div className="iloop__dots" role="group" aria-label="Images">
          {images.map((src, i) => (
            <button
              type="button"
              key={src + i}
              className={i === active ? 'is-on' : ''}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === active}
              onClick={() => go(i)}
            >
              <span />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
