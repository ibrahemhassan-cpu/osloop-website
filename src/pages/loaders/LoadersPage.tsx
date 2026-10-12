import { useState, type ReactElement } from 'react'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { Button } from '../../components/ui'
import { NAV } from '../../lib/nav'
import { LOADERS, type LoaderEntry } from '../../loaders'
import { ICON_CENTRE, IconArrow, IconBand, IconDefs } from '../../loaders/art'
import { WORD, WORD_BOX } from '../../loaders/wordmark'
import { A, ARROW_HOME_SVG, ARROW_SCALE, RHO, RT, iconMotion } from '../../lib/loopShape'
import './loaders.css'

const HOME = `translate(${ARROW_HOME_SVG.x} ${ARROW_HOME_SVG.y})`

/** the finished icon, centred on the origin */
function Icon({ id, scale = 1, color }: { id: string; scale?: number; color?: string }) {
  return (
    <g transform={`scale(${scale}) translate(${-ICON_CENTRE.x} ${-ICON_CENTRE.y})`} style={{ color }}>
      <IconBand id={id} />
      <IconArrow transform={HOME} />
    </g>
  )
}

function PressPlayPoster() {
  const c = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]
  return (
    <svg viewBox="-200 -125 400 250">
      <defs>
        <IconDefs id="pp" />
      </defs>
      {c.map(([sx, sy]) => (
        <path key={`${sx}${sy}`} className="lab-poster__line" d={`M${sx * 180} ${sy * 105 - sy * 16} L${sx * 180} ${sy * 105} L${sx * 180 - sx * 16} ${sy * 105}`} />
      ))}
      <circle cx="-164" cy="-93" r="3.2" fill="#ffae23" />
      <text className="lab-poster__mono" x="-155" y="-90">
        REC
      </text>
      <text className="lab-poster__mono" x="160" y="98" textAnchor="end">
        TC 00:00:02:14
      </text>
      <Icon id="pp" scale={1.25} />
    </svg>
  )
}

function IrisPoster() {
  const Rin = 78
  const r = Rin * 0.62
  const n = 9
  const pts = Array.from({ length: n }, (_, i) => {
    const a = ((-118 + (i * 360) / n) * Math.PI) / 180
    return [r * Math.cos(a), r * Math.sin(a)]
  })
  const blades = pts.map(([x0, y0], i) => {
    const [x1, y1] = pts[(i + 1) % n]
    let dx = x1 - x0
    let dy = y1 - y0
    const l = Math.hypot(dx, dy)
    dx /= l
    dy /= l
    let nx = dy
    let ny = -dx
    if (nx * (x0 + x1) + ny * (y0 + y1) < 0) {
      nx = -nx
      ny = -ny
    }
    const ax = x0 - dx * 14
    const ay = y0 - dy * 14
    const bx = x0 + dx * 190
    const by = y0 + dy * 190
    return [ax, ay, bx, by, bx + nx * 170, by + ny * 170, ax + nx * 170, ay + ny * 170].map((v) => v.toFixed(1)).join(',')
  })
  return (
    <svg viewBox="-200 -125 400 250">
      <defs>
        <IconDefs id="pi" />
        <clipPath id="pi-barrel">
          <circle r={Rin} />
        </clipPath>
      </defs>
      <circle r={Rin} className="lab-poster__fill" />
      <Icon id="pi" scale={0.42} />
      <g clipPath="url(#pi-barrel)">
        {blades.map((p, i) => (
          <polygon key={i} points={p} className={`lab-poster__blade lab-poster__blade--${i % 3}`} />
        ))}
      </g>
      <circle r={Rin} className="lab-poster__line" />
      <circle r={104} className="lab-poster__line" />
      <circle r={112} className="lab-poster__line" />
      {Array.from({ length: 72 }, (_, i) => (
        <line key={i} x1="0" x2="0" y1="-104" y2="-112" className="lab-poster__line" transform={`rotate(${i * 5})`} />
      ))}
      {['3', '5', '10', '∞'].map((s, i) => (
        <text key={s} className={`lab-poster__mono${s === '∞' ? ' is-orange' : ''}`} textAnchor="middle" transform={`rotate(${(i - 3) * 22}) translate(0 -88)`}>
          {s}
        </text>
      ))}
      <path d="M0 -99 L-4 -94 L4 -94 Z" transform="rotate(180 0 -96.5)" fill="#ffae23" />
    </svg>
  )
}

function FramesPoster() {
  const m = iconMotion()
  const fw = 170
  const fh = fw / 1.66
  const pitch = fh * 1.1
  const stripW = fw * 1.24
  const sc = Math.min((fw * 0.8) / 165, (fh * 0.84) / 111)
  const frame = (k: number, p: number | null) => {
    const s = p == null ? 0 : p * m.flightLen
    return (
      <g key={k} transform={`translate(0 ${k * pitch})`}>
        <rect className="lab-poster__film" x={-stripW / 2} y={-pitch / 2 - 0.5} width={stripW} height={pitch + 1} />
        {[0, 1, 2, 3].map((i) =>
          [-1, 1].map((side) => (
            <rect
              key={`${i}${side}`}
              className="lab-poster__hole"
              x={side * (fw / 2 + fw * 0.06) - 4}
              y={-pitch / 2 + (pitch * (i + 0.5)) / 4 - 5}
              width="8"
              height="10"
              rx="2"
            />
          )),
        )}
        <rect className="lab-poster__frame" x={-fw / 2} y={-fh / 2} width={fw} height={fh} rx="4" />
        <g transform={`scale(${sc}) translate(4.5 -10.5)`} className="lab-poster__ink">
          {p == null ? (
            <>
              <IconBand id="pf" />
              <IconArrow transform={HOME} />
            </>
          ) : (
            <>
              <IconBand id="pf" dash={m.bandOffset(s)} dashLen={m.bandLen} finished={false} />
              <IconArrow transform={m.arrowAt(s, 1, 1.1)} />
            </>
          )}
        </g>
      </g>
    )
  }
  return (
    <svg viewBox="-200 -125 400 250">
      <defs>
        <IconDefs id="pf" />
      </defs>
      <g>
        {frame(-1, 0.55)}
        {frame(0, null)}
        {frame(1, 0.2)}
      </g>
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sy]) => (
        <path key={`${sx}${sy}`} className="lab-poster__bracket" d={`M${sx * (fw / 2 + 7)} ${sy * (fh / 2 + 7) - sy * 12} L${sx * (fw / 2 + 7)} ${sy * (fh / 2 + 7)} L${sx * (fw / 2 + 7) - sx * 12} ${sy * (fh / 2 + 7)}`} />
      ))}
    </svg>
  )
}

