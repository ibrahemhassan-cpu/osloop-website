import { useRef, useState } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap'
import { useSmoothScroll } from '../../providers/SmoothScroll'
import { RichTitle } from '../v2/ChapterView'
import { PROCESS_STEPS } from './stage'

export const PROCESS_ID = 'v3-process'
const STEP_VH = 75

/** The story part: a pinned, seven-step walk through how a video is made. */
export function Process() {
  const root = useRef<HTMLElement>(null)
  const [step, setStep] = useState(0)
  const { scrollTo } = useSmoothScroll()
  const N = PROCESS_STEPS.length

  useGSAP(
    () => {
      const bars = gsap.utils.toArray<HTMLElement>('.v3-pnav__fill', root.current)
      const digits = root.current!.querySelector<HTMLElement>('.v3-process__digits')!
      ScrollTrigger.create({
        id: PROCESS_ID,
        trigger: root.current,
        start: 'top top',
        end: () => `+=${(window.innerHeight * STEP_VH * N) / 100}`,
        pin: true,
        onUpdate: (self) => {
          const x = Math.min(self.progress * N, N - 0.0001)
          const k = Math.floor(x)
          setStep((s) => (s === k ? s : k))
          bars.forEach((b, i) => (b.style.transform = `scaleX(${gsap.utils.clamp(0, 1, x - i)})`))
          digits.style.transform = `translateY(${-k * 100}%)`
        },
      })
    },
    { scope: root },
  )

  const jump = (i: number) => {
    const st = ScrollTrigger.getById(PROCESS_ID)
    if (!st) return
    const len = st.end - st.start
    scrollTo(st.start + (len * (i + 0.45)) / N, { duration: 1.8 })
  }

  return (
    <section className="v3-process" id="process" ref={root} data-header-theme="auto">
      <div className="v3-process__head">
        <p className="v3-label mono" data-reveal="fade">
          (04) — How a video is born
        </p>
        <h2 className="v3-h2" data-reveal="lines">
          <RichTitle text="From idea to screen in *seven steps.*" />
        </h2>
      </div>

      <div className="v3-process__body">
        <div className="v3-process__num" aria-hidden>
          <span className="v3-process__digits">
            {PROCESS_STEPS.map((s) => (
              <span key={s.n}>{s.n}</span>
            ))}
          </span>
        </div>
        <div className="v3-process__steps">
          {PROCESS_STEPS.map((s, i) => (
            <article key={s.n} className={`v3-pstep${i === step ? ' is-on' : i < step ? ' is-past' : ''}`} aria-hidden={i !== step}>
              <p className="v3-pstep__kicker mono">
                Step {s.n} / 0{N}
              </p>
              <h3 className="v3-pstep__title">
                <span>{s.title}</span>
              </h3>
              <p className="v3-pstep__body">{s.body}</p>
              <div className="v3-pstep__get">
                <span className="mono">You get</span>
                <strong>{s.get}</strong>
              </div>
            </article>
          ))}
        </div>
      </div>

      <ol className="v3-pnav">
        {PROCESS_STEPS.map((s, i) => (
          <li key={s.n}>
            <button className={i === step ? 'is-on' : ''} onClick={() => jump(i)}>
              <span className="v3-pnav__bar">
                <span className="v3-pnav__fill" />
              </span>
              <span className="mono">{s.n}</span>
              <span className="v3-pnav__t">{s.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
