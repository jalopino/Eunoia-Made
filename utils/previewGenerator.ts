import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { KeychainParameters } from '@/types/keychain'

// Create a dedicated 3D preview renderer
export async function generate3DPreview(parameters: KeychainParameters): Promise<string> {
  return new Promise((resolve) => {
    // Create a dedicated canvas for preview rendering
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 200
    
    // Create a new WebGL renderer specifically for preview
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      alpha: true, 
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    })
    renderer.setSize(300, 200)
    renderer.setClearColor(0xf8fafc, 1)
    
    // Create scene
    const scene = new THREE.Scene()
    
    // Create camera positioned for top-down view
    const camera = new THREE.PerspectiveCamera(45, 1.5, 0.1, 1000)
    camera.position.set(0, 0, 80)
    camera.lookAt(0, 0, 0)
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(0, 0, 50)
    scene.add(directionalLight)
    
    const sideLight = new THREE.DirectionalLight(0xffffff, 0.4)
    sideLight.position.set(30, 30, 30)
    scene.add(sideLight)
    
    // Create keychain geometry
    createPreviewKeychain(scene, parameters)
    
    // Render the scene
    renderer.render(scene, camera)
    
    // Convert to data URL
    const dataURL = canvas.toDataURL('image/png', 0.9)
    
    // Clean up
    renderer.dispose()
    
    resolve(dataURL)
  })
}

// Create a simplified but accurate keychain for preview
function createPreviewKeychain(scene: THREE.Scene, parameters: KeychainParameters) {
  // Create base plate
  const baseWidth = Math.max(parameters.line1.length * parameters.textSize * 0.8, 25)
  const baseHeight = parameters.line2 ? parameters.textSize * 1.8 : parameters.textSize * 1.2
  
  const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, parameters.borderHeight)
  const baseMaterial = new THREE.MeshStandardMaterial({ 
    color: parameters.baseColor,
    transparent: true,
    opacity: 0.9
  })
  const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial)
  scene.add(baseMesh)
  
  // Create text representation (simplified but visible)
  if (parameters.line1) {
    const text1Geometry = new THREE.BoxGeometry(
      parameters.line1.length * parameters.textSize * 0.6, 
      parameters.textSize * 0.8, 
      Math.abs(parameters.textHeight)
    )
    const text1Material = new THREE.MeshStandardMaterial({ 
      color: parameters.twoColors ? parameters.textColor : parameters.baseColor
    })
    const text1Mesh = new THREE.Mesh(text1Geometry, text1Material)
    text1Mesh.position.set(0, parameters.line2 ? parameters.textSize * 0.4 : 0, parameters.borderHeight + 0.1)
    scene.add(text1Mesh)
  }
  
  if (parameters.line2) {
    const text2Geometry = new THREE.BoxGeometry(
      parameters.line2.length * parameters.textSize * 0.6, 
      parameters.textSize * 0.8, 
      Math.abs(parameters.textHeight)
    )
    const text2Material = new THREE.MeshStandardMaterial({ 
      color: parameters.twoColors ? parameters.textColor : parameters.baseColor
    })
    const text2Mesh = new THREE.Mesh(text2Geometry, text2Material)
    text2Mesh.position.set(0, -parameters.textSize * 0.4, parameters.borderHeight + 0.1)
    scene.add(text2Mesh)
  }
  
  // Create ring if enabled
  if (parameters.showRing) {
    const ringGeometry = new THREE.TorusGeometry(
      parameters.outerDiameter / 2, 
      (parameters.outerDiameter - parameters.innerDiameter) / 2, 
      8, 
      16
    )
    const ringMaterial = new THREE.MeshStandardMaterial({ 
      color: parameters.baseColor 
    })
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial)
    
    // Position ring
    const ringX = -(baseWidth / 2 + parameters.outerDiameter / 4) + parameters.ringX
    const ringY = parameters.line2 ? parameters.textSize * parameters.lineSpacing / 2 : 0
    ringMesh.position.set(ringX, ringY, parameters.borderHeight)
    ringMesh.rotation.x = Math.PI / 2
    
    scene.add(ringMesh)
  }
}