function LoopsPoster() {
  const q = 0.135
  // every level shares the right lobe's hole (A, 0); the next one sits inside it, turned a little
  const lvl = (k: number) => (
    <g key={k} transform={`translate(${A} 0) rotate(${32 * k}) scale(${q ** k}) translate(${-A} 0)`} style={{ color: k % 2 ? 'var(--hl)' : undefined }}>
      <IconBand id="pl" />
      <IconArrow transform={HOME} />
    </g>
  )
  return (
    <svg viewBox="-200 -125 400 250">
      <defs>
        <IconDefs id="pl" />
      </defs>
      <g className="lab-poster__ink" transform={`translate(${40 - 1.25 * A} 0) scale(1.25)`}>
        {[0, 1, 2].map(lvl)}
      </g>
    </svg>
  )
}

function WordPoster() {
  const k = 0.72
  const cx = WORD_BOX.x + WORD_BOX.w / 2
  const cy = WORD_BOX.y + WORD_BOX.h / 2
  const arrow = `translate(${ARROW_HOME_SVG.x} ${ARROW_HOME_SVG.y}) scale(${1 / ARROW_SCALE})`
  const letters = [...WORD.o, ...WORD.s, ...WORD.L, ...WORD.p].map((d) => <path key={d} d={d} fill="currentColor" fillRule="evenodd" />)
  // the word, extruded: its depth is stacked behind the front face
  const depth = Array.from({ length: 12 }, (_, i) => 12 - i)
  return (
    <svg viewBox="-200 -125 400 250">
      <defs>
        <IconDefs id="pw" />
      </defs>
      <g transform={`scale(${k}) translate(${-cx} ${-cy})`}>
        {[-41.5, 41.14].map((y) => (
          <line key={y} className="lab-poster__line" x1={WORD_BOX.x - 20} x2={WORD_BOX.x + WORD_BOX.w + 20} y1={y} y2={y} />
        ))}
        {[-A, A].map((x) => (
          <circle key={x} className="lab-poster__line" cx={x} cy={0} r={RHO + RT + 6} />
        ))}
        {depth.map((n) => (
          <g key={n} className="lab-poster__depth" transform={`translate(${n * 0.7} ${n * 0.6})`}>
            {letters}
            <IconBand id="pw" finished={false} />
            <IconArrow className="lab-poster__adepth" transform={arrow} />
          </g>
        ))}
        <g className="lab-poster__ink">
          {letters}
          <IconBand id="pw" />
          <IconArrow transform={arrow} />
        </g>
      </g>
    </svg>
  )
}

const POSTERS: Record<string, () => ReactElement> = {
  press: PressPlayPoster,
  iris: IrisPoster,
  frames: FramesPoster,
  loops: LoopsPoster,
  word: WordPoster,
}

/** Lab page: preview the loading screens and pick one. Not linked from the navigation. */
export default function LoadersPage() {
  const [playing, setPlaying] = useState<{ entry: LoaderEntry; run: number } | null>(null)

  return (
    <>
      <Header links={NAV} />
      <main className="lab">
        <section className="lab__head">
          <p className="mono lab__kicker">Lab · Loading screens</p>
          <h1 className="lab__title">
            Pick the first <span className="serif">impression.</span>
          </h1>
          <p className="lab__p">
            Four new loading screens, plus the current one. Play each one right here, or open the site with it to see
            how it hands over to the hero. Every loader follows the theme — switch light / dark from the header.
          </p>
        </section>

        <div className="lab__grid">
          {LOADERS.map((l, i) => {
            const Poster = POSTERS[l.id]
            return (
              <article className="lab-card" key={l.id}>
                <div className="lab-card__poster">{Poster && <Poster />}</div>
                <div className="lab-card__body">
                  <span className="mono lab-card__num">
                    {String(i + 1).padStart(2, '0')}
                    {l.current && <em>Current</em>}
                  </span>
                  <h2 className="lab-card__name">{l.name}</h2>
                  <p className="lab-card__idea">{l.idea}</p>
                  <ol className="lab-card__beats">
                    {l.beats.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ol>
                  <div className="lab-card__actions">
                    <Button label="Play here" variant="blue" onClick={() => setPlaying((p) => ({ entry: l, run: (p?.run ?? 0) + 1 }))} />
                    <Button label="Open on the site" variant="ghost" href={`/?loader=${l.id}`} />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </main>
      <Footer links={NAV} />

      {playing && <playing.entry.Component key={playing.run} onReveal={() => {}} onDone={() => setPlaying(null)} />}
    </>
  )
}
