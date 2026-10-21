// All copy & brand assets live here so the client can edit one file.

/** YouTube still: 'maxresdefault' is the thumbnail, 'maxres1..3' are frames at 25/50/75% of the video. */
export const yt = (id: string, frame: 'maxresdefault' | 'maxres1' | 'maxres2' | 'maxres3' = 'maxresdefault') =>
  `https://i.ytimg.com/vi/${id}/${frame}.jpg`

export const brand = {
  name: 'OsLoop',
  fullName: 'OsLoop Media Production',
  tagline: 'Your story, our expertise.',
  email: 'media.production@osloop.com',
  location: 'Alexandria, Egypt',
  timeZone: 'Africa/Cairo',
  mapUrl: 'https://goo.gl/maps/ou6TEmMqB5Xh9jE1A',
  /*
   * Official logo files supplied by OsLoop (public/brand/, originals in public/brand/raw/).
   *   mediaLogo / mediaLogoWhite → navbar, loader and page transitions ("OsLoop Media Production")
   *   logoWhite                 → footer ("OsLoop Main logo white")
   *   logoWhite / logoBlue      → the general logo behind the hero glass (dark / light theme)
   * The tab icon (public/favicon*.png) is made from "main logo icon light"; the hero glass ∞ and its
   * orange arrow are modelled on "Media logo icon".
   */
  mediaLogo: '/brand/osloop-media-logo.webp',
  mediaLogoWhite: '/brand/osloop-media-logo-white.webp',
  /** the same two files at 600px wide — crisp in the navbar without loading the full-size art */
  mediaLogoNav: '/brand/osloop-media-logo-nav.webp',
  mediaLogoWhiteNav: '/brand/osloop-media-logo-white-nav.webp',
  logoWhite: '/brand/osloop-logo-white.webp',
  logoBlue: '/brand/osloop-logo-blue.webp',
  /** "OsLoop Media logo light / dark small" — icon over OSLOOP MEDIA, used by the loading screen */
  stackedLogo: '/brand/osloop-media-logo-stacked.webp',
  stackedLogoWhite: '/brand/osloop-media-logo-stacked-white.webp',
  /** "Media logo icon light / dark" — the ∞ the loading screen's arrow draws */
  mediaIcon: '/brand/osloop-media-icon.webp',
  mediaIconWhite: '/brand/osloop-media-icon-white.webp',
}

export const reel = {
  youtubeId: '2yJWao9VURw',
  /** seconds — where the muted background loop starts. The Play Reel popup always starts at 0:00. */
  start: 77,
  poster: yt('2yJWao9VURw'),
  // TODO(client): drop a short muted MP4 loop of the showreel here, e.g. '/media/reel-loop.mp4'
  loopMp4: '' as string,
}

export const videos = {
  behindTheRender: 'pbxs3DfUQsM',
  justOneSmallChange: 'a2sQZQgHVgM',
  explainerShowreel: 'S7Ue-qoUh64',
  viaEurope: 'qz8AZfPAG7s',
  mark: '7QwmBHm1kyc',
}

export const images = {
  arva1: 'https://arva.osloop.com/stills/v1.webp',
  arva2: 'https://arva.osloop.com/stills/v2.webp',
}

/* ----------------------------------------------------------------- Services */
export type Service = { id: string; title: string; lead: string; body: string; tags: string[]; images: string[] }

/**
 * A service's stills, from the client's Figma ("New website 12th assetes"), exported at 2x as WebP:
 * public/services/<id>/1.webp, 2.webp … 2+ images play as a slow crossfade loop.
 */
const stills = (id: string, count = 3) => Array.from({ length: count }, (_, i) => `/services/${id}/${i + 1}.webp`)

