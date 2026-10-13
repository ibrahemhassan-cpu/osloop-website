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
  theCode: 'sY-HPw9R1u4',
  aiden: 'vCRLr4DG5EU',
  headtech: 'gqKvTu3zZdQ',
  mark: '7QwmBHm1kyc',
}

export const images = {
  explainer: 'https://agency.osloop.com/images/Rectangle-43.png',
  handDrawn: 'https://agency.osloop.com/images/Rectangle-44.png',
  videoRoom: 'https://agency.osloop.com/images/Rectangle-45.png',
  arva1: 'https://arva.osloop.com/stills/v1.webp',
  arva2: 'https://arva.osloop.com/stills/v2.webp',
}

/* ----------------------------------------------------------------- Services */
export type Service = { id: string; title: string; lead: string; body: string; tags: string[]; images: string[] }

// TODO(client): add more stills per service — 2+ images play as a slow crossfade loop.
export const services: Service[] = [
  {
    id: 'explainer',
    title: 'Explainer Videos',
    lead: 'Complex ideas, simply told.',
    body: 'Scripted, storyboarded and animated to make your product click — for landing pages, pitches and campaigns.',
    tags: ['Script', 'Character animation', 'Voice-over'],
    images: [yt(videos.aiden), yt(videos.aiden, 'maxres2'), images.explainer, yt(videos.aiden, 'maxres3')],
  },
  {
    id: 'motion',
    title: 'Motion Graphics',
    lead: 'Information that moves.',
    body: 'Type, icons, data and product UI choreographed into clear, rhythmic motion that holds attention.',
    tags: ['Kinetic type', 'Infographics', 'Product UI'],
    images: [yt(videos.headtech), yt(videos.headtech, 'maxres1'), yt(videos.headtech, 'maxres2'), yt(videos.headtech, 'maxres3')],
  },
  {
    id: 'editing',
    title: 'Video Editing',
    lead: 'The cut that makes it land.',
    body: 'Editing, color grading and clean-up that turn raw footage into a polished, on-brand film.',
    tags: ['Editing', 'Color grading', 'Clean-up'],
    images: [yt(videos.mark), yt(videos.mark, 'maxres1'), yt(videos.mark, 'maxres2')],
  },
  {
    id: '3d',
    title: '3D Videos',
    lead: 'Spaces and products you can almost touch.',
    body: 'Architectural walkthroughs, photoreal products and environments — lit, shaded and animated like a film set.',
    tags: ['Architecture', 'Product 3D', 'Environments'],
    images: [yt(videos.theCode, 'maxres1'), yt(videos.theCode), yt(videos.theCode, 'maxres3'), images.videoRoom],
  },
  {
    id: 'hand-drawn',
    title: 'Real Hand Drawing Videos',
    lead: 'Drawn live, frame by frame.',
    body: 'A real hand, a real pen — the warmth of hand-drawn storytelling that feels personal and memorable.',
    tags: ['Hand drawing', 'Storytelling', 'Voice-over'],
    images: [yt(reel.youtubeId, 'maxres1'), images.handDrawn],
  },
  {
    id: 'whiteboard',
    title: 'Whiteboard Animation',
    lead: 'Sketch it. Explain it.',
    body: 'Clean whiteboard sketches that build your message line by line — perfect for training and education.',
    tags: ['Whiteboard', 'Education', 'Training'],
    images: ['/services/whiteboard.svg', yt(reel.youtubeId, 'maxres1')],
  },
  {
    id: 'graphic',
    title: 'Graphic Design',
    lead: 'Brands that look like they mean it.',
    body: 'Identities, brand manuals and campaign visuals designed as one consistent system.',
    tags: ['Brand identity', 'Brand manuals', 'Campaigns'],
    images: ['/services/graphic-design.svg', yt(reel.youtubeId)],
  },
  {
    id: 'web-mobile',
    title: 'Website & Mobile Design',
    lead: 'Interfaces people enjoy using.',
    body: 'Websites and mobile apps designed around your audience — clear structure, crafted details, real usability.',
    tags: ['UX/UI', 'Websites', 'Mobile apps'],
    images: [images.arva1, images.arva2],
  },
  {
    id: 'animated-web',
    title: 'Animated Websites',
    lead: 'Sites that move like film.',
    body: 'Scroll-driven storytelling, motion systems and interactive 3D that turn visitors into an audience.',
    tags: ['Scroll stories', 'WebGL', 'Micro-interactions'],
    images: ['/services/animated-web.svg', images.arva2],
  },
]

