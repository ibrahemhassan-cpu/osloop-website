import { useState } from 'react'
import { loaderFromUrl } from '../loaders'
import type { LoaderProps } from '../loaders/types'

/**
 * The site's loading screen. The loaders live in src/loaders; `?loader=<id>` previews another one
 * (see /loaders) — otherwise the current one plays.
 */
export function Preloader(props: LoaderProps) {
  const [{ Component }] = useState(loaderFromUrl)
  return <Component {...props} />
}