export const services: Service[] = [
  {
    id: 'explainer',
    title: 'Explainer Videos',
    lead: 'Complex ideas, simply told.',
    body: 'Scripted, storyboarded and animated to make your product click, for landing pages, pitches and campaigns.',
    tags: ['Script', 'Character animation', 'Voice-over'],
    images: stills('explainer'),
  },
  {
    id: 'ai-video',
    title: 'AI Videos',
    lead: 'Bold worlds, made in days.',
    body: 'Generative AI directed by real storytellers: a clear script, one consistent look and every shot edited into a film that feels crafted.',
    tags: ['Generative video', 'AI imagery', 'Edit & sound'],
    images: stills('ai-video'),
  },
  {
    id: 'motion',
    title: 'Motion Graphics',
    lead: 'Information that moves.',
    body: 'Type, icons, data and product UI choreographed into clear, rhythmic motion that holds attention.',
    tags: ['Kinetic type', 'Infographics', 'Product UI'],
    images: stills('motion'),
  },
  {
    id: 'editing',
    title: 'Video Editing',
    lead: 'The cut that makes it land.',
    body: 'Editing, color grading and clean-up that turn raw footage into a polished, on-brand film.',
    tags: ['Editing', 'Color grading', 'Clean-up'],
    images: stills('editing'),
  },
  {
    id: '3d',
    title: '3D Videos',
    lead: 'Spaces and products you can almost touch.',
    body: 'Architectural walkthroughs, photoreal products and environments, lit, shaded and animated like a film set.',
    tags: ['Architecture', 'Product 3D', 'Environments'],
    images: stills('3d'),
  },
  {
    id: 'hand-drawn',
    title: 'Real Hand Drawing Videos',
    lead: 'Drawn live, frame by frame.',
    body: 'A real hand, a real pen, and the warmth of hand-drawn storytelling that feels personal and memorable.',
    tags: ['Hand drawing', 'Storytelling', 'Voice-over'],
    images: stills('hand-drawn'),
  },
  {
    id: 'whiteboard',
    title: 'Whiteboard Animation',
    lead: 'Sketch it. Explain it.',
    body: 'Clean whiteboard sketches that build your message line by line. Perfect for training and education.',
    tags: ['Whiteboard', 'Education', 'Training'],
    images: stills('whiteboard'),
  },
  {
    id: 'graphic',
    title: 'Graphic Design',
    lead: 'Brands that look like they mean it.',
    body: 'Identities, brand manuals and campaign visuals designed as one consistent system.',
    tags: ['Brand identity', 'Brand manuals', 'Campaigns'],
    images: stills('graphic'),
  },
  {
    id: 'web-mobile',
    title: 'Website & Mobile Design',
    lead: 'Interfaces people enjoy using.',
    body: 'Websites and mobile apps designed around your audience: clear structure, crafted details, real usability.',
    tags: ['UX/UI', 'Websites', 'Mobile apps'],
    images: stills('web-mobile'),
  },
  {
    id: 'animated-web',
    title: 'Animated Websites',
    lead: 'Sites that move like film.',
    body: 'Scroll-driven storytelling, motion systems and interactive 3D that turn visitors into an audience.',
    tags: ['Scroll stories', 'WebGL', 'Micro-interactions'],
    images: stills('animated-web', 1),
  },
]

/* ------------------------------------------------------------------ Process */
export const pipeline = [
  { n: '01', title: 'Script Writing', body: 'We learn your industry, then write every line to earn its place.' },
  { n: '02', title: 'Storyboard', body: 'Each scene sketched, timed and approved before a single frame moves.' },
  { n: '03', title: 'Illustrations', body: 'Characters, worlds and assets designed in your brand’s own language.' },
  { n: '04', title: 'Voice Over', body: 'Native, professional voices that give the story its soul.' },
  { n: '05', title: 'Animation', body: '2D, 3D, whiteboard or hand-drawn, crafted frame by frame.' },
  { n: '06', title: 'VFX & SFX', body: 'Effects, compositing and sound design that make every beat land.' },
  { n: '07', title: 'Final Result', body: 'A polished master, delivered in every format you need.' },
]

