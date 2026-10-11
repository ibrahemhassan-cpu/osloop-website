import { useState } from 'react'
import { brand } from '../lib/content'

type Source = { src: string; invert?: boolean }

/** Image that walks down a list of sources until one loads (official SVG → derived → PNG). */
function FallbackImg({ sources, alt, className = '', hidden }: { sources: Source[]; alt: string; className?: string; hidden?: boolean }) {
  const [i, setI] = useState(0)
  const s = sources[Math.min(i, sources.length - 1)]
  return (
    <img
      src={s.src}
      alt={alt}
      aria-hidden={hidden || undefined}
      className={`${className}${s.invert ? ' is-inverted' : ''}`}
      draggable={false}
      onError={() => setI((n) => (n < sources.length - 1 ? n + 1 : n))}
    />
  )
}

/** Full "OsLoop Media Production" logo in colour (for light backgrounds). */
export function LogoColor({ className, hidden }: { className?: string; hidden?: boolean }) {
  return <FallbackImg className={className} hidden={hidden} alt={brand.fullName} sources={[{ src: brand.logoSvg }, { src: brand.logo }]} />
}

/** White version for dark backgrounds — the white SVG, else the colour SVG inverted, else the PNG. */
export function LogoWhite({ className, hidden }: { className?: string; hidden?: boolean }) {
  return (
    <FallbackImg
      className={className}
      hidden={hidden}
      alt={brand.fullName}
      sources={[{ src: brand.logoWhiteSvg }, { src: brand.logoSvg, invert: true }, { src: brand.logoWhite }]}
    />
  )
}
