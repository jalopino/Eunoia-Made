import { saveAs } from 'file-saver'
import { KeychainParameters } from '@/types/keychain'
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { TTFLoader } from 'three-stdlib'
// @ts-ignore
import ClipperLib from 'clipper-lib'

// Fix Math function types
declare global {
  interface Math {
    round(x: number): number
  }
}

// Simplified mesh cleaning - only remove degenerate triangles and weld vertices
// NO CSG operations = NO non-manifold edges
function cleanMesh(geom: THREE.BufferGeometry, name: string): THREE.BufferGeometry {
  try {
    // Convert to non-indexed for processing
    const nonIndexed = geom.index ? geom.toNonIndexed() : geom.clone()
    const positions = nonIndexed.getAttribute('position') as THREE.BufferAttribute
    
    // Remove degenerate triangles (zero-area or nearly zero-area)
    const goodTriangles: number[] = []
    const TOLERANCE = 0.0001 // Very small tolerance
    
    for (let i = 0; i < positions.count; i += 3) {
      const ax = positions.getX(i), ay = positions.getY(i), az = positions.getZ(i)
      const bx = positions.getX(i + 1), by = positions.getY(i + 1), bz = positions.getZ(i + 1)
      const cx = positions.getX(i + 2), cy = positions.getY(i + 2), cz = positions.getZ(i + 2)
      
      // Calculate triangle area using cross product
      const abx = bx - ax, aby = by - ay, abz = bz - az
      const acx = cx - ax, acy = cy - ay, acz = cz - az
      const crossX = aby * acz - abz * acy
      const crossY = abz * acx - abx * acz
      const crossZ = abx * acy - aby * acx
      const area = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ) / 2
      
      if (area > TOLERANCE) {
        goodTriangles.push(i, i+1, i+2)
      }
    }
    
    if (goodTriangles.length === 0) {
      console.warn(`No valid triangles found in ${name}`)
      return geom
    }
    
    // Create new geometry with only good triangles
    const cleaned = new THREE.BufferGeometry()
    const newPositions = new Float32Array(goodTriangles.length * 3)
    
    for (let i = 0; i < goodTriangles.length; i++) {
      const oldIdx = goodTriangles[i]
      newPositions[i*3] = positions.getX(oldIdx)
      newPositions[i*3+1] = positions.getY(oldIdx)
      newPositions[i*3+2] = positions.getZ(oldIdx)
    }
    
    cleaned.setAttribute('position', new THREE.BufferAttribute(newPositions, 3))
    
    // Gentle vertex welding to remove duplicates
    const welded = BufferGeometryUtils.mergeVertices(cleaned, 0.0001)
    welded.computeVertexNormals()
    
    console.log(`Cleaned ${name}:`, {
      originalTriangles: positions.count / 3,
      validTriangles: goodTriangles.length / 3,
      finalVertices: welded.getAttribute('position').count
    })
    
    return welded
  } catch (error) {
    console.warn(`Mesh cleaning failed for ${name}:`, error)
    return geom
  }
}

