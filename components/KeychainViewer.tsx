'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Center, Text, Text3D } from '@react-three/drei'
import LoadingOverlay from './LoadingOverlay'
import * as THREE from 'three'
import { KeychainParameters } from '@/types/keychain'
import { TTFLoader } from 'three-stdlib'
// @ts-ignore
import Offset from 'polygon-offset'

interface KeychainViewerProps {
  parameters: KeychainParameters
  commitId?: number
}

function KeychainMesh({ parameters, onBuildingChange, onProgressChange }: { parameters: KeychainParameters, onBuildingChange: (v: boolean) => void, onProgressChange: (v: number) => void }) {
  const meshRef = useRef<THREE.Group>(null)
  const [line1Bounds, setLine1Bounds] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [line2Bounds, setLine2Bounds] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [baseGeomState, setBaseGeomState] = useState<THREE.BufferGeometry | null>(null)
  const [textGeomState, setTextGeomState] = useState<THREE.BufferGeometry | null>(null)
  const [ringPosState, setRingPosState] = useState<[number, number, number]>([0, 0, 0])
  
  // Font factors from OpenSCAD code
  const getFontFactor = (font: string) => {
    const factors: { [key: string]: number } = {
      'Archivo Black': 0.39, 'Bangers': 0.27, 'Bungee': 0.47,
      'Changa One': 0.33, 'Bebas Neue': 0.25, 'Poppins': 0.38,
      'Pacifico': 0.3, 'Press Start 2P': 0.69, 'Audiowide': 0.41,
      'DynaPuff': 0.36, 'Arial': 0.45, 'Helvetica': 0.45,
      'Times': 0.5, 'Courier': 0.6, 'Georgia': 0.48,
      'Verdana': 0.42, 'Impact': 0.35, 'Comic Sans MS': 0.4
    }
    return factors[font] || 0.45
  }

  // Calculate text dimensions based on OpenSCAD logic
  const { textBounds, baseGeometry, ringGeometry, ringPosition } = useMemo(() => {
    const fontFactor = getFontFactor(parameters.font)
    const line1Width = parameters.line1.length * parameters.textSize * fontFactor
    const line2Width = parameters.line2 ? parameters.line2.length * parameters.textSize * fontFactor : 0
    const maxWidth = Math.max(line1Width, line2Width)
    
    // Create text shapes - simplified as rounded rectangles that represent text
    const createTextShape = (text: string, yOffset: number = 0) => {
      const width = text.length * parameters.textSize * fontFactor
      const height = parameters.textSize * 0.8
      const shape = new THREE.Shape()
      
      // Create rounded rectangle for text
      const r = height * 0.1
      shape.moveTo(-width/2 + r, -height/2 + yOffset)
      shape.lineTo(width/2 - r, -height/2 + yOffset)
      shape.quadraticCurveTo(width/2, -height/2 + yOffset, width/2, -height/2 + r + yOffset)
      shape.lineTo(width/2, height/2 - r + yOffset)
      shape.quadraticCurveTo(width/2, height/2 + yOffset, width/2 - r, height/2 + yOffset)
      shape.lineTo(-width/2 + r, height/2 + yOffset)
      shape.quadraticCurveTo(-width/2, height/2 + yOffset, -width/2, height/2 - r + yOffset)
      shape.lineTo(-width/2, -height/2 + r + yOffset)
      shape.quadraticCurveTo(-width/2, -height/2 + yOffset, -width/2 + r, -height/2 + yOffset)
      
      return shape
    }

    // Create combined text shape
    let textShape: THREE.Shape
    if (parameters.line2) {
      // Two lines - create a combined shape that encompasses both
      const spacing = parameters.textSize * parameters.lineSpacing
      const totalHeight = parameters.textSize * 0.8 * 2 + spacing
      const combinedWidth = maxWidth
      
      const combinedShape = new THREE.Shape()
      const r = totalHeight * 0.05
      
      combinedShape.moveTo(-combinedWidth/2 + r, -totalHeight/2)
      combinedShape.lineTo(combinedWidth/2 - r, -totalHeight/2)
      combinedShape.quadraticCurveTo(combinedWidth/2, -totalHeight/2, combinedWidth/2, -totalHeight/2 + r)
      combinedShape.lineTo(combinedWidth/2, totalHeight/2 - r)
      combinedShape.quadraticCurveTo(combinedWidth/2, totalHeight/2, combinedWidth/2 - r, totalHeight/2)
      combinedShape.lineTo(-combinedWidth/2 + r, totalHeight/2)
      combinedShape.quadraticCurveTo(-combinedWidth/2, totalHeight/2, -combinedWidth/2, totalHeight/2 - r)
      combinedShape.lineTo(-combinedWidth/2, -totalHeight/2 + r)
      combinedShape.quadraticCurveTo(-combinedWidth/2, -totalHeight/2, -combinedWidth/2 + r, -totalHeight/2)
      
      textShape = combinedShape
    } else {
      textShape = createTextShape(parameters.line1)
    }

    // Approximate text bounds (we will refine using onSync from Text later)
    const textGeomForBounds = new THREE.ExtrudeGeometry(textShape, {
      depth: 1,
      bevelEnabled: false
    })

    // Create base with border (minkowski-like effect)
    // This creates a border around the text shape
    const textBounds = new THREE.Box3().setFromObject(new THREE.Mesh(textGeomForBounds))
    const textWidth = textBounds.max.x - textBounds.min.x
    const textHeight = textBounds.max.y - textBounds.min.y
    
    // If we have measured bounds from actual rendered text, prefer them
    const measuredWidthLine1 = line1Bounds.width
    const measuredWidthLine2 = parameters.line2 ? line2Bounds.width : 0
    const measuredWidth = Math.max(measuredWidthLine1, measuredWidthLine2)

    const measuredHeightLine1 = line1Bounds.height
    const measuredHeightLine2 = parameters.line2 ? line2Bounds.height : 0
    const lineGap = parameters.line2 ? (parameters.fontSize * parameters.lineSpacing) : 0
    const measuredTotalHeight = parameters.line2
      ? (measuredHeightLine1 + measuredHeightLine2 + lineGap)
      : measuredHeightLine1

    const finalWidth = measuredWidth > 0 ? measuredWidth : textWidth
    const finalHeight = measuredTotalHeight > 0 ? measuredTotalHeight : textHeight

    const baseWidth = finalWidth + parameters.borderThickness * 2
    const baseHeight = finalHeight + parameters.borderThickness * 2
    
    const baseShape = new THREE.Shape()
    const radius = parameters.borderThickness
    
    // Create rounded rectangle base that encompasses text + border
    baseShape.moveTo(-baseWidth/2 + radius, -baseHeight/2)
    baseShape.lineTo(baseWidth/2 - radius, -baseHeight/2)
    baseShape.quadraticCurveTo(baseWidth/2, -baseHeight/2, baseWidth/2, -baseHeight/2 + radius)
    baseShape.lineTo(baseWidth/2, baseHeight/2 - radius)
    baseShape.quadraticCurveTo(baseWidth/2, baseHeight/2, baseWidth/2 - radius, baseHeight/2)
    baseShape.lineTo(-baseWidth/2 + radius, baseHeight/2)
    baseShape.quadraticCurveTo(-baseWidth/2, baseHeight/2, -baseWidth/2, baseHeight/2 - radius)
    baseShape.lineTo(-baseWidth/2, -baseHeight/2 + radius)
    baseShape.quadraticCurveTo(-baseWidth/2, -baseHeight/2, -baseWidth/2 + radius, -baseHeight/2)
    
    const baseGeom = new THREE.ExtrudeGeometry(baseShape, {
      depth: parameters.borderHeight,
      bevelEnabled: false
    })

    // Create ring geometry
    let ringGeom = null
    let ringPos: [number, number, number] = [0, 0, 0]
    
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

      // Calculate ring position based on OpenSCAD logic
      const initialX = -(finalWidth + parameters.borderThickness + parameters.outerDiameter/4)
      const firstLineY = parameters.line2 ? parameters.textSize * parameters.lineSpacing / 2 : 0
      ringPos = [
        initialX + parameters.ringX,
        firstLineY + parameters.textOffsetY + parameters.ringY,
        0
      ]
    }

    return {
      textBounds,
      baseGeometry: baseGeom,
      ringGeometry: ringGeom,
      ringPosition: ringPos
    }
  }, [parameters, line1Bounds, line2Bounds])

  // Build a glyph-based base that hugs the text using TTF font if available
  useEffect(() => {
    let cancelled = false
    async function buildGlyphBase() {
      try {
        onBuildingChange(true)
        onProgressChange(10) // Start from 10% since scene is initialized
        const { FontLoader } = await import('three/examples/jsm/loaders/FontLoader.js')
        let font: any
        const url = parameters.fontUrl?.toLowerCase()
        if (url) {
          const fl = new FontLoader()
          if (url.endsWith('.typeface.json')) {
            // Load pre-generated typeface JSON directly
            const json = await fetch(parameters.fontUrl!).then(r => r.json())
            font = fl.parse(json)
            onProgressChange(20)
          } else if (/\.(ttf|otf)$/i.test(url)) {
            // Load TTF/OTF, then parse to font
            const ttfJson = await new TTFLoader().loadAsync(parameters.fontUrl!)
            onProgressChange(20)
            font = fl.parse(ttfJson)
            onProgressChange(30)
          } else {
            // Unknown format: fallback to bundled helvetiker
            // Try first detected typeface.json via API; otherwise abort without fetching
            try {
              const res = await fetch('/api/fonts')
              const data = await res.json()
              const first = data?.fonts?.[0]?.fileUrl as string | undefined
              if (first) {
                const json = await fetch(first).then(r => r.json())
                font = fl.parse(json)
              } else {
                if (!cancelled) {
                  setBaseGeomState(null)
                  setTextGeomState(null)
                }
                return
              }
            } catch {
              if (!cancelled) {
                setBaseGeomState(null)
                setTextGeomState(null)
              }
              return
            }
          }
        } else {
          // No explicit URL: try to auto-pick the first detected typeface.json
          const fl = new FontLoader()
          try {
            const res = await fetch('/api/fonts')
            const data = await res.json()
            const first = data?.fonts?.[0]?.fileUrl as string | undefined
            if (first && first.toLowerCase().endsWith('.typeface.json')) {
              const json = await fetch(first).then(r => r.json())
              font = fl.parse(json)
            } else {
              // Nothing to load yet
              if (!cancelled) {
                setBaseGeomState(null)
                setTextGeomState(null)
              }
              onBuildingChange(false)
              return
            }
          } catch {
            if (!cancelled) {
              setBaseGeomState(null)
              setTextGeomState(null)
            }
            onBuildingChange(false)
            return
          }
        }

        // Generate shapes for lines (no in-place translate on shapes)
        const isAdminMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pass') === 'eunoia'
        const line1Size = isAdminMode && parameters.fontSize !== parameters.textSize ? parameters.fontSize : parameters.textSize
        // Only use line2FontSize if admin mode is enabled and it's different from textSize
        const line2Size = isAdminMode && parameters.line2FontSize !== parameters.textSize ? parameters.line2FontSize : parameters.textSize
        const spacing = line1Size * parameters.lineSpacing
        onProgressChange(40)
        const line1Shapes = parameters.line1 ? font.generateShapes(parameters.line1, line1Size) : []
        const line2Shapes = parameters.line2 ? font.generateShapes(parameters.line2, line2Size) : []
        onProgressChange(50)

        // Build 3D text geometry per line and apply offsets on the geometry
        const textLineGeoms: THREE.BufferGeometry[] = []
        if (line1Shapes.length) {
          const g1 = new THREE.ExtrudeGeometry(line1Shapes, { depth: Math.abs(parameters.textHeight), bevelEnabled: false })
          g1.computeBoundingBox()
          const bb1 = g1.boundingBox
          const cx1 = bb1 ? (bb1.min.x + bb1.max.x) / 2 : 0
          const cy1 = bb1 ? (bb1.min.y + bb1.max.y) / 2 : 0
          g1.translate(-cx1, (parameters.line2 ? spacing / 2 : 0) - cy1 + parameters.textOffsetY, 0)
          textLineGeoms.push(g1)
        }
        if (line2Shapes.length) {
          const g2 = new THREE.ExtrudeGeometry(line2Shapes, { depth: Math.abs(parameters.textHeight), bevelEnabled: false })
          g2.computeBoundingBox()
          const bb2 = g2.boundingBox
          const cx2 = bb2 ? (bb2.min.x + bb2.max.x) / 2 : 0
          const cy2 = bb2 ? (bb2.min.y + bb2.max.y) / 2 : 0
          g2.translate(-cx2, -spacing / 2 - cy2 + parameters.textOffsetY, 0)
          textLineGeoms.push(g2)
        }
        // Merge text geometry if height is non-zero
        if (parameters.textHeight !== 0 && textLineGeoms.length) {
          const mergedText = mergeBufferGeometriesFallback(textLineGeoms)
          if (!cancelled) setTextGeomState(mergedText)
        } else {
          if (!cancelled) setTextGeomState(null)
        }

        if (!line1Shapes.length && !line2Shapes.length) {
          setBaseGeomState(null)
          setTextGeomState(null)
          return
        }

        // Prepare translated contours for union/offset with separate border settings
        const SCALE = 1000
        const subjectPaths: any[] = []
        const line1Paths: any[] = []
        const line2Paths: any[] = []
        if (line1Shapes.length) {
          const g1tmp = new THREE.ShapeGeometry(line1Shapes)
          g1tmp.computeBoundingBox()
          const bb1s = g1tmp.boundingBox
          const cx1s = bb1s ? (bb1s.min.x + bb1s.max.x) / 2 : 0
          const cy1s = bb1s ? (bb1s.min.y + bb1s.max.y) / 2 : 0
          const dy1s = (parameters.line2 ? spacing / 2 : 0) + parameters.textOffsetY
          line1Shapes.forEach((sh: THREE.Shape) => {
            const outer = sh.getPoints(64).map(p => ({ X: Math.round((p.x - cx1s) * SCALE), Y: Math.round((p.y - cy1s + dy1s) * SCALE) }))
            if (outer.length > 2) {
              subjectPaths.push(outer)
              line1Paths.push(outer)
            }
            if ((sh as any).holes && (sh as any).holes.length) {
              ;(sh as any).holes.forEach((h: THREE.Path) => {
                const pts = h.getPoints(64).map(p => ({ X: Math.round((p.x - cx1s) * SCALE), Y: Math.round((p.y - cy1s + dy1s) * SCALE) }))
                if (pts.length > 2) {
                  subjectPaths.push(pts)
                  line1Paths.push(pts)
                }
              })
            }
          })
        }
        if (line2Shapes.length) {
          const g2tmp = new THREE.ShapeGeometry(line2Shapes)
          g2tmp.computeBoundingBox()
          const bb2s = g2tmp.boundingBox
          const cx2s = bb2s ? (bb2s.min.x + bb2s.max.x) / 2 : 0
          const cy2s = bb2s ? (bb2s.min.y + bb2s.max.y) / 2 : 0
          const dy2s = -spacing / 2 + parameters.textOffsetY
          line2Shapes.forEach((sh: THREE.Shape) => {
            const outer = sh.getPoints(64).map(p => ({ X: Math.round((p.x - cx2s) * SCALE), Y: Math.round((p.y - cy2s + dy2s) * SCALE) }))
            if (outer.length > 2) {
              subjectPaths.push(outer)
              line2Paths.push(outer)
            }
            if ((sh as any).holes && (sh as any).holes.length) {
              ;(sh as any).holes.forEach((h: THREE.Path) => {
                const pts = h.getPoints(64).map(p => ({ X: Math.round((p.x - cx2s) * SCALE), Y: Math.round((p.y - cy2s + dy2s) * SCALE) }))
                if (pts.length > 2) {
                  subjectPaths.push(pts)
                  line2Paths.push(pts)
                }
              })
            }
          })
        }

        // Build base by offsetting glyph outlines so it hugs the text (Minkowski-like)
        onProgressChange(70)
        const { default: ClipperLib } = await import('clipper-lib')

        // Create separate borders for each line
        const allBorderShapes: THREE.Shape[] = []
        
        // Process line 1 with its specific border settings
        if (line1Paths.length > 0) {
          console.log('KeychainViewer: Processing line 1 with border thickness:', parameters.line1BorderThickness, 'roundedness:', parameters.line1BorderRoundedness)
          const clipper1 = new ClipperLib.Clipper()
          clipper1.AddPaths(line1Paths, ClipperLib.PolyType.ptSubject, true)
          const union1: any[] = []
          clipper1.Execute(
            ClipperLib.ClipType.ctUnion,
            union1,
            ClipperLib.PolyFillType.pftNonZero,
            ClipperLib.PolyFillType.pftNonZero
          )

          const co1 = new ClipperLib.ClipperOffset(parameters.line1BorderRoundedness * 2, parameters.line1BorderRoundedness * 2)
          co1.AddPaths(union1, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon)
          const offsetSolution1: any[] = []
          co1.Execute(offsetSolution1, Math.round(parameters.line1BorderThickness * SCALE))

          offsetSolution1.forEach((path: any[]) => {
            const shape = new THREE.Shape()
            path.forEach((pt: any, i: number) => {
              const x = pt.X / SCALE
              const y = pt.Y / SCALE
              if (i === 0) shape.moveTo(x, y)
              else shape.lineTo(x, y)
            })
            shape.closePath()
            allBorderShapes.push(shape)
          })
        }

        // Process line 2 with its specific border settings
        if (line2Paths.length > 0) {
          console.log('KeychainViewer: Processing line 2 with border thickness:', parameters.line2BorderThickness, 'roundedness:', parameters.line2BorderRoundedness)
          const clipper2 = new ClipperLib.Clipper()
          clipper2.AddPaths(line2Paths, ClipperLib.PolyType.ptSubject, true)
          const union2: any[] = []
          clipper2.Execute(
            ClipperLib.ClipType.ctUnion,
            union2,
            ClipperLib.PolyFillType.pftNonZero,
            ClipperLib.PolyFillType.pftNonZero
          )

          const co2 = new ClipperLib.ClipperOffset(parameters.line2BorderRoundedness * 2, parameters.line2BorderRoundedness * 2)
          co2.AddPaths(union2, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon)
          const offsetSolution2: any[] = []
          co2.Execute(offsetSolution2, Math.round(parameters.line2BorderThickness * SCALE))

          offsetSolution2.forEach((path: any[]) => {
            const shape = new THREE.Shape()
            path.forEach((pt: any, i: number) => {
              const x = pt.X / SCALE
              const y = pt.Y / SCALE
              if (i === 0) shape.moveTo(x, y)
              else shape.lineTo(x, y)
            })
            shape.closePath()
            allBorderShapes.push(shape)
          })
        }

        // Define max values for fallback
        const maxBorderThickness = Math.max(parameters.line1BorderThickness, parameters.line2BorderThickness)
        const maxBorderRoundedness = Math.max(parameters.line1BorderRoundedness, parameters.line2BorderRoundedness)

        // If no separate borders were created, fall back to global border
        if (allBorderShapes.length === 0) {
          console.log('KeychainViewer: No separate borders created, using fallback with max thickness:', maxBorderThickness, 'max roundedness:', maxBorderRoundedness)
          const clipper = new ClipperLib.Clipper()
          clipper.AddPaths(subjectPaths, ClipperLib.PolyType.ptSubject, true)
          const union: any[] = []
          clipper.Execute(
            ClipperLib.ClipType.ctUnion,
            union,
            ClipperLib.PolyFillType.pftNonZero,
            ClipperLib.PolyFillType.pftNonZero
          )

          const co = new ClipperLib.ClipperOffset(maxBorderRoundedness * 2, maxBorderRoundedness * 2)
          co.AddPaths(union, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon)
          const offsetSolution: any[] = []
          co.Execute(offsetSolution, Math.round(maxBorderThickness * SCALE))

          offsetSolution.forEach((path: any[]) => {
            const shape = new THREE.Shape()
            path.forEach((pt: any, i: number) => {
              const x = pt.X / SCALE
              const y = pt.Y / SCALE
              if (i === 0) shape.moveTo(x, y)
              else shape.lineTo(x, y)
            })
            shape.closePath()
            allBorderShapes.push(shape)
          })
        }
        
        if (allBorderShapes.length === 0) {
          setBaseGeomState(null)
          onBuildingChange(false)
          return
        }
        const baseGeoms: THREE.BufferGeometry[] = []
        allBorderShapes.forEach(os => {
          const g = new THREE.ExtrudeGeometry(os, { depth: parameters.borderHeight, bevelEnabled: false })
          baseGeoms.push(g)
        })
        const mergedBase = mergeBufferGeometriesFallback(baseGeoms)
        // Center base like we centered text
        mergedBase.computeBoundingBox()
        const bbb = mergedBase.boundingBox
        if (bbb) {
          const cx = (bbb.min.x + bbb.max.x) / 2
          const cy = (bbb.min.y + bbb.max.y) / 2
          mergedBase.translate(-cx, -cy, 0)
          const baseWidth = bbb.max.x - bbb.min.x
          const firstLineY = parameters.line2 ? parameters.textSize * parameters.lineSpacing / 2 : 0
          if (!cancelled) setRingPosState([-(baseWidth / 2 + parameters.outerDiameter / 4) + parameters.ringX, firstLineY + parameters.ringY, 0])
        }
        if (!cancelled) {
          setBaseGeomState(mergedBase)
          onProgressChange(100)
        }
      } catch (e) {
        console.error('Glyph base build failed:', e)
        if (!cancelled) {
          setBaseGeomState(null)
          setTextGeomState(null)
        }
      }
      finally {
        if (!cancelled) onBuildingChange(false)
      }
    }
    buildGlyphBase()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    parameters.fontUrl,
    parameters.line1,
    parameters.line2,
    parameters.textSize,
    parameters.lineSpacing,
    parameters.borderHeight,
    parameters.borderThickness,
    parameters.borderRoundedness,
    parameters.advancedBorderMode,
    parameters.line1BorderThickness,
    parameters.line1BorderRoundedness,
    parameters.line2BorderThickness,
    parameters.line2BorderRoundedness,
    parameters.ringX,
    parameters.ringY,
    parameters.outerDiameter,
  ])

  // Fallback merge if BufferGeometryUtils is not present
  function mergeBufferGeometriesFallback(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
    const merged = new THREE.BufferGeometry()
    const positions: number[] = []
    const indices: number[] = []
    let indexOffset = 0
    geoms.forEach(g => {
      const pos = g.getAttribute('position') as THREE.BufferAttribute
      const idx = g.getIndex()
      for (let i = 0; i < pos.array.length; i++) positions.push((pos.array as any)[i])
      if (idx) {
        for (let i = 0; i < idx.array.length; i++) indices.push((idx.array as any)[i] + indexOffset)
      } else {
        // generate sequential indices
        for (let i = 0; i < pos.count; i += 3) {
          indices.push(indexOffset + i, indexOffset + i + 1, indexOffset + i + 2)
        }
      }
      indexOffset += pos.count
    })
    merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    merged.setIndex(indices)
    merged.computeVertexNormals()
    return merged
  }

  const baseColor = parameters.twoColors ? parameters.baseColor : parameters.baseColor
  const textColor = parameters.twoColors ? parameters.textColor : parameters.baseColor

  return (
    <group ref={meshRef}>
      {/* Base with proper border around text */}
      <mesh geometry={baseGeomState || baseGeometry} position={[0, 0, 0]}>
      <meshStandardMaterial 
          color={baseColor} 
          roughness={0.2}
          metalness={0.1}
          envMapIntensity={0.8}
        />
      </mesh>

      {/* Raised or engraved 3D text from glyphs */}
      {parameters.textHeight !== 0 && textGeomState && (
        <mesh
          geometry={textGeomState}
          position={[0, 0, parameters.textHeight > 0 ? parameters.borderHeight : Math.max(0, parameters.borderHeight - Math.abs(parameters.textHeight))]}
        >
          <meshStandardMaterial color={textColor} />
        </mesh>
      )}

      {/* Fallback: Text3D using helvetiker if glyph text failed */}
      {parameters.textHeight !== 0 && !textGeomState && (
        <Center position={[0, 0, parameters.borderHeight]}>
          {parameters.line2 ? (
            <>
              <Text3D font={parameters.fontUrl || '/fonts/Borel.typeface.json'} size={parameters.fontSize} height={Math.abs(parameters.textHeight)} curveSegments={8} bevelEnabled={false} position={[0, parameters.fontSize * parameters.lineSpacing / 4, 0]}>
                {parameters.line1}
                <meshStandardMaterial color={textColor} />
              </Text3D>
              <Text3D font={parameters.fontUrl || '/fonts/Borel.typeface.json'} size={parameters.line2FontSize} height={Math.abs(parameters.textHeight)} curveSegments={8} bevelEnabled={false} position={[0, -parameters.fontSize * parameters.lineSpacing / 4, 0]}>
                {parameters.line2}
                <meshStandardMaterial color={textColor} />
              </Text3D>
            </>
          ) : (
            <Text3D font={parameters.fontUrl || '/fonts/Borel.typeface.json'} size={parameters.fontSize} height={Math.abs(parameters.textHeight)} curveSegments={8} bevelEnabled={false}>
              {parameters.line1}
              <meshStandardMaterial color={textColor} />
            </Text3D>
          )}
        </Center>
      )}

      {/* Remove 2D overlay and block fallback to ensure only 3D text renders */}

      {/* Ring */}
      {parameters.showRing && ringGeometry && (
        <mesh geometry={ringGeometry} position={baseGeomState ? ringPosState : ringPosition}>
          <meshStandardMaterial color={baseColor} />
        </mesh>
      )}
    </group>
  )
}

