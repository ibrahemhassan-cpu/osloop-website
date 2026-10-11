import { useEffect, useRef, useState } from 'react'
import './image-loop.css'

/**
 * Crossfading still loop. One image stays static; 2+ images advance every `interval` ms
 * with a ~600ms crossfade — only while the element is on screen. No controls, no counters.
 */
export function ImageLoop({
  images,
  alt,
  interval = 3000,
  offset = 0,
  className = '',
}: {
  images: string[]
  alt: string
  interval?: number
  /** delays the first switch so neighbouring cards don't change in sync */
  offset?: number
  className?: string
}) {
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 })
    io.observe(root.current!)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || images.length < 2) return
    let id = 0
    const first = window.setTimeout(() => {
      setActive((a) => (a + 1) % images.length)
      id = window.setInterval(() => setActive((a) => (a + 1) % images.length), interval)
    }, interval + offset)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [visible, images.length, interval, offset])

  return (
    <div className={`iloop ${className}`} ref={root}>
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
  )
}
