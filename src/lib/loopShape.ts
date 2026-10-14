/*
 * The OsLoop "Media logo icon" — the ∞ band and its orange play arrow — measured from the official
 * artwork. Logo units, origin at the crossing of the ∞. Shared by the 3D hero (loopIcon.ts) and the
 * loading screen (SVG). Kept free of three.js so the loader stays light.
 */

export const A = 37.145 // half the distance between the lobe centres
export const RHO = 28.825 // radius of the band's centre line
export const RT = 12.075 // half the band width
export const K = 29.6 // Bézier handle of the S strands (matches the 52° crossing)

/** where the band starts (upper cut) and ends (lower cut) on the left lobe, in degrees */
export const CUT_START_DEG = 100.5
export const CUT_END_DEG = 203.5
/** the play arrow sits on the band's circle, in the gap */
export const SLOT_DEG = 143.9

/** the arrow outline from the artwork (PDF space, y down) */
export const ARROW_D =
  'M652.74 664.98L626.25 638.82C621.97 634.94 615.09 637.16 613.88 642.8L605.58 681.43C604.37 687.08 609.72 691.92 615.22 690.15L650.01 677.68C655.51 675.91 657.02 668.85 652.74 664.98Z'
export const ARTWORK_CROSSING = { x: 691.325, y: 680.55 }
export const ARROW_CENTRE_PDF = { x: 630.695, y: 663.43 }
/** the icon's arrow is drawn a touch smaller than the one in the wordmark */
export const ARROW_SCALE = 0.942

/* ------------------------------------------------------------- SVG (y down) */

const rad = (d: number) => (d * Math.PI) / 180
const f = (n: number) => +n.toFixed(3)
const pt = (cx: number, deg: number) => [cx + RHO * Math.cos(rad(deg)), -RHO * Math.sin(rad(deg))]
const M = (cx: number, deg: number) => {
  const [x, y] = pt(cx, deg)
  return `M${f(x)} ${f(y)}`
}
/** arc on a lobe; decreasing angles run clockwise on screen */
const arcTo = (cx: number, from: number, to: number) => {
  const [x, y] = pt(cx, to)
  return `A${RHO} ${RHO} 0 ${Math.abs(to - from) > 180 ? 1 : 0} ${to < from ? 1 : 0} ${f(x)} ${f(y)}`
}
/** "\" strand, top of the left lobe → bottom of the right lobe (it passes under) */
const S1 = `C${f(-A + K)} ${f(-RHO)} ${f(A - K)} ${f(RHO)} ${f(A)} ${f(RHO)}`
/** "/" strand, top of the right lobe → bottom of the left lobe (it passes over) */
const S2 = `C${f(A - K)} ${f(-RHO)} ${f(-A + K)} ${f(RHO)} ${f(-A)} ${f(RHO)}`
const RIGHT = arcTo(A, -90, 0) + arcTo(A, 0, 90)

/** the arrow's rest position (centre), screen units */
export const ARROW_HOME_SVG = { x: ARROW_CENTRE_PDF.x - ARTWORK_CROSSING.x, y: ARROW_CENTRE_PDF.y - ARTWORK_CROSSING.y }
/** direction the arrow points at rest, degrees on screen (y down) */
export const ARROW_POINTING_SVG = (Math.atan2(5.3, 29.3) * 180) / Math.PI

/**
 * SVG paths of the icon (screen coordinates, y down, origin at the crossing).
 * `overrunDeg` starts the band a little before its upper cut, so a mask can cut it at the artwork's angle.
 */
export function iconSvg(overrunDeg = 22) {
  const start = CUT_START_DEG + overrunDeg
  const cut = pt(-A, CUT_START_DEG)
  const c = cut[1] - cut[0] // the upper cut runs at 45°: y = x + c
  // the region beyond the cut is limited to the lobe's upper-left (from the lobe centre, between 25° and
  // 180°): like the artwork, the straight cut carries on a little into the "\" strand's inner edge, and
  // stops before it would touch the strand itself (measured against the official icon file)
  const u = (A - c) / (Math.cos(rad(25)) + Math.sin(rad(25)))
  const inner = [-A + u * Math.cos(rad(25)), -u * Math.sin(rad(25))]
  return {
    /** the band, drawn as a stroke of width 2·RT */
    band: M(-A, start) + arcTo(-A, start, 90) + S1 + RIGHT + S2 + arcTo(-A, 270, CUT_END_DEG),
    /** where along `band` the visible part begins (the cut), in logo units */
    bandHidden: RHO * rad(overrunDeg),
    s1: M(-A, 90) + S1,
    s2: M(A, 90) + S2,
    /** the arrow's round trip: slot → around the whole ∞ → slot */
    flight: M(-A, SLOT_DEG) + arcTo(-A, SLOT_DEG, 90) + S1 + RIGHT + S2 + arcTo(-A, 270, SLOT_DEG),
    /** distance along `flight` to the start of `band` */
    flightToBand: RHO * rad(SLOT_DEG - start),
    /** region beyond the upper cut (removed from the band) */
    cutWedge: [
      [-A, 0],
      inner,
      [-60 - c, -60],
      [-100, -60],
      [-100, 0],
    ]
      .map(([x, y]) => `${f(x)},${f(y)}`)
      .join(' '),
  }
}
