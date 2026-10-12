import type { ComponentType } from 'react'
import { PressPlay } from './PressPlay'
import { Iris } from './Iris'
import { FrameByFrame } from './FrameByFrame'
import { LoopAfterLoop } from './LoopAfterLoop'
import type { LoaderProps } from './types'

export type LoaderEntry = {
  id: string
  name: string
  current?: boolean
  idea: string
  beats: string[]
  Component: ComponentType<LoaderProps>
}

/** The loading screens to choose from (shown on /loaders). The first one is the site's current one. */
export const LOADERS: LoaderEntry[] = [
  {
    id: 'press',
    name: 'Press Play',
    current: true,
    idea: 'A camera viewfinder. The orange play arrow draws the ∞ and is pressed like a play button.',
    beats: ['Viewfinder, REC and a running timecode', 'The arrow rides the loop and draws it', 'REC turns to PLAY — the site opens from the arrow'],
    Component: PressPlay,
  },
  {
    id: 'iris',
    name: 'Iris — Focus on ∞',
    idea: 'A camera lens. The focus ring turns until its ∞ mark meets the index — and the logo snaps into focus.',
    beats: ['Aperture blades open from f/16 to f/1.4', 'Rack focus: the logo sharpens exactly on ∞', 'The iris opens all the way onto the site'],
    Component: Iris,
  },
  {
    id: 'frames',
    name: 'Frame by Frame',
    idea: 'A 35 mm film strip through a projector gate — the icon is drawn as a flipbook, frame by frame.',
    beats: ['Countdown leader 5 · 4 · 3 · 2 · 1', 'Real pull-down: every frame stops in the gate', 'Locks on the logo, then the gate opens like a shutter'],
    Component: FrameByFrame,
  },
  {
    id: 'loops',
    name: 'Loop after Loop',
    idea: 'An endless zoom: every ∞ holds the next one inside its lobe, turning as you dive in.',
    beats: ['Dive through three loops', 'Land on the logo with OSLOOP MEDIA', 'Fly through the lobe — it becomes the window onto the site'],
    Component: LoopAfterLoop,
  },
]

/** `?loader=<id>` picks a loader for this page load (used to preview them on the real site). */
export function loaderFromUrl(): LoaderEntry {
  const id = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('loader')
  return LOADERS.find((l) => l.id === id) ?? LOADERS[0]
}
