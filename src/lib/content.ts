// All copy & brand assets live here so the client can edit one file.

export const brand = {
  name: 'OsLoop',
  fullName: 'OsLoop Media Production',
  tagline: 'Your story, our expertise.',
  email: 'media.production@osloop.com',
  location: 'Alexandria, Egypt',
  timeZone: 'Africa/Cairo',
  mapUrl: 'https://goo.gl/maps/ou6TEmMqB5Xh9jE1A',
  // TODO(client): replace with official SVG logos for crisp rendering.
  logo: 'https://agency.osloop.com/images/Osloop---LOGO-01-01-1.png',
  logoWhite: 'https://agency.osloop.com/images/Osloop---LOGO-WHITE.png',
}

export const reel = {
  youtubeId: '2yJWao9VURw',
  /** seconds — the reel opens on its strongest moment (1:17) */
  start: 77,
  poster: 'https://i.ytimg.com/vi/2yJWao9VURw/maxresdefault.jpg',
  // TODO(client): drop a short muted MP4 loop of the showreel here, e.g. '/media/reel-loop.mp4'
  loopMp4: '' as string,
}

export const images = {
  explainer: 'https://agency.osloop.com/images/Rectangle-43.png',
  handDrawn: 'https://agency.osloop.com/images/Rectangle-44.png',
  videoRoom: 'https://agency.osloop.com/images/Rectangle-45.png',
}

export const services = [
  {
    id: 'explainer',
    index: '01',
    title: 'Explainer Videos',
    lead: 'Complex ideas, simply told.',
    body: 'Scripted, storyboarded and animated to make your product click in under two minutes — for landing pages, pitches and campaigns.',
    tags: ['2D Animation', 'Whiteboard', 'Cartoon', 'Real Hand Drawing'],
    image: images.explainer,
  },
  {
    id: '3d',
    index: '02',
    title: '3D Production',
    lead: 'Products you can almost touch.',
    body: 'Photoreal product renders, VFX objects, creatures and environments — lit, shaded and animated like a film set.',
    tags: ['Product 3D', 'VFX', 'Environments', 'Characters'],
    image: images.videoRoom,
  },
  {
    id: 'web',
    index: '03',
    title: 'Animated Websites',
    lead: 'Sites that move like film.',
    body: 'Scroll-driven storytelling, motion systems and interactive 3D that turn visitors into an audience.',
    tags: ['Scroll Stories', 'WebGL', 'Motion Systems', 'Micro-interactions'],
    image: images.handDrawn,
  },
]

