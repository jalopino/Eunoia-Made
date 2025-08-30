import { saveAs } from 'file-saver'
import { KeychainParameters } from '@/types/keychain'
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { TTFLoader } from 'three-stdlib'
import { CSG } from 'three-csg-ts'
// @ts-ignore
import ClipperLib from 'clipper-lib'

// Advanced mesh repair specifically targeting non-manifold edges
function repairMesh(geom: THREE.BufferGeometry, name: string): THREE.BufferGeometry {
  // For base geometry, use less aggressive repair to preserve shape
  if (name === 'base') {
    try {
      // Convert to non-indexed for processing
      const nonIndexed = geom.index ? geom.toNonIndexed() : geom.clone()
      const positions = nonIndexed.getAttribute('position') as THREE.BufferAttribute
      
      // Step 1: Remove only very degenerate triangles (much higher tolerance)
      const goodTriangles: number[] = []
      const DEGENERATE_TOLERANCE = 0.01 // Higher tolerance for base
      
      for (let i = 0; i < positions.count; i += 3) {
        const ax = positions.getX(i)
        const ay = positions.getY(i)
        const az = positions.getZ(i)
        const bx = positions.getX(i + 1)
        const by = positions.getY(i + 1)
        const bz = positions.getZ(i + 1)
        const cx = positions.getX(i + 2)
        const cy = positions.getY(i + 2)
        const cz = positions.getZ(i + 2)
        
        // Check if any two vertices are too close
        const abDist = Math.sqrt((ax-bx)**2 + (ay-by)**2 + (az-bz)**2)
        const bcDist = Math.sqrt((bx-cx)**2 + (by-cy)**2 + (bz-cz)**2)
        const caDist = Math.sqrt((cx-ax)**2 + (cy-ay)**2 + (cz-az)**2)
        
        if (abDist > DEGENERATE_TOLERANCE && 
            bcDist > DEGENERATE_TOLERANCE && 
            caDist > DEGENERATE_TOLERANCE) {
          goodTriangles.push(i, i+1, i+2)
        }
      }
      
      // Step 2: Create new geometry with only good triangles
      const cleaned = new THREE.BufferGeometry()
      const newPositions = new Float32Array(goodTriangles.length * 3)
      
      for (let i = 0; i < goodTriangles.length; i++) {
        const oldIdx = goodTriangles[i]
        newPositions[i*3] = positions.getX(oldIdx)
        newPositions[i*3+1] = positions.getY(oldIdx)
        newPositions[i*3+2] = positions.getZ(oldIdx)
      }
      
      cleaned.setAttribute('position', new THREE.BufferAttribute(newPositions, 3))
      
      // Step 3: Gentle vertex welding (less aggressive)
      const welded = BufferGeometryUtils.mergeVertices(cleaned, 0.001) // Less aggressive welding
      welded.computeVertexNormals()
      
      console.log(`Gentle mesh repair for base:`, {
        originalVertices: positions.count,
        originalTriangles: positions.count / 3,
        cleanedTriangles: goodTriangles.length / 3,
        weldedVertices: welded.getAttribute('position').count,
        finalTriangles: welded.getAttribute('position').count / 3
      })
      
      return welded
    } catch (error) {
      console.warn(`Base mesh repair failed, using original:`, error)
      return geom
    }
  }
  
    // For other geometries (text, ring), use the original aggressive repair
  try {
    // Convert to non-indexed for processing
    const nonIndexed = geom.index ? geom.toNonIndexed() : geom.clone()
    const positions = nonIndexed.getAttribute('position') as THREE.BufferAttribute
    
    // Step 1: Remove degenerate triangles
    const goodTriangles: number[] = []
    const DEGENERATE_TOLERANCE = 0.001
    
    for (let i = 0; i < positions.count; i += 3) {
      const ax = positions.getX(i)
      const ay = positions.getY(i)
      const az = positions.getZ(i)
      const bx = positions.getX(i + 1)
      const by = positions.getY(i + 1)
      const bz = positions.getZ(i + 1)
      const cx = positions.getX(i + 2)
      const cy = positions.getY(i + 2)
      const cz = positions.getZ(i + 2)
      
      // Check if any two vertices are too close
      const abDist = Math.sqrt((ax-bx)**2 + (ay-by)**2 + (az-bz)**2)
      const bcDist = Math.sqrt((bx-cx)**2 + (by-cy)**2 + (bz-cz)**2)
      const caDist = Math.sqrt((cx-ax)**2 + (cy-ay)**2 + (cz-az)**2)
      
      if (abDist > DEGENERATE_TOLERANCE && 
          bcDist > DEGENERATE_TOLERANCE && 
          caDist > DEGENERATE_TOLERANCE) {
        goodTriangles.push(i, i+1, i+2)
      }
    }
    
    // Step 2: Create new geometry with only good triangles
    const cleaned = new THREE.BufferGeometry()
    const newPositions = new Float32Array(goodTriangles.length * 3)
    
    for (let i = 0; i < goodTriangles.length; i++) {
      const oldIdx = goodTriangles[i]
      newPositions[i*3] = positions.getX(oldIdx)
      newPositions[i*3+1] = positions.getY(oldIdx)
      newPositions[i*3+2] = positions.getZ(oldIdx)
    }
    
    cleaned.setAttribute('position', new THREE.BufferAttribute(newPositions, 3))
    
    // Step 3: Advanced vertex welding with edge analysis
    const welded = BufferGeometryUtils.mergeVertices(cleaned, 0.005) // More aggressive welding
    welded.computeVertexNormals()
    
    // Step 4: Remove isolated vertices and fix edge connectivity
    const finalGeom = removeIsolatedVertices(welded)
    finalGeom.computeVertexNormals()
    
    console.log(`Advanced mesh repair for ${name}:`, {
      originalVertices: positions.count,
      originalTriangles: positions.count / 3,
      cleanedTriangles: goodTriangles.length / 3,
      weldedVertices: welded.getAttribute('position').count,
      finalVertices: finalGeom.getAttribute('position').count,
      finalTriangles: finalGeom.getIndex() ? finalGeom.getIndex()!.count / 3 : finalGeom.getAttribute('position').count / 3
    })
    
    return finalGeom
    } catch (error) {
    console.warn(`Mesh repair failed for ${name}, using original:`, error)
    return geom
  }
}

