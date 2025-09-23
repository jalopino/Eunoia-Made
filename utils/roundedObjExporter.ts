import * as THREE from 'three'
import { KeychainParameters } from '@/types/keychain'
import { TTFLoader } from 'three-stdlib'
import { CSG } from 'three-csg-ts'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Fix Math function types
declare global {
  interface Math {
    sqrt(x: number): number
    max(...values: number[]): number
    min(...values: number[]): number
  }
}

// Advanced mesh repair (same as original OBJ exporter)
function repairMesh(geom: THREE.BufferGeometry, name: string): THREE.BufferGeometry {
  try {
    const nonIndexed = geom.index ? geom.toNonIndexed() : geom.clone()
    const positions = nonIndexed.getAttribute('position') as THREE.BufferAttribute
    
    // Remove degenerate triangles
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
      
      const abDist = Math.sqrt((ax-bx)**2 + (ay-by)**2 + (az-bz)**2)
      const bcDist = Math.sqrt((bx-cx)**2 + (by-cy)**2 + (bz-cz)**2)
      const caDist = Math.sqrt((cx-ax)**2 + (cy-ay)**2 + (cz-az)**2)
      
      if (abDist > DEGENERATE_TOLERANCE && 
          bcDist > DEGENERATE_TOLERANCE && 
          caDist > DEGENERATE_TOLERANCE) {
        goodTriangles.push(i, i+1, i+2)
      }
    }
    
    const cleaned = new THREE.BufferGeometry()
    const newPositions = new Float32Array(goodTriangles.length * 3)
    
    for (let i = 0; i < goodTriangles.length; i++) {
      const oldIdx = goodTriangles[i]
      newPositions[i*3] = positions.getX(oldIdx)
      newPositions[i*3+1] = positions.getY(oldIdx)
      newPositions[i*3+2] = positions.getZ(oldIdx)
    }
    
    cleaned.setAttribute('position', new THREE.BufferAttribute(newPositions, 3))
    
    const welded = BufferGeometryUtils.mergeVertices(cleaned, 0.005)
    welded.computeVertexNormals()
    
    console.log(`Mesh repair for ${name}:`, {
      originalVertices: positions.count,
      cleanedTriangles: goodTriangles.length / 3,
      weldedVertices: welded.getAttribute('position').count
    })
    
    return welded
  } catch (error) {
    console.warn(`Mesh repair failed for ${name}, using original:`, error)
    return geom
  }
}

