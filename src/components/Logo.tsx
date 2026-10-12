import { brand } from '../lib/content'

type Props = { className?: string; hidden?: boolean; /** use the 600px navbar-sized file */ small?: boolean }

function Img({ src, alt, className, hidden }: { src: string; alt: string; className?: string; hidden?: boolean }) {
  return <img src={src} alt={hidden ? '' : alt} aria-hidden={hidden || undefined} className={className} draggable={false} decoding="async" />
}

/** OsLoop Media Production logo — blue, for light backgrounds. */
export function MediaLogo({ small, ...props }: Props) {
  return <Img {...props} src={small ? brand.mediaLogoNav : brand.mediaLogo} alt={brand.fullName} />
}

/** OsLoop Media Production logo — white, for dark backgrounds. */
export function MediaLogoWhite({ small, ...props }: Props) {
  return <Img {...props} src={small ? brand.mediaLogoWhiteNav : brand.mediaLogoWhite} alt={brand.fullName} />
}
