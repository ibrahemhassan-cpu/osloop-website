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

Drop the official SVGs into `public/brand/` using these names, and the site switches to them on its own:

| File | Used for |
| --- | --- |
| `osloop-media-production.svg` | navbar, footer, preloader |
| `osloop-media-production-white.svg` | optional white version for dark backgrounds (otherwise the colour logo is inverted) |
| `osloop.svg` | the general logo behind the glass loop in the hero |

### Contact form + spam protection

The form validates every field, includes a hidden honeypot field, and supports Cloudflare Turnstile.

1. Create a Turnstile widget at dash.cloudflare.com. Put the **site key** in `contact.turnstileSiteKey`, or set the `VITE_TURNSTILE_SITE_KEY` env var.
2. Create a free form at formspree.io.
3. On Vercel, set the env vars `TURNSTILE_SECRET_KEY` and `FORMSPREE_ENDPOINT`.
4. Set `contact.formEndpoint` to `'/api/contact'`. The function in `api/contact.ts` verifies Turnstile on the server and then forwards the message to Formspree.

Until those steps are done, the form opens the visitor's email app with the brief already filled in. In local development, Cloudflare's test key is used so you can see the check working.

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