export const marqueeA = ['Script Writing', 'Storyboard', 'Illustrations', 'Voice Over', 'Animation', 'VFX', 'SFX']
export const marqueeB = ['2D Animation', 'Whiteboard', '3D Animation', 'Cartoon Animation', 'Real Hand Drawing']

export const values = [
  {
    n: '01',
    title: 'Industry Versatility',
    body: "Whether you're in healthcare or real estate, food or SaaS, we dive deep into your industry's unique needs. We speak your language and translate it into animations that resonate with your audience.",
  },
  {
    n: '02',
    title: 'Bespoke Creations',
    body: 'Your brand is unique, and your animations should be too. We tailor every piece to mirror your personality, align with your marketing goals, and captivate your audience.',
  },
  {
    n: '03',
    title: 'World Class Quality',
    body: "Quality is not just a promise, it's our ethos. Every video is meticulously crafted to ensure visual excellence and engaging storytelling.",
  },
  {
    n: '04',
    title: 'Transparent Communication',
    body: 'Your vision is our mission. We keep you in the loop at every stage, so the final film looks exactly the way you imagined it.',
  },
]

export const testimonials = [
  {
    quote:
      "These guys rock! They did everything I needed, exactly as I needed it. I've worked with a lot of freelancers over the past 10 years, and these guys are among the few who follow instructions strictly and deliver great results without much hustle.",
    project: 'Realistic 3D Animation of a Product',
  },
  {
    quote: 'Superheroes! Beyond any expectation. You can’t go wrong working with this team of superheroes. Can’t recommend them enough.',
    project: 'Animated Video',
  },
  {
    quote:
      'The team took on my VFX work, which was ambitious in scope and turnaround. They understood my vision and delivered exactly what I needed for the film.',
    project: 'VFX Objects, Animals & Backgrounds',
  },
  {
    quote: 'Fantastic work, the team were on it like white on rice. Really happy with the result and will work with them again.',
    project: '3D Products, Elements & Video Animations',
  },
  {
    quote:
      'One of the most amazing work experiences I ever had. Way more than what I hoped for. This became my dream team to work with.',
    project: 'Motion Graphics & Animation Production',
  },
  {
    quote: 'One in a million. Honestly, one of the best people to work with. I’ll work with them whenever I get the chance.',
    project: 'Explainer Video for Dentists',
  },
]

export const legal = [
  { label: 'Privacy Policy', href: 'https://agency.osloop.com/privacy-policy.html' },
  { label: 'Terms & Conditions', href: 'https://agency.osloop.com/terms-and-conditions.html' },
]

export const socials = [
  { label: 'Instagram', href: 'https://www.instagram.com/osloopmedia/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/osloop/' },
  { label: 'YouTube', href: 'https://www.youtube.com/@OsLoopMediaProduction' },
  { label: 'Facebook', href: 'https://www.facebook.com/osloop.media.production/' },
]

/* ------------------------------------------------------------------ Contact */
export const contact = {
  /**
   * Where the form posts. '/api/contact' is the included serverless function (api/contact.ts):
   * it verifies Cloudflare Turnstile and forwards the message to FORMSPREE_ENDPOINT.
   * Leave empty to fall back to opening the visitor's email app with the message ready.
   * TODO(client): set to '/api/contact' once the env vars in README are configured.
   */
  formEndpoint: '' as string,
  /**
   * TODO(client): your Cloudflare Turnstile site key. While empty, the form asks a small sum
   * ("7 + 4 = ?") as its human check; once set, Turnstile takes over automatically.
   */
  turnstileSiteKey: '' as string,
  /** TODO(client): e.g. '+20 100 000 0000' — shows a WhatsApp link when set */
  whatsapp: '' as string,
  needs: ['Explainer video', '3D production', 'Animated website', 'Not sure yet'],
  budgets: ['Less than $2,800', '$2,800 to $5,600', 'More than $5,600'],
}

