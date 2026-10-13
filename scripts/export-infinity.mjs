// Exports the hero's 3D OsLoop icon — the glass ∞ and the orange play arrow — to standard 3D files
// (GLB + OBJ + STL) in design-assets/. Uses the exact geometry the site renders (src/pages/home/loopIcon.ts).
// Run:  node scripts/export-infinity.mjs   (Node 23.6+ — it imports the .ts module directly)
import { mkdirSync, writeFileSync } from 'node:fs'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { ARROW_HOME, createArrowGeometry, createLoopGeometry, toScene } from '../src/pages/home/loopIcon.ts'

// Node has Blob but no FileReader — GLTFExporter needs a tiny shim.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((b) => ((this.result = b), this.onloadend?.(), this.onload?.()))
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((b) => {
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(b).toString('base64')}`
      this.onloadend?.()
      this.onload?.()
    })
  }
}

const glass = new THREE.MeshPhysicalMaterial({
  name: 'OsLoop Glass',
  color: '#f2f5ff',
  roughness: 0.04,
  metalness: 0,
  transmission: 1,
  ior: 1.32,
  thickness: 0.55,
  attenuationColor: new THREE.Color('#b9c9ff'),
  attenuationDistance: 2.2,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
})
const orange = new THREE.MeshPhysicalMaterial({
  name: 'OsLoop Orange',
  color: '#ffae23',
  roughness: 0.24,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
})

const loop = new THREE.Mesh(createLoopGeometry(640, 64), glass)
loop.name = 'OsLoop_Infinity'
const arrow = new THREE.Mesh(createArrowGeometry(), orange)
arrow.name = 'OsLoop_Arrow'
toScene(ARROW_HOME.x, ARROW_HOME.y, 0, arrow.position)

const scene = new THREE.Scene()
scene.add(loop, arrow)

const out = new URL('../design-assets/', import.meta.url)
mkdirSync(out, { recursive: true })

const glb = await new GLTFExporter().parseAsync(scene, { binary: true })
writeFileSync(new URL('osloop-infinity.glb', out), Buffer.from(glb))
writeFileSync(new URL('osloop-infinity.obj', out), new OBJExporter().parse(scene))
writeFileSync(new URL('osloop-infinity.stl', out), Buffer.from(new STLExporter().parse(scene, { binary: true }).buffer))

console.log('Exported to design-assets/: osloop-infinity.glb, .obj, .stl (glass ∞ + orange arrow)')
