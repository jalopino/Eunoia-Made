'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text3D, Center } from '@react-three/drei'
import * as THREE from 'three'
import { KeychainParameters, roundedDefaultParameters, defaultParameters } from '@/types/keychain'
import { TTFLoader } from 'three-stdlib'

// Simple caching - just prevent regeneration of identical previews
const geometryCache = new Map<string, {
  baseGeom?: THREE.BufferGeometry | null
  textGeom?: THREE.BufferGeometry | null
  ringGeom?: THREE.BufferGeometry | null
  ringPos?: [number, number, number]
  roundedBaseGeom?: THREE.BufferGeometry | null
  roundedBorderGeom?: THREE.BufferGeometry | null
}>()

// Font cache to prevent reloading fonts
const fontCache = new Map<string, any>()

// Cache cleanup function to prevent memory leaks
const cleanupCache = () => {
  // Limit cache size to prevent memory issues
  if (geometryCache.size > 50) {
    const entries = Array.from(geometryCache.entries())
    // Keep only the most recent 25 entries
    geometryCache.clear()
    entries.slice(-25).forEach(([key, value]) => {
      geometryCache.set(key, value)
    })
  }
}

interface KeychainPreviewProps {
  type: 'regular' | 'rounded'
  parameters?: KeychainParameters
  className?: string
}