export const industries = ['Healthcare', 'Real Estate', 'Food', 'SaaS']

/* --------------------------------------------------------------------- Team */
export type TeamMember = {
  role: string
  mono: string
  /** TODO(client): add real names and photos — cards switch to portraits automatically */
  name?: string
  photo?: string
  skills: string[]
}

export const team: TeamMember[] = [
  { role: 'Creative Direction', mono: 'CD', skills: ['Concept', 'Art direction', 'Client partnership'] },
  { role: 'Scriptwriting', mono: 'SW', skills: ['Messaging', 'Storytelling', 'Tone of voice'] },
  { role: 'Storyboard', mono: 'SB', skills: ['Shot planning', 'Timing', 'Sketching'] },
  { role: 'Illustration', mono: 'IL', skills: ['Characters', 'Backgrounds', 'Hand drawing'] },
  { role: '3D & CGI', mono: '3D', skills: ['Modeling', 'Lighting', 'Rendering'] },
  { role: 'Animation', mono: 'AN', skills: ['2D', 'Whiteboard', 'Character motion'] },
  { role: 'VFX & Compositing', mono: 'FX', skills: ['Compositing', 'Simulation', 'Creatures'] },
  { role: 'Sound & Voice', mono: 'SFX', skills: ['Voice-over', 'Music', 'Sound design'] },
]

/* ----------------------------------------------------------------- Projects */
export type ProjectLink =
  | { kind: 'youtube'; id: string; label: string }
  | { kind: 'pdf'; url: string; label: string }
  | { kind: 'web'; url: string; label: string }

export type Project = {
  slug: string
  title: string
  /** short name used in lists and the curtain */
  name: string
  category: string
  /** filter group on /projects */
  group: '3D' | 'AI' | 'Animation' | 'Motion' | 'VFX' | 'Branding' | 'Web'
  year: string
  /** running time of the film, e.g. '00:51' */
  duration?: string
  services: string[]
  deliverable: string
  /** null → a designed generative cover is shown */
  cover: string | null
  gallery: string[]
  accent: string
  link: ProjectLink
  summary: string
  /** Where it started: the brief */
  start: string
  /** How it was made */
  journey: { stage: string; text: string }[]
  /** Where it ended: the result */
  end: string
  /** What the client said. At most one review; without one the section isn't shown at all */
  review?: Review
}

/** `label` stands in for the client's name (never shown); `rating` out of 5, when the client gave one */
export type Review = { quote: string; label: string; rating?: number }

/**
 * A project's media (public/projects/<slug>/): cover.webp is the hero and the Work card, stage-1..4.webp
 * follow the four steps of How it was made. Every file also has a -960 copy; sizes in lib/images.ts.
 */
const media = (slug: string) => ({
  cover: `/projects/${slug}/cover.webp`,
  gallery: [1, 2, 3, 4].map((i) => `/projects/${slug}/stage-${i}.webp`),
})

/*
 * Selected Work, in the client's order (OsLoop_Selected_Work_Content_and_Media.xlsx, 2026-10-19).
 * River City Recovery and ARVAmethod keep their earlier copy and media.
 */
