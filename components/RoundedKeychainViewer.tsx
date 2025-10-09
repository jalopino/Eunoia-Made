'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Center, Text3D } from '@react-three/drei'
import * as THREE from 'three'
import { KeychainParameters } from '@/types/keychain'
import { TTFLoader } from 'three-stdlib'
// @ts-ignore
import ClipperLib from 'clipper-lib'

// Geometry cache to avoid regenerating same parameters
const geometryCache = new Map<string, {
  baseGeom?: THREE.BufferGeometry
  textGeom?: THREE.BufferGeometry
  ringGeom?: THREE.BufferGeometry
  ringPos?: [number, number, number]
  roundedBaseGeom?: THREE.BufferGeometry
  roundedBorderGeom?: THREE.BufferGeometry
}>()

// Clear all cached geometries to prevent WebGL context issues
geometryCache.clear()

// Font cache to avoid repeated font loads
const fontCache = new Map<string, any>()

interface RoundedKeychainViewerProps {
  parameters: KeychainParameters
  commitId?: number
}

function RoundedKeychainMesh({ parameters, onBuildingChange, onProgressChange }: { parameters: KeychainParameters, onBuildingChange: (v: boolean) => void, onProgressChange: (v: number) => void }) {
  const meshRef = useRef<THREE.Group>(null)
  const [line1Bounds, setLine1Bounds] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [line2Bounds, setLine2Bounds] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [textGeomState, setTextGeomState] = useState<THREE.BufferGeometry | null>(null)
  const [ringPosState, setRingPosState] = useState<[number, number, number]>([0, 0, 0])
  const [roundedBaseGeom, setRoundedBaseGeom] = useState<THREE.BufferGeometry | null>(null)
  const [roundedBorderGeom, setRoundedBorderGeom] = useState<THREE.BufferGeometry | null>(null)

  // Generate cache key for this parameter set (with version to invalidate old cache)
  const cacheKey = useMemo(() => {
    return `rounded-v2-${parameters.line1}-${parameters.line2}-${parameters.textSize}-${parameters.fontUrl}-${parameters.borderThickness}-${parameters.borderHeight}-${parameters.showRing}-${parameters.outerDiameter}-${parameters.innerDiameter}-${parameters.ringHeight}-${parameters.ringX}-${parameters.ringY}`
  }, [parameters.line1, parameters.line2, parameters.textSize, parameters.fontUrl, parameters.borderThickness, parameters.borderHeight, parameters.showRing, parameters.outerDiameter, parameters.innerDiameter, parameters.ringHeight, parameters.ringX, parameters.ringY])

  // Optimized font loading with caching
  const loadFont = async (fontUrl?: string) => {
    const cacheKey = fontUrl || 'default'
    if (fontCache.has(cacheKey)) {
      return fontCache.get(cacheKey)
    }

    const { FontLoader } = await import('three/examples/jsm/loaders/FontLoader.js')
    let font: any
    
    if (fontUrl) {
      const fl = new FontLoader()
      const url = fontUrl.toLowerCase()
      
      if (url.endsWith('.typeface.json')) {
        const json = await fetch(fontUrl).then(r => r.json())
        font = fl.parse(json)
      } else if (/\.(ttf|otf)$/i.test(url)) {
        const ttfJson = await new TTFLoader().loadAsync(fontUrl)
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
          }
        } catch {
          // Use default font
          font = null
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
        }
      } catch {
        font = null
      }
    }

    if (font) {
      fontCache.set(cacheKey, font)
    }
    return font
  }
  
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

  // Calculate text dimensions using ClipperLib (same as KeychainViewer)
  const { baseGeometry, ringGeometry, ringPosition } = useMemo(() => {
    // Use actual bounds from font measurements if available (same as KeychainPreview)
    let measuredWidth = 0
    let measuredHeight = 0
    
    // Use actual bounds from font measurements if available
    if (line1Bounds.width > 0) {
      measuredWidth = Math.max(measuredWidth, line1Bounds.width)
      measuredHeight = Math.max(measuredHeight, line1Bounds.height)
    }
    if (line2Bounds.width > 0) {
      measuredWidth = Math.max(measuredWidth, line2Bounds.width)
      measuredHeight = Math.max(measuredHeight, line2Bounds.height)
    }
    
    // Fallback to estimated dimensions if no measurements available
    if (measuredWidth === 0) {
      const fontFactor = getFontFactor(parameters.font)
      const line1Width = parameters.line1.length * parameters.textSize * fontFactor
      const line2Width = parameters.line2 ? parameters.line2.length * parameters.textSize * fontFactor : 0
      measuredWidth = Math.max(line1Width, line2Width)
    }
    if (measuredHeight === 0) {
      const lineHeight = parameters.textSize * 0.8
      const spacing = parameters.line2 ? parameters.textSize * parameters.lineSpacing : 0
      measuredHeight = parameters.line2 ? (lineHeight * 2 + spacing) : lineHeight
    }

    // Use measured dimensions for base creation (same as KeychainPreview)
    const finalWidth = measuredWidth
    const finalHeight = measuredHeight

    // Create rounded rectangle base with extruded border effect
    // Add small padding around text for better visual spacing
    const padding = parameters.textSize * 0.2 // 20% of text size as padding
    const textAreaWidth = finalWidth + padding * 2
    const textAreaHeight = finalHeight + padding * 2
    
    // Create outer border area (text area + border thickness)
    const outerWidth = textAreaWidth + parameters.borderThickness * 2
    const outerHeight = textAreaHeight + parameters.borderThickness * 2
    
    // Create base shape - make it cover the entire outer area
    const baseShape = new THREE.Shape()
    const baseRadius = Math.min(parameters.borderThickness, outerWidth / 4, outerHeight / 4) * parameters.borderRoundedness
    
    // Create base as the full outer rounded rectangle
    baseShape.moveTo(-outerWidth/2 + baseRadius, -outerHeight/2)
    baseShape.lineTo(outerWidth/2 - baseRadius, -outerHeight/2)
    baseShape.quadraticCurveTo(outerWidth/2, -outerHeight/2, outerWidth/2, -outerHeight/2 + baseRadius)
    baseShape.lineTo(outerWidth/2, outerHeight/2 - baseRadius)
    baseShape.quadraticCurveTo(outerWidth/2, outerHeight/2, outerWidth/2 - baseRadius, outerHeight/2)
    baseShape.lineTo(-outerWidth/2 + baseRadius, outerHeight/2)
    baseShape.quadraticCurveTo(-outerWidth/2, outerHeight/2, -outerWidth/2, outerHeight/2 - baseRadius)
    baseShape.lineTo(-outerWidth/2, -outerHeight/2 + baseRadius)
    baseShape.quadraticCurveTo(-outerWidth/2, -outerHeight/2, -outerWidth/2 + baseRadius, -outerHeight/2)
    
    // Create border shape (outer - inner) - create a ring around the text area
    const borderShape = new THREE.Shape()
    const borderRadius = Math.min(parameters.borderThickness, outerWidth / 4, outerHeight / 4) * parameters.borderRoundedness
    
    // Create outer border rounded rectangle
    borderShape.moveTo(-outerWidth/2 + borderRadius, -outerHeight/2)
    borderShape.lineTo(outerWidth/2 - borderRadius, -outerHeight/2)
    borderShape.quadraticCurveTo(outerWidth/2, -outerHeight/2, outerWidth/2, -outerHeight/2 + borderRadius)
    borderShape.lineTo(outerWidth/2, outerHeight/2 - borderRadius)
    borderShape.quadraticCurveTo(outerWidth/2, outerHeight/2, outerWidth/2 - borderRadius, outerHeight/2)
    borderShape.lineTo(-outerWidth/2 + borderRadius, outerHeight/2)
    borderShape.quadraticCurveTo(-outerWidth/2, outerHeight/2, -outerWidth/2, outerHeight/2 - borderRadius)
    borderShape.lineTo(-outerWidth/2, -outerHeight/2 + borderRadius)
    borderShape.quadraticCurveTo(-outerWidth/2, -outerHeight/2, -outerWidth/2 + borderRadius, -outerHeight/2)
    
    // Create inner hole for the text area
    const innerShape = new THREE.Path()
    const innerRadius = Math.min(parameters.borderThickness * 0.3, textAreaWidth / 6, textAreaHeight / 6) * parameters.borderRoundedness
    
    innerShape.moveTo(-textAreaWidth/2 + innerRadius, -textAreaHeight/2)
    innerShape.lineTo(textAreaWidth/2 - innerRadius, -textAreaHeight/2)
    innerShape.quadraticCurveTo(textAreaWidth/2, -textAreaHeight/2, textAreaWidth/2, -textAreaHeight/2 + innerRadius)
    innerShape.lineTo(textAreaWidth/2, textAreaHeight/2 - innerRadius)
    innerShape.quadraticCurveTo(textAreaWidth/2, textAreaHeight/2, textAreaWidth/2 - innerRadius, textAreaHeight/2)
    innerShape.lineTo(-textAreaWidth/2 + innerRadius, textAreaHeight/2)
    innerShape.quadraticCurveTo(-textAreaWidth/2, textAreaHeight/2, -textAreaWidth/2, textAreaHeight/2 - innerRadius)
    innerShape.lineTo(-textAreaWidth/2, -textAreaHeight/2 + innerRadius)
    innerShape.quadraticCurveTo(-textAreaWidth/2, -textAreaHeight/2, -textAreaWidth/2 + innerRadius, -textAreaHeight/2)
    
    // Add inner hole to create border ring
    borderShape.holes.push(innerShape)
    
    // Create base geometry (lower level)
    const baseGeom = new THREE.ExtrudeGeometry(baseShape, {
      depth: parameters.borderHeight, // Base at full border height
      bevelEnabled: false
    })
    
    // Create border geometry (higher level - same as text height)
    const borderGeom = new THREE.ExtrudeGeometry(borderShape, {
      depth: Math.abs(parameters.textHeight), // Border same height as text
      bevelEnabled: false
    })
    
    // Return both geometries separately
    const finalBaseGeom = { base: baseGeom, border: borderGeom }

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

      // Calculate ring position
      const initialX = -(outerWidth/2 + parameters.outerDiameter/4)
      const firstLineY = parameters.line2 ? parameters.textSize * parameters.lineSpacing / 2 : 0
      ringPos = [
        initialX + parameters.ringX,
        firstLineY + parameters.ringY,
        0
      ]
    }

    return {
      baseGeometry: finalBaseGeom,
      ringGeometry: ringGeom,
      ringPosition: ringPos
    }
  }, [parameters, line1Bounds.width, line1Bounds.height, line2Bounds.width, line2Bounds.height])

  // Build 3D text geometry using font loader
  useEffect(() => {
    let cancelled = false
    async function buildTextGeometry() {
      try {
        // Check cache first (disabled temporarily to prevent WebGL issues)
        if (false && geometryCache.has(cacheKey)) {
          const cached = geometryCache.get(cacheKey)!
          setTextGeomState(cached.textGeom || null)
          setRingPosState(cached.ringPos || [0, 0, 0])
          setRoundedBaseGeom(cached.roundedBaseGeom || null)
          setRoundedBorderGeom(cached.roundedBorderGeom || null)
          onBuildingChange(false)
          return
        }

        onBuildingChange(true)
        onProgressChange(10)
        
        // Use optimized font loading
        const font = await loadFont(parameters.fontUrl)
        if (!font) {
          if (!cancelled) {
            setTextGeomState(null)
          }
          onBuildingChange(false)
          return
        }

        // Generate text geometry
        const size = parameters.textSize
        const spacing = parameters.textSize * parameters.lineSpacing
        onProgressChange(70)
        
        const textLineGeoms: THREE.BufferGeometry[] = []
        
        if (parameters.line1) {
          const line1Shapes = font.generateShapes(parameters.line1, size)
          if (line1Shapes.length) {
            const g1 = new THREE.ExtrudeGeometry(line1Shapes, { 
              depth: Math.abs(parameters.textHeight), 
              bevelEnabled: false,
              curveSegments: 8 // Same as KeychainPreview for consistency
            })
            g1.computeBoundingBox()
            const bb1 = g1.boundingBox
            const cx1 = bb1 ? (bb1.min.x + bb1.max.x) / 2 : 0
            const cy1 = bb1 ? (bb1.min.y + bb1.max.y) / 2 : 0
            g1.translate(-cx1, (parameters.line2 ? spacing / 2 : 0) - cy1, 0)
            textLineGeoms.push(g1)
          }
        }
        
        if (parameters.line2) {
          // Only use line2FontSize if admin mode is enabled and it's different from textSize
          const isAdminMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pass') === 'eunoia'
          const line2Size = isAdminMode && parameters.line2FontSize !== parameters.textSize ? parameters.line2FontSize : parameters.textSize
          const line2Shapes = font.generateShapes(parameters.line2, line2Size)
          if (line2Shapes.length) {
            const g2 = new THREE.ExtrudeGeometry(line2Shapes, { 
              depth: Math.abs(parameters.textHeight), 
              bevelEnabled: false,
              curveSegments: 8 // Same as KeychainPreview for consistency
            })
            g2.computeBoundingBox()
            const bb2 = g2.boundingBox
            const cx2 = bb2 ? (bb2.min.x + bb2.max.x) / 2 : 0
            const cy2 = bb2 ? (bb2.min.y + bb2.max.y) / 2 : 0
            g2.translate(-cx2, -spacing / 2 - cy2, 0)
            textLineGeoms.push(g2)
          }
        }
        
        // Merge text geometries
        if (parameters.textHeight !== 0 && textLineGeoms.length) {
          const mergedText = mergeBufferGeometriesFallback(textLineGeoms)
          if (!cancelled) setTextGeomState(mergedText)
          
          // Measure actual text bounds for proper base sizing
          mergedText.computeBoundingBox()
          const textBounds = mergedText.boundingBox
          if (textBounds) {
            const textWidth = textBounds.max.x - textBounds.min.x
            const textHeight = textBounds.max.y - textBounds.min.y
            
            // Update bounds state for useMemo
            if (!cancelled) {
              setLine1Bounds({ width: textWidth, height: textHeight })
              if (parameters.line2) {
                setLine2Bounds({ width: textWidth, height: textHeight })
              }
            }
          }
        } else {
          if (!cancelled) setTextGeomState(null)
        }

        // Base geometry is now handled in useMemo, no need to regenerate here
        
        if (!cancelled) {
          onProgressChange(100)
          
          // Cache disabled temporarily to prevent WebGL context issues
          // geometryCache.set(cacheKey, {
          //   textGeom: textGeomState || undefined,
          //   ringPos: ringPosState
          // })
        }
      } catch (e) {
        console.error('Text geometry build failed:', e)
        if (!cancelled) {
          setTextGeomState(null)
        }
      } finally {
        if (!cancelled) onBuildingChange(false)
      }
    }
    buildTextGeometry()
    return () => { cancelled = true }
  }, [cacheKey])

  // Fallback merge function
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
      {/* Rounded rectangle base and border */}
      {baseGeometry && (
        <>
          {/* Base geometry */}
          <mesh geometry={baseGeometry.base} position={[0, 0, 0]}>
            <meshStandardMaterial 
              color={baseColor} 
              roughness={0.2}
              metalness={0.1}
              envMapIntensity={0.8}
            />
          </mesh>
          
          {/* Border geometry */}
          <mesh geometry={baseGeometry.border} position={[0, 0, parameters.borderHeight]}>
            <meshStandardMaterial 
              color={textColor} 
              roughness={0.2}
              metalness={0.1}
              envMapIntensity={0.8}
            />
          </mesh>
        </>
      )}

      {/* Extruded 3D text */}
      {parameters.textHeight !== 0 && textGeomState && (
        <mesh
          geometry={textGeomState}
          position={[0, 0, parameters.textHeight > 0 ? parameters.borderHeight : Math.max(0, parameters.borderHeight - Math.abs(parameters.textHeight))]}
        >
          <meshStandardMaterial color={textColor} />
        </mesh>
      )}

      {/* Fallback: Text3D using font if glyph text failed */}
      {parameters.textHeight !== 0 && !textGeomState && (
        <Center position={[0, 0, parameters.borderHeight]}>
          {parameters.line2 ? (
            <>
              <Text3D font={parameters.fontUrl || '/fonts/Borel.typeface.json'} size={parameters.textSize} height={Math.abs(parameters.textHeight)} curveSegments={8} bevelEnabled={false} position={[0, parameters.textSize * parameters.lineSpacing / 4, 0]}>
                {parameters.line1}
                <meshStandardMaterial color={textColor} />
              </Text3D>
              <Text3D font={parameters.fontUrl || '/fonts/Borel.typeface.json'} size={parameters.textSize} height={Math.abs(parameters.textHeight)} curveSegments={8} bevelEnabled={false} position={[0, -parameters.textSize * parameters.lineSpacing / 4, 0]}>
                {parameters.line2}
                <meshStandardMaterial color={textColor} />
              </Text3D>
            </>
          ) : (
            <Text3D font={parameters.fontUrl || '/fonts/Borel.typeface.json'} size={parameters.textSize} height={Math.abs(parameters.textHeight)} curveSegments={8} bevelEnabled={false}>
              {parameters.line1}
              <meshStandardMaterial color={textColor} />
            </Text3D>
          )}
        </Center>
      )}

      {/* Ring */}
      {parameters.showRing && ringGeometry && (
        <mesh geometry={ringGeometry} position={ringPosition}>
          <meshStandardMaterial color={baseColor} />
        </mesh>
      )}
    </group>
  )
}

