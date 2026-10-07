import { useEffect, useRef, useState } from 'react'
import { reel } from '../lib/content'
import { useMedia } from '../lib/useMedia'

/**
 * Muted, looping, chrome-less YouTube video that covers its parent like `object-fit: cover`.
 * Mounts only near the viewport and fades in once playing (hides YouTube's title flash).
 */
export function YouTubeBackground({ id = reel.youtubeId, start = reel.start, poster = reel.poster }: { id?: string; start?: number; poster?: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [near, setNear] = useState(false)
  const [shown, setShown] = useState(false)
  // YouTube forces its touch UI on small screens — show the poster there instead.
  const canPlay = useMedia('(min-width: 761px) and (hover: hover)')

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '400px 0px' })
    io.observe(wrap.current!)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!near) setShown(false)
  }, [near])

  // Cover sizing — uses layout size, so parent scale/clip animations don't disturb it.
  useEffect(() => {
    if (!near || !canPlay) return
    const el = wrap.current!
    const fit = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      const ratio = 16 / 9
      let fw = w
      let fh = w / ratio
      if (fh < h) {
        fh = h
        fw = h * ratio
      }
      if (frame.current) {
        frame.current.style.width = `${Math.ceil(fw * 1.04)}px`
        frame.current.style.height = `${Math.ceil(fh * 1.04)}px`
      }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [near, canPlay])

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    loop: '1',
    playlist: id,
    start: String(start),
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    disablekb: '1',
    fs: '0',
  })

  return (
    <div className="ytbg" ref={wrap} aria-hidden>
      <img className="ytbg__poster" src={poster} alt="" loading="lazy" />
      {near && canPlay && (
        <iframe
          ref={frame}
          className={`ytbg__frame${shown ? ' is-shown' : ''}`}
          src={`https://www.youtube-nocookie.com/embed/${id}?${params}`}
          title="OsLoop showreel (background)"
          allow="autoplay; encrypted-media"
          tabIndex={-1}
          onLoad={() => window.setTimeout(() => setShown(true), 1400)}
        />
      )}
    </div>
  )
}