// Remove isolated vertices that can cause non-manifold edges
function removeIsolatedVertices(geom: THREE.BufferGeometry): THREE.BufferGeometry {
  try {
    const positions = geom.getAttribute('position') as THREE.BufferAttribute
    const index = geom.getIndex()
    
    if (!index) return geom
    
    // Count vertex usage
    const vertexUsage = new Array(positions.count).fill(0)
    for (let i = 0; i < index.count; i++) {
      vertexUsage[index.getX(i)]++
    }
    
    // Find vertices used in at least 3 triangles (connected)
    const validVertices = new Set<number>()
    for (let i = 0; i < vertexUsage.length; i++) {
      if (vertexUsage[i] >= 3) {
        validVertices.add(i)
      }
    }
    
    if (validVertices.size === positions.count) {
      return geom // All vertices are valid
    }
    
    // Create new geometry with only valid vertices
    const newPositions: number[] = []
    const newIndices: number[] = []
    const vertexMap = new Map<number, number>()
    let newVertexIndex = 0
    
    // Map old vertex indices to new ones
    for (let i = 0; i < positions.count; i++) {
      if (validVertices.has(i)) {
        vertexMap.set(i, newVertexIndex)
        newPositions.push(positions.getX(i), positions.getY(i), positions.getZ(i))
        newVertexIndex++
      }
    }
    
    // Create new indices using only valid vertices
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i)
      const b = index.getX(i + 1)
      const c = index.getX(i + 2)
      
      if (validVertices.has(a) && validVertices.has(b) && validVertices.has(c)) {
        newIndices.push(vertexMap.get(a)!, vertexMap.get(b)!, vertexMap.get(c)!)
      }
    }
    
    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.BufferAttribute(new Float32Array(newPositions), 3))
    result.setIndex(newIndices)
    
    return result
  } catch (error) {
    console.warn('Failed to remove isolated vertices:', error)
    return geom
  }
}

export async function exportOBJ(parameters: KeychainParameters) {
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

  const size = parameters.textSize
  const spacing = parameters.textSize * parameters.lineSpacing
  const line1Shapes = parameters.line1 ? font.generateShapes(parameters.line1, size) : []
  const line2Shapes = parameters.line2 ? font.generateShapes(parameters.line2, size) : []

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
      g1.translate(-cx, (parameters.line2 ? spacing/2 : 0) - cy, parameters.borderHeight)
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
      g2.translate(-cx, -spacing/2 - cy, parameters.borderHeight)
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
    const dy = parameters.line2 ? spacing/2 : 0
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
    const dy = -spacing/2
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
  // Ring
  let ringGeom:THREE.BufferGeometry|null = null
  if (parameters.showRing) {
    const ringShape = new THREE.Shape()
    ringShape.moveTo(parameters.outerDiameter/2,0)
    ringShape.absarc(0,0,parameters.outerDiameter/2,0,Math.PI*2,false)
    const hole = new THREE.Path()
    hole.moveTo(parameters.innerDiameter/2,0)
    hole.absarc(0,0,parameters.innerDiameter/2,0,Math.PI*2,true)
    ringShape.holes.push(hole)
    ringGeom = new THREE.ExtrudeGeometry(ringShape,{
      depth: parameters.ringHeight,
      bevelEnabled: false,
      steps: 1
    })
    baseGeom.computeBoundingBox()
    const b=baseGeom.boundingBox!
    const baseW=b.max.x-b.min.x
    ringGeom.translate(-(baseW/2+parameters.outerDiameter/4)+parameters.ringX,(parameters.line2?spacing/2:0)+parameters.ringY,0)
  }

  // CSG union base + ring into a single watertight shell
  let baseMesh = new THREE.Mesh(baseGeom)
  if (ringGeom) {
    const ringMesh = new THREE.Mesh(ringGeom)
    baseMesh = CSG.union(baseMesh, ringMesh)
  }
  const basePart = repairMesh(baseMesh.geometry, 'base')

  // Build OBJ+MTL
  // Union all text geoms into one shell
  let textPart: THREE.BufferGeometry | null = null
  if (textGeoms.length) {
    let tm = new THREE.Mesh(textGeoms[0])
    for (let i=1;i<textGeoms.length;i++) {
      tm = CSG.union(tm, new THREE.Mesh(textGeoms[i]))
    }
    textPart = repairMesh(tm.geometry, 'text')
  }

  const partsForExport = [
    { name: 'base', geom: basePart, color: parameters.baseColor },
    ...(textPart ? [{ name: 'text', geom: textPart, color: parameters.twoColors ? parameters.textColor : parameters.baseColor }] : [])
  ]

  const { obj, mtl } = await buildOBJWithMTL(partsForExport)
  const zip = new (await import('jszip')).default()
  zip.file('keychain.obj', obj)
  zip.file('keychain.mtl', mtl)
  const blob = await zip.generateAsync({ type:'blob' })
  saveAs(blob, `keychain_${parameters.line1 || 'model'}.zip`)
}

async function buildOBJWithMTL(parts:{name:string,geom:THREE.BufferGeometry,color:string}[]) {
  let obj = 'mtllib keychain.mtl\n'
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