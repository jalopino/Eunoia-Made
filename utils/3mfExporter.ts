import { saveAs } from 'file-saver'
import { KeychainParameters } from '@/types/keychain'
import * as THREE from 'three'
import JSZip from 'jszip'
import { TTFLoader } from 'three-stdlib'
// @ts-ignore
import ClipperLib from 'clipper-lib'

export async function export3MF(parameters: KeychainParameters) {
  try {
    const { FontLoader } = await import('three/examples/jsm/loaders/FontLoader.js')
    // Load font (typeface.json preferred)
    const url = parameters.fontUrl?.toLowerCase()
    let font: any
    const fl = new FontLoader()
    if (url && url.endsWith('.typeface.json')) {
      const json = await fetch(parameters.fontUrl!).then(r => r.json())
      font = fl.parse(json)
    } else if (url && /\.(ttf|otf)$/i.test(url)) {
      const ttfJson = await new TTFLoader().loadAsync(parameters.fontUrl!)
      font = fl.parse(ttfJson)
    } else {
      // Try first detected
      const first = await fetch('/api/fonts').then(r => r.json()).then(d => d?.fonts?.[0]?.fileUrl)
      if (first) {
        const json = await fetch(first).then(r => r.json())
        font = fl.parse(json)
      } else {
        throw new Error('No font available for export')
      }
    }

    // Build shapes similar to viewer
    const size = parameters.textSize
    const spacing = parameters.textSize * parameters.lineSpacing
    const line1Shapes = parameters.line1 ? font.generateShapes(parameters.line1, size) : []
    const line2Shapes = parameters.line2 ? font.generateShapes(parameters.line2, size) : []

    const textGeoms: THREE.BufferGeometry[] = []
    if (parameters.textHeight !== 0) {
      if (line1Shapes.length) {
        const g1 = new THREE.ExtrudeGeometry(line1Shapes, { depth: Math.abs(parameters.textHeight), bevelEnabled: false })
        g1.computeBoundingBox()
        const bb = g1.boundingBox!
        const cx = (bb.min.x + bb.max.x) / 2
        const cy = (bb.min.y + bb.max.y) / 2
        // raise by small epsilon to avoid coplanar faces with base
        g1.translate(-cx, (parameters.line2 ? spacing / 2 : 0) - cy, parameters.borderHeight + 0.001)
        textGeoms.push(g1)
      }
      if (line2Shapes.length) {
        const g2 = new THREE.ExtrudeGeometry(line2Shapes, { depth: Math.abs(parameters.textHeight), bevelEnabled: false })
        g2.computeBoundingBox()
        const bb = g2.boundingBox!
        const cx = (bb.min.x + bb.max.x) / 2
        const cy = (bb.min.y + bb.max.y) / 2
        g2.translate(-cx, -spacing / 2 - cy, parameters.borderHeight + 0.001)
        textGeoms.push(g2)
      }
    }

    // Base via union + outward offset (Minkowski-like) to hug the glyphs
    const SCALE = 1000
    const subjectPaths: any[] = []

    if (line1Shapes.length) {
      const g1tmp = new THREE.ShapeGeometry(line1Shapes)
      g1tmp.computeBoundingBox()
      const bb1s = g1tmp.boundingBox!
      const cx1s = (bb1s.min.x + bb1s.max.x) / 2
      const cy1s = (bb1s.min.y + bb1s.max.y) / 2
      const dy1s = parameters.line2 ? spacing / 2 : 0
      line1Shapes.forEach((sh: any) => {
        const outer = sh.getPoints(64).map((p: any) => ({ X: Math.round((p.x - cx1s) * SCALE), Y: Math.round((p.y - cy1s + dy1s) * SCALE) }))
        if (outer.length > 2) subjectPaths.push(outer)
        if (sh.holes && sh.holes.length) {
          sh.holes.forEach((h: any) => {
            const pts = h.getPoints(64).map((p: any) => ({ X: Math.round((p.x - cx1s) * SCALE), Y: Math.round((p.y - cy1s + dy1s) * SCALE) }))
            if (pts.length > 2) subjectPaths.push(pts)
          })
        }
      })
    }
    if (line2Shapes.length) {
      const g2tmp = new THREE.ShapeGeometry(line2Shapes)
      g2tmp.computeBoundingBox()
      const bb2s = g2tmp.boundingBox!
      const cx2s = (bb2s.min.x + bb2s.max.x) / 2
      const cy2s = (bb2s.min.y + bb2s.max.y) / 2
      const dy2s = -spacing / 2
      line2Shapes.forEach((sh: any) => {
        const outer = sh.getPoints(64).map((p: any) => ({ X: Math.round((p.x - cx2s) * SCALE), Y: Math.round((p.y - cy2s + dy2s) * SCALE) }))
        if (outer.length > 2) subjectPaths.push(outer)
        if (sh.holes && sh.holes.length) {
          sh.holes.forEach((h: any) => {
            const pts = h.getPoints(64).map((p: any) => ({ X: Math.round((p.x - cx2s) * SCALE), Y: Math.round((p.y - cy2s + dy2s) * SCALE) }))
            if (pts.length > 2) subjectPaths.push(pts)
          })
        }
      })
    }

    // union
    const clipper = new ClipperLib.Clipper()
    clipper.AddPaths(subjectPaths, ClipperLib.PolyType.ptSubject, true)
    const union: any[] = []
    clipper.Execute(
      ClipperLib.ClipType.ctUnion,
      union,
      ClipperLib.PolyFillType.pftNonZero,
      ClipperLib.PolyFillType.pftNonZero
    )

    // offset outward by borderThickness
    const co = new ClipperLib.ClipperOffset(2, 2)
    co.AddPaths(union, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon)
    const offsetSolution: any[] = []
    co.Execute(offsetSolution, Math.round(parameters.borderThickness * SCALE))

    const offsetShapes: THREE.Shape[] = []
    offsetSolution.forEach((path: any[]) => {
      const shape = new THREE.Shape()
      path.forEach((pt: any, i: number) => {
        const x = pt.X / SCALE
        const y = pt.Y / SCALE
        if (i === 0) shape.moveTo(x, y)
        else shape.lineTo(x, y)
      })
      shape.closePath()
      offsetShapes.push(shape)
    })
    if (offsetShapes.length === 0) throw new Error('Offset failed to produce shapes')
    // Extrude and merge offset shapes for base
    const baseGeoms: THREE.BufferGeometry[] = []
    offsetShapes.forEach(os => {
      const g = new THREE.ExtrudeGeometry(os, { depth: parameters.borderHeight, bevelEnabled: false })
      baseGeoms.push(g)
    })
    const baseGeom = mergeBufferGeoms(baseGeoms)

    // Ring
    const ringShapes: THREE.Shape[] = []
    if (parameters.showRing) {
      const ringShape = new THREE.Shape()
      ringShape.moveTo(parameters.outerDiameter / 2, 0)
      ringShape.absarc(0, 0, parameters.outerDiameter / 2, 0, Math.PI * 2, false)
      const hole = new THREE.Path()
      hole.moveTo(parameters.innerDiameter / 2, 0)
      hole.absarc(0, 0, parameters.innerDiameter / 2, 0, Math.PI * 2, true)
      ringShape.holes.push(hole)
      ringShapes.push(ringShape)
    }
    const ringGeom = ringShapes.length ? new THREE.ExtrudeGeometry(ringShapes[0], { depth: parameters.ringHeight, bevelEnabled: false }) : null

    // Build base part (base + ring), and text part (union of text geoms)
    let basePartGeoms: THREE.BufferGeometry[] = [baseGeom]
    if (ringGeom) {
      baseGeom.computeBoundingBox()
      const b = baseGeom.boundingBox!
      const baseW = b.max.x - b.min.x
      const ringX = -(baseW / 2 + parameters.outerDiameter / 4) + parameters.ringX
      const ringY = (parameters.line2 ? spacing / 2 : 0) + parameters.ringY
      ringGeom.translate(ringX, ringY, 0)
      basePartGeoms.push(ringGeom)
    }
    const basePart = mergeBufferGeoms(basePartGeoms)
    const parts: { geom: THREE.BufferGeometry; matIndex: number }[] = [{ geom: basePart, matIndex: 0 }]
    if (textGeoms.length) {
      const textPart = mergeBufferGeoms(textGeoms)
      parts.push({ geom: textPart, matIndex: 1 })
    }

    const palette = [parameters.baseColor, parameters.twoColors ? parameters.textColor : parameters.baseColor]
    const modelXml = build3MFModelWithColors(parts, palette)
    const zip = new JSZip()
    zip.file('[Content_Types].xml', contentTypesXml())
    zip.file('3D/3dmodel.model', modelXml)
    zip.file('_rels/.rels', relsXml())
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, `keychain_${parameters.line1 || 'model'}.3mf`)
  } catch (e) {
    console.error('3MF export failed', e)
    alert('3MF export failed. Please try a different font or parameters.')
  }
}

