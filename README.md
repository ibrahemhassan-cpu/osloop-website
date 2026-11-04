# OsLoop — Website

The OsLoop Media Production site, built with React, GSAP, Lenis, Three.js and Motion.

| Route | Page |
| --- | --- |
| `/` | Home: a draggable 3D glass ∞ hero, about, live showreel, nine services, selected work, 3D process ring, values, reviews, the team wheel and a contact form |
| `/projects` | All projects, with animated category filters |
| `/projects/:slug` | One project's story: where it started → how it was made → where it ended |

There's a **Light / Dark** toggle in the header (Light is the default, and the choice is remembered).

## Run

```bash
npm install
npm run dev        # http://localhost:5180
npm run build      # production build in /dist
```

This is a single-page app. `vercel.json` and `public/_redirects` (Netlify) send every route to `index.html`.

## Editing content

Everything lives in **`src/lib/content.ts`**:

- `services` — the nine services. Each one has an `images` list: two or more images crossfade every ~3 s, while a single image stays still.
- `pipeline` — the seven process steps. Their card backgrounds are in `public/process/`.
- `projects` — the six projects in order, with their real links (YouTube, the brand manual, the website). The story text is a draft and should be replaced with the real details.
- `team` — roles. Add `name` and `photo` to each member; the photo becomes the main visual of the card.
- `contact` — the budget options, WhatsApp number and form settings (see below).

Navigation links are in `src/lib/nav.ts`.

### Logo files

The official logo files supplied by OsLoop live in `public/brand/`:

| File | Source file | Used for |
| --- | --- | --- |
| `osloop-media-logo.webp` | OsLoop Media logo light | navbar on light pages (`-nav` = 600px copy for the navbar) |
| `osloop-media-logo-white.webp` | OsLoop Main logo white copy | navbar on dark pages, loader, page transitions |
| `osloop-logo-white.webp` | OsLoop Main logo white | footer, and behind the hero glass in dark mode |
| `osloop-logo-blue.webp` | OsLoop Main logo blue | behind the hero glass in light mode |
| `/favicon*.png`, `/apple-touch-icon.png` | main logo icon light | browser tab icon |

The hero's glass ∞ and its orange play arrow are built in 3D from the **Media logo icon** (`src/pages/home/loopIcon.ts`).

### Arabic site

The Arabic version lives under `/ar/` and mirrors every English page. All its words are in `src/lib/arabic.ts` (interface words in English are in `src/lib/strings.ts`, in the same shape), loaded only on Arabic pages. Right-to-left rules and the two Arabic fonts (TROX for headings, Cairo for everything else) are in `src/styles/rtl.css`. Neither covers Latin letters or digits, so English words such as project names, which stay untranslated, use the English font; every rule there starts from the page's language or direction, so none of them can reach the English site. The privacy, terms and consultation pages are in English only.

### Contact form and Apache hosting

Run `npm ci`, `npm run typecheck`, and `npm run build`. Upload the contents of `dist`, including `.htaccess`, to the existing PHP/Apache document root.

The English and Arabic sites both post to `/formAction.php` (the Arabic form shows Arabic labels and sends the same English values); the older Arabic landing page, now at `/ar/landing.html`, posts to `/ar/formAction.php`. These use the SMTP configuration and recipients from `dev-1`. The build includes their PHPMailer dependencies, country-context endpoints, Arabic assets, Google tags, sitemap, robots file, LLM discovery file, policy pages and static project metadata.

The English form retains its current validation and quick-check UI. The server retains the original required-field validation, budget allow-list, honeypot and HTML escaping. The quick check is a client-side check. The older Vercel/Formspree endpoint in `api/contact.ts` is not used by this Apache configuration.

Successful delivery returns HTTP 200 with `{ "ok": true }`. Lead conversion events fire only after that response. A failure preserves the form and allows a retry.

See [the migration notes](docs/dev-1-integration.md) for the preserved Google IDs, events and verification details.

## Where things live

```
src/pages/home/          ← home sections (HeroScene.tsx = 3D glass ∞ + flying arrow, drag + spring-back; loopIcon.ts = its geometry)
src/pages/projects/      ← projects list + project story page
src/components/          ← header, mobile menu, footer, cursor, project cover, reel modal
src/providers/           ← smooth scroll (Lenis), page transitions + preloader, theme
src/styles/global.css    ← theme tokens (--bg, --fg, --hl …) for light and dark
archive/                 ← earlier concepts (not part of the build)
```

## Motion tuning

- Overall pace: `lerp` in `SmoothScroll.tsx` (0.085, lower = floatier) and the `silk` ease in `lib/gsap.ts`.
- ∞ spring-back: `K` (stiffness) and `C` (damping) in `HeroScene.tsx`.
- With `prefers-reduced-motion`, scrolling is native and the reveal animations are skipped.
