/**
 * Local images that come in two sizes: <name>.webp at the width listed here and <name>-960.webp.
 * Width × height are the files' own (never cropped), so every box can keep the image's ratio.
 */
export const imageSizes: Record<string, [number, number]> = {
  '/projects/behind-the-render/cover.webp': [1920, 1080],
  '/projects/behind-the-render/stage-1.webp': [1920, 1080],
  '/projects/behind-the-render/stage-2.webp': [1672, 941],
  '/projects/behind-the-render/stage-3.webp': [1672, 941],
  '/projects/behind-the-render/stage-4.webp': [1672, 941],
  '/projects/just-one-small-change/cover.webp': [1672, 941],
  '/projects/just-one-small-change/stage-1.webp': [1672, 941],
  '/projects/just-one-small-change/stage-2.webp': [1920, 1080],
  '/projects/just-one-small-change/stage-3.webp': [1920, 1017],
  '/projects/just-one-small-change/stage-4.webp': [1672, 941],
  '/projects/animated-explainer-showreel/cover.webp': [1672, 941],
  '/projects/animated-explainer-showreel/stage-1.webp': [1690, 931],
  '/projects/animated-explainer-showreel/stage-2.webp': [1672, 941],
  '/projects/animated-explainer-showreel/stage-3.webp': [1672, 941],
  '/projects/animated-explainer-showreel/stage-4.webp': [1672, 941],
  '/projects/viaeurope-rfid/cover.webp': [1670, 942],
  '/projects/viaeurope-rfid/stage-1.webp': [1672, 941],
  '/projects/viaeurope-rfid/stage-2.webp': [1672, 940],
  '/projects/viaeurope-rfid/stage-3.webp': [1672, 940],
  '/projects/viaeurope-rfid/stage-4.webp': [1670, 942],
  '/projects/mark-vfx-before-after/cover.webp': [1756, 896],
  '/projects/mark-vfx-before-after/stage-1.webp': [1774, 887],
  '/projects/mark-vfx-before-after/stage-2.webp': [1759, 894],
  '/projects/mark-vfx-before-after/stage-3.webp': [1763, 892],
  '/projects/mark-vfx-before-after/stage-4.webp': [1763, 892],
  '/projects/river-city/cover.webp': [1672, 941],
}

/** srcSet / width / height for an image listed in imageSizes (nothing for any other image) */
export function responsive(src: string | null | undefined) {
  const size = src ? imageSizes[src] : undefined
  if (!src || !size) return {}
  return { srcSet: `${src.replace(/\.webp$/, '-960.webp')} 960w, ${src} ${size[0]}w`, width: size[0], height: size[1] }
}
