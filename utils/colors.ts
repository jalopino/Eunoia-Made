import { colorOptions } from '@/types/keychain'

/**
 * Creates a color map object from the colorOptions array for efficient lookups
 */
export const createColorMap = (): { [key: string]: string } => {
  const colorMap: { [key: string]: string } = {}
  
  colorOptions.forEach(color => {
    // Store both uppercase and lowercase versions for case-insensitive lookup
    colorMap[color.value.toUpperCase()] = color.name
    colorMap[color.value.toLowerCase()] = color.name
    colorMap[color.value] = color.name
  })
  
  return colorMap
}

/**
 * Gets the readable color name from a hex color value
 * @param hexColor - The hex color value (e.g., '#FFFFFF' or '#ffffff')
 * @returns The readable color name or the original hex value if not found
 */
export const getColorName = (hexColor: string): string => {
  if (!hexColor) return hexColor // Handle undefined/null values
  
  const colorMap = createColorMap()
  return colorMap[hexColor.toUpperCase()] || colorMap[hexColor.toLowerCase()] || colorMap[hexColor] || hexColor
}

/**
 * Pre-computed color map for performance (created once)
 */
export const colorMap = createColorMap()
