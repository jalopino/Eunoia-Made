export interface KeychainParameters {
  // Text settings
  line1: string
  line2: string
  font: string
  fontUrl?: string
  textHeight: number
  textSize: number
  fontSize: number // Admin-only: First line font size
  line2FontSize: number
  lineSpacing: number
  textOffsetY: number // Admin-only: Y position offset for text

  // Border settings
  borderThickness: number
  borderHeight: number
  borderRoundedness: number
  
  // Advanced border mode
  advancedBorderMode: boolean
  
  // Line-specific border settings
  line1BorderThickness: number
  line1BorderRoundedness: number
  line2BorderThickness: number
  line2BorderRoundedness: number

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
  font: 'Rethink',
  fontUrl: '/fonts/Rethink.typeface.json',
  textHeight: 1.5,
  textSize: 12,
  fontSize: 12,
  line2FontSize: 12,
  lineSpacing: 1.2,
  textOffsetY: 0,

  // Border settings
  borderThickness: 3,
  borderHeight: 3,
  borderRoundedness: 0.3,
  
  // Advanced border mode
  advancedBorderMode: false,
  
  // Line-specific border settings
  line1BorderThickness: 3,
  line1BorderRoundedness: 0.3,
  line2BorderThickness: 3,
  line2BorderRoundedness: 0.3,

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

export const roundedDefaultParameters: KeychainParameters = {
  // Text settings
  line1: 'Eunoia Made',
  line2: '',
  font: 'Rethink',
  fontUrl: '/fonts/Rethink.typeface.json',
  textHeight: 1.5,
  textSize: 12,
  fontSize: 12,
  line2FontSize: 12,
  lineSpacing: 1.2,
  textOffsetY: 0,

  // Border settings
  borderThickness: 2,
  borderHeight: 3,
  borderRoundedness: 2,
  
  // Advanced border mode
  advancedBorderMode: false,
  
  // Line-specific border settings
  line1BorderThickness: 2,
  line1BorderRoundedness: 2,
  line2BorderThickness: 2,
  line2BorderRoundedness: 2,

  // Ring settings
  showRing: true,
  outerDiameter: 11,
  innerDiameter: 4,
  ringHeight: 3,
  ringX: 0,
  ringY: 0,

  // Color settings
  twoColors: false,
  baseColor: '#98FB98',
  textColor: '#FFFFFF'
}

export interface FontOption {
  name: string // Display name / family name
  value: string // Family name used in selector
  fileUrl?: string // Direct URL to .woff2/.ttf/.otf if available
  googleFont?: boolean
}

export const defaultFonts: FontOption[] = [
  { name: 'Rethink', value: 'Rethink', fileUrl: '/fonts/Rethink.typeface.json' },
  { name: 'Changa One', value: 'ChangaOne', fileUrl: '/fonts/ChangaOne.typeface.json' },
  { name: 'Pacifico', value: 'Pacifico', fileUrl: '/fonts/Pacifico.typeface.json' },
  { name: 'Bungee', value: 'Bungee', fileUrl: '/fonts/Bungee.typeface.json' },
  { name: 'Poppins', value: 'Poppins', fileUrl: '/fonts/Poppins.typeface.json' },
  { name: 'DynaPuff', value: 'DynaPuff', fileUrl: '/fonts/DynaPuff.typeface.json' },
  { name: 'Bangers', value: 'Bangers', fileUrl: '/fonts/Bangers.typeface.json' },
  { name: 'Audiowide', value: 'Audiowide', fileUrl: '/fonts/Audiowide.typeface.json' },
  { name: 'Archivo', value: 'Archivo', fileUrl: '/fonts/Archivo.typeface.json' },
  { name: 'Borel', value: 'Borel', fileUrl: '/fonts/Borel.typeface.json' },
  { name: 'Caprasimo', value: 'Caprasimo', fileUrl: '/fonts/Caprasimo.typeface.json' },
  { name: 'Cherry Bomb', value: 'CherryBomb', fileUrl: '/fonts/CherryBomb.typeface.json' },
  { name: 'Pure Blossom', value: 'PureBlossom', fileUrl: '/fonts/PureBlossom.typeface.json' }
]

export interface ColorOption {
  name: string
  value: string
}

export const colorOptions: ColorOption[] = [
  { name: 'Cotton White', value: '#FFFFFF' },
  { name: 'Fossil Grey', value: '#C8C8C8' },
  { name: 'Charcoal Black', value: '#36454F' },
  { name: 'Earth Brown', value: '#8B4513' },
  { name: 'Army Brown', value: '#5F4B32' },
  { name: 'Wood Brown', value: '#966F33' },
  { name: 'Army Beige', value: '#C3B091' },
  { name: 'Candy', value: '#FF69B4' },
  { name: 'Sakura Pink', value: '#FFB6C1' },
  { name: 'Pink', value: '#FFC0CB' },
  { name: 'Army Red', value: '#7C0A02' },
  { name: 'Pastel Peach', value: '#FFDAB9' },
  { name: 'Sunrise Orange', value: '#FF7F50' },
  { name: 'Basic Orange', value: '#FFA500' },
  { name: 'Sunshine Yellow', value: '#FFFF00' },
  { name: 'Pastel Banana', value: '#FFF5B4' },
  { name: 'Creamy Yellow', value: '#FFFACD' },
  { name: 'Pale Green', value: '#98FB98' },
  { name: 'Mint Green', value: '#AAF0D1' },
  { name: 'Army Light Green', value: '#9CAF88' },
  { name: 'Forest Green', value: '#228B22' },
  { name: 'Grass Green', value: '#7CFC00' },
  { name: 'Basic Green', value: '#00FF00' },
  { name: 'Army Dark Green', value: '#4B5320' },
  { name: 'Teal Green', value: '#008080' },
  { name: 'Ice Blue', value: '#AFEEEE' },
  { name: 'Muted Blue', value: '#6A7B8C' },
  { name: 'Sapphire Blue', value: '#0F52BA' },
  { name: 'Army Blue', value: '#3C5A75' },
  { name: 'Electric Indigo', value: '#6600FF' },
  { name: 'Lavender', value: '#967bb6' },
  { name: 'Periwinkle', value: '#CCCCFF' },
  { name: 'Muted White', value: '#F5F5F5' }
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

export interface CartItem {
  id: string
  name: string
  type: 'regular' | 'rounded'
  price: number
  parameters: KeychainParameters
  quantity: number
  addedAt: string
}

export interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
  isHydrated: boolean
}
