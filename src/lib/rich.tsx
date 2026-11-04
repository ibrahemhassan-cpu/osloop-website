import { Fragment, type ReactNode } from 'react'

/** Copy with its accent marked in the text: *these words* take the accent style, a line break starts a new line. */
export function rich(text: string): ReactNode {
  return text.split(/(\*[^*]+\*|\n)/).map((part, i) => {
    if (part === '\n') return <br key={i} />
    if (part.length > 2 && part.startsWith('*'))
      return (
        <span className="serif" key={i}>
          {part.slice(1, -1)}
        </span>
      )
    return <Fragment key={i}>{part}</Fragment>
  })
}