// Generate a fallback preview if canvas capture fails
function generateFallbackPreview(): string {
  const canvas = document.createElement('canvas')
  canvas.width = 200
  canvas.height = 200
  const context = canvas.getContext('2d')!
  
  // Background
  context.fillStyle = '#f8fafc'
  context.fillRect(0, 0, 200, 200)
  
  // Border
  context.strokeStyle = '#e2e8f0'
  context.lineWidth = 2
  context.strokeRect(10, 10, 180, 180)
  
  // Text
  const centerX = 100
  const centerY = 100
  const fontSize = 16
  const lineHeight = fontSize * 1.2
  
  context.font = `bold ${fontSize}px Arial`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  
  context.fillStyle = '#000000'
  context.fillText('Preview', centerX, centerY - lineHeight / 2)
  context.fillText('Unavailable', centerX, centerY + lineHeight / 2)
  
  return canvas.toDataURL('image/png')
}

// Legacy 3D preview function (keeping for reference but not using)
export async function generateKeychainPreview(parameters: KeychainParameters): Promise<string> {
  return new Promise(async (resolve) => {
    // Create a headless canvas for rendering
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    
    // Create a headless renderer
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      alpha: true, 
      antialias: true,
      preserveDrawingBuffer: true
    })
    renderer.setSize(200, 200)
    renderer.setClearColor(0xf8fafc, 1)
    
    // Create scene
    const scene = new THREE.Scene()
    
    // Create camera positioned for top-down view (Z-axis looking down)
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    camera.position.set(0, 0, 100)
    camera.lookAt(0, 0, 0)
    
    // Add lighting for top-down view
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(0, 0, 50)
    scene.add(directionalLight)
    
    // Add a second light from an angle for better depth perception
    const sideLight = new THREE.DirectionalLight(0xffffff, 0.3)
    sideLight.position.set(30, 30, 30)
    scene.add(sideLight)
    
    try {
      // Create keychain geometry using the same logic as the main viewer
      const keychainGroup = await createKeychainGeometry(parameters)
      scene.add(keychainGroup)
      
      // Render the scene
      renderer.render(scene, camera)
      
      // Convert to data URL
      const dataURL = canvas.toDataURL('image/png')
      
      // Clean up
      renderer.dispose()
      scene.remove(keychainGroup)
      
      resolve(dataURL)
    } catch (error) {
      console.error('Preview generation failed:', error)
      // Fallback to simple preview
      const fallbackPreview = generateSimpleFallback(parameters)
      resolve(fallbackPreview)
    }
  })
}

// Create keychain geometry similar to the main viewer
async function createKeychainGeometry(parameters: KeychainParameters): Promise<THREE.Group> {
  const group = new THREE.Group()
  
  // Create base geometry
  const baseGeometry = createBaseGeometry(parameters)
  if (baseGeometry) {
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: parameters.baseColor,
      transparent: true,
      opacity: 0.9
    })
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial)
    group.add(baseMesh)
  }
  
  // Create text geometry
  const textGeometry = await createTextGeometry(parameters)
  if (textGeometry) {
    const textMaterial = new THREE.MeshStandardMaterial({ 
      color: parameters.twoColors ? parameters.textColor : parameters.baseColor
    })
    const textMesh = new THREE.Mesh(textGeometry, textMaterial)
    textMesh.position.z = parameters.borderHeight + 0.1
    group.add(textMesh)
  }
  
  // Create ring geometry
  if (parameters.showRing) {
    const ringGeometry = createRingGeometry(parameters)
    if (ringGeometry) {
      const ringMaterial = new THREE.MeshStandardMaterial({ 
        color: parameters.baseColor 
      })
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial)
      
      // Position ring based on parameters
      const ringX = parameters.ringX
      const ringY = parameters.line2 ? parameters.textSize * parameters.lineSpacing / 2 : 0
      ringMesh.position.set(ringX, ringY, parameters.borderHeight)
      
      group.add(ringMesh)
    }
  }
  
  return group
}

