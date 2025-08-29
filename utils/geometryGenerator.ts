import * as THREE from 'three'
import { KeychainParameters } from '@/types/keychain'

// Font factors from the original OpenSCAD code
const FONT_FACTORS: { [key: string]: number } = {
  'Archivo Black': 0.39,
  'Bangers': 0.27,
  'Bungee': 0.47,
  'Changa One': 0.33,
  'Bebas Neue': 0.25,
  'Poppins': 0.38,
  'Pacifico': 0.3,
  'Press Start 2P': 0.69,
  'Audiowide': 0.41,
  'DynaPuff': 0.36,
  'Arial': 0.45,
  'Helvetica': 0.45,
  'Times': 0.5,
  'Courier': 0.6,
  'Georgia': 0.48,
  'Verdana': 0.42,
  'Impact': 0.35,
  'Comic Sans MS': 0.4
}

function getFontFactor(fontName: string): number {
  return FONT_FACTORS[fontName] || 0.45
}

function calculateMaxWidth(parameters: KeychainParameters): number {
  const fontFactor = getFontFactor(parameters.font)
  const line1Width = parameters.line1.length * parameters.textSize * fontFactor
  const line2Width = parameters.line2 ? parameters.line2.length * parameters.textSize * fontFactor : 0
  
  return Math.max(line1Width, line2Width)
}

function calculateInitialPositionX(parameters: KeychainParameters): number {
  const maxWidth = calculateMaxWidth(parameters)
  return -(maxWidth + parameters.borderThickness + parameters.outerDiameter / 4)
}

function calculateFirstLinePosition(parameters: KeychainParameters): number {
  return parameters.line2 ? parameters.textSize * parameters.lineSpacing / 2 : 0
}

export interface KeychainGeometry {
  base: THREE.BufferGeometry
  text?: THREE.BufferGeometry
  ring?: THREE.BufferGeometry
  ringPosition: { x: number; y: number }
}

export function createKeychainGeometry(parameters: KeychainParameters): KeychainGeometry {
  const result: KeychainGeometry = {
    base: new THREE.BufferGeometry(),
    ringPosition: { x: 0, y: 0 }
  }

  // Create text geometry using TextGeometry approximation
  const textGeometry = createTextGeometry(parameters)
  
  // Create base geometry (text + border using minkowski-like approach)
  const baseGeometry = createBaseGeometry(parameters, textGeometry)
  
  // Create ring geometry if enabled
  let ringGeometry: THREE.BufferGeometry | undefined
  if (parameters.showRing) {
    ringGeometry = createRingGeometry(parameters)
    const ringPosX = calculateInitialPositionX(parameters) + parameters.ringX
    const ringPosY = calculateFirstLinePosition(parameters) + parameters.ringY
    result.ringPosition = { x: ringPosX, y: ringPosY }
  }

  // Combine base and ring, subtract ring hole if needed
  result.base = combineBaseAndRing(baseGeometry, ringGeometry, result.ringPosition, parameters)
  
  // Set text geometry for elevated/carved text
  if (parameters.textHeight !== 0) {
    result.text = textGeometry
    result.ring = ringGeometry
  }

  return result
}

function createTextGeometry(parameters: KeychainParameters): THREE.BufferGeometry {
  const shapes: THREE.Shape[] = []
  
  // Create text shapes (simplified approach)
  if (parameters.line1) {
    const line1Shape = createTextShape(parameters.line1, parameters)
    if (parameters.line2) {
      // Position for two lines - create positioned shapes
      const line1ShapePositioned = createTextShape(parameters.line1, parameters, 0, parameters.textSize * parameters.lineSpacing / 2)
      shapes.push(line1ShapePositioned)
      
      const line2Shape = createTextShape(parameters.line2, parameters, 0, -parameters.textSize * parameters.lineSpacing / 2)
      shapes.push(line2Shape)
    } else {
      shapes.push(line1Shape)
    }
  }

  if (parameters.line2 && !parameters.line1) {
    const line2Shape = createTextShape(parameters.line2, parameters)
    shapes.push(line2Shape)
  }

  // Extrude the shapes
  const extrudeSettings = {
    depth: Math.abs(parameters.textHeight),
    bevelEnabled: false
  }

  const combinedGeometry = new THREE.BufferGeometry()
  
  if (shapes.length > 0) {
    const geometries: THREE.BufferGeometry[] = []
    
    shapes.forEach(shape => {
      const extrudeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
      geometries.push(extrudeGeometry)
    })

    // Merge all text geometries
    const mergedGeometry = new THREE.BufferGeometry()
    let positions: number[] = []
    let indices: number[] = []
    let currentIndex = 0

    geometries.forEach(geom => {
      const pos = Array.from(geom.attributes.position.array)
      const idx = geom.index ? Array.from(geom.index.array) : []
      
      // Adjust indices
      const adjustedIndices = idx.map(i => i + currentIndex)
      
      positions = positions.concat(pos)
      indices = indices.concat(adjustedIndices)
      
      currentIndex += pos.length / 3
    })

    mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    mergedGeometry.setIndex(indices)
    mergedGeometry.computeVertexNormals()
    
    return mergedGeometry
  }

  return combinedGeometry
}