export async function exportOBJ(parameters: KeychainParameters, mtlFileName = 'keychain.mtl') {
  // Build geometry (same approach as 3MF)
  const { FontLoader } = await import('three/examples/jsm/loaders/FontLoader.js')
  const url = parameters.fontUrl?.toLowerCase()
  const fl = new FontLoader()
  let font: any
  if (url && url.endsWith('.typeface.json')) {
    const json = await fetch(parameters.fontUrl!).then(r => r.json())
    font = fl.parse(json)
  } else if (url && /\.(ttf|otf)$/i.test(url)) {
    const ttfJson = await new TTFLoader().loadAsync(parameters.fontUrl!)
    font = fl.parse(ttfJson)
  } else {
    const first = await fetch('/api/fonts').then(r => r.json()).then(d => d?.fonts?.[0]?.fileUrl)
    if (!first) throw new Error('No font available for export')
    const json = await fetch(first).then(r => r.json())
    font = fl.parse(json)
  }

  // Use fontSize for first line if admin mode is enabled
  const isAdminMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pass') === 'eunoia'
  const line1Size = isAdminMode && parameters.fontSize !== parameters.textSize ? parameters.fontSize : parameters.textSize
  // Only use line2FontSize if admin mode is enabled and it's different from textSize
  const line2Size = isAdminMode && parameters.line2FontSize !== parameters.textSize ? parameters.line2FontSize : parameters.textSize
  const spacing = line1Size * parameters.lineSpacing
  const line1Shapes = parameters.line1 ? font.generateShapes(parameters.line1, line1Size) : []
  const line2Shapes = parameters.line2 ? font.generateShapes(parameters.line2, line2Size) : []

  const textGeoms: THREE.BufferGeometry[] = []
  if (parameters.textHeight !== 0) {
    if (line1Shapes.length) {
      const g1 = new THREE.ExtrudeGeometry(line1Shapes, { 
        depth: Math.abs(parameters.textHeight), 
        bevelEnabled: false,
        steps: 1
      })
      g1.computeBoundingBox(); const bb = g1.boundingBox!
      const cx = (bb.min.x + bb.max.x) / 2; const cy = (bb.min.y + bb.max.y) / 2
      g1.translate(-cx, (parameters.line2 ? spacing/2 : 0) - cy + parameters.textOffsetY, parameters.borderHeight)
      textGeoms.push(g1)
    }
    if (line2Shapes.length) {
      const g2 = new THREE.ExtrudeGeometry(line2Shapes, { 
        depth: Math.abs(parameters.textHeight), 
        bevelEnabled: false,
        steps: 1
      })
      g2.computeBoundingBox(); const bb = g2.boundingBox!
      const cx = (bb.min.x + bb.max.x) / 2; const cy = (bb.min.y + bb.max.y) / 2
      g2.translate(-cx, -spacing/2 - cy + parameters.textOffsetY, parameters.borderHeight)
      textGeoms.push(g2)
    }
  }

  // Base via union+offset
  const SCALE = 1000
  const subjectPaths: any[] = []
  if (line1Shapes.length) {
    const g1tmp = new THREE.ShapeGeometry(line1Shapes)
    g1tmp.computeBoundingBox(); const bb = g1tmp.boundingBox!
    const cx = (bb.min.x + bb.max.x) / 2; const cy = (bb.min.y + bb.max.y) / 2
    const dy = (parameters.line2 ? spacing/2 : 0) + parameters.textOffsetY
    line1Shapes.forEach((sh: any) => {
      const outer = sh.getPoints(128).map((p:any)=>({X:Math.round((p.x-cx)*SCALE),Y:Math.round((p.y-cy+dy)*SCALE)}))
      if (outer.length>2) subjectPaths.push(outer)
      if (sh.holes) sh.holes.forEach((h:any)=>{
        const pts = h.getPoints(128).map((p:any)=>({X:Math.round((p.x-cx)*SCALE),Y:Math.round((p.y-cy+dy)*SCALE)}))
        if (pts.length>2) subjectPaths.push(pts)
      })
    })
  }
  if (line2Shapes.length) {
    const g2tmp = new THREE.ShapeGeometry(line2Shapes)
    g2tmp.computeBoundingBox(); const bb = g2tmp.boundingBox!
    const cx = (bb.min.x + bb.max.x) / 2; const cy = (bb.min.y + bb.max.y) / 2
    const dy = -spacing/2 + parameters.textOffsetY
    line2Shapes.forEach((sh: any) => {
      const outer = sh.getPoints(128).map((p:any)=>({X:Math.round((p.x-cx)*SCALE),Y:Math.round((p.y-cy+dy)*SCALE)}))
      if (outer.length>2) subjectPaths.push(outer)
      if (sh.holes) sh.holes.forEach((h:any)=>{
        const pts = h.getPoints(128).map((p:any)=>({X:Math.round((p.x-cx)*SCALE),Y:Math.round((p.y-cy+dy)*SCALE)}))
        if (pts.length>2) subjectPaths.push(pts)
      })
    })
  }
  const clipper = new ClipperLib.Clipper(); clipper.AddPaths(subjectPaths, ClipperLib.PolyType.ptSubject, true)
  const union:any[] = []; clipper.Execute(ClipperLib.ClipType.ctUnion, union, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero)
  const co = new ClipperLib.ClipperOffset(2,2); co.AddPaths(union, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon)
  const solution:any[] = []; co.Execute(solution, Math.round(parameters.borderThickness*SCALE))
  const offsetShapes:THREE.Shape[] = []
  solution.forEach((path:any[])=>{ const s=new THREE.Shape(); path.forEach((pt:any,i:number)=>{const x=pt.X/SCALE; const y=pt.Y/SCALE; if(i===0)s.moveTo(x,y); else s.lineTo(x,y)}); s.closePath(); offsetShapes.push(s) })
  const baseGeoms:THREE.BufferGeometry[] = []; offsetShapes.forEach(os=>{ 
    baseGeoms.push(new THREE.ExtrudeGeometry(os,{
      depth: parameters.borderHeight,
      bevelEnabled: false,
      steps: 1
    })) 
  })
  const baseGeom = mergeBufferGeoms(baseGeoms)
  const basePart = cleanMesh(baseGeom, 'base')
  
  // Ring - NO CSG, export as separate part
  let ringPart: THREE.BufferGeometry | null = null
  if (parameters.showRing) {
    const ringShape = new THREE.Shape()
    ringShape.moveTo(parameters.outerDiameter/2,0)
    ringShape.absarc(0,0,parameters.outerDiameter/2,0,Math.PI*2,false)
    const hole = new THREE.Path()
    hole.moveTo(parameters.innerDiameter/2,0)
    hole.absarc(0,0,parameters.innerDiameter/2,0,Math.PI*2,true)
    ringShape.holes.push(hole)
    const ringGeom = new THREE.ExtrudeGeometry(ringShape,{
      depth: parameters.ringHeight,
      bevelEnabled: false,
      steps: 1
    })
    baseGeom.computeBoundingBox()
    const b=baseGeom.boundingBox!
    const baseW=b.max.x-b.min.x
    ringGeom.translate(-(baseW/2+parameters.outerDiameter/4)+parameters.ringX,(parameters.line2?spacing/2:0)+parameters.textOffsetY+parameters.ringY,0)
    ringPart = cleanMesh(ringGeom, 'ring')
  }

  // Build OBJ+MTL - NO CSG operations, export each part separately
  // Text parts - keep separate, no union
  const textParts: THREE.BufferGeometry[] = []
  textGeoms.forEach((tg, i) => {
    textParts.push(cleanMesh(tg, `text_${i}`))
  })

  const partsForExport = [
    { name: 'base', geom: basePart, color: parameters.baseColor },
    ...(ringPart ? [{ name: 'ring', geom: ringPart, color: parameters.baseColor }] : []),
    ...textParts.map((tp, i) => ({ 
      name: `text_${i}`, 
      geom: tp, 
      color: parameters.twoColors ? parameters.textColor : parameters.baseColor 
    }))
  ]

  const { obj, mtl } = await buildOBJWithMTL(partsForExport, mtlFileName)
  return { obj, mtl }
}