// Create base geometry (simplified version)
function createBaseGeometry(parameters: KeychainParameters): THREE.BufferGeometry | null {
  try {
    // Create a simple rectangular base
    const width = Math.max(parameters.line1.length * parameters.textSize * 0.6, 20)
    const height = parameters.line2 ? parameters.textSize * 1.5 : parameters.textSize * 0.8
    
    const shape = new THREE.Shape()
    shape.moveTo(-width/2, -height/2)
    shape.lineTo(width/2, -height/2)
    shape.lineTo(width/2, height/2)
    shape.lineTo(-width/2, height/2)
    shape.closePath()
    
    const extrudeSettings = {
      depth: parameters.borderHeight,
      bevelEnabled: false
    }
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  } catch (error) {
    console.error('Base geometry creation failed:', error)
    return null
  }
}

// Create text geometry using proper font loading (same as main viewer)
async function createTextGeometry(parameters: KeychainParameters): Promise<THREE.BufferGeometry | null> {
  try {
    // Load font using FontLoader (same as main viewer)
    const fontLoader = new FontLoader()
    let font: any = null
    
    if (parameters.fontUrl && parameters.fontUrl.toLowerCase().endsWith('.typeface.json')) {
      // Load specific font URL
      try {
        const response = await fetch(parameters.fontUrl)
        const json = await response.json()
        font = fontLoader.parse(json)
      } catch (error) {
        console.error('Failed to load specific font:', error)
      }
    }
    
    // Fallback to default font if specific font failed
    if (!font) {
      try {
        const response = await fetch('/api/fonts')
        const data = await response.json()
        const first = data?.fonts?.[0]?.fileUrl
        if (first && first.toLowerCase().endsWith('.typeface.json')) {
          const json = await fetch(first).then(r => r.json())
          font = fontLoader.parse(json)
        }
      } catch (error) {
        console.error('Failed to load default font:', error)
        return null
      }
    }
    
    if (!font) {
      console.error('No font available for text generation')
      return null
    }
    
    // Generate shapes for lines (same as main viewer)
    const size = parameters.textSize
    const spacing = parameters.textSize * parameters.lineSpacing
    const line1Shapes = parameters.line1 ? font.generateShapes(parameters.line1, size) : []
    const line2Shapes = parameters.line2 ? font.generateShapes(parameters.line2, size) : []
    
    if (line1Shapes.length === 0 && line2Shapes.length === 0) {
      return null
    }
    
    // Build 3D text geometry per line and apply offsets (same as main viewer)
    const textLineGeoms: THREE.BufferGeometry[] = []
    
    if (line1Shapes.length) {
      const g1 = new THREE.ExtrudeGeometry(line1Shapes, { 
        depth: Math.abs(parameters.textHeight), 
        bevelEnabled: false 
      })
      g1.computeBoundingBox()
      const bb1 = g1.boundingBox
      const cx1 = bb1 ? (bb1.min.x + bb1.max.x) / 2 : 0
      const cy1 = bb1 ? (bb1.min.y + bb1.max.y) / 2 : 0
      g1.translate(-cx1, (parameters.line2 ? spacing / 2 : 0) - cy1, 0)
      textLineGeoms.push(g1)
    }
    
    if (line2Shapes.length) {
      const g2 = new THREE.ExtrudeGeometry(line2Shapes, { 
        depth: Math.abs(parameters.textHeight), 
        bevelEnabled: false 
      })
      g2.computeBoundingBox()
      const bb2 = g2.boundingBox
      const cx2 = bb2 ? (bb2.min.x + bb2.max.x) / 2 : 0
      const cy2 = bb2 ? (bb2.min.y + bb2.max.y) / 2 : 0
      g2.translate(-cx2, -spacing / 2 - cy2, 0)
      textLineGeoms.push(g2)
    }
    
    // Merge text geometries if height is non-zero
    if (parameters.textHeight !== 0 && textLineGeoms.length) {
      return mergeBufferGeometriesFallback(textLineGeoms)
    }
    
    return null
  } catch (error) {
    console.error('Text geometry creation failed:', error)
    return null
  }
}