export const projects: Project[] = [
  {
    slug: 'behind-the-render',
    title: 'Behind the Render: What We See / What You See',
    name: 'Behind the Render',
    category: '3D Animation',
    group: '3D',
    year: '2026',
    duration: '00:51',
    services: ['3D scene setup', 'Lighting & look development', 'Animation', 'Compositing & edit'],
    deliverable: 'Vertical 3D process film',
    ...media('behind-the-render'),
    accent: '#F4B728',
    link: { kind: 'youtube', id: videos.behindTheRender, label: 'Watch the 3D film' },
    summary:
      'A concise 3D process film that turns invisible production work into a simple visual contrast: the technical setup artists build versus the cinematic result audiences experience.',
    start:
      'The idea needed to explain 3D craft quickly without relying on a long technical breakdown. The challenge was to make the behind-the-scenes process readable, entertaining and native to a vertical social format.',
    journey: [
      { stage: 'Concept & structure', text: 'Built the film around a clear “What we see / What you see” device, giving viewers an immediate way into the process.' },
      { stage: '3D setup', text: 'Revealed the working scene, geometry, nodes and lighting controls behind the finished shot.' },
      { stage: 'Look development', text: 'Balanced night lighting, material response and atmosphere to turn the technical setup into a believable cinematic environment.' },
      { stage: 'Edit & finish', text: 'Cut the comparison for fast comprehension, added titles and prepared the final vertical delivery.' },
    ],
    end: 'A compact, educational 3D film that makes technical craft easy to understand while keeping the final result visually rewarding.',
    review: {
      quote:
        "The OsLoop team was a pleasure to work with on this project. They asked a lot of questions in order to clearly understand our goals and objectives. Because of that we only had very minor changes to the final product. We really enjoyed working with them and appreciate their professional approach and going beyond expectations to deliver what we didn't even know we needed!!! We will definitely be using them again in the future.",
      label: '3D Animation Project',
      rating: 5,
    },
  },
  {
    slug: 'just-one-small-change',
    title: 'Just One Small Change: AI Character Film',
    name: 'Just One Small Change',
    category: 'AI Video',
    group: 'AI',
    year: '2026',
    duration: '00:46',
    services: ['Creative concept', 'AI character generation', 'Visual continuity', 'Editing & sound'],
    deliverable: 'AI-generated short film',
    ...media('just-one-small-change'),
    accent: '#15AABF',
    link: { kind: 'youtube', id: videos.justOneSmallChange, label: 'Watch the film' },
    summary:
      'A character-led AI short built around a simple comic beat, using controlled performance, consistent styling and cinematic editing to carry the idea.',
    start:
      'AI-generated character work can lose continuity from shot to shot. The challenge was to keep one recognisable character, wardrobe and environment consistent while giving the performance enough variation to feel alive.',
    journey: [
      { stage: 'Creative direction', text: 'Defined the visual tone, character styling and comedic rhythm before generating shots.' },
      { stage: 'Character continuity', text: 'Kept the same face, wardrobe palette and environment across close-ups and wider frames.' },
      { stage: 'Shot generation', text: 'Produced a focused set of performance variations that supported the line rather than distracting from it.' },
      { stage: 'Edit & sound', text: 'Selected the strongest takes, shaped the pacing and finished the short as one cohesive scene.' },
    ],
    end: 'A concise AI-led film with a consistent lead character and a polished, cinematic flow.',
  },
  {
    slug: 'animated-explainer-showreel',
    title: 'Animated Explainer Showreel: Stories Made Clear',
    name: 'Animated Explainer Showreel',
    category: 'Explainer Videos',
    group: 'Animation',
    year: '2021',
    duration: '02:02',
    services: ['Script & story structure', 'Storyboarding', 'Illustration', '2D animation & sound'],
    deliverable: 'B2B animated explainer showreel',
    ...media('animated-explainer-showreel'),
    accent: '#E64A75',
    link: { kind: 'youtube', id: videos.explainerShowreel, label: 'Watch the showreel' },
    summary:
      'A fast-moving selection of explainer work that shows how different visual languages can make complex messages clear, memorable and easy to follow.',
    start:
      'The reel needed to represent a broad range of industries and illustration styles while still feeling like one coherent presentation of OsLoop’s explainer capabilities.',
    journey: [
      { stage: 'Selection', text: 'Chose sequences that demonstrate clarity, character, information design and emotional range.' },
      { stage: 'Flow', text: 'Structured the reel so contrasting styles and subjects transition smoothly without losing momentum.' },
      { stage: 'Edit', text: 'Balanced shot length and pacing to keep every example readable while maintaining energy.' },
      { stage: 'Sound & finish', text: 'Unified the reel with a consistent audio bed, transitions and final brand treatment.' },
    ],
    end: 'A concise showcase of 2D explainer storytelling, from hand-drawn character work to bold campaign visuals and narrative scenes.',
  },
  {
    slug: 'viaeurope-rfid',
    title: 'ViaEurope RFID: Supply Chain Made Visible',
    name: 'ViaEurope RFID',
    category: 'Motion Graphics',
    group: 'Motion',
    year: '2021',
    duration: '03:35',
    services: ['Information design', 'Isometric illustration', 'Motion graphics', 'Editing & sound'],
    deliverable: 'Motion graphics explainer',
    ...media('viaeurope-rfid'),
    accent: '#F28A20',
    link: { kind: 'youtube', id: videos.viaEurope, label: 'Watch the explainer' },
    summary:
      'An isometric motion graphics film that visualises how RFID supports shipment receiving, warehouse handling and logistics visibility across a connected supply chain.',
    start:
      'The process behind RFID-enabled logistics is operational and technical. The challenge was to turn multiple locations, handoffs and data moments into one clear visual journey.',
    journey: [
      { stage: 'Information mapping', text: 'Broke the workflow into a sequence of simple stages, from inbound shipment to warehouse handling.' },
      { stage: 'Visual system', text: 'Developed a consistent isometric world using ViaEurope’s blue-and-orange palette, vehicles, pallets and facilities.' },
      { stage: 'Motion design', text: 'Animated each handoff and system interaction so the viewer can follow the process without visual overload.' },
      { stage: 'Narration & finish', text: 'Timed the visuals to the voice-over and refined transitions, labels and pacing for clarity.' },
    ],
    end: 'A clean operational explainer that makes an RFID logistics process easier to understand at a glance.',
    review: {
      quote:
        'It was again a great pleasure to work with the OsLoop team. Very professional approach and very patient with the feedback and comments. The responsiveness is excellent. Thank you!',
      label: 'RFID Motion Graphics Project',
      rating: 5,
    },
  },
  {
    slug: 'mark-vfx-before-after',
    // the page keeps its old address for now (video-editing-sfx-project-update.md)
    title: 'Video Editing & SFX: Before and After',
    name: 'Video Editing & SFX',
    category: 'VFX & Compositing',
    group: 'VFX',
    year: '2022',
    duration: '02:52',
    services: ['Compositing', 'Clean-up', 'Color grading', 'Video editing'],
    deliverable: 'Before-and-after VFX edit',
    ...media('mark-vfx-before-after'),
    accent: '#4B5D8A',
    link: { kind: 'youtube', id: videos.mark, label: 'Watch the before & after' },
    summary: 'Raw footage transformed through compositing, grading and clean-up, shown side by side: original against edited.',
    start:
      'The footage was solid but visually flat and inconsistent. The challenge was to improve clarity, depth and polish while keeping the presenter natural and the comparison honest.',
    journey: [
      { stage: 'Review', text: 'Assessed exposure, color balance, background distractions and the consistency of the source footage.' },
      { stage: 'Clean-up & compositing', text: 'Removed distractions and refined the frame so the presenter stayed at the centre of attention.' },
      { stage: 'Color grading', text: 'Built a richer, more consistent look with cleaner skin tones, stronger contrast and controlled highlights.' },
      { stage: 'Before & after', text: 'Presented the original and finished shots together so every improvement remains visible.' },
    ],
    end: 'The same footage, transformed into a cleaner and more confident final film while preserving a transparent before-and-after comparison.',
    review: {
      quote: 'This company always goes above and beyond when it comes to edits. They are very communicative and professional!',
      label: 'VFX & Video Editing',
      rating: 5,
    },
  },
  {
    slug: 'river-city-recovery',
    title: 'River City Recovery: Brand Identity System',
    name: 'River City Recovery',
    category: 'Brand Identity',
    group: 'Branding',
    year: '2025',
    services: ['Logo design', 'Color system', 'Typography', 'Brand manual'],
    deliverable: 'Brand identity & brand manual',
    // cover: the identity applied (signage, packaging, web, merch, cards) — from the brand manual
    cover: '/projects/river-city/cover.webp',
    // one page of the manual per journey stage
    gallery: [
      '/projects/river-city/manual-p3.webp',
      '/projects/river-city/manual-p9.webp',
      '/projects/river-city/manual-p11.webp',
      '/projects/river-city/manual-p16.webp',
      '/projects/river-city/manual-p17.webp',
    ],
    accent: '#29af5f',
    link: {
      kind: 'pdf',
      url: 'https://www.dropbox.com/scl/fi/ncged49ssl2v681u2kabd/River-City-Recovery-Brand-Manual-V01-14th-Oct-2025.pdf?rlkey=rj1a09sckxt7p6jn7eno6qdne&st=ejj07snm&e=1&dl=0',
      label: 'View the brand manual',
    },
    summary:
      'A complete identity for River City Recovery: a mark where a flowing river becomes growth, a calm green color system, and a brand manual that keeps every touchpoint consistent.',
    start:
      'River City Recovery needed a brand that feels trustworthy, calm and hopeful, one that speaks with compassion and without judgment, and looks the same on every sign, screen and document.',
    journey: [
      {
        stage: 'Logo & mark',
        text: 'A circular mark with a flowing “river” path that stands for healing, renewal and forward motion, with RECOVERY set in bold to keep the focus on purpose.',
      },
      {
        stage: 'Color system',
        text: 'An RCR primary green, a dark green and a green-to-teal gradient, with supporting neutrals, a 60/30/10 usage ratio and contrast checked for accessibility.',
      },
      {
        stage: 'Typography & voice',
        text: 'Franklin Gothic in a clear type hierarchy, and a plain-language, compassionate tone of voice: “We’re here to help. No judgment.”',
      },
      { stage: 'Pattern & imagery', text: 'A quiet roundel pattern for backgrounds, and an imagery style that is authentic, diverse and hopeful.' },
      { stage: 'Applications', text: 'Signage, stationery, merchandise, web and mobile: every touchpoint designed and documented in the brand manual.' },
    ],
    end: 'A complete identity system and brand manual (logo, color, type, imagery, iconography, voice and applications), ready for every sign, screen and document. Second chances start here.',
    review: { quote: 'This is amazing work and looks great.', label: 'Brand Identity Project' },
  },
  {
    slug: 'arvamethod',
    title: 'ARVAmethod: Digital Experience Design',
    name: 'ARVAmethod',
    category: 'Website Design & Development',
    group: 'Web',
    year: '2025',
    services: ['UX/UI design', 'Web development', 'Motion', 'Responsive design'],
    deliverable: 'Website in two design directions',
    cover: images.arva1,
    gallery: [images.arva2],
    accent: '#b8865b',
    link: { kind: 'web', url: 'https://arva.osloop.com/', label: 'Visit the website' },
    summary: 'A new website for ARVAmethod, designed and built in two directions, each a complete, explorable experience.',
    start: 'ARVAmethod wanted a site that feels as considered as its method, and the freedom to compare more than one direction before choosing.',
    journey: [
      { stage: 'Structure', text: 'We mapped the content and the journey a visitor should take.' },
      { stage: 'Two directions', text: 'Two complete visual directions were designed, each with its own personality.' },
      { stage: 'Build', text: 'Both were built as working, responsive websites, not just static mockups.' },
      { stage: 'Motion & polish', text: 'Subtle motion and details made each experience feel alive.' },
    ],
    end: 'Two complete, live website directions, so the decision could be made by experiencing them, not imagining them.',
  },
]
