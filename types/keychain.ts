export interface KeychainParameters {
  // Text settings
  line1: string
  line2: string
  font: string
  fontUrl?: string
  textHeight: number
  textSize: number
  lineSpacing: number

  // Border settings
  borderThickness: number
  borderHeight: number

  // Ring settings
  showRing: boolean
  outerDiameter: number
  innerDiameter: number
  ringHeight: number
  ringX: number
  ringY: number

  // Color settings
  twoColors: boolean
  baseColor: string
  textColor: string
}

export const defaultParameters: KeychainParameters = {
  // Text settings
  line1: 'Eunoia',
  line2: 'Made',
  font: 'Arial',
  fontUrl: '',
  textHeight: 1.5,
  textSize: 12,
  lineSpacing: 1.2,

  // Border settings
  borderThickness: 3,
  borderHeight: 3,

  // Ring settings
  showRing: true,
  outerDiameter: 11,
  innerDiameter: 4,
  ringHeight: 3,
  ringX: 0,
  ringY: 0,

  // Color settings
  twoColors: true,
  baseColor: '#000000',
  textColor: '#00FF00'
}

export interface FontOption {
  name: string // Display name / family name
  value: string // Family name used in selector
  fileUrl?: string // Direct URL to .woff2/.ttf/.otf if available
  googleFont?: boolean
}

export const defaultFonts: FontOption[] = [
  { name: 'Arial', value: 'Arial' },
  { name: 'Helvetica', value: 'Helvetica' },
  { name: 'Times New Roman', value: 'Times' },
  { name: 'Courier New', value: 'Courier' },
  { name: 'Georgia', value: 'Georgia' },
  { name: 'Verdana', value: 'Verdana' },
  { name: 'Impact', value: 'Impact' },
  { name: 'Comic Sans MS', value: 'Comic Sans MS' },
  { name: 'Archivo Black', value: 'Archivo Black', googleFont: true },
  { name: 'Bangers', value: 'Bangers', googleFont: true },
  { name: 'Bungee', value: 'Bungee', googleFont: true },
  { name: 'Changa One', value: 'Changa One', googleFont: true },
  { name: 'Bebas Neue', value: 'Bebas Neue', googleFont: true },
  { name: 'Poppins Black', value: 'Poppins', googleFont: true },
  { name: 'Pacifico', value: 'Pacifico', googleFont: true },
  { name: 'Press Start 2P', value: 'Press Start 2P', googleFont: true },
  { name: 'Audiowide', value: 'Audiowide', googleFont: true },
  { name: 'DynaPuff', value: 'DynaPuff', googleFont: true }
]

export interface ColorOption {
  name: string
  value: string
}

export const colorOptions: ColorOption[] = [
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Dark Red', value: '#990000' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Dark Green', value: '#009900' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Dark Blue', value: '#000099' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Orange', value: '#FF8000' },
  { name: 'Purple', value: '#800080' },
  { name: 'Pink', value: '#FF66B3' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Light Gray', value: '#CCCCCC' },
  { name: 'Dark Gray', value: '#4D4D4D' },
  { name: 'Turquoise', value: '#00CCCC' }
]

export interface KeychainListItem {
  id: string
  parameters: KeychainParameters
  previewImage: string
  addedAt: Date
}

export interface PurchaseForm {
  name: string
  phone: string
  email: string
  deliveryType: 'delivery' | 'pickup'
  receiptImage?: File
  keychains: KeychainListItem[]
}
