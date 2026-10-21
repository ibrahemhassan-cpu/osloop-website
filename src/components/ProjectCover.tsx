import type { CSSProperties } from 'react'
import type { Project } from '../lib/content'
import { responsive } from '../lib/images'
import './project-cover.css'

/** A project's still — or, until the real still arrives, a designed generative cover in the project's accent. */
export function ProjectCover({
  project,
  className = '',
  eager = false,
  sizes = '100vw',
}: {
  project: Project
  className?: string
  /** the page's hero: loads first */
  eager?: boolean
  /** how wide the image shows, so the browser picks the right file */
  sizes?: string
}) {
  if (project.cover)
    return (
      <img
        className={`pcover pcover--img ${className}`}
        src={project.cover}
        {...responsive(project.cover)}
        sizes={sizes}
        alt={`${project.title}, by OsLoop`}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
      />
    )
  return (
    <div className={`pcover pcover--gen ${className}`} style={{ '--accent': project.accent } as CSSProperties} role="img" aria-label={project.title}>
      <span className="pcover__orb" />
      <span className="pcover__orb pcover__orb--2" />
      <span className="pcover__grid" />
      <span className="pcover__ring" />
      <span className="pcover__label">{project.category}</span>
    </div>
  )
}
