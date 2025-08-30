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
  font: 'Britanica',
  fontUrl: '/fonts/Britanica.typeface.json',
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
  textColor: '#FFFFFF'
}

export interface FontOption {
  name: string // Display name / family name
  value: string // Family name used in selector
  fileUrl?: string // Direct URL to .woff2/.ttf/.otf if available
  googleFont?: boolean
}

export const defaultFonts: FontOption[] = [
  { name: 'Britanica', value: 'Britanica', fileUrl: '/fonts/Britanica.typeface.json' },
  { name: 'Changa One', value: 'ChangaOne', fileUrl: '/fonts/ChangaOne.typeface.json' },
  { name: 'Pacifico', value: 'Pacifico', fileUrl: '/fonts/Pacifico.typeface.json' },
  { name: 'Bungee', value: 'Bungee', fileUrl: '/fonts/Bungee.typeface.json' },
  { name: 'Poppins', value: 'Poppins', fileUrl: '/fonts/Poppins.typeface.json' },
  { name: 'DynaPuff', value: 'DynaPuff', fileUrl: '/fonts/DynaPuff.typeface.json' },
  { name: 'Bangers', value: 'Bangers', fileUrl: '/fonts/Bangers.typeface.json' },
  { name: 'Audiowide', value: 'Audiowide', fileUrl: '/fonts/Audiowide.typeface.json' },
  { name: 'Archivo', value: 'Archivo', fileUrl: '/fonts/Archivo.typeface.json' },
  { name: 'Borel', value: 'Borel', fileUrl: '/fonts/Borel.typeface.json' }
]

export interface ColorOption {
  name: string
  value: string
}

export const colorOptions: ColorOption[] = [
  { name: 'Cotton White', value: '#FFFFFF' },
  { name: 'Light Grey', value: '#D3D3D3' },
  { name: 'Black', value: '#000000' },
  { name: 'Sakura Pink', value: '#FFB6C1' },
  { name: 'Pink', value: '#FFC0CB' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Pastel Orange', value: '#FFB347' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Pastel Yellow', value: '#FFFFE0' },
  { name: 'Pale Green', value: '#98FB98' },
  { name: 'Mint Green', value: '#98FF98' },
  { name: 'Dark Green', value: '#006400' },
  { name: 'Teal', value: '#008080' },
  { name: 'Light Blue', value: '#ADD8E6' },
  { name: 'Navy Blue', value: '#000080' },
  { name: 'Sapphire Blue', value: '#0F52BA' },
  { name: 'Periwinkle', value: '#CCCCFF' },
  { name: 'Lavender Purple', value: '#967bb6' }
]

export interface KeychainListItem {
  id: string
  parameters: KeychainParameters
  addedAt: string
}

export interface PurchaseForm {
  name: string
  phone: string
  email: string
  deliveryType: 'delivery' | 'pickup'
  receiptImage?: File
  keychains: KeychainListItem[]
}
