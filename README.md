# OsLoop — Website

The OsLoop Media Production site, built with React, GSAP, Lenis, Three.js and Motion.

| Route | Page |
| --- | --- |
| `/` | Home: a draggable 3D glass ∞ hero, about, live showreel, services, selected work, 3D process ring, values, reviews, the crew and a contact form |
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

- `projects` — titles, covers, and the story text for each project (start / journey / end). The quotes are real client reviews.
- `team` — roles and skills. Add `name` and `photo` and the cards switch to portraits automatically.
- `contact.formEndpoint` — paste a form endpoint (for example a free Formspree form) so messages arrive in your inbox. While it's empty, the form opens the visitor's email app with the message already filled in.
- `contact.whatsapp` — set a number to show a WhatsApp link.
- `reel` — the YouTube showreel and its start time (1:17). Add a muted MP4 loop for best quality.

Navigation links are in `src/lib/nav.ts`.

## Where things live

```
src/pages/home/          ← home sections (HeroScene.tsx = 3D glass loop, drag + spring-back)
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