/* ------------------------------------------------------------------ Process */
// TODO(client): swap the illustrated backgrounds in public/process/ for real artwork if you have it.
export const pipeline = [
  { n: '01', title: 'Script Writing', body: 'We learn your industry, then write every line to earn its place.', bg: '/process/script.svg' },
  { n: '02', title: 'Storyboard', body: 'Each scene sketched, timed and approved before a single frame moves.', bg: '/process/storyboard.svg' },
  { n: '03', title: 'Illustrations', body: 'Characters, worlds and assets designed in your brand’s own language.', bg: '/process/illustration.svg' },
  { n: '04', title: 'Voice Over', body: 'Native, professional voices that give the story its soul.', bg: '/process/voice.svg' },
  { n: '05', title: 'Animation', body: '2D, 3D, whiteboard or hand-drawn — crafted frame by frame.', bg: '/process/animation.svg' },
  { n: '06', title: 'VFX & SFX', body: 'Effects, compositing and sound design that make every beat land.', bg: '/process/vfx-sfx.svg' },
  { n: '07', title: 'Final Result', body: 'A polished master, delivered in every format you need.', bg: '/process/final.svg' },
]

export const marqueeA = ['Script Writing', 'Storyboard', 'Illustrations', 'Voice Over', 'Animation', 'VFX', 'SFX']
export const marqueeB = ['2D Animation', 'Whiteboard', '3D Animation', 'Cartoon Animation', 'Real Hand Drawing']