function PreviewKeychainMesh({ type, parameters, onLoadingChange, onProgressChange }: { type: 'regular' | 'rounded', parameters?: KeychainParameters, onLoadingChange: (loading: boolean) => void, onProgressChange: (progress: number) => void }) {
  const meshRef = useRef<THREE.Group>(null)
  const [baseGeomState, setBaseGeomState] = useState<THREE.BufferGeometry | null>(null)
  const [textGeomState, setTextGeomState] = useState<THREE.BufferGeometry | null>(null)
  const [ringPosState, setRingPosState] = useState<[number, number, number]>([0, 0, 0])
  const [ringGeomState, setRingGeomState] = useState<THREE.BufferGeometry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  
  // Use the provided parameters or fall back to defaults
  const keychainParameters: KeychainParameters = parameters || (type === 'rounded' ? roundedDefaultParameters : defaultParameters)
  
  // For rounded keychains, we need separate base and border geometries
  const [roundedBaseGeom, setRoundedBaseGeom] = useState<THREE.BufferGeometry | null>(null)
  const [roundedBorderGeom, setRoundedBorderGeom] = useState<THREE.BufferGeometry | null>(null)

  // Create cache key from parameters - more stable serialization
  const cacheKey = useMemo(() => {
    const sortedParams = {
      type,
      line1: keychainParameters.line1,
      line2: keychainParameters.line2,
      font: keychainParameters.font,
      fontUrl: keychainParameters.fontUrl,
      textHeight: keychainParameters.textHeight,
      textSize: keychainParameters.textSize,
      lineSpacing: keychainParameters.lineSpacing,
      textOffsetY: keychainParameters.textOffsetY,
      borderThickness: keychainParameters.borderThickness,
      borderHeight: keychainParameters.borderHeight,
      borderRoundedness: keychainParameters.borderRoundedness,
      showRing: keychainParameters.showRing,
      outerDiameter: keychainParameters.outerDiameter,
      innerDiameter: keychainParameters.innerDiameter,
      ringHeight: keychainParameters.ringHeight,
      ringX: keychainParameters.ringX,
      ringY: keychainParameters.ringY,
      twoColors: keychainParameters.twoColors,
      baseColor: keychainParameters.baseColor,
      textColor: keychainParameters.textColor
    }
    return `${type}-${JSON.stringify(sortedParams)}`
  }, [type, keychainParameters])

  
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

  // Build geometry - different logic for regular vs rounded
  useEffect(() => {
    let cancelled = false
    
    // Check cache first
    const cached = geometryCache.get(cacheKey)
    if (cached) {
      console.log('Using cached geometry for:', cacheKey)
      setBaseGeomState(cached.baseGeom || null)
      setTextGeomState(cached.textGeom || null)
      setRingGeomState(cached.ringGeom || null)
      setRingPosState(cached.ringPos || [0, 0, 0])
      setRoundedBaseGeom(cached.roundedBaseGeom || null)
      setRoundedBorderGeom(cached.roundedBorderGeom || null)
      setIsLoading(false)
      onLoadingChange(false)
      return
    }
    
    console.log('No cached geometry found for:', cacheKey, 'Generating new...')
    
    async function buildGeometry() {
      try {
        setIsLoading(true)
        onLoadingChange(true)
        setProgress(10)
        onProgressChange(10)
        
        if (type === 'rounded') {
          // Use rounded keychain logic (separate base and border)
          await buildRoundedGeometry()
        } else {
          // Use regular keychain logic (ClipperLib)
          await buildRegularGeometry()
        }
        
        if (!cancelled) {
          setProgress(100)
          onProgressChange(100)
          setTimeout(() => {
            setIsLoading(false)
            onLoadingChange(false)
          }, 100) // Reduced delay for faster preview
        }
      } catch (e) {
        console.error('Geometry build failed:', e)
        if (!cancelled) {
          setBaseGeomState(null)
          setTextGeomState(null)
          setRoundedBaseGeom(null)
          setRoundedBorderGeom(null)
          setIsLoading(false)
          onLoadingChange(false)
        }
      }
    }

    async function buildRoundedGeometry() {
      setProgress(20)
      onProgressChange(20)
      
      // Load font with caching
      let font: any
      const fontKey = keychainParameters.fontUrl || 'default'
      
      if (fontCache.has(fontKey)) {
        font = fontCache.get(fontKey)
        console.log('Using cached font:', fontKey)
      } else {
        console.log('Loading font:', fontKey)
        const { FontLoader } = await import('three/examples/jsm/loaders/FontLoader.js')
      const url = keychainParameters.fontUrl?.toLowerCase()
      
      if (url) {
        const fl = new FontLoader()
        if (url.endsWith('.typeface.json')) {
          const json = await fetch(keychainParameters.fontUrl!).then(r => r.json())
          font = fl.parse(json)
        } else if (/\.(ttf|otf)$/i.test(url)) {
          const ttfJson = await new TTFLoader().loadAsync(keychainParameters.fontUrl!)
          font = fl.parse(ttfJson)
        } else {
          // Fallback to bundled font
          try {
            const res = await fetch('/api/fonts')
            const data = await res.json()
            const first = data?.fonts?.[0]?.fileUrl as string | undefined
            if (first) {
              const json = await fetch(first).then(r => r.json())
              font = fl.parse(json)
            } else {
              if (!cancelled) {
                setTextGeomState(null)
              }
              return
            }
          } catch {
            if (!cancelled) {
              setTextGeomState(null)
            }
            return
          }
        }
      } else {
        // Auto-pick first detected font
        const fl = new FontLoader()
        try {
          const res = await fetch('/api/fonts')
          const data = await res.json()
          const first = data?.fonts?.[0]?.fileUrl as string | undefined
          if (first && first.toLowerCase().endsWith('.typeface.json')) {
            const json = await fetch(first).then(r => r.json())
            font = fl.parse(json)
          } else {
            if (!cancelled) {
              setTextGeomState(null)
            }
            return
          }
        } catch {
          if (!cancelled) {
            setTextGeomState(null)
          }
          return
        }
        }
        
        // Cache the font
        fontCache.set(fontKey, font)
        console.log('Font loaded and cached:', fontKey)
      }

      setProgress(40)
      onProgressChange(40)
      // Generate simplified text geometry for preview (reduced complexity)
      const size = keychainParameters.textSize
      const spacing = keychainParameters.textSize * keychainParameters.lineSpacing
      
      const textLineGeoms: THREE.BufferGeometry[] = []
      let measuredWidth = 0
      let measuredHeight = 0
      
      if (keychainParameters.line1) {
        const line1Shapes = font.generateShapes(keychainParameters.line1, size)
        if (line1Shapes.length) {
          // Optimized geometry for preview - balanced quality/performance
          const g1 = new THREE.ExtrudeGeometry(line1Shapes, { 
            depth: Math.abs(keychainParameters.textHeight), 
            bevelEnabled: false,
            curveSegments: 8 // Balanced quality for preview
          })
          // Generated with high quality curveSegments: 8
          g1.computeBoundingBox()
          const bb1 = g1.boundingBox
          const cx1 = bb1 ? (bb1.min.x + bb1.max.x) / 2 : 0
          const cy1 = bb1 ? (bb1.min.y + bb1.max.y) / 2 : 0
          g1.translate(-cx1, (keychainParameters.line2 ? spacing / 2 : 0) - cy1 + keychainParameters.textOffsetY, 0)
          textLineGeoms.push(g1)
          
          // Measure actual bounds
          if (bb1) {
            measuredWidth = Math.max(measuredWidth, bb1.max.x - bb1.min.x)
            measuredHeight = Math.max(measuredHeight, bb1.max.y - bb1.min.y)
          }
        }
      }
      
      if (keychainParameters.line2) {
        const line2Shapes = font.generateShapes(keychainParameters.line2, size)
        if (line2Shapes.length) {
          // Optimized geometry for preview - balanced quality/performance
          const g2 = new THREE.ExtrudeGeometry(line2Shapes, { 
            depth: Math.abs(keychainParameters.textHeight), 
            bevelEnabled: false,
            curveSegments: 8 // Balanced quality for preview
          })
          // Generated with high quality curveSegments: 8
          g2.computeBoundingBox()
          const bb2 = g2.boundingBox
          const cx2 = bb2 ? (bb2.min.x + bb2.max.x) / 2 : 0
          const cy2 = bb2 ? (bb2.min.y + bb2.max.y) / 2 : 0
          g2.translate(-cx2, -spacing / 2 - cy2 + keychainParameters.textOffsetY, 0)
          textLineGeoms.push(g2)
          
          // Measure actual bounds
          if (bb2) {
            measuredWidth = Math.max(measuredWidth, bb2.max.x - bb2.min.x)
            measuredHeight = Math.max(measuredHeight, bb2.max.y - bb2.min.y)
          }
        }
      }
      
      // Merge text geometries
      let mergedTextGeom: THREE.BufferGeometry | null = null
      if (keychainParameters.textHeight !== 0 && textLineGeoms.length) {
        mergedTextGeom = mergeBufferGeometriesFallback(textLineGeoms)
        if (!cancelled) setTextGeomState(mergedTextGeom)
      } else {
        if (!cancelled) setTextGeomState(null)
      }

      setProgress(60)
      onProgressChange(60)
      // Use measured dimensions for base creation (same as real viewer)
      const padding = keychainParameters.textSize * 0.2
      const textAreaWidth = measuredWidth + padding * 2
      const textAreaHeight = measuredHeight + padding * 2
      const outerWidth = textAreaWidth + keychainParameters.borderThickness * 2
      const outerHeight = textAreaHeight + keychainParameters.borderThickness * 2

      // Create base shape (full outer rounded rectangle)
      const baseShape = new THREE.Shape()
      const baseRadius = Math.min(keychainParameters.borderThickness, outerWidth / 4, outerHeight / 4) * keychainParameters.borderRoundedness
      
      baseShape.moveTo(-outerWidth/2 + baseRadius, -outerHeight/2)
      baseShape.lineTo(outerWidth/2 - baseRadius, -outerHeight/2)
      baseShape.quadraticCurveTo(outerWidth/2, -outerHeight/2, outerWidth/2, -outerHeight/2 + baseRadius)
      baseShape.lineTo(outerWidth/2, outerHeight/2 - baseRadius)
      baseShape.quadraticCurveTo(outerWidth/2, outerHeight/2, outerWidth/2 - baseRadius, outerHeight/2)
      baseShape.lineTo(-outerWidth/2 + baseRadius, outerHeight/2)
      baseShape.quadraticCurveTo(-outerWidth/2, outerHeight/2, -outerWidth/2, outerHeight/2 - baseRadius)
      baseShape.lineTo(-outerWidth/2, -outerHeight/2 + baseRadius)
      baseShape.quadraticCurveTo(-outerWidth/2, -outerHeight/2, -outerWidth/2 + baseRadius, -outerHeight/2)

      // Create border shape (ring around text area)
      const borderShape = new THREE.Shape()
      const borderRadius = Math.min(keychainParameters.borderThickness, outerWidth / 4, outerHeight / 4) * keychainParameters.borderRoundedness
      
      borderShape.moveTo(-outerWidth/2 + borderRadius, -outerHeight/2)
      borderShape.lineTo(outerWidth/2 - borderRadius, -outerHeight/2)
      borderShape.quadraticCurveTo(outerWidth/2, -outerHeight/2, outerWidth/2, -outerHeight/2 + borderRadius)
      borderShape.lineTo(outerWidth/2, outerHeight/2 - borderRadius)
      borderShape.quadraticCurveTo(outerWidth/2, outerHeight/2, outerWidth/2 - borderRadius, outerHeight/2)
      borderShape.lineTo(-outerWidth/2 + borderRadius, outerHeight/2)
      borderShape.quadraticCurveTo(-outerWidth/2, outerHeight/2, -outerWidth/2, outerHeight/2 - borderRadius)
      borderShape.lineTo(-outerWidth/2, -outerHeight/2 + borderRadius)
      borderShape.quadraticCurveTo(-outerWidth/2, -outerHeight/2, -outerWidth/2 + borderRadius, -outerHeight/2)
      
      // Create inner hole for text area
      const innerShape = new THREE.Path()
      const innerRadius = Math.min(keychainParameters.borderThickness * 0.3, textAreaWidth / 6, textAreaHeight / 6) * keychainParameters.borderRoundedness
      
      innerShape.moveTo(-textAreaWidth/2 + innerRadius, -textAreaHeight/2)
      innerShape.lineTo(textAreaWidth/2 - innerRadius, -textAreaHeight/2)
      innerShape.quadraticCurveTo(textAreaWidth/2, -textAreaHeight/2, textAreaWidth/2, -textAreaHeight/2 + innerRadius)
      innerShape.lineTo(textAreaWidth/2, textAreaHeight/2 - innerRadius)
      innerShape.quadraticCurveTo(textAreaWidth/2, textAreaHeight/2, textAreaWidth/2 - innerRadius, textAreaHeight/2)
      innerShape.lineTo(-textAreaWidth/2 + innerRadius, textAreaHeight/2)
      innerShape.quadraticCurveTo(-textAreaWidth/2, textAreaHeight/2, -textAreaWidth/2, textAreaHeight/2 - innerRadius)
      innerShape.lineTo(-textAreaWidth/2, -textAreaHeight/2 + innerRadius)
      innerShape.quadraticCurveTo(-textAreaWidth/2, -textAreaHeight/2, -textAreaWidth/2 + innerRadius, -textAreaHeight/2)
      
      borderShape.holes.push(innerShape)

      // Create optimized geometries for preview
      const baseGeom = new THREE.ExtrudeGeometry(baseShape, {
        depth: keychainParameters.borderHeight,
        bevelEnabled: false,
        curveSegments: 8 // Balanced quality for preview
      })
      
      const borderGeom = new THREE.ExtrudeGeometry(borderShape, {
        depth: Math.abs(keychainParameters.textHeight),
        bevelEnabled: false,
        curveSegments: 8 // Balanced quality for preview
      })

      setProgress(80)
      onProgressChange(80)
      // Create ring geometry (same as real viewer)
      let ringGeom: THREE.BufferGeometry | null = null
      if (keychainParameters.showRing) {
        const ringShape = new THREE.Shape()
        ringShape.moveTo(keychainParameters.outerDiameter/2, 0)
        ringShape.absarc(0, 0, keychainParameters.outerDiameter/2, 0, Math.PI * 2, false)
        
        const hole = new THREE.Path()
        hole.moveTo(keychainParameters.innerDiameter/2, 0)
        hole.absarc(0, 0, keychainParameters.innerDiameter/2, 0, Math.PI * 2, true)
        ringShape.holes.push(hole)
        
        ringGeom = new THREE.ExtrudeGeometry(ringShape, {
          depth: keychainParameters.ringHeight,
          bevelEnabled: false
        })
      }

      // Calculate ring position for rounded keychains (on the side, not top)
      const initialX = -(outerWidth/2 + keychainParameters.outerDiameter/4)
      const firstLineY = keychainParameters.line2 ? keychainParameters.textSize * keychainParameters.lineSpacing / 2 : 0
      const ringPos: [number, number, number] = [
        initialX + keychainParameters.ringX,
        firstLineY + keychainParameters.textOffsetY + keychainParameters.ringY,
        0
      ]
      if (!cancelled) {
        setRoundedBaseGeom(baseGeom)
        setRoundedBorderGeom(borderGeom)
        setRingPosState(ringPos)
        setRingGeomState(ringGeom)
        
        // Cache the results with the correct calculated values
        geometryCache.set(cacheKey, {
          roundedBaseGeom: baseGeom,
          roundedBorderGeom: borderGeom,
          ringGeom: ringGeom,
          ringPos: ringPos,
          textGeom: mergedTextGeom
        })
        cleanupCache() // Clean up cache to prevent memory leaks
        console.log('Cached rounded geometry for:', cacheKey)
      }
    }

    async function buildRegularGeometry() {
      try {
        setProgress(20)
        onProgressChange(20)
        
        // Load font with caching (same as rounded)
        let font: any
        const fontKey = keychainParameters.fontUrl || 'default'
        
        if (fontCache.has(fontKey)) {
          font = fontCache.get(fontKey)
        } else {
          const { FontLoader } = await import('three/examples/jsm/loaders/FontLoader.js')
        const url = keychainParameters.fontUrl?.toLowerCase()
        
        if (url) {
          const fl = new FontLoader()
          if (url.endsWith('.typeface.json')) {
            const json = await fetch(keychainParameters.fontUrl!).then(r => r.json())
            font = fl.parse(json)
          } else if (/\.(ttf|otf)$/i.test(url)) {
            const ttfJson = await new TTFLoader().loadAsync(keychainParameters.fontUrl!)
            font = fl.parse(ttfJson)
          } else {
            // Fallback to bundled font
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
          // Auto-pick first detected font
          const fl = new FontLoader()
          try {
            const res = await fetch('/api/fonts')
            const data = await res.json()
            const first = data?.fonts?.[0]?.fileUrl as string | undefined
            if (first && first.toLowerCase().endsWith('.typeface.json')) {
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
          
          // Cache the font
          fontCache.set(fontKey, font)
          console.log('Font loaded and cached:', fontKey)
        }

        setProgress(40)
        onProgressChange(40)
        // Generate text shapes
        const line1Size = keychainParameters.textSize
        // Only use line2FontSize if admin mode is enabled and it's different from textSize
        const isAdminMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pass') === 'eunoia'
        const line2Size = isAdminMode && keychainParameters.line2FontSize !== keychainParameters.textSize ? keychainParameters.line2FontSize : keychainParameters.textSize
        const spacing = line1Size * keychainParameters.lineSpacing
        const line1Shapes = keychainParameters.line1 ? font.generateShapes(keychainParameters.line1, line1Size) : []
        const line2Shapes = keychainParameters.line2 ? font.generateShapes(keychainParameters.line2, line2Size) : []

        // Build optimized 3D text geometry for preview
        const textLineGeoms: THREE.BufferGeometry[] = []
        if (line1Shapes.length) {
          const g1 = new THREE.ExtrudeGeometry(line1Shapes, { 
            depth: Math.abs(keychainParameters.textHeight), 
            bevelEnabled: false,
            curveSegments: 8 // Balanced quality for preview
          })
          g1.computeBoundingBox()
          const bb1 = g1.boundingBox
          const cx1 = bb1 ? (bb1.min.x + bb1.max.x) / 2 : 0
          const cy1 = bb1 ? (bb1.min.y + bb1.max.y) / 2 : 0
          g1.translate(-cx1, (keychainParameters.line2 ? spacing / 2 : 0) - cy1 + keychainParameters.textOffsetY, 0)
          textLineGeoms.push(g1)
        }
        if (line2Shapes.length) {
          const g2 = new THREE.ExtrudeGeometry(line2Shapes, { 
            depth: Math.abs(keychainParameters.textHeight), 
            bevelEnabled: false,
            curveSegments: 8 // Balanced quality for preview
          })
          g2.computeBoundingBox()
          const bb2 = g2.boundingBox
          const cx2 = bb2 ? (bb2.min.x + bb2.max.x) / 2 : 0
          const cy2 = bb2 ? (bb2.min.y + bb2.max.y) / 2 : 0
          g2.translate(-cx2, -spacing / 2 - cy2 + keychainParameters.textOffsetY, 0)
          textLineGeoms.push(g2)
        }

        // Merge text geometry
        let mergedTextGeom: THREE.BufferGeometry | null = null
        if (keychainParameters.textHeight !== 0 && textLineGeoms.length) {
          mergedTextGeom = mergeBufferGeometriesFallback(textLineGeoms)
          if (!cancelled) setTextGeomState(mergedTextGeom)
        } else {
          if (!cancelled) setTextGeomState(null)
        }

        if (!line1Shapes.length && !line2Shapes.length) {
          setBaseGeomState(null)
          setTextGeomState(null)
          return
        }

        // Build base using ClipperLib (same as real viewers)
        const SCALE = 1000
        const subjectPaths: any[] = []
        if (line1Shapes.length) {
          const g1tmp = new THREE.ShapeGeometry(line1Shapes)
          g1tmp.computeBoundingBox()
          const bb1s = g1tmp.boundingBox
          const cx1s = bb1s ? (bb1s.min.x + bb1s.max.x) / 2 : 0
          const cy1s = bb1s ? (bb1s.min.y + bb1s.max.y) / 2 : 0
          const dy1s = (keychainParameters.line2 ? spacing / 2 : 0) + keychainParameters.textOffsetY
          line1Shapes.forEach((sh: THREE.Shape) => {
            const outer = sh.getPoints(64).map(p => ({ X: Math.round((p.x - cx1s) * SCALE), Y: Math.round((p.y - cy1s + dy1s) * SCALE) }))
            if (outer.length > 2) subjectPaths.push(outer)
            if ((sh as any).holes && (sh as any).holes.length) {
              ;(sh as any).holes.forEach((h: THREE.Path) => {
                const pts = h.getPoints(64).map(p => ({ X: Math.round((p.x - cx1s) * SCALE), Y: Math.round((p.y - cy1s + dy1s) * SCALE) }))
                if (pts.length > 2) subjectPaths.push(pts)
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
          const dy2s = -spacing / 2 + keychainParameters.textOffsetY
          line2Shapes.forEach((sh: THREE.Shape) => {
            const outer = sh.getPoints(64).map(p => ({ X: Math.round((p.x - cx2s) * SCALE), Y: Math.round((p.y - cy2s + dy2s) * SCALE) }))
            if (outer.length > 2) subjectPaths.push(outer)
            if ((sh as any).holes && (sh as any).holes.length) {
              ;(sh as any).holes.forEach((h: THREE.Path) => {
                const pts = h.getPoints(64).map(p => ({ X: Math.round((p.x - cx2s) * SCALE), Y: Math.round((p.y - cy2s + dy2s) * SCALE) }))
                if (pts.length > 2) subjectPaths.push(pts)
              })
            }
          })
        }

        setProgress(60)
        onProgressChange(60)
        // Use ClipperLib to create proper border
        const { default: ClipperLib } = await import('clipper-lib')

        // Union all contours first
        const clipper = new ClipperLib.Clipper()
        clipper.AddPaths(subjectPaths, ClipperLib.PolyType.ptSubject, true)
        const union: any[] = []
        clipper.Execute(
          ClipperLib.ClipType.ctUnion,
          union,
          ClipperLib.PolyFillType.pftNonZero,
          ClipperLib.PolyFillType.pftNonZero
        )

        // Offset outward by borderThickness
        const co = new ClipperLib.ClipperOffset(2, 2)
        co.AddPaths(union, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon)
        const offsetSolution: any[] = []
        co.Execute(offsetSolution, Math.round(keychainParameters.borderThickness * SCALE))

        // Convert back to THREE.Shape
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

        if (offsetShapes.length === 0) {
          setBaseGeomState(null)
          return
        }

        const baseGeoms: THREE.BufferGeometry[] = []
        offsetShapes.forEach(os => {
          const g = new THREE.ExtrudeGeometry(os, { depth: keychainParameters.borderHeight, bevelEnabled: false })
          baseGeoms.push(g)
        })
        const mergedBase = mergeBufferGeometriesFallback(baseGeoms)
        
        // Center base
        mergedBase.computeBoundingBox()
        const bbb = mergedBase.boundingBox
        let calculatedRingPos: [number, number, number] = [0, 0, 0]
        if (bbb) {
          const cx = (bbb.min.x + bbb.max.x) / 2
          const cy = (bbb.min.y + bbb.max.y) / 2
          mergedBase.translate(-cx, -cy, 0)
          const baseWidth = bbb.max.x - bbb.min.x
          const firstLineY = keychainParameters.line2 ? keychainParameters.textSize * keychainParameters.lineSpacing / 2 : 0
          calculatedRingPos = [-(baseWidth / 2 + keychainParameters.outerDiameter / 4) + keychainParameters.ringX, firstLineY + keychainParameters.textOffsetY + keychainParameters.ringY, 0]
          if (!cancelled) setRingPosState(calculatedRingPos)
        }

        setProgress(80)
        onProgressChange(80)
        // Create ring geometry (same as real viewer)
        let ringGeom: THREE.BufferGeometry | null = null
        if (keychainParameters.showRing) {
          const ringShape = new THREE.Shape()
          ringShape.moveTo(keychainParameters.outerDiameter/2, 0)
          ringShape.absarc(0, 0, keychainParameters.outerDiameter/2, 0, Math.PI * 2, false)
          
          const hole = new THREE.Path()
          hole.moveTo(keychainParameters.innerDiameter/2, 0)
          hole.absarc(0, 0, keychainParameters.innerDiameter/2, 0, Math.PI * 2, true)
          ringShape.holes.push(hole)
          
          ringGeom = new THREE.ExtrudeGeometry(ringShape, {
            depth: keychainParameters.ringHeight,
            bevelEnabled: false
          })
        }
        
        if (!cancelled) {
          setBaseGeomState(mergedBase)
          setRingGeomState(ringGeom)
          
          // Cache the results with the correct calculated values
          geometryCache.set(cacheKey, {
            baseGeom: mergedBase,
            ringGeom: ringGeom,
            ringPos: calculatedRingPos,
            textGeom: mergedTextGeom
          })
          cleanupCache() // Clean up cache to prevent memory leaks
          console.log('Cached regular geometry for:', cacheKey)
        }
      } catch (e) {
        console.error('Geometry build failed:', e)
        if (!cancelled) {
          setBaseGeomState(null)
          setTextGeomState(null)
        }
      }
    }
    buildGeometry()
    return () => { 
      cancelled = true 
    }
  }, [keychainParameters.fontUrl, keychainParameters.line1, keychainParameters.line2, keychainParameters.textSize, keychainParameters.lineSpacing, keychainParameters.textOffsetY, keychainParameters.borderHeight, keychainParameters.borderThickness, keychainParameters.ringX, keychainParameters.ringY, keychainParameters.outerDiameter])

  // Fallback merge function with proper cleanup
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
        for (let i = 0; i < pos.count; i += 3) {
          indices.push(indexOffset + i, indexOffset + i + 1, indexOffset + i + 2)
        }
      }
      indexOffset += pos.count
      // Don't dispose here - it causes issues with merged geometry
    })
    merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    merged.setIndex(indices)
    merged.computeVertexNormals()
    return merged
  }

  const baseColor = keychainParameters.twoColors ? keychainParameters.baseColor : keychainParameters.baseColor
  const textColor = keychainParameters.twoColors ? keychainParameters.textColor : keychainParameters.baseColor

  // Show placeholder geometry while loading
  if (isLoading) {
    return (
      <group ref={meshRef}>
        {/* Placeholder keychain shape */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[20, 10, 2]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
        <mesh position={[0, 0, 1]}>
          <boxGeometry args={[15, 6, 1]} />
          <meshStandardMaterial color="#e0e0e0" />
        </mesh>
        {/* Placeholder ring */}
        <mesh position={[-12, 0, 0]}>
          <torusGeometry args={[3, 0.5, 8, 16]} />
          <meshStandardMaterial color="#d0d0d0" />
        </mesh>
      </group>
    )
  }

  return (
    <group ref={meshRef}>
      {type === 'rounded' ? (
        // Rounded keychain rendering
        <>
          {/* Rounded rectangle base */}
          {roundedBaseGeom && (
          <mesh geometry={roundedBaseGeom} position={[0, 0, 0]}>
            <meshStandardMaterial 
              color={baseColor} 
              roughness={0.2}
              metalness={0.1}
              envMapIntensity={0.8}
            />
          </mesh>
          )}

          {/* Extruded border */}
          {roundedBorderGeom && (
          <mesh geometry={roundedBorderGeom} position={[0, 0, keychainParameters.borderHeight]}>
            <meshStandardMaterial 
              color={textColor} 
              roughness={0.2}
              metalness={0.1}
              envMapIntensity={0.8}
            />
          </mesh>
          )}

          {/* Extruded 3D text */}
          {keychainParameters.textHeight !== 0 && textGeomState && (
            <mesh
              geometry={textGeomState}
              position={[0, 0, keychainParameters.textHeight > 0 ? keychainParameters.borderHeight : Math.max(0, keychainParameters.borderHeight - Math.abs(keychainParameters.textHeight))]}
            >
              <meshStandardMaterial color={textColor} />
            </mesh>
          )}

          {/* Fallback: Text3D using font if glyph text failed */}
          {keychainParameters.textHeight !== 0 && !textGeomState && (
          <Center position={[0, 0, keychainParameters.borderHeight]}>
              {keychainParameters.line2 ? (
                <>
                  <Text3D 
                    font={keychainParameters.fontUrl || '/fonts/Britanica.typeface.json'} 
                    size={keychainParameters.textSize} 
                    height={Math.abs(keychainParameters.textHeight)} 
                    curveSegments={12} 
                    bevelEnabled={false}
                    position={[0, keychainParameters.textSize * keychainParameters.lineSpacing / 4, 0]}
                  >
                    {keychainParameters.line1}
                    <meshStandardMaterial color={textColor} />
                  </Text3D>
                  <Text3D 
                    font={keychainParameters.fontUrl || '/fonts/Britanica.typeface.json'} 
                    size={keychainParameters.textSize} 
                    height={Math.abs(keychainParameters.textHeight)} 
                    curveSegments={12} 
                    bevelEnabled={false}
                    position={[0, -keychainParameters.textSize * keychainParameters.lineSpacing / 4, 0]}
                  >
                    {keychainParameters.line2}
                    <meshStandardMaterial color={textColor} />
                  </Text3D>
                </>
              ) : (
            <Text3D 
              font={keychainParameters.fontUrl || '/fonts/Britanica.typeface.json'} 
              size={keychainParameters.textSize} 
              height={Math.abs(keychainParameters.textHeight)} 
              curveSegments={12} 
              bevelEnabled={false}
            >
              {keychainParameters.line1}
              <meshStandardMaterial color={textColor} />
            </Text3D>
              )}
          </Center>
          )}
        </>
      ) : (
        // Regular keychain rendering (ClipperLib)
        <>
          {/* Base with proper border around text */}
          {baseGeomState && (
          <mesh geometry={baseGeomState} position={[0, 0, 0]}>
            <meshStandardMaterial 
              color={baseColor} 
              roughness={0.2}
              metalness={0.1}
              envMapIntensity={0.8}
            />
          </mesh>
          )}

          {/* Raised or engraved 3D text from glyphs */}
          {keychainParameters.textHeight !== 0 && textGeomState && (
            <mesh
              geometry={textGeomState}
              position={[0, 0, keychainParameters.textHeight > 0 ? keychainParameters.borderHeight : Math.max(0, keychainParameters.borderHeight - Math.abs(keychainParameters.textHeight))]}
            >
              <meshStandardMaterial color={textColor} />
            </mesh>
          )}

          {/* Fallback: Text3D using helvetiker if glyph text failed */}
          {keychainParameters.textHeight !== 0 && !textGeomState && (
            <Center position={[0, 0, keychainParameters.borderHeight]}>
              {keychainParameters.line2 ? (
                <>
                  <Text3D font={keychainParameters.fontUrl || '/fonts/Britanica.typeface.json'} size={keychainParameters.textSize} height={Math.abs(keychainParameters.textHeight)} curveSegments={12} bevelEnabled={false} position={[0, keychainParameters.textSize * keychainParameters.lineSpacing / 4, 0]}>
                    {keychainParameters.line1}
                    <meshStandardMaterial color={textColor} />
                  </Text3D>
                  <Text3D font={keychainParameters.fontUrl || '/fonts/Britanica.typeface.json'} size={keychainParameters.textSize} height={Math.abs(keychainParameters.textHeight)} curveSegments={12} bevelEnabled={false} position={[0, -keychainParameters.textSize * keychainParameters.lineSpacing / 4, 0]}>
                    {keychainParameters.line2}
                    <meshStandardMaterial color={textColor} />
                  </Text3D>
                </>
              ) : (
                <Text3D font={keychainParameters.fontUrl || '/fonts/Britanica.typeface.json'} size={keychainParameters.textSize} height={Math.abs(keychainParameters.textHeight)} curveSegments={12} bevelEnabled={false}>
                  {keychainParameters.line1}
                  <meshStandardMaterial color={textColor} />
                </Text3D>
              )}
            </Center>
          )}
        </>
      )}

      {/* Ring */}
      {keychainParameters.showRing && ringGeomState && (
        <mesh geometry={ringGeomState} position={ringPosState}>
          <meshStandardMaterial color={baseColor} />
        </mesh>
      )}
    </group>
  )
}

function PreviewScene({ type, parameters, onLoadingChange, onProgressChange }: { type: 'regular' | 'rounded', parameters?: KeychainParameters, onLoadingChange: (loading: boolean) => void, onProgressChange: (progress: number) => void }) {
  return (
    <>
      {/* Lighting similar to actual viewers */}
      <ambientLight intensity={0.7} color="#ffffff" />
      <ambientLight intensity={0.3} color="#fff8e1" />
      
      <directionalLight 
        position={[15, 20, 10]} 
        intensity={1.0} 
        color="#ffffff"
        castShadow
      />
      
      <directionalLight 
        position={[-15, 20, 10]} 
        intensity={0.6} 
        color="#ffffff"
      />
      
      <directionalLight 
        position={[0, 10, -15]} 
        intensity={0.5} 
        color="#e3f2fd"
      />
      
      <pointLight 
        position={[8, 15, 8]} 
        intensity={0.5} 
        color="#fff3e0"
        distance={50}
      />


      {/* Keychain - same rotation as actual viewers */}
      <group rotation={[-Math.PI / 2, 0, Math.PI]} position={[0, 0.5, 0]}>
        <PreviewKeychainMesh type={type} parameters={parameters} onLoadingChange={onLoadingChange} onProgressChange={onProgressChange} />
      </group>
    </>
  )
}

export default function KeychainPreview({ type, parameters, className = '' }: KeychainPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  return (
    <div className={`w-full h-64 relative ${className}`}>
      <Canvas
        camera={{ position: [0, 100, 0], fov: 60 }}
        shadows={false} // Disable shadows for preview performance
        dpr={[1, 2]} // Limit pixel ratio for better performance
        // Temporarily disable performance optimization to test
        // performance={{ min: 0.5 }} // Reduce quality if performance drops
      >
        <PreviewScene type={type} parameters={parameters} onLoadingChange={setIsLoading} onProgressChange={setProgress} />
        <OrbitControls
          enablePan={false} // Disable pan for preview
          enableZoom={true}
          enableRotate={true}
          minDistance={30}
          maxDistance={300}
          target={[0, 0, 5]}
          autoRotate={true}
          autoRotateSpeed={0.5} // Slower rotation for smoother performance
        />
      </Canvas>
      
      {/* Non-blocking loading indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
            {/* Moving circle animation */}
            <div className="relative w-6 h-6">
              {/* Outer rotating circle */}
              <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-transparent border-t-brand-blue border-r-brand-green rounded-full animate-spin"></div>
              
              {/* Inner pulsing circle */}
              <div className="absolute inset-1 border border-transparent border-t-brand-yellow border-r-brand-red rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>

            {/* Loading text */}
            <div className="text-xs font-medium text-gray-600">
              {progress < 100 ? 'Loading...' : 'Ready!'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