function build3MFModelWithColors(parts: { geom: THREE.BufferGeometry; matIndex: number }[], paletteHex: string[]): string {
  // Build basematerials palette id=1
  const normHex = (c: string) => (c && c.startsWith('#') ? c : '#000000')
  const bases = paletteHex.map((c, i) => `    <base name="m${i}" displaycolor="${normHex(c)}"/>`).join('\n')
  const basematerials = `  <basematerials id="1">\n${bases}\n  </basematerials>\n`
  let objectsXML = ''
  let itemsXML = ''
  parts.forEach((part, i) => {
    const nonIndexed = part.geom.index ? part.geom.toNonIndexed() : part.geom
    const pos = nonIndexed.getAttribute('position') as THREE.BufferAttribute
    const vertices: string[] = []
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i).toFixed(6)
      const y = pos.getY(i).toFixed(6)
      const z = pos.getZ(i).toFixed(6)
      vertices.push(`        <vertex x="${x}" y="${y}" z="${z}" />`)
    }
    // Triangles are sequential in non-indexed positions
    const triangles: string[] = []
    for (let iTri = 0; iTri < pos.count; iTri += 3) {
      triangles.push(`        <triangle v1="${iTri}" v2="${iTri + 1}" v3="${iTri + 2}" pid="1" p1="${part.matIndex}"/>`)
    }
    objectsXML += `  <object id="${i + 1}" type="model">\n    <mesh>\n      <vertices>\n${vertices.join('\n')}\n      </vertices>\n      <triangles>\n${triangles.join('\n')}\n      </triangles>\n    </mesh>\n  </object>\n`
    itemsXML += `    <item objectid="${i + 1}" />\n`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${basematerials}${objectsXML}  </resources>
  <build>
${itemsXML}  </build>
</model>`
}

function contentTypesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`
}

function relsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`
}

function mergeBufferGeoms(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geoms.length === 1) return geoms[0]
  const merged = new THREE.BufferGeometry()
  const positions: number[] = []
  const indices: number[] = []
  let offset = 0
  geoms.forEach(g => {
    const non = g.index ? g.toNonIndexed() : g
    const pos = non.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i))
    }
    for (let i = 0; i < pos.count; i += 3) {
      indices.push(offset + i, offset + i + 1, offset + i + 2)
    }
    offset += pos.count
  })
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  merged.setIndex(indices)
  merged.computeVertexNormals()
  return merged
}
