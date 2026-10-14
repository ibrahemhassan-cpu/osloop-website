import { useState } from 'react'
import { yt } from '../lib/content'

/**
 * Lightweight YouTube embed: shows the poster + play button and only loads the player
 * on click (then autoplays from 0:00). Keeps pages fast and avoids loading YouTube up front.
 */
export function VideoEmbed({ id, title, poster }: { id: string; title: string; poster?: string }) {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="vembed">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&start=0&rel=0&modestbranding=1&playsinline=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button type="button" className="vembed__poster" onClick={() => setPlaying(true)} aria-label={`Play: ${title}`}>
          <img src={poster ?? yt(id)} alt="" loading="lazy" />
          <span className="vembed__play" aria-hidden>
            <svg viewBox="0 0 24 24" width="26" height="26">
              <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
            </svg>
          </span>
        </button>
      )}
    </div>
  )
}
