// What the "Our reach" globe (WebGL, ReachScene.tsx) and the section around it (DOM, Reach.tsx) share.
// No three.js here, so the section stays light until the scene's chunk loads.

/** the camera's vertical field of view (degrees); its distance is fitted to the box */
export const GLOBE_FOV = 30

/** a small seeded random, so the stars and the lights are the same on every visit */
export function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** how the section and the scene talk without re-rendering the canvas */
export type GlobeBridge = {
  /** the market picked (index into reach.markets), or null */
  active: number | null
  /** 0 → 1 as the section comes into view: the globe and its pins come in */
  reveal: number
  /** the element the globe is dragged on */
  surface: HTMLElement | null
  /** each market's pin, placed over its country every frame */
  pins: (HTMLElement | null)[]
  /** turn and zoom the globe to this market; `n` counts the picks, so the same one can be asked for again */
  focus: { i: number; n: number } | null
}
