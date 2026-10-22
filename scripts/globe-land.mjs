// Builds the dotted globe of the "Our reach" section (src/pages/home/globeLand.ts) from Natural Earth
// 1:50m data (world-atlas). The globe is rows of dots every STEP degrees; we keep one bit per dot
// (1 = land) and, for the land dots, which of our countries each one falls in.
// It also draws the globe's land texture (public/globe/land.webp).
// Run:  npm i --no-save world-atlas@2 topojson-client@3 sharp@0.33 && node scripts/globe-land.mjs
// (or pass a folder whose node_modules has them:  node scripts/globe-land.mjs path/to/folder)
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(import.meta.url), '../..')
const modules = resolve(process.argv[2] ?? root)
const require = createRequire(join(modules, 'package.json'))
const topojson = require('topojson-client')
const atlas = (name) => JSON.parse(readFileSync(require.resolve(`world-atlas/${name}`), 'utf8'))

const STEP = 1

/**
 * The countries the globe lights up (ISO alpha-2 → ISO numeric, as world-atlas ids them). Keep in step
 * with `reach` in src/lib/content.ts. `box` keeps only the part of a country near its mainland.
 */
const COUNTRIES = {
  US: '840', GB: '826', AU: '036', AE: '784', QA: '634', SA: '682', FR: '250', CH: '756', DE: '276',
  ES: '724', CA: '124', OM: '512', IE: '372', GR: '300', KR: '410', SG: '702', ZA: '710', RO: '642', EG: '818',
}
const BOX = { FR: [-6, 41, 10, 52] } // mainland France and Corsica, not French Guiana or the islands

/** polygons → a point-in-shape test that copes with the antimeridian and with Antarctica's open ring */
function tester(geometries) {
  const polys = []
  for (const g of geometries) {
    const list = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
    for (const p of list) {
      const xs = p[0].map((c) => c[0])
      const ys = p[0].map((c) => c[1])
      const minY = Math.min(...ys)
      let minX = Math.min(...xs)
      let maxX = Math.max(...xs)
      // Antarctica wraps the pole: its ring runs -180..180 and never closes over -90
      const polar = minY < -60 && maxX - minX > 350
      let rings = p
      let wrap = false
      if (!polar && maxX - minX > 180) {
        // crosses the antimeridian: unwrap it so it's continuous, then test x and x ± 360
        rings = p.map((r) => {
          let off = 0
          return r.map(([x, y], i) => {
            if (i && Math.abs(x - r[i - 1][0]) > 180) off += x < r[i - 1][0] ? 360 : -360
            return [x + off, y]
          })
        })
        const ux = rings[0].map((c) => c[0])
        minX = Math.min(...ux)
        maxX = Math.max(...ux)
        wrap = true
      }
      polys.push({ rings, minX, maxX, minY, maxY: Math.max(...ys), polar, wrap })
    }
  }
  const inRing = (x, y, ring) => {
    let c = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i]
      const [xj, yj] = ring[j]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
    }
    return c
  }
  // a ray straight north: an odd number of coast crossings means we're on the pole's side
  const southOf = (x, y, ring) => {
    let c = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i]
      const [xj, yj] = ring[j]
      if (xi > x !== xj > x && Math.abs(xi - xj) < 180 && ((x - xi) * (yj - yi)) / (xj - xi) + yi > y) c = !c
    }
    return c
  }
  return (x0, y) => {
    for (const p of polys) {
      const x = p.wrap && x0 < p.minX ? x0 + 360 : p.wrap && x0 > p.maxX ? x0 - 360 : x0
      if (x < p.minX || x > p.maxX || y < p.minY || y > p.maxY) continue
      if (p.polar) {
        if (southOf(x, y, p.rings[0])) return true
        continue
      }
      if (!inRing(x, y, p.rings[0])) continue
      if (!p.rings.slice(1).some((h) => inRing(x, y, h))) return true
    }
    return false
  }
}

const landTopo = atlas('land-50m.json')
const land = topojson.feature(landTopo, landTopo.objects.land)
const isLand = tester((land.features ?? [land]).map((f) => f.geometry))

