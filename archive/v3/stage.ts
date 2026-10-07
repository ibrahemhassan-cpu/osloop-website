import type { ShapeName } from '../../particles/shapes'
import type { View } from '../../particles/ParticleField'

/**
 * One slot per scroll "beat" of the page. The particle field morphs from
 * slot k-1 to slot k as that beat scrolls into view.
 */
export type Slot = { shape: ShapeName; view: View; fade: number }

export const PROCESS_STEPS = [
  {
    n: '01',
    title: 'Script Writing',
    body: 'We learn your product, your audience and your industry — then write a script where every line earns its place.',
    get: 'An approved script and tone of voice',
  },
  {
    n: '02',
    title: 'Storyboard',
    body: 'Every scene is sketched, timed and approved, so you see the whole film before a single frame moves.',
    get: 'A frame-by-frame storyboard',
  },
  {
    n: '03',
    title: 'Illustrations',
    body: 'Characters, scenes and assets designed in your brand’s own visual language — 2D, 3D or hand-drawn.',
    get: 'Style frames and final artwork',
  },
  {
    n: '04',
    title: 'Voice Over',
    body: 'Native, professional voices and music selected to match your message and your audience.',
    get: 'Voice, music and timing locked',
  },
  {
    n: '05',
    title: 'Animation',
    body: 'Everything comes to life — crafted frame by frame with the style that fits your story best.',
    get: 'The animated film for review',
  },
  {
    n: '06',
    title: 'VFX',
    body: 'Compositing, particles and effects that push the piece past ordinary and make it unforgettable.',
    get: 'Effects, compositing and polish',
  },
  {
    n: '07',
    title: 'SFX & Delivery',
    body: 'Sound design that makes every beat land — then a final master ready for web, social and screens.',
    get: 'Final master in every format you need',
  },
]

const v = (x: number, y: number, rx: number, ry: number, scale: number, spin: number, rz = 0): View => ({ x, y, rx, ry, rz, scale, spin })

export const SLOTS: Slot[] = [
  { shape: 'loop', view: v(2.55, 0.2, 0.35, 0, 0.82, 0.25), fade: 1 }, // hero
  { shape: 'spark', view: v(3.3, 0.9, 0, 0, 0.6, 0.25), fade: 0.9 }, // about
  { shape: 'galaxy', view: v(3.2, 1.6, 1.1, 0, 0.6, 0.12, 0.25), fade: 0.55 }, // services
  // process — one formation per step
  { shape: 'page', view: v(2.9, -0.25, -0.12, -0.35, 0.95, 0, -0.05), fade: 1 },
  { shape: 'storyboard', view: v(2.95, -0.25, 0.08, -0.4, 0.68, 0), fade: 1 },
  { shape: 'brush', view: v(2.95, -0.25, 0.1, -0.25, 0.7, 0), fade: 1 },
  { shape: 'wave', view: v(2.95, -0.25, 0.2, -0.45, 0.68, 0), fade: 1 },
  { shape: 'loop', view: v(2.9, -0.25, 0.4, 0, 0.78, 0.35), fade: 1 },
  { shape: 'burst', view: v(2.9, -0.25, 0, 0, 0.9, 0.18), fade: 1 },
  { shape: 'ripples', view: v(2.85, -0.35, 1.05, 0, 0.75, 0.1), fade: 1 },
  { shape: 'crystal', view: v(3.4, 1.4, 0.4, 0, 0.5, 0.22), fade: 0.6 }, // why us
  { shape: 'globe', view: v(2.7, 0, 0.3, 0, 0.9, 0.14), fade: 1 }, // industries
  { shape: 'field', view: v(0, 0, 0, 0, 1, 0.02), fade: 0.45 }, // reviews
  { shape: 'logo', view: v(2.45, 0.9, 0, -0.18, 0.62, 0), fade: 1 }, // contact
]

export const SHAPES = SLOTS.map((s) => s.shape)
export const VIEWS = SLOTS.map((s) => s.view)
export const FADES = SLOTS.map((s) => s.fade)
/** On phones the formation sits above the copy, so dim it behind text-heavy sections. */
export const MOBILE_FADES = [1, 0.9, 0.35, 1, 1, 1, 1, 1, 1, 1, 0.3, 0.3, 0.3, 0.55]
/** index of the first process slot */
export const PROCESS_SLOT = 3