export const values = [
  {
    n: '01',
    title: 'Industry Versatility',
    body: "Whether you're in healthcare or crypto, food or SaaS, we dive deep into your industry's unique needs. We speak your language and translate it into animations that resonate with your audience.",
  },
  {
    n: '02',
    title: 'Bespoke Creations',
    body: 'Your brand is unique, and your animations should be too. We tailor every piece to mirror your personality, align with your marketing goals, and captivate your audience.',
  },
  {
    n: '03',
    title: 'World Class Quality',
    body: "Quality is not just a promise — it's our ethos. Every video is meticulously crafted to ensure visual excellence and engaging storytelling.",
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
      "These guys rock! They did everything I needed, exactly as I needed it. I've worked with a lot of freelancers over the past 10 years — these guys are among the few who follow instructions strictly and deliver great results without much hustle.",
    project: 'Realistic 3D Animation of a Product',
  },
  {
    quote: 'Superheroes! Beyond any expectation — you can’t go wrong working with this team of superheroes. Can’t recommend them enough.',
    project: 'Animated Video',
  },
  {
    quote:
      'The team took on my VFX work, which was ambitious in scope and turnaround. They understood my vision and delivered exactly what I needed for the film.',
    project: 'VFX Objects, Animals & Backgrounds',
  },
  {
    quote: 'Fantastic work — the team were on it like white on rice. Really happy with the result and will work with them again.',
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

export const industries = ['Healthcare', 'Crypto', 'Food', 'SaaS']

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
  group: 'Animation' | 'VFX' | 'Branding' | 'Web'
  year: string
  services: string[]
  deliverable: string
  /** null → a designed generative cover is shown */
  cover: string | null
  gallery: string[]
  accent: string
  link: ProjectLink
  summary: string
  /** Where it started — the brief */
  start: string
  /** How it was made */
  journey: { stage: string; text: string }[]
  /** Where it ended — the result */
  end: string
}

/*
 * TODO(client): titles, categories, years and links are real; the story copy is a first
 * draft written around each piece of work. Replace with the real brief, process notes and results.
 */
export const projects: Project[] = [
  {
    slug: 'the-code',
    title: 'THE CODE — Architectural 3D Experience',
    name: 'THE CODE',
    category: '3D Animation',
    group: 'Animation',
    year: '2025',
    services: ['3D modeling', 'Architectural visualisation', 'Lighting & materials', 'Animation'],
    deliverable: 'Full 3D animated film',
    cover: yt(videos.theCode, 'maxres1'),
    gallery: [yt(videos.theCode), yt(videos.theCode, 'maxres2'), yt(videos.theCode, 'maxres3')],
    accent: '#c99a6b',
    link: { kind: 'youtube', id: videos.theCode, label: 'Watch the film' },
    summary: 'A cinematic 3D film that walks the viewer through architecture, interiors and a premium service — every space built, lit and animated in 3D.',
    start:
      'THE CODE needed to show a premium, space-saving service in a way that felt as refined as the homes it serves. Real filming couldn’t deliver the scale or control they wanted — so the whole world had to be built in 3D.',
    journey: [
      { stage: 'Script & shot list', text: 'We shaped the message into a short story and planned every camera move before modeling started.' },
      { stage: 'Architecture & interiors', text: 'Buildings, rooms and furniture were modeled to scale, from the façade down to the bedside lamp.' },
      { stage: 'Materials & lighting', text: 'Wood, stone, fabric and glass were tuned under warm, cinematic light so every frame feels premium.' },
      { stage: 'Animation & characters', text: 'Camera paths, product UI and people bring the service to life inside the spaces.' },
      { stage: 'Sound & delivery', text: 'Voice-over, music and sound design were layered in, and the film was delivered in full HD.' },
    ],
    end: 'A full 3D film that makes a service feel tangible — architecture, people and product in one seamless, cinematic story.',
  },
  {
    slug: 'aiden',
    title: 'Aiden — AI Assistant Explainer',
    name: 'Aiden',
    category: 'Animated Explainer',
    group: 'Animation',
    year: '2023',
    services: ['Script', 'Character design', '2D animation', 'Voice-over'],
    deliverable: 'Animated explainer video',
    // cover: Aiden's own AI interface (H-26)
    cover: yt(videos.aiden, 'maxres3'),
    gallery: [yt(videos.aiden), yt(videos.aiden, 'maxres2'), yt(videos.aiden, 'maxres1')],
    accent: '#2c5bff',
    link: { kind: 'youtube', id: videos.aiden, label: 'Watch the explainer' },
    summary: 'Meet Aiden — an AI assistant introduced through a friendly character and a clean, technology-led visual world.',
    start: 'AI products are powerful but hard to picture. The goal was to introduce Aiden in a way anyone could understand — and remember — in a couple of minutes.',
    journey: [
      { stage: 'Script', text: 'We turned features into a simple story: a relatable problem, and the moment Aiden makes it easy.' },
      { stage: 'Character & style', text: 'Aiden got a personality and a look, set against clean interface and data visuals.' },
      { stage: 'Storyboard', text: 'Every scene was sketched and timed so the flow was approved before animation began.' },
      { stage: 'Animation & voice', text: 'Smooth 2D character animation and UI motion, carried by a professional voice-over.' },
      { stage: 'Sound & delivery', text: 'Music and sound design added the final polish before delivery.' },
    ],
    end: 'A friendly, clear explainer that gives an AI product a face — and makes it easy to understand.',
  },
  {
    slug: 'headtech',
    title: 'Headtech — Animated Product Explainer',
    name: 'Headtech',
    category: 'Motion Graphics',
    group: 'Animation',
    year: '2022',
    services: ['Motion graphics', '3D product visuals', 'Kinetic typography', 'Sound design'],
    deliverable: 'Animated product explainer',
    // cover: the clean product frame, without captions
    cover: yt(videos.headtech, 'maxres3'),
    gallery: [yt(videos.headtech), yt(videos.headtech, 'maxres1'), yt(videos.headtech, 'maxres2')],
    accent: '#3ddc84',
    link: { kind: 'youtube', id: videos.headtech, label: 'Watch the explainer' },
    summary: 'A high-tech headset explained through bold motion graphics, 3D product visuals and kinetic type.',
    start: 'Headtech’s product packs a lot of technology into one device. The challenge was to show each feature clearly without overwhelming the viewer.',
    journey: [
      { stage: 'Feature mapping', text: 'We ranked every feature and built the story around the ones that matter most.' },
      { stage: 'Design frames', text: 'A dark, futuristic visual language with clean typography set the tone.' },
      { stage: 'Motion', text: 'Product visuals, callouts and kinetic type were choreographed into a clear rhythm.' },
      { stage: 'Sound & delivery', text: 'A driving soundtrack and sound design gave every transition its punch.' },
    ],
    end: 'A sharp, energetic product explainer that turns complex technology into clear benefits.',
  },
  {
    slug: 'mark-before-after',
    title: 'Mark — VFX Before & After',
    name: 'Mark',
    category: 'VFX & Compositing',
    group: 'VFX',
    year: '2022',
    services: ['Compositing', 'Color grading', 'Clean-up', 'Editing'],
    deliverable: 'Before & after VFX edit',
    // cover: the frame where original vs edited reads clearest
    cover: yt(videos.mark, 'maxres1'),
    gallery: [yt(videos.mark), yt(videos.mark, 'maxres2'), yt(videos.mark, 'maxres3')],
    accent: '#7d9bff',
    link: { kind: 'youtube', id: videos.mark, label: 'Watch the before & after' },
    summary: 'Raw footage transformed through compositing, grading and clean-up — shown side by side, original against edited.',
    start: 'The footage was solid but flat. The goal was to make it look cinematic and polished without losing what made it real.',
    journey: [
      { stage: 'Review', text: 'We studied every shot to decide what needed fixing, enhancing or replacing.' },
      { stage: 'Clean-up & compositing', text: 'Distractions were removed and elements composited in seamlessly.' },
      { stage: 'Color grading', text: 'A consistent, cinematic grade brought depth and mood to every frame.' },
      { stage: 'Before & after', text: 'The final edit shows the original and the result side by side.' },
    ],
    end: 'The same footage, transformed — a before & after that shows exactly what careful VFX and grading can do.',
  },
  {
    slug: 'river-city-recovery',
    title: 'River City Recovery — Brand Identity System',
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
      'A complete identity for River City Recovery — a mark where a flowing river becomes growth, a calm green color system, and a brand manual that keeps every touchpoint consistent.',
    start:
      'River City Recovery needed a brand that feels trustworthy, calm and hopeful — one that speaks with compassion and without judgment, and looks the same on every sign, screen and document.',
    journey: [
      {
        stage: 'Logo & mark',
        text: 'A circular mark with a flowing “river” path that stands for healing, renewal and forward motion — with RECOVERY set in bold to keep the focus on purpose.',
      },
      {
        stage: 'Color system',
        text: 'An RCR primary green, a dark green and a green-to-teal gradient, with supporting neutrals, a 60/30/10 usage ratio and contrast checked for accessibility.',
      },
      {
        stage: 'Typography & voice',
        text: 'Franklin Gothic in a clear type hierarchy, and a plain-language, compassionate tone of voice: “We’re here to help — no judgment.”',
      },
      { stage: 'Pattern & imagery', text: 'A quiet roundel pattern for backgrounds, and an imagery style that is authentic, diverse and hopeful.' },
      { stage: 'Applications', text: 'Signage, stationery, merchandise, web and mobile — every touchpoint designed and documented in the brand manual.' },
    ],
    end: 'A complete identity system and brand manual — logo, color, type, imagery, iconography, voice and applications — ready for every sign, screen and document. Second chances start here.',
  },
  {
    slug: 'arvamethod',
    title: 'ARVAmethod — Digital Experience Design',
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
    summary: 'A new website for ARVAmethod, designed and built in two directions — each a complete, explorable experience.',
    start: 'ARVAmethod wanted a site that feels as considered as its method — and the freedom to compare more than one direction before choosing.',
    journey: [
      { stage: 'Structure', text: 'We mapped the content and the journey a visitor should take.' },
      { stage: 'Two directions', text: 'Two complete visual directions were designed, each with its own personality.' },
      { stage: 'Build', text: 'Both were built as working, responsive websites — not just static mockups.' },
      { stage: 'Motion & polish', text: 'Subtle motion and details made each experience feel alive.' },
    ],
    end: 'Two complete, live website directions — so the decision could be made by experiencing them, not imagining them.',
  },
]