async function buildOBJWithMTL(parts:{name:string,geom:THREE.BufferGeometry,color:string}[], mtlFileName = 'keychain.mtl') {
  let obj = `mtllib ${mtlFileName}\n`
  let mtl = ''
  const norm = (c:string)=> c && c.startsWith('#') ? c : '#000000'
  const hexToRgb = (h:string)=>({ r:parseInt(h.slice(1,3),16)/255, g:parseInt(h.slice(3,5),16)/255, b:parseInt(h.slice(5,7),16)/255 })
  let vOffset = 0
  parts.forEach((p,i)=>{
    const color = hexToRgb(norm(p.color))
    const matName = `mat_${p.name}`
    mtl += `newmtl ${matName}\nKd ${color.r.toFixed(4)} ${color.g.toFixed(4)} ${color.b.toFixed(4)}\n\n`
    // Geometry is already cleaned and indexed by this point
    const pos = p.geom.getAttribute('position') as THREE.BufferAttribute
    const idx = p.geom.getIndex()!
    obj += `o ${p.name}\nusemtl ${matName}\n`
    for (let vi=0; vi<pos.count; vi++) {
      obj += `v ${pos.getX(vi).toFixed(6)} ${pos.getY(vi).toFixed(6)} ${pos.getZ(vi).toFixed(6)}\n`
    }
    for (let fi=0; fi<idx.count; fi+=3) {
      const a = idx.getX(fi)
      const b = idx.getX(fi+1)
      const c = idx.getX(fi+2)
      obj += `f ${vOffset+a+1} ${vOffset+b+1} ${vOffset+c+1}\n`
    }
    vOffset += pos.count
  })
  return { obj, mtl }
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
    for (let i = 0; i < pos.count; i++) positions.push(pos.getX(i), pos.getY(i), pos.getZ(i))
    for (let i = 0; i < pos.count; i += 3) indices.push(offset + i, offset + i + 1, offset + i + 2)
    offset += pos.count
  })
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  merged.setIndex(indices)
  merged.computeVertexNormals()
  return merged
}