import { Fragment, useEffect, useRef, useState } from 'react'
import { gsap, SplitText, useGSAP } from '../../lib/gsap'
import type { Chapter } from './chapters'
import { echoes, promises, styles } from './chapters'
import { Button } from '../../components/ui'

/** Renders "Plain *serif* words" → spans. */
export function RichTitle({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/g).map((part, i) =>
        part.startsWith('*') ? (
          <span className="serif" key={i}>
            {part.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

function Quotes({ active }: { active: boolean }) {
  const [i, setI] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setI((v) => (v + 1) % echoes.length), 4800)
    return () => window.clearInterval(id)
  }, [active])
  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current, { autoAlpha: 0, y: 18, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.1 })
  }, [i])
  const e = echoes[i]
  return (
    <div className="v2-quotes">
      <div ref={ref} className="v2-quote" key={i}>
        <p className="serif">“{e.q}”</p>
        <span className="mono">{e.p}</span>
      </div>
      <div className="v2-quotes__dots" aria-hidden>
        {echoes.map((_, k) => (
          <span key={k} className={k === i ? 'is-on' : ''} />
        ))}
      </div>
    </div>
  )
}

type Props = {
  chapter: Chapter
  index: number
  active: boolean
  onCta?: (kind: 'contact' | 'reel') => void
}

export function ChapterView({ chapter: c, index, active, onCta }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const words = useRef<HTMLElement[]>([])
  const first = useRef(true)

  useGSAP(
    () => {
      const split = SplitText.create('.v2-ch__title', { type: 'words', mask: 'words' })
      words.current = split.words as HTMLElement[]
      gsap.set(root.current, { autoAlpha: 0 })
    },
    { scope: root },
  )

  useEffect(() => {
    const el = root.current!
    const kicker = el.querySelector('.v2-ch__kicker')
    const rest = el.querySelectorAll('.v2-ch__fade')
    gsap.killTweensOf([el, kicker, words.current, rest])
    if (active) {
      gsap
        .timeline()
        .set(el, { autoAlpha: 1, y: 0 })
        .fromTo(words.current, { yPercent: 115, rotate: 3 }, { yPercent: 0, rotate: 0, duration: 1.35, stagger: 0.055, ease: 'silk' }, 0.1)
        .to(kicker, { duration: 1.4, scrambleText: { text: c.kicker, chars: '01/—▮', speed: 0.5, revealDelay: 0.2 } }, 0)
        .fromTo(rest, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08 }, 0.45)
    } else if (!first.current) {
      gsap.to(el, { autoAlpha: 0, y: -24, duration: 0.55, ease: 'power2.in' })
    }
    first.current = false
  }, [active, c.kicker])

  return (
    <div className={`v2-ch v2-ch--${c.align}${active ? ' is-active' : ''}`} ref={root} aria-hidden={!active}>
      <div className="v2-ch__block">
        <p className="v2-ch__kicker mono">{c.kicker}</p>
        <h2 className={`v2-ch__title${index === 0 || c.extra === 'cta' ? ' v2-ch__title--xl' : ''}`}>
          <RichTitle text={c.title} />
        </h2>
        {c.body && <p className="v2-ch__body v2-ch__fade">{c.body}</p>}

        {c.extra === 'scroll' && (
          <div className="v2-ch__scroll v2-ch__fade mono">
            <span className="v2-ch__mouse" aria-hidden>
              <i />
            </span>
            Scroll to play the story
          </div>
        )}

        {c.extra === 'styles' && (
          <ul className="v2-chips v2-ch__fade">
            {styles.map((s) => (
              <li key={s} className="mono">
                {s}
              </li>
            ))}
          </ul>
        )}

        {c.extra === 'values' && (
          <ol className="v2-promises">
            {promises.map((p, i) => (
              <li key={p.t} className="v2-ch__fade">
                <span className="mono">0{i + 1}</span>
                <div>
                  <strong>{p.t}</strong>
                  <p>{p.d}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {c.extra === 'quotes' && (
          <div className="v2-ch__fade">
            <Quotes active={active} />
          </div>
        )}

        {c.extra === 'cta' && (
          <div className="v2-ch__ctas v2-ch__fade">
            <Button label="Start your story" variant="blue" onClick={() => onCta?.('contact')} />
            <Button label="Watch the reel" variant="ghost" cursor="Play" onClick={() => onCta?.('reel')} />
          </div>
        )}
      </div>
    </div>
  )
}
