import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'

// Windows has no flag emoji — load a tiny self-hosted flag font only where needed.
polyfillCountryFlagEmojis('Twemoji Country Flags', '/fonts/TwemojiCountryFlags.woff2')

/** ISO 3166 alpha-2 code → its flag emoji (style it with the 'Twemoji Country Flags' font first) */
export const flag = (cc: string) => String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