// Create ring geometry
function createRingGeometry(parameters: KeychainParameters): THREE.BufferGeometry | null {
  try {
    const ringShape = new THREE.Shape()
    ringShape.moveTo(parameters.outerDiameter/2, 0)
    ringShape.absarc(0, 0, parameters.outerDiameter/2, 0, Math.PI * 2, false)
    
    const hole = new THREE.Path()
    hole.moveTo(parameters.innerDiameter/2, 0)
    hole.absarc(0, 0, parameters.innerDiameter/2, 0, Math.PI * 2, true)
    ringShape.holes.push(hole)
    
    const extrudeSettings = {
      depth: parameters.ringHeight,
      bevelEnabled: false
    }
    
    return new THREE.ExtrudeGeometry(ringShape, extrudeSettings)
  } catch (error) {
    console.error('Ring geometry creation failed:', error)
    return null
  }
}

// Fallback simple preview if 3D rendering fails
function generateSimpleFallback(parameters: KeychainParameters): string {
  const canvas = document.createElement('canvas')
  canvas.width = 200
  canvas.height = 200
  const context = canvas.getContext('2d')!
  
  // Background
  context.fillStyle = '#f8fafc'
  context.fillRect(0, 0, 200, 200)
  
  // Border
  context.strokeStyle = '#e2e8f0'
  context.lineWidth = 2
  context.strokeRect(10, 10, 180, 180)
  
  // Text
  const centerX = 100
  const centerY = 100
  const fontSize = 16
  const lineHeight = fontSize * 1.2
  
  context.font = `bold ${fontSize}px Arial`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  
  if (parameters.line1) {
    context.fillStyle = parameters.baseColor
    context.fillText(parameters.line1, centerX, centerY - (parameters.line2 ? lineHeight / 2 : 0))
  }
  
  if (parameters.line2) {
    context.fillStyle = parameters.twoColors ? parameters.textColor : parameters.baseColor
    context.fillText(parameters.line2, centerX, centerY + lineHeight / 2)
  }
  
  // Ring
  if (parameters.showRing) {
    context.strokeStyle = parameters.baseColor
    context.lineWidth = 3
    context.beginPath()
    context.arc(160, 40, 15, 0, 2 * Math.PI)
    context.stroke()
    
    context.fillStyle = '#f8fafc'
    context.beginPath()
    context.arc(160, 40, 8, 0, 2 * Math.PI)
    context.fill()
  }
  
  return canvas.toDataURL('image/png')
}

// Merge buffer geometries (same as main viewer)
function mergeBufferGeometriesFallback(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const mergedGeometry = new THREE.BufferGeometry()
  let positions: number[] = []
  let indices: number[] = []
  let currentIndex = 0
  
  geoms.forEach(geom => {
    const pos = Array.from(geom.attributes.position.array)
    const idx = geom.index ? Array.from(geom.index.array) : []
    
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

// Alternative: Generate a more stylized preview
export function generateStylizedPreview(parameters: KeychainParameters): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 150
    canvas.height = 100
    const context = canvas.getContext('2d')!
    
    // Background
    const gradient = context.createLinearGradient(0, 0, 0, 100)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(1, '#f1f5f9')
    context.fillStyle = gradient
    context.fillRect(0, 0, 150, 100)
    
    // Keychain shape outline
    context.strokeStyle = parameters.baseColor
    context.lineWidth = 2
    context.strokeRect(10, 20, 130, 60)
    
    // Text
    context.font = 'bold 12px Arial'
    context.textAlign = 'center'
    context.fillStyle = parameters.twoColors ? parameters.textColor : parameters.baseColor
    
    if (parameters.line1) {
      context.fillText(parameters.line1, 75, 40)
    }
    if (parameters.line2) {
      context.fillText(parameters.line2, 75, 55)
    }
    
    // Ring indicator
    if (parameters.showRing) {
      context.fillStyle = parameters.baseColor
      context.beginPath()
      context.arc(130, 30, 8, 0, 2 * Math.PI)
      context.fill()
    }
    
    // Font indicator
    context.font = '8px Arial'
    context.fillStyle = '#64748b'
    context.textAlign = 'left'
    context.fillText(parameters.font, 15, 85)
    
    const dataURL = canvas.toDataURL('image/png')
    resolve(dataURL)
  })
}