function createTextShape(text: string, parameters: KeychainParameters, offsetX: number = 0, offsetY: number = 0): THREE.Shape {
  // Simplified text shape creation - in a real implementation, you'd use a proper font loader
  const shape = new THREE.Shape()
  const fontSize = parameters.textSize
  const fontFactor = getFontFactor(parameters.font)
  
  // Create a simple rectangular approximation for each character
  let currentX = -(text.length * fontSize * fontFactor) / 2 + offsetX
  
  for (let i = 0; i < text.length; i++) {
    const charWidth = fontSize * fontFactor * 0.8 // Approximate character width
    const charHeight = fontSize * 0.8 // Approximate character height
    
    // Create rectangle for character
    const charShape = new THREE.Shape()
    charShape.moveTo(currentX, -charHeight / 2 + offsetY)
    charShape.lineTo(currentX + charWidth, -charHeight / 2 + offsetY)
    charShape.lineTo(currentX + charWidth, charHeight / 2 + offsetY)
    charShape.lineTo(currentX, charHeight / 2 + offsetY)
    charShape.lineTo(currentX, -charHeight / 2 + offsetY)
    
    // Add to main shape (simplified union)
    if (i === 0) {
      shape.holes = []
      shape.curves = charShape.curves.slice()
    } else {
      // In a real implementation, you'd properly union the shapes
      shape.curves = shape.curves.concat(charShape.curves)
    }
    
    currentX += charWidth + fontSize * 0.1 // Small spacing between characters
  }
  
  return shape
}

function createBaseGeometry(parameters: KeychainParameters, textGeometry: THREE.BufferGeometry): THREE.BufferGeometry {
  // Create base by extruding text shape and adding border (minkowski-like effect)
  const maxWidth = calculateMaxWidth(parameters)
  const textHeight = parameters.line2 ? parameters.textSize * parameters.lineSpacing : parameters.textSize
  
  // Create a rectangular base that encompasses the text plus border
  const baseWidth = maxWidth + parameters.borderThickness * 2
  const baseHeight = textHeight + parameters.borderThickness * 2
  
  const baseShape = new THREE.Shape()
  baseShape.moveTo(-baseWidth / 2, -baseHeight / 2)
  baseShape.lineTo(baseWidth / 2, -baseHeight / 2)
  baseShape.lineTo(baseWidth / 2, baseHeight / 2)
  baseShape.lineTo(-baseWidth / 2, baseHeight / 2)
  baseShape.lineTo(-baseWidth / 2, -baseHeight / 2)
  
  // Add rounded corners (simplified)
  const roundedShape = createRoundedRectangle(baseWidth, baseHeight, parameters.borderThickness / 2)
  
  const extrudeSettings = {
    depth: parameters.borderHeight,
    bevelEnabled: false
  }
  
  return new THREE.ExtrudeGeometry(roundedShape, extrudeSettings)
}

function createRoundedRectangle(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape()
  const x = -width / 2
  const y = -height / 2
  
  shape.moveTo(x, y + radius)
  shape.lineTo(x, y + height - radius)
  shape.quadraticCurveTo(x, y + height, x + radius, y + height)
  shape.lineTo(x + width - radius, y + height)
  shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius)
  shape.lineTo(x + width, y + radius)
  shape.quadraticCurveTo(x + width, y, x + width - radius, y)
  shape.lineTo(x + radius, y)
  shape.quadraticCurveTo(x, y, x, y + radius)
  
  return shape
}

function createRingGeometry(parameters: KeychainParameters): THREE.BufferGeometry {
  const ringGeometry = new THREE.RingGeometry(
    parameters.innerDiameter / 2,
    parameters.outerDiameter / 2,
    32
  )
  
  // Convert to 3D by extruding
  const shape = new THREE.Shape()
  const outerRadius = parameters.outerDiameter / 2
  const innerRadius = parameters.innerDiameter / 2
  
  // Outer circle
  shape.moveTo(outerRadius, 0)
  shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false)
  
  // Inner circle (hole)
  const hole = new THREE.Path()
  hole.moveTo(innerRadius, 0)
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  
  const extrudeSettings = {
    depth: parameters.ringHeight,
    bevelEnabled: false
  }
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings)
}

function combineBaseAndRing(
  baseGeometry: THREE.BufferGeometry,
  ringGeometry: THREE.BufferGeometry | undefined,
  ringPosition: { x: number; y: number },
  parameters: KeychainParameters
): THREE.BufferGeometry {
  if (!ringGeometry) {
    return baseGeometry
  }

  // In a real implementation, you'd use CSG operations to properly union and subtract
  // For now, we'll return the base geometry and handle the ring separately
  return baseGeometry
}