export const pipeline = [
  { n: '01', title: 'Script Writing', body: 'We learn your industry, then write every line to earn its place.' },
  { n: '02', title: 'Storyboard', body: 'Each scene sketched, timed and approved before a single frame moves.' },
  { n: '03', title: 'Illustrations', body: 'Characters, worlds and assets designed in your brand’s own language.' },
  { n: '04', title: 'Voice Over', body: 'Native, professional voices that give the story its soul.' },
  { n: '05', title: 'Animation', body: '2D, 3D, whiteboard or hand-drawn — crafted frame by frame.' },
  { n: '06', title: 'VFX', body: 'Compositing, particles and effects that push it past ordinary.' },
  { n: '07', title: 'SFX', body: 'Sound design and music that make every beat land.' },
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
   * TODO(client): paste a form endpoint to receive messages directly in your inbox
   * (e.g. a free Formspree form: 'https://formspree.io/f/xxxxxxx').
   * While empty, the form opens the visitor's email app with the message ready to send.
   */
  formEndpoint: '' as string,
  /** TODO(client): e.g. '+20 100 000 0000' — shows a WhatsApp button when set */
  whatsapp: '' as string,
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
export type Project = {
  slug: string
  title: string
  category: string
  client: string
  services: string[]
  deliverable: string
  /** null → a designed generative cover is shown */
  cover: string | null
  accent: string
  summary: string
  /** Where it started — the brief */
  start: string
  /** How it was made */
  journey: { stage: string; text: string }[]
  /** Where it ended — the result */
  end: string
  quote: { text: string; source: string }
}

const q = (i: number) => ({ text: testimonials[i].quote, source: testimonials[i].project })

/*
 * TODO(client): project names and client quotes are real (from the current site);
 * the story copy below is a first draft written around the OsLoop pipeline.
 * Replace with the real brief, process notes, stills and results for each project.
 */
export const projects: Project[] = [
  {
    slug: 'realistic-3d-product',
    title: 'Realistic 3D Product Animation',
    category: '3D Production',
    client: 'Upwork client',
    services: ['3D modeling', 'Look development', 'Animation', 'Rendering'],
    deliverable: 'Photoreal product film',
    cover: images.videoRoom,
    accent: '#2c5bff',
    summary: 'A product brought to life in photoreal 3D — every surface, reflection and movement built to match the brief exactly.',
    start:
      'The client arrived with a product and a precise list of requirements: show it realistically, show how it works, and keep every detail exactly as specified. After years of working with freelancers, they wanted a team that would follow the brief to the letter.',
    journey: [
      { stage: 'Brief & references', text: 'We gathered specs, references and the exact shots the client had in mind, and locked a shot list before a single polygon was modeled.' },
      { stage: 'Modeling', text: 'The product was modeled to scale — every part, edge and surface matched to the real object.' },
      { stage: 'Look development', text: 'Materials, lighting and reflections were tuned until the renders felt close enough to touch.' },
      { stage: 'Animation', text: 'Camera moves and product animations reveal each feature in turn, timed to the message.' },
      { stage: 'Delivery', text: 'Final renders were delivered in every format the client needed, ready to publish.' },
    ],
    end: 'A realistic product film that does exactly what the brief asked for — delivered without endless back-and-forth.',
    quote: q(0),
  },
  {
    slug: 'animated-brand-video',
    title: 'Animated Brand Video',
    category: '2D Animation',
    client: 'Upwork client',
    services: ['Script', 'Storyboard', 'Illustration', '2D animation', 'Voice-over'],
    deliverable: 'Animated explainer',
    cover: images.explainer,
    accent: '#ffb547',
    summary: 'A story-driven animated video that turns a complex offer into something anyone understands in seconds.',
    start:
      'The client had a strong product and a message that was hard to explain in words. They needed a short animated video that people would actually watch to the end — and remember.',
    journey: [
      { stage: 'Script', text: 'We distilled the offer into one clear story: a relatable character, a real problem, and the moment the product makes it disappear.' },
      { stage: 'Storyboard', text: 'Every scene was sketched and timed, so the client could see the whole video before animation started.' },
      { stage: 'Illustration', text: 'Characters and scenes were designed in the brand’s colors and personality.' },
      { stage: 'Animation & voice', text: 'Smooth 2D animation, a professional voice-over and music brought the story to life.' },
      { stage: 'Sound & delivery', text: 'Sound design added the final polish before delivery in web and social formats.' },
    ],
    end: 'An animated video that went beyond what the client expected — and a client who now recommends the team to others.',
    quote: q(1),
  },
  {
    slug: 'vfx-film-scene',
    title: 'VFX for a Film Scene',
    category: 'VFX',
    client: 'Upwork client · Film',
    services: ['VFX objects', 'Creatures', 'Backgrounds', 'Compositing'],
    deliverable: 'Composited film shots',
    cover: reel.poster,
    accent: '#7d9bff',
    summary: 'Objects, animals and backgrounds created and composited into live-action footage — on an ambitious timeline.',
    start:
      'A filmmaker needed VFX that was ambitious in both scope and turnaround: objects, animals and full backgrounds that had to sit naturally inside their footage.',
    journey: [
      { stage: 'Shot breakdown', text: 'We broke the scene down shot by shot to understand exactly what each moment needed.' },
      { stage: 'Asset creation', text: 'Objects, animals and environments were built to match the look and scale of the footage.' },
      { stage: 'Tracking & integration', text: 'Every element was tracked into the plates so it moves with the camera.' },
      { stage: 'Compositing', text: 'Lighting, color and grain were matched until the effects disappeared into the film.' },
      { stage: 'Delivery', text: 'Final shots were delivered on schedule, ready for the edit.' },
    ],
    end: 'Effects that serve the story instead of shouting over it — delivered on a tight schedule, exactly as the director imagined.',
    quote: q(2),
  },
  {
    slug: '3d-products-elements',
    title: '3D Products & Elements',
    category: '3D Animation',
    client: 'Upwork client',
    services: ['3D products', 'Motion elements', 'Video animation'],
    deliverable: '3D assets & animations',
    cover: null,
    accent: '#3ddc84',
    summary: 'A set of 3D products, elements and animations built as one consistent visual system for video.',
    start:
      'The client needed a family of 3D products and elements that could be reused across several videos — consistent, flexible and fast to work with.',
    journey: [
      { stage: 'System design', text: 'We defined a shared style — materials, lighting and motion rules — so every element felt part of one family.' },
      { stage: 'Modeling', text: 'Products and elements were modeled clean and reusable.' },
      { stage: 'Animation', text: 'Each element was animated with motion that fits the brand rhythm.' },
      { stage: 'Video assembly', text: 'The pieces were combined into finished video animations.' },
    ],
    end: 'A reusable 3D toolkit plus finished animations — and a client who wants to work together again.',
    quote: q(3),
  },
  {
    slug: 'motion-graphics',
    title: 'Motion Graphics Production',
    category: 'Motion Design',
    client: 'Upwork client',
    services: ['Motion graphics', 'Illustration', 'Animation', 'Sound'],
    deliverable: 'Motion graphics series',
    cover: images.handDrawn,
    accent: '#ff7a59',
    summary: 'A motion graphics and animation production that shaped a big idea into sharp, memorable pieces.',
    start: 'The client came with a big idea and a lot of content. They needed it shaped into motion graphics that felt crafted, not templated.',
    journey: [
      { stage: 'Discovery', text: 'We listened first — to the audience, the goals and the tone the client wanted.' },
      { stage: 'Design frames', text: 'Key frames set the visual language before any motion was added.' },
      { stage: 'Animation', text: 'Type, shapes and illustrations were choreographed into fluid motion.' },
      { stage: 'Sound & finish', text: 'Music and sound design gave every transition its weight.' },
    ],
    end: 'A production the client called one of the most amazing work experiences they ever had.',
    quote: q(4),
  },
  {
    slug: 'explainer-for-dentists',
    title: 'Explainer Video for Dentists',
    category: 'Healthcare · Explainer',
    client: 'Upwork client · Healthcare',
    services: ['Script', 'Medical illustration', '2D animation', 'Voice-over'],
    deliverable: 'Healthcare explainer',
    cover: null,
    accent: '#46c2ff',
    summary: 'A clear, friendly explainer for dental professionals — clinical detail turned into a story anyone can follow.',
    start:
      'Healthcare messages have to be accurate and easy to follow at the same time. The client needed an explainer that dentists would trust and their audience would understand.',
    journey: [
      { stage: 'Research & script', text: 'We learned the clinical language, then rewrote it in words a patient would understand.' },
      { stage: 'Storyboard', text: 'Every step was visualized in a calm, reassuring sequence.' },
      { stage: 'Illustration', text: 'Clean, friendly medical illustrations — precise without being scary.' },
      { stage: 'Animation & voice', text: 'Gentle animation and a warm voice-over guide the viewer from start to finish.' },
    ],
    end: 'An explainer that makes a clinical topic feel simple — and a client who would work with the team again whenever they can.',
    quote: q(5),
  },
]