const countriesTopo = atlas('countries-50m.json')
const shapes = topojson.feature(countriesTopo, countriesTopo.objects.countries).features
const codes = Object.keys(COUNTRIES)
const inCountry = codes.map((code) => {
  const test = tester(shapes.filter((f) => f.id === COUNTRIES[code] && f.properties.name !== 'Ashmore and Cartier Is.').map((f) => f.geometry))
  const box = BOX[code]
  return box ? (x, y) => x >= box[0] && y >= box[1] && x <= box[2] && y <= box[3] && test(x, y) : test
})

const bits = []
const ids = []
for (let r = 0; r < Math.round(180 / STEP); r++) {
  const lat = -90 + (r + 0.5) * STEP
  const n = Math.max(1, Math.round((360 * Math.cos((lat * Math.PI) / 180)) / STEP))
  for (let j = 0; j < n; j++) {
    const lon = -180 + ((j + 0.5) * 360) / n
    const on = isLand(lon, lat)
    bits.push(on ? 1 : 0)
    if (on) ids.push(inCountry.findIndex((t) => t(lon, lat)) + 1)
  }
}

const mask = new Uint8Array(Math.ceil(bits.length / 8))
bits.forEach((b, i) => b && (mask[i >> 3] |= 1 << (i & 7)))

// land dots' ids as runs: id byte, then the run's length as a varint
const runs = []
for (let i = 0; i < ids.length; ) {
  let j = i
  while (j < ids.length && ids[j] === ids[i]) j++
  runs.push(ids[i])
  for (let len = j - i; ; len >>= 7) {
    runs.push(len > 127 ? (len & 127) | 128 : len)
    if (len <= 127) break
  }
  i = j
}

// The globe's surface: an equirectangular land mask (white land on black), west → east from -180°,
// north at the top. Rings crossing the antimeridian are unwrapped and drawn a turn either side too.
const W = 4096
const H = W / 2
const paths = []
for (const f of land.features ?? [land]) {
  const g = f.geometry
  for (const poly of g.type === 'Polygon' ? [g.coordinates] : g.coordinates) {
    let d = ''
    for (const ring of poly) {
      let off = 0
      const pts = ring.map(([x, y], i) => {
        if (i && Math.abs(x - ring[i - 1][0]) > 180) off += x < ring[i - 1][0] ? 360 : -360
        return [x + off, y]
      })
      // Antarctica: its ring goes once round the pole, so close it over the bottom edge
      if (Math.abs(pts.at(-1)[0] - pts[0][0]) > 300) pts.push([pts.at(-1)[0], -90], [pts[0][0], -90])
      d += 'M' + pts.map(([x, y]) => `${(((x + 180) / 360) * W).toFixed(1)},${(((90 - y) / 180) * H).toFixed(1)}`).join('L') + 'Z'
    }
    paths.push(d)
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#000"/><g fill="#fff" fill-rule="evenodd">${[-W, 0, W]
  .map((dx) => `<g transform="translate(${dx} 0)">${paths.map((d) => `<path d="${d}"/>`).join('')}</g>`)
  .join('')}</g></svg>`
const sharp = require('sharp')
mkdirSync(join(root, 'public/globe'), { recursive: true })
const info = await sharp(Buffer.from(svg)).greyscale().webp({ quality: 82 }).toFile(join(root, 'public/globe/land.webp'))
console.log(`public/globe/land.webp ${W}×${H}, ${(info.size / 1024).toFixed(0)} KB`)

const b64 = (a) => Buffer.from(a).toString('base64')
const counts = codes.map((c, k) => `${c} ${ids.filter((x) => x === k + 1).length}`).join(', ')
writeFileSync(
  join(root, 'src/pages/home/globeLand.ts'),
  `// Generated by scripts/globe-land.mjs from Natural Earth 1:50m (world-atlas). Don't edit by hand.
// ${bits.length} dots, ${ids.length} on land. Land dots per country: ${counts}

/** the dots sit in rows every LAND_STEP degrees of latitude, spaced the same along each row */
export const LAND_STEP = ${STEP}
/** one bit per dot, rows south → north, each row west → east from -180°; 1 = land */
export const LAND_MASK = '${b64(mask)}'
/** the countries the globe can light up; a land dot's id is its index here + 1 (0 = anywhere else) */
export const LAND_COUNTRIES = ${JSON.stringify(codes)}
/** every land dot's id, in order, as runs: the id, then the run's length as a varint (base64) */
export const LAND_IDS = '${b64(runs)}'
`,
)
console.log(`${bits.length} dots, ${ids.length} land, mask ${mask.length} B, ids ${runs.length} B\n${counts}`)
