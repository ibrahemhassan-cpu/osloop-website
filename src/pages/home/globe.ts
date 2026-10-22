// What the "Our reach" globe (WebGL, ReachScene.tsx) and the section around it (DOM, Reach.tsx) share.
// No three.js here, so the section stays light until the scene's chunk loads.

/** the camera's vertical field of view (degrees); its distance is fitted to the box */
export const GLOBE_FOV = 30

/**
 * The rings the markets sit on, round a globe of radius 1: their radius and tilt about x and z
 * (degrees). Market i sits on ring i % ORBITS.length, where its name reads best. The rings and the
 * markets hold still; only the globe turns.
 */
export const ORBITS = [
  { r: 1.36, x: 4, z: -5 },
  { r: 1.53, x: -6, z: 4 },
  { r: 1.7, x: 7, z: 6 },
  { r: 1.86, x: -3, z: -7 },
  { r: 2.02, x: 6, z: -3 },
  { r: 2.18, x: -7, z: 7 },
]

/** how the section and the scene talk without re-rendering the canvas */
export type GlobeBridge = {
  /** the market pointed at (index into reach.markets), or null */
  active: number | null
  /** 0 → 1 as the section comes into view: the globe and its rings come in */
  reveal: number
  /** the element the globe is dragged on */
  surface: HTMLElement | null
  /** each market's name tag, placed beside its satellite every frame */
  labels: (HTMLElement | null)[]
  /** turn the globe to this market; `n` counts the clicks, so the same market can be asked for again */
  focus: { i: number; n: number } | null
  /** the visitor grabbed the globe */
  onGrab: () => void
}