function Scene({ parameters, onBuildingChange, onProgressChange }: { parameters: KeychainParameters, onBuildingChange: (v: boolean) => void, onProgressChange: (v: number) => void }) {
  return (
    <>
      {/* Enhanced Lighting */}
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
      
      <directionalLight 
        position={[0, -15, 5]} 
        intensity={0.3} 
        color="#f3e5f5"
      />
      
      <pointLight 
        position={[8, 15, 8]} 
        intensity={0.5} 
        color="#fff3e0"
        distance={50}
      />

      {/* Bed Grid */}
      <gridHelper args={[200, 40, '#e0e0e0', '#f0f0f0']} position={[0, 0, 0]} />

      {/* Keychain - lay flat and right-side up */}
      <group rotation={[-Math.PI / 2, 0, Math.PI]} position={[0, 0.5, 0]}>
        <RoundedKeychainMesh parameters={parameters} onBuildingChange={onBuildingChange} onProgressChange={onProgressChange} />
      </group>
    </>
  )
}

export default function RoundedKeychainViewer({ parameters, commitId = 0 }: RoundedKeychainViewerProps) {
  const [isBuilding, setIsBuilding] = useState(true)
  const [buildProgress, setBuildProgress] = useState(0)
  const [isSceneReady, setIsSceneReady] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSceneReady(true)
      setBuildProgress(10)
    }, 100)
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

        {/* Non-blocking loading indicator */}
        {isBuilding && (
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
                {buildProgress < 100 ? 'Loading...' : 'Ready!'}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center font-bold">
          Click and drag to rotate, zoom, and pan the 3D model
        </p>
      </div>
    </div>
  )
}
