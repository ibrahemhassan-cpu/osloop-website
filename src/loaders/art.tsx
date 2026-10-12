import { brand } from '../lib/content'
import { ARROW_CENTRE_PDF, ARROW_D, ARROW_SCALE, iconSvg } from '../lib/loopShape'

/*
 * Drawing pieces shared by the loading screens: the OsLoop icon as SVG (the ∞ band with its cut,
 * fold shading and over strand, plus the orange play arrow) and the official stacked logo file.
 * Everything is in icon units (origin at the ∞ crossing, y down).
 */

export const ICON = iconSvg()
export const ORANGE = '#ffae23'
export const BAND_WIDTH = 24.15

/** the arrow path, centred on its own middle (place it with a transform on a parent <g>) */
export const ARROW_CENTRED = `scale(${ARROW_SCALE}) translate(${-ARROW_CENTRE_PDF.x} ${-ARROW_CENTRE_PDF.y})`

/** the stacked logo files (icon + "OSLOOP MEDIA") share the icon's geometry; placed in icon units */
export const PX_PER_UNIT = 9.72
export const STACKED = {
  dark: { src: brand.stackedLogoWhite, x: -87.12, y: -46.03 },
  light: { src: brand.stackedLogo, x: -86.81, y: -46.18 },
}
export const STACKED_W = 1622 / PX_PER_UNIT
export const STACKED_H = 1100 / PX_PER_UNIT
/** the "OSLOOP MEDIA" line of the stacked file sits between these (icon units) */
export const TEXT_TOP = 48
export const TEXT_H = 19
/** centre of the whole stacked composition (icon + text), icon units */
export const STACK_CENTRE = { x: -4.5, y: 10.5 }
/** centre of the icon alone */
export const ICON_CENTRE = { x: -3.8, y: -1.4 }

/** the cut mask and the fold-shading gradient; render once per <svg> */
export function IconDefs({ id }: { id: string }) {
  return (
    <>
      <mask id={`${id}-cut`} maskUnits="userSpaceOnUse" x="-120" y="-90" width="240" height="200">
        <rect x="-120" y="-90" width="240" height="200" fill="#fff" />
        <polygon points={ICON.cutWedge} fill="#000" />
      </mask>
      <linearGradient id={`${id}-fold`} gradientUnits="userSpaceOnUse" x1="-18.48" y1="-18.36" x2="17.79" y2="17.91">
        <stop offset="0" stopColor="#fff" />
        <stop offset="0.114" stopColor="#fdfdfd" />
        <stop offset="0.611" stopColor="#696a6d" />
        <stop offset="0.955" stopColor="#fff" />
        <stop offset="1" stopColor="#fff" />
      </linearGradient>
      <clipPath id={`${id}-line`}>
        <rect x="-110" y={TEXT_TOP} width="220" height={TEXT_H} />
      </clipPath>
    </>
  )
}

/**
 * The ∞ band in `currentColor`. `dash` draws only part of it (stroke-dashoffset against `dashLen`);
 * `finished` adds the fold shading and the over strand of the completed logo.
 */
export function IconBand({ id, dash, dashLen, finished = true }: { id: string; dash?: number; dashLen?: number; finished?: boolean }) {
  const drawn = dash != null && dashLen != null ? { strokeDasharray: dashLen, strokeDashoffset: dash } : undefined
  return (
    <g mask={`url(#${id}-cut)`} fill="none" strokeWidth={BAND_WIDTH}>
      <path d={ICON.band} stroke="currentColor" style={drawn} />
      {finished && (
        <>
          <path d={ICON.s1} stroke={`url(#${id}-fold)`} style={{ mixBlendMode: 'multiply' }} />
          <path d={ICON.s2} stroke="currentColor" />
        </>
      )}
    </g>
  )
}

/** the orange play arrow; `transform` places its centre */
export function IconArrow({ transform, className }: { transform: string; className?: string }) {
  return (
    <g transform={transform} className={className} fill={ORANGE}>
      <path d={ARROW_D} transform={ARROW_CENTRED} />
    </g>
  )
}

/** only the "OSLOOP MEDIA" line of the official stacked logo, in the right place under the icon */
export function StackedWord({ id, theme }: { id: string; theme: 'light' | 'dark' }) {
  const s = STACKED[theme]
  return <image href={s.src} x={s.x} y={s.y} width={STACKED_W} height={STACKED_H} clipPath={`url(#${id}-line)`} />
}