function mergeBufferGeometriesFallback(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) return new THREE.BufferGeometry()
  if (geometries.length === 1) return geometries[0]
  
  try {
    return BufferGeometryUtils.mergeGeometries(geometries)
  } catch (error) {
    console.warn('BufferGeometryUtils.mergeGeometries failed, using fallback:', error)
    
    const merged = new THREE.BufferGeometry()
    const positions: number[] = []
    const indices: number[] = []
    let offset = 0
    
    geometries.forEach(g => {
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
}

async function buildOBJWithMTL(parts: {name: string, geom: THREE.BufferGeometry, color: string}[], mtlFileName = 'keychain.mtl') {
  let obj = `mtllib ${mtlFileName}\n`
  let mtl = ''
  const norm = (c: string) => c && c.startsWith('#') ? c : '#000000'
  const hexToRgb = (h: string) => ({ r: parseInt(h.slice(1,3),16)/255, g: parseInt(h.slice(3,5),16)/255, b: parseInt(h.slice(5,7),16)/255 })
  let vOffset = 0
  
  parts.forEach((p, i) => {
    const color = hexToRgb(norm(p.color))
    const matName = `mat_${p.name}`
    mtl += `newmtl ${matName}\nKd ${color.r.toFixed(4)} ${color.g.toFixed(4)} ${color.b.toFixed(4)}\n\n`
    
    const pos = p.geom.getAttribute('position') as THREE.BufferAttribute
    const idx = p.geom.getIndex()!
    
    if (!pos || !idx) {
      console.error(`Part ${p.name} missing position or index attribute!`)
      return
    }
    
    obj += `o ${p.name}\nusemtl ${matName}\n`
    
    for (let vi = 0; vi < pos.count; vi++) {
      obj += `v ${pos.getX(vi).toFixed(6)} ${pos.getY(vi).toFixed(6)} ${pos.getZ(vi).toFixed(6)}\n`
    }
    
    for (let fi = 0; fi < idx.count; fi += 3) {
      const a = idx.getX(fi)
      const b = idx.getX(fi+1)
      const c = idx.getX(fi+2)
      obj += `f ${vOffset+a+1} ${vOffset+b+1} ${vOffset+c+1}\n`
    }
    
    vOffset += pos.count
  })
  
  console.log('Final OBJ length:', obj.length, 'MTL length:', mtl.length)
  return { obj, mtl }
}

export async function exportRoundedKeychainOBJ(parameters: KeychainParameters, mtlFileName = 'keychain.mtl'): Promise<{ obj: string, mtl: string }> {
  // Use the same high-quality font loading as original OBJ exporter
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

  // Generate actual text geometry using font.generateShapes (same as original)
  const size = parameters.textSize
  const spacing = parameters.textSize * parameters.lineSpacing
  const line1Shapes = parameters.line1 ? font.generateShapes(parameters.line1, size) : []
  const line2Shapes = parameters.line2 ? font.generateShapes(parameters.line2, size) : []

  const textGeoms: THREE.BufferGeometry[] = []
  let measuredWidth = 0
  let measuredHeight = 0

  if (parameters.textHeight !== 0) {
    if (line1Shapes.length) {
      const g1 = new THREE.ExtrudeGeometry(line1Shapes, { 
        depth: Math.abs(parameters.textHeight), 
        bevelEnabled: false,
        curveSegments: 8 // Same quality as original
      })
      g1.computeBoundingBox()
      const bb = g1.boundingBox!
      const cx = (bb.min.x + bb.max.x) / 2
      const cy = (bb.min.y + bb.max.y) / 2
      g1.translate(-cx, (parameters.line2 ? spacing/2 : 0) - cy, parameters.borderHeight)
      textGeoms.push(g1)
      
      // Measure actual bounds
      measuredWidth = Math.max(measuredWidth, bb.max.x - bb.min.x)
      measuredHeight = Math.max(measuredHeight, bb.max.y - bb.min.y)
    }
    if (line2Shapes.length) {
      const g2 = new THREE.ExtrudeGeometry(line2Shapes, { 
        depth: Math.abs(parameters.textHeight), 
        bevelEnabled: false,
        curveSegments: 8 // Same quality as original
      })
      g2.computeBoundingBox()
      const bb = g2.boundingBox!
      const cx = (bb.min.x + bb.max.x) / 2
      const cy = (bb.min.y + bb.max.y) / 2
      g2.translate(-cx, -spacing/2 - cy, parameters.borderHeight)
      textGeoms.push(g2)
      
      // Measure actual bounds
      measuredWidth = Math.max(measuredWidth, bb.max.x - bb.min.x)
      measuredHeight = Math.max(measuredHeight, bb.max.y - bb.min.y)
    }
  }

  // Use measured dimensions for base creation (same as original)
  const padding = parameters.textSize * 0.2
  const textAreaWidth = measuredWidth + padding * 2
  const textAreaHeight = measuredHeight + padding * 2
  const outerWidth = textAreaWidth + parameters.borderThickness * 2
  const outerHeight = textAreaHeight + parameters.borderThickness * 2

  // Create base shape (full outer rounded rectangle) - same as original
  const baseShape = new THREE.Shape()
  const baseRadius = Math.min(parameters.borderThickness, outerWidth / 4, outerHeight / 4) * parameters.borderRoundedness
  
  baseShape.moveTo(-outerWidth/2 + baseRadius, -outerHeight/2)
  baseShape.lineTo(outerWidth/2 - baseRadius, -outerHeight/2)
  baseShape.quadraticCurveTo(outerWidth/2, -outerHeight/2, outerWidth/2, -outerHeight/2 + baseRadius)
  baseShape.lineTo(outerWidth/2, outerHeight/2 - baseRadius)
  baseShape.quadraticCurveTo(outerWidth/2, outerHeight/2, outerWidth/2 - baseRadius, outerHeight/2)
  baseShape.lineTo(-outerWidth/2 + baseRadius, outerHeight/2)
  baseShape.quadraticCurveTo(-outerWidth/2, outerHeight/2, -outerWidth/2, outerHeight/2 - baseRadius)
  baseShape.lineTo(-outerWidth/2, -outerHeight/2 + baseRadius)
  baseShape.quadraticCurveTo(-outerWidth/2, -outerHeight/2, -outerWidth/2 + baseRadius, -outerHeight/2)
  
  // Create border shape (outer - inner) - FIXED: Ensure minimum border thickness
  const borderShape = new THREE.Shape()
  const borderRadius = Math.min(parameters.borderThickness, outerWidth / 4, outerHeight / 4) * parameters.borderRoundedness
  
  borderShape.moveTo(-outerWidth/2 + borderRadius, -outerHeight/2)
  borderShape.lineTo(outerWidth/2 - borderRadius, -outerHeight/2)
  borderShape.quadraticCurveTo(outerWidth/2, -outerHeight/2, outerWidth/2, -outerHeight/2 + borderRadius)
  borderShape.lineTo(outerWidth/2, outerHeight/2 - borderRadius)
  borderShape.quadraticCurveTo(outerWidth/2, outerHeight/2, outerWidth/2 - borderRadius, outerHeight/2)
  borderShape.lineTo(-outerWidth/2 + borderRadius, outerHeight/2)
  borderShape.quadraticCurveTo(-outerWidth/2, outerHeight/2, -outerWidth/2, outerHeight/2 - borderRadius)
  borderShape.lineTo(-outerWidth/2, -outerHeight/2 + borderRadius)
  borderShape.quadraticCurveTo(-outerWidth/2, -outerHeight/2, -outerWidth/2 + borderRadius, -outerHeight/2)
  
  // Create inner hole for the text area - FIXED: Ensure proper border thickness
  const innerShape = new THREE.Path()
  const innerRadius = Math.min(parameters.borderThickness * 0.3, textAreaWidth / 6, textAreaHeight / 6) * parameters.borderRoundedness
  
  // CRITICAL FIX: Ensure inner hole is smaller than outer shape to create actual border
  // If borderThickness is too small, use a minimum effective border
  const effectiveBorderThickness = Math.max(parameters.borderThickness, 0.5) // Minimum 0.5 units
  const innerWidth = Math.max(textAreaWidth, outerWidth - effectiveBorderThickness * 2)
  const innerHeight = Math.max(textAreaHeight, outerHeight - effectiveBorderThickness * 2)
  
  // Ensure inner dimensions are actually smaller than outer
  const finalInnerWidth = Math.min(innerWidth, outerWidth - 1) // At least 1 unit smaller
  const finalInnerHeight = Math.min(innerHeight, outerHeight - 1) // At least 1 unit smaller
  
  innerShape.moveTo(-finalInnerWidth/2 + innerRadius, -finalInnerHeight/2)
  innerShape.lineTo(finalInnerWidth/2 - innerRadius, -finalInnerHeight/2)
  innerShape.quadraticCurveTo(finalInnerWidth/2, -finalInnerHeight/2, finalInnerWidth/2, -finalInnerHeight/2 + innerRadius)
  innerShape.lineTo(finalInnerWidth/2, finalInnerHeight/2 - innerRadius)
  innerShape.quadraticCurveTo(finalInnerWidth/2, finalInnerHeight/2, finalInnerWidth/2 - innerRadius, finalInnerHeight/2)
  innerShape.lineTo(-finalInnerWidth/2 + innerRadius, finalInnerHeight/2)
  innerShape.quadraticCurveTo(-finalInnerWidth/2, finalInnerHeight/2, -finalInnerWidth/2, finalInnerHeight/2 - innerRadius)
  innerShape.lineTo(-finalInnerWidth/2, -finalInnerHeight/2 + innerRadius)
  innerShape.quadraticCurveTo(-finalInnerWidth/2, -finalInnerHeight/2, -finalInnerWidth/2 + innerRadius, -finalInnerHeight/2)
  
  // Add inner hole to create border ring
  borderShape.holes.push(innerShape)
  
  console.log('Border shape dimensions:', {
    outerWidth,
    outerHeight,
    textAreaWidth,
    textAreaHeight,
    borderThickness: parameters.borderThickness,
    effectiveBorderThickness,
    finalInnerWidth,
    finalInnerHeight,
    borderRadius,
    innerRadius,
    hasHoles: borderShape.holes.length,
    borderWidth: outerWidth - finalInnerWidth,
    borderHeight: outerHeight - finalInnerHeight
  })
  
  // Create base geometry (lower level) - same as original
  const baseGeom = new THREE.ExtrudeGeometry(baseShape, {
    depth: parameters.borderHeight,
    bevelEnabled: false
  })
  
  // Create border geometry (higher level) - FIXED: Position above base
  const borderGeom = new THREE.ExtrudeGeometry(borderShape, {
    depth: Math.abs(parameters.textHeight),
    bevelEnabled: false
  })
  
  // CRITICAL FIX: Move border geometry ABOVE the base
  borderGeom.translate(0, 0, parameters.borderHeight)
  
  console.log('Border geometry created:', {
    hasPosition: !!borderGeom.getAttribute('position'),
    positionCount: borderGeom.getAttribute('position')?.count || 0,
    hasIndex: !!borderGeom.getIndex(),
    indexCount: borderGeom.getIndex()?.count || 0,
    borderThickness: parameters.borderThickness,
    textHeight: parameters.textHeight,
    borderZPosition: parameters.borderHeight
  })
  
  // FALLBACK: If border geometry is empty, create a simple border without holes
  let finalBorderGeom = borderGeom
  if (!borderGeom.getAttribute('position') || borderGeom.getAttribute('position').count === 0) {
    console.warn('Border geometry is empty, creating fallback border')
    
    // Create a simple border as a ring around the text area
    const fallbackBorderShape = new THREE.Shape()
    const fallbackRadius = Math.min(parameters.borderThickness, outerWidth / 4, outerHeight / 4) * parameters.borderRoundedness
    
    fallbackBorderShape.moveTo(-outerWidth/2 + fallbackRadius, -outerHeight/2)
    fallbackBorderShape.lineTo(outerWidth/2 - fallbackRadius, -outerHeight/2)
    fallbackBorderShape.quadraticCurveTo(outerWidth/2, -outerHeight/2, outerWidth/2, -outerHeight/2 + fallbackRadius)
    fallbackBorderShape.lineTo(outerWidth/2, outerHeight/2 - fallbackRadius)
    fallbackBorderShape.quadraticCurveTo(outerWidth/2, outerHeight/2, outerWidth/2 - fallbackRadius, outerHeight/2)
    fallbackBorderShape.lineTo(-outerWidth/2 + fallbackRadius, outerHeight/2)
    fallbackBorderShape.quadraticCurveTo(-outerWidth/2, outerHeight/2, -outerWidth/2, outerHeight/2 - fallbackRadius)
    fallbackBorderShape.lineTo(-outerWidth/2, -outerHeight/2 + fallbackRadius)
    fallbackBorderShape.quadraticCurveTo(-outerWidth/2, -outerHeight/2, -outerWidth/2 + fallbackRadius, -outerHeight/2)
    
    // Create inner hole with guaranteed smaller size
    const fallbackInnerShape = new THREE.Path()
    const fallbackInnerRadius = Math.min(parameters.borderThickness * 0.3, textAreaWidth / 6, textAreaHeight / 6) * parameters.borderRoundedness
    
    // Force inner hole to be significantly smaller
    const guaranteedInnerWidth = Math.max(textAreaWidth * 0.8, outerWidth * 0.6) // 60-80% of outer width
    const guaranteedInnerHeight = Math.max(textAreaHeight * 0.8, outerHeight * 0.6) // 60-80% of outer height
    
    fallbackInnerShape.moveTo(-guaranteedInnerWidth/2 + fallbackInnerRadius, -guaranteedInnerHeight/2)
    fallbackInnerShape.lineTo(guaranteedInnerWidth/2 - fallbackInnerRadius, -guaranteedInnerHeight/2)
    fallbackInnerShape.quadraticCurveTo(guaranteedInnerWidth/2, -guaranteedInnerHeight/2, guaranteedInnerWidth/2, -guaranteedInnerHeight/2 + fallbackInnerRadius)
    fallbackInnerShape.lineTo(guaranteedInnerWidth/2, guaranteedInnerHeight/2 - fallbackInnerRadius)
    fallbackInnerShape.quadraticCurveTo(guaranteedInnerWidth/2, guaranteedInnerHeight/2, guaranteedInnerWidth/2 - fallbackInnerRadius, guaranteedInnerHeight/2)
    fallbackInnerShape.lineTo(-guaranteedInnerWidth/2 + fallbackInnerRadius, guaranteedInnerHeight/2)
    fallbackInnerShape.quadraticCurveTo(-guaranteedInnerWidth/2, guaranteedInnerHeight/2, -guaranteedInnerWidth/2, guaranteedInnerHeight/2 - fallbackInnerRadius)
    fallbackInnerShape.lineTo(-guaranteedInnerWidth/2, -guaranteedInnerHeight/2 + fallbackInnerRadius)
    fallbackInnerShape.quadraticCurveTo(-guaranteedInnerWidth/2, -guaranteedInnerHeight/2, -guaranteedInnerWidth/2 + fallbackInnerRadius, -guaranteedInnerHeight/2)
    
    fallbackBorderShape.holes.push(fallbackInnerShape)
    
    finalBorderGeom = new THREE.ExtrudeGeometry(fallbackBorderShape, {
      depth: Math.abs(parameters.textHeight),
      bevelEnabled: false
    })
    
    // CRITICAL FIX: Move fallback border geometry ABOVE the base
    finalBorderGeom.translate(0, 0, parameters.borderHeight)
    
    console.log('Fallback border created:', {
      hasPosition: !!finalBorderGeom.getAttribute('position'),
      positionCount: finalBorderGeom.getAttribute('position')?.count || 0,
      guaranteedInnerWidth,
      guaranteedInnerHeight,
      borderZPosition: parameters.borderHeight
    })
  }

  // Create ring geometry - same as original
  let ringGeom: THREE.BufferGeometry | null = null
  if (parameters.showRing) {
    const ringShape = new THREE.Shape()
    ringShape.moveTo(parameters.outerDiameter/2, 0)
    ringShape.absarc(0, 0, parameters.outerDiameter/2, 0, Math.PI * 2, false)
    
    const hole = new THREE.Path()
    hole.moveTo(parameters.innerDiameter/2, 0)
    hole.absarc(0, 0, parameters.innerDiameter/2, 0, Math.PI * 2, true)
    ringShape.holes.push(hole)
    
    ringGeom = new THREE.ExtrudeGeometry(ringShape, {
      depth: parameters.ringHeight,
      bevelEnabled: false
    })

    // Calculate ring position - same as original
    const initialX = -(outerWidth/2 + parameters.outerDiameter/4)
    const firstLineY = parameters.line2 ? parameters.textSize * parameters.lineSpacing / 2 : 0
    ringGeom.translate(
      initialX + parameters.ringX,
      firstLineY + parameters.ringY,
      0
    )
  }

  // Export base and border as separate parts (KEYTONE has two-level design)
  const basePart = repairMesh(baseGeom, 'base')
  const borderPart = repairMesh(finalBorderGeom, 'border')
  
  console.log('Border part created:', {
    vertices: borderPart.getAttribute('position')?.count || 0,
    indices: borderPart.getIndex()?.count || 0
  })
  
  // Union ring with base if present
  let finalBasePart = basePart
  if (ringGeom) {
    const baseMesh = new THREE.Mesh(basePart)
    const ringMesh = new THREE.Mesh(ringGeom)
    const unionedMesh = CSG.union(baseMesh, ringMesh)
    finalBasePart = repairMesh(unionedMesh.geometry, 'base_with_ring')
  }

  // Union all text geoms into one shell
  let textPart: THREE.BufferGeometry | null = null
  if (textGeoms.length) {
    let tm = new THREE.Mesh(textGeoms[0])
    for (let i = 1; i < textGeoms.length; i++) {
      tm = CSG.union(tm, new THREE.Mesh(textGeoms[i]))
    }
    textPart = repairMesh(tm.geometry, 'text')
  }

  const partsForExport = [
    { name: 'base', geom: finalBasePart, color: parameters.baseColor },
    { name: 'border', geom: borderPart, color: parameters.twoColors ? parameters.textColor : parameters.baseColor },
    ...(textPart ? [{ name: 'text', geom: textPart, color: parameters.twoColors ? parameters.textColor : parameters.baseColor }] : [])
  ]

  const { obj, mtl } = await buildOBJWithMTL(partsForExport, mtlFileName)
  
  return { obj, mtl }
}