function Scene({ parameters, onBuildingChange, onProgressChange }: { parameters: KeychainParameters, onBuildingChange: (v: boolean) => void, onProgressChange: (v: number) => void }) {
  return (
    <>
      {/* Enhanced Table Lighting */}
      {/* Main ambient light for overall illumination */}
      <ambientLight intensity={0.7} color="#ffffff" />
      
      {/* Warm ambient fill light for table warmth */}
      <ambientLight intensity={0.3} color="#fff8e1" />
      
      {/* Main directional light from top-right */}
      <directionalLight 
        position={[15, 20, 10]} 
        intensity={1.0} 
        color="#ffffff"
        castShadow
      />
      
      {/* Secondary directional light from top-left */}
      <directionalLight 
        position={[-15, 20, 10]} 
        intensity={0.6} 
        color="#ffffff"
      />
      
      {/* Rim lighting from behind for edge definition */}
      <directionalLight 
        position={[0, 10, -15]} 
        intensity={0.5} 
        color="#e3f2fd"
      />
      
      {/* Fill light from bottom for table underside */}
      <directionalLight 
        position={[0, -15, 5]} 
        intensity={0.3} 
        color="#f3e5f5"
      />
      
      {/* Accent point light for keychain highlights */}
      <pointLight 
        position={[8, 15, 8]} 
        intensity={0.5} 
        color="#fff3e0"
        distance={50}
      />

      {/* Bed Grid at Z=0 */}
      <gridHelper args={[200, 40, '#e0e0e0', '#f0f0f0']} position={[0, 0, 0]} />

      {/* Keychain - XY text on XZ bed; rotate 180° around Z */}
      <group rotation={[-Math.PI / 2, 0, Math.PI]} position={[0, 0.5, 0]}>
        <KeychainMesh parameters={parameters} onBuildingChange={onBuildingChange} onProgressChange={onProgressChange} />
      </group>
    </>
  )
}

