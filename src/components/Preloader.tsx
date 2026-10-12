import { PressPlay } from '../loaders/PressPlay'
import type { LoaderProps } from '../loaders/types'

/** The site's loading screen (the loaders themselves live in src/loaders). */
export function Preloader(props: LoaderProps) {
  return <PressPlay {...props} />
}
