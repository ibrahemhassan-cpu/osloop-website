import type { ShapeName } from '../../particles/shapes'
import type { View } from '../../particles/ParticleField'

export type Chapter = {
  id: string
  nav: string
  kicker: string
  /** wrap words in *asterisks* to set them in the italic serif */
  title: string
  body?: string
  align: 'left' | 'right' | 'center'
  shape: ShapeName
  view: View
  extra?: 'scroll' | 'styles' | 'values' | 'quotes' | 'cta'
}

export const chapters: Chapter[] = [
  {
    id: 'prologue',
    nav: 'Prologue',
    kicker: 'Prologue — The OsLoop Story',
    title: 'Every story starts as a *spark.*',
    body: 'Before the pixels, before the frames — there is an idea that refuses to stay quiet. This is what we do with it.',
    align: 'center',
    shape: 'spark',
    view: { x: 0, y: 1.25, rx: 0, ry: 0, scale: 0.85, spin: 0.25 },
    extra: 'scroll',
  },
  {
    id: 'idea',
    nav: 'The Idea',
    kicker: 'Chapter 01 — The Idea',
    title: 'It begins *with you.*',
    body: 'A product that changes lives. A mission worth sharing. A message that is hard to explain. You bring the spark — we give it gravity.',
    align: 'left',
    shape: 'galaxy',
    view: { x: 2.4, y: 0, rx: 1.05, ry: 0, rz: 0.25, scale: 0.95, spin: 0.12 },
  },
  {
    id: 'script',
    nav: 'The Script',
    kicker: 'Chapter 02 — The Script',
    title: 'Words first. *Always.*',
    body: 'We dive deep into your world — healthcare or crypto, food or SaaS — until we speak your language. Then we write a script where every line earns its place.',
    align: 'right',
    shape: 'page',
    view: { x: -2.5, y: 0, rx: -0.12, ry: 0.38, rz: 0.06, scale: 1, spin: 0 },
  },
  {
    id: 'storyboard',
    nav: 'Storyboard',
    kicker: 'Chapter 03 — The Storyboard',
    title: 'Frame by frame, *it takes shape.*',
    body: 'Sketches become sequences. Every scene, transition and beat is mapped — so you see the film before a single frame moves.',
    align: 'left',
    shape: 'storyboard',
    view: { x: 2.65, y: 0, rx: 0.08, ry: -0.42, scale: 0.74, spin: 0 },
  },
  {
    id: 'voice',
    nav: 'Voice & Sound',
    kicker: 'Chapter 04 — Voice & Sound',
    title: 'Then it finds *its voice.*',
    body: 'Professional voice-over, music and sound design give your story rhythm, emotion and weight. You feel it before you understand it.',
    align: 'right',
    shape: 'wave',
    view: { x: -2.7, y: 0, rx: 0.22, ry: 0.5, scale: 0.7, spin: 0 },
  },
  {
    id: 'motion',
    nav: 'Motion',
    kicker: 'Chapter 05 — The Motion',
    title: 'And everything *begins to move.*',
    body: 'We pick the style that mirrors your brand — never a template.',
    align: 'left',
    shape: 'loop',
    view: { x: 2.55, y: 0, rx: 0.35, ry: 0, scale: 0.8, spin: 0.3 },
    extra: 'styles',
  },
  {
    id: 'promise',
    nav: 'The Promise',
    kicker: 'Chapter 06 — The Promise',
    title: 'Built on *four promises.*',
    align: 'right',
    shape: 'crystal',
    view: { x: -2.6, y: 0, rx: 0.4, ry: 0, scale: 0.9, spin: 0.22 },
    extra: 'values',
  },
  {
    id: 'world',
    nav: 'The World',
    kicker: 'Chapter 07 — The World',
    title: 'Then we send it *into the world.*',
    body: 'From our studio in Alexandria, Egypt to screens everywhere — explainer videos, 3D productions and animated websites that people actually remember.',
    align: 'left',
    shape: 'globe',
    view: { x: 2.5, y: 0, rx: 0.3, ry: 0, scale: 0.9, spin: 0.14 },
  },
  {
    id: 'echoes',
    nav: 'Echoes',
    kicker: 'Chapter 08 — Echoes',
    title: 'And the world *answers back.*',
    align: 'right',
    shape: 'ripples',
    view: { x: -2.4, y: -0.1, rx: 1.0, ry: 0, scale: 0.8, spin: 0.08 },
    extra: 'quotes',
  },
  {
    id: 'osloop',
    nav: 'Epilogue',
    kicker: 'Epilogue — This is OsLoop',
    title: 'Your story. *Our expertise.*',
    align: 'center',
    shape: 'logo',
    view: { x: 0, y: 0.75, rx: 0, ry: 0, scale: 1, spin: 0 },
    extra: 'cta',
  },
]

/** Shape list = one per chapter + the dispersed field used by the finale */
export const shapeOrder: ShapeName[] = [...chapters.map((c) => c.shape), 'field']
export const finaleView: View = { x: 0, y: 0, rx: 0, ry: 0, scale: 1, spin: 0.02 }
export const viewOrder: View[] = [...chapters.map((c) => c.view), finaleView]

export const styles = ['2D Animation', 'Whiteboard', '3D Animation', 'Cartoon', 'Real Hand Drawing', 'VFX']

export const promises = [
  { t: 'Industry Versatility', d: 'We speak your industry’s language.' },
  { t: 'Bespoke Creations', d: 'Tailored to your brand — never a template.' },
  { t: 'World Class Quality', d: 'Every frame crafted to a standard.' },
  { t: 'Transparent Communication', d: 'You’re in the loop at every stage.' },
]

export const echoes = [
  { q: 'Superheroes! Beyond any expectation.', p: 'Animated Video' },
  { q: 'This became my dream team to work with.', p: 'Motion Graphics & Animation' },
  { q: 'They understood my vision and delivered what I needed for the film.', p: 'VFX for Film' },
  { q: 'One in a million.', p: 'Explainer Video for Dentists' },
]