export default function KeychainViewer({ parameters, commitId = 0 }: KeychainViewerProps) {
  const [isBuilding, setIsBuilding] = useState(true) // Start with loading state
  const [buildProgress, setBuildProgress] = useState(0)
  const [isSceneReady, setIsSceneReady] = useState(false)
  // Effect to initialize scene after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSceneReady(true)
      setBuildProgress(10) // Initial progress for scene setup
    }, 100) // Small delay to ensure loading shows first
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-fit">
      <div className={`relative h-[calc(100vh-200px)] min-h-[400px] transition-filter duration-150 ${isBuilding ? '' : ''}`}>
        <Canvas
          key={commitId}
          camera={{ position: [0, 100, 0], fov: 60 }}
          frameloop={isBuilding ? 'never' : 'always'}
          shadows
        >
          {isSceneReady && (
            <Scene parameters={parameters} onBuildingChange={setIsBuilding} onProgressChange={setBuildProgress} />
          )}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={30}
            maxDistance={300}
            target={[0, 0, 5]}
          />
        </Canvas>

        <LoadingOverlay isLoading={isBuilding} progress={buildProgress} />
      </div>
      
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center font-bold">
          Click and drag to rotate, zoom, and pan the 3D model
        </p>
      </div>
    </div>
  )
}
