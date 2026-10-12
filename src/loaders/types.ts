/** Every loading screen takes the same two callbacks from the experience provider. */
export type LoaderProps = {
  /** called when the site starts to show through (starts the hero intro) */
  onReveal: () => void
  /** called when the loader is finished and can be removed */
  onDone: () => void
}
