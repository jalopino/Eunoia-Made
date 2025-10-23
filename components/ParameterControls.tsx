'use client'

import { useEffect, useState, useRef } from 'react'
import { KeychainParameters, FontOption, defaultFonts, colorOptions } from '@/types/keychain'
import { RotateCcw, X, Type, Palette, Eye, ListPlus, ChevronDown, Square, Copy, Settings } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

// Custom Color Dropdown Component
interface ColorDropdownProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ name: string; value: string }>
  className?: string
}

function ColorDropdown({ value, onChange, options, className = '' }: ColorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find(option => option.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white"
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: value }}
          />
          <span>{selectedOption?.name || 'Select color'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: option.value }}
              />
              <span className="text-sm">{option.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface ParameterControlsProps {
  parameters: KeychainParameters
  onParameterChange: (key: keyof KeychainParameters, value: any) => void
  onReset: () => void
  onGenerate: () => void
  onAddToList: (customParameters?: KeychainParameters, customId?: string) => void
  keychainList: any[]
  onPurchase: () => void
  isGenerating?: boolean
  disableCheckout?: boolean
}

export default function ParameterControls({
  parameters,
  onParameterChange,
  onReset,
  onGenerate,
  onAddToList,
  keychainList,
  onPurchase,
  isGenerating = false,
  disableCheckout = false
}: ParameterControlsProps) {
  
  const { showToast } = useToast()
  
  // Admin mode detection
  const [isAdminMode, setIsAdminMode] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      setIsAdminMode(urlParams.get('pass') === 'eunoia')
    }
  }, [])
  
  // Helper function to convert hex colors to readable names
  const getColorName = (hexColor: string) => {
    if (!hexColor) return hexColor // Handle undefined/null values
    
    const colorMap: { [key: string]: string } = {
      '#FFFFFF': 'Cotton White',
      '#D3D3D3': 'Light Grey',
      '#000000': 'Black',
      '#FFB6C1': 'Sakura Pink',
      '#FFC0CB': 'Pink',
      '#FF0000': 'Red',
      '#FFB347': 'Pastel Orange',
      '#FFFF00': 'Yellow',
      '#FFFFE0': 'Pastel Yellow',
      '#98FB98': 'Pale Green',
      '#98FF98': 'Mint Green',
      '#006400': 'Dark Green',
      '#008080': 'Teal',
      '#ADD8E6': 'Light Blue',
      '#000080': 'Navy Blue',
      '#0F52BA': 'Sapphire Blue',
      '#CCCCFF': 'Periwinkle',
      '#967BB6': 'Lavender Purple',
      '#967bb6': 'Lavender Purple'
    }
    return colorMap[hexColor.toUpperCase()] || colorMap[hexColor] || hexColor
  }
  const [fonts] = useState<FontOption[]>(defaultFonts)
  const [activeTab, setActiveTab] = useState<'text' | 'ring' | 'colors' | 'border' | 'bulk' | 'admin'>('text')
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false)
  
  // Close font dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isFontDropdownOpen) {
        const target = event.target as Element
        if (!target.closest('.font-dropdown-container')) {
          setIsFontDropdownOpen(false)
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isFontDropdownOpen])
  
  // Helper function to get Google Font name
  const getGoogleFontName = (fontName: string) => {
    const googleFontMap: { [key: string]: string } = {
      'Rethink': 'Rethink Sans',
      'ChangaOne': 'Changa One',
      'Pacifico': 'Pacifico',
      'Bungee': 'Bungee',
      'Poppins': 'Poppins',
      'DynaPuff': 'DynaPuff',
      'Bangers': 'Bangers',
      'Audiowide': 'Audiowide',
      'Archivo': 'Archivo',
      'Borel': 'Borel',
      'Caprasimo': 'Caprasimo',
      'CherryBomb': 'Cherry Bomb One',
      'PureBlossom': 'Cherry Bomb One'
    }
    return googleFontMap[fontName] || fontName
  }
  const [bulkNames, setBulkNames] = useState<string>('')
  const [bulkKeychains, setBulkKeychains] = useState<Array<{
    id: string
    name: string
    secondLine: string
    font: string
    fontUrl: string
    baseColor: string
    textColor: string
  }>>([])
  const [individualBulkInput, setIndividualBulkInput] = useState<{firstLine: string, secondLine: string}>({firstLine: '', secondLine: ''})

  // Auto-detect typeface.json in public/fonts and add to list
  useEffect(() => {
    let ignore = false
    fetch('/api/fonts')
      .then((r) => r.json())
      .then((data) => {
        if (ignore) return
        if (data?.fonts?.length) {
          // Skip auto-detection since we're using defaultFonts
        }
      })
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [])

  const handleSliderChange = (key: keyof KeychainParameters, value: string) => {
    // Handle boolean values specially
    if (key === 'advancedBorderMode') {
      onParameterChange(key, value === 'true')
    } else {
    onParameterChange(key, parseFloat(value))
    }
  }

  // Sync line-specific border values with global values when not in advanced mode
  useEffect(() => {
    if (!parameters.advancedBorderMode) {
      // Sync line-specific values with global values
      if (parameters.line1BorderThickness !== parameters.borderThickness) {
        onParameterChange('line1BorderThickness', parameters.borderThickness)
      }
      if (parameters.line2BorderThickness !== parameters.borderThickness) {
        onParameterChange('line2BorderThickness', parameters.borderThickness)
      }
      if (parameters.line1BorderRoundedness !== parameters.borderRoundedness) {
        onParameterChange('line1BorderRoundedness', parameters.borderRoundedness)
      }
      if (parameters.line2BorderRoundedness !== parameters.borderRoundedness) {
        onParameterChange('line2BorderRoundedness', parameters.borderRoundedness)
      }
    }
  }, [parameters.advancedBorderMode, parameters.borderThickness, parameters.borderRoundedness, onParameterChange])



  const handleFontSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const selected = fonts.find(f => f.value === val || f.name === val)
    if (selected) {
      // Only allow typeface.json fonts
      onParameterChange('font', selected.name)
      const url = selected.fileUrl || selected.value
      if (url && url.toLowerCase().endsWith('.typeface.json')) {
        onParameterChange('fontUrl', url)
      } else {
        onParameterChange('fontUrl', '')
      }
    } else {
      onParameterChange('font', val)
      onParameterChange('fontUrl', '')
    }
  }



  const tabs = [
    { id: 'text' as const, label: 'Text', icon: Type },
    { id: 'ring' as const, label: 'Ring', icon: Eye },
    { id: 'border' as const, label: 'Border', icon: Square },
    { id: 'colors' as const, label: 'Colors', icon: Palette },
    { id: 'bulk' as const, label: 'Bulk Order', icon: ListPlus },
    ...(isAdminMode ? [{ id: 'admin' as const, label: 'Settings', icon: Settings }] : [])
  ]

  return (
    <div className="bg-white flex flex-col">
      {/* Tab Navigation */}
      <div className="flex flex-col border-b border-gray-200 flex-shrink-0">
        {/* First three tabs */}
        <div className="flex">
          {tabs.slice(0, 3).map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
        
        {/* Colors and Bulk order tabs on second row */}
        <div className="flex">
          {tabs.slice(3).map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-6">
        {/* Generate Button - Always visible at top (except bulk order and admin tabs) */}
        {activeTab !== 'bulk' && activeTab !== 'admin' && (
          <div className="mb-6">
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 font-medium ${
                isGenerating 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
              }`}
            >
              {isGenerating ? 'Generating...' : 'Generate KEYGO'}
            </button>
          </div>
        )}

        {/* Text Settings Tab */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div className="input-group">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={parameters.showText}
                  onChange={(e) => onParameterChange('showText', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Show Text</span>
              </label>
            </div>

            {parameters.showText && (
              <>
                <div className="input-group">
              <label htmlFor="line1" className="text-sm font-medium text-gray-700">
                First Line:
              </label>
              <div className="relative">
                                  <input
                    type="text"
                    id="line1"
                    value={parameters.line1}
                    onChange={(e) => {
                      const newValue = isAdminMode ? e.target.value : e.target.value.replace(/[^a-zA-Z0-9\s'"]/g, '');
                      if (isAdminMode || (newValue.length + (parameters.line2?.length || 0)) <= 12) {
                        onParameterChange('line1', newValue);
                        // Clear second line if first line is empty
                        if (newValue.length === 0) {
                          onParameterChange('line2', '');
                        }
                      }
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                  />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                  {parameters.line1.length}{!isAdminMode && `/${12 - (parameters.line2?.length || 0)}`}
                </span>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="line2" className="text-sm font-medium text-gray-700">
                Second Line (Optional):
              </label>
              <div className="relative">
                                  <input
                    type="text"
                    id="line2"
                    value={parameters.line2}
                    onChange={(e) => {
                      const newValue = isAdminMode ? e.target.value : e.target.value.replace(/[^a-zA-Z0-9\s'"]/g, '');
                      // Only allow input if first line has content
                      if (parameters.line1.length > 0 && (isAdminMode || (newValue.length + parameters.line1.length) <= 12)) {
                        onParameterChange('line2', newValue);
                      }
                    }}
                    placeholder={parameters.line1.length === 0 ? "First line required" : ""}
                    disabled={parameters.line1.length === 0}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                  />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                  {parameters.line2?.length || 0}{!isAdminMode && `/${12 - parameters.line1.length}`}
                </span>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="font" className="text-sm font-medium text-gray-700">
                Font:
              </label>
              <div className="relative font-dropdown-container">
                <button
                  type="button"
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-white text-left flex items-center justify-between"
                  onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                >
                  <span style={{ fontFamily: `"${getGoogleFontName(parameters.font)}", sans-serif` }}>
                    {parameters.font}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                
                {isFontDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {fonts
                  .filter((f) => f.fileUrl?.toLowerCase().endsWith('.typeface.json'))
                  .map((font) => (
                        <button
                          key={font.value}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          onClick={() => {
                            handleFontSelect({ target: { value: font.value } } as any)
                            setIsFontDropdownOpen(false)
                          }}
                        >
                          <span style={{ fontFamily: `"${getGoogleFontName(font.name)}", sans-serif` }}>
                      {font.name}
                          </span>
                        </button>
                  ))}
                  </div>
                )}
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="lineSpacing" className="text-sm font-medium text-gray-700">
                Line Spacing:
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  id="lineSpacing"
                  min="0.8"
                  max="1.3"
                  step="0.1"
                  value={parameters.lineSpacing}
                  onChange={(e) => handleSliderChange('lineSpacing', e.target.value)}
                  className="flex-1"
                />
                <span className="value-display">{parameters.lineSpacing}</span>
              </div>
            </div>

            {/* Admin-only: First Line Font Size */}
            {isAdminMode && (
              <div className="input-group">
                <label htmlFor="fontSize" className="text-sm font-medium text-gray-700">
                  First Line Font Size:
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    id="fontSize"
                    min="1"
                    max="24"
                    step="1"
                    value={parameters.fontSize}
                    onChange={(e) => handleSliderChange('fontSize', e.target.value)}
                    className="flex-1"
                  />
                  <span className="value-display">{parameters.fontSize}</span>
                </div>
              </div>
            )}

            {/* Admin-only: Second Line Font Size */}
            {isAdminMode && (
              <div className="input-group">
                <label htmlFor="line2FontSize" className="text-sm font-medium text-gray-700">
                  Second Line Font Size:
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    id="line2FontSize"
                    min="1"
                    max="24"
                    step="1"
                    value={parameters.line2FontSize}
                    onChange={(e) => handleSliderChange('line2FontSize', e.target.value)}
                    className="flex-1"
                  />
                  <span className="value-display">{parameters.line2FontSize}</span>
                </div>
              </div>
            )}

            {/* Admin-only: Text Y Position */}
            {isAdminMode && (
              <div className="input-group">
                <label htmlFor="textOffsetY" className="text-sm font-medium text-gray-700">
                  Text Y Position:
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    id="textOffsetY"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={parameters.textOffsetY}
                    onChange={(e) => handleSliderChange('textOffsetY', e.target.value)}
                    className="flex-1"
                  />
                  <span className="value-display">{parameters.textOffsetY}mm</span>
                </div>
              </div>
            )}

            {/* Admin-only: Text Height */}
            {isAdminMode && (
              <div className="input-group">
                <label htmlFor="textHeight" className="text-sm font-medium text-gray-700">
                  Text Height:
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    id="textHeight"
                    min="0"
                    max="5"
                    step="0.1"
                    value={parameters.textHeight}
                    onChange={(e) => handleSliderChange('textHeight', e.target.value)}
                    className="flex-1"
                  />
                  <span className="value-display">{parameters.textHeight}mm</span>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        )}

        {/* Ring Settings Tab */}
        {activeTab === 'ring' && (
          <div className="space-y-4">
            <div className="input-group">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={parameters.showRing}
                  onChange={(e) => onParameterChange('showRing', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Show Ring</span>
              </label>
            </div>

            {parameters.showRing && (
              <>
                {/* Admin-only: Advanced Ring Controls */}
                {isAdminMode && (
              <div className="input-group">
                <label htmlFor="outerDiameter" className="text-sm font-medium text-gray-700">
                  Outer Diameter:
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    id="outerDiameter"
                    min="8"
                    max="15"
                    step="0.5"
                    value={parameters.outerDiameter}
                    onChange={(e) => handleSliderChange('outerDiameter', e.target.value)}
                    className="flex-1"
                  />
                  <span className="value-display">{parameters.outerDiameter}mm</span>
                </div>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="innerDiameter" className="text-sm font-medium text-gray-700">
                Inner Diameter:
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  id="innerDiameter"
                  min="2"
                  max="6"
                  step="0.5"
                  value={parameters.innerDiameter}
                  onChange={(e) => handleSliderChange('innerDiameter', e.target.value)}
                  className="flex-1"
                />
                <span className="value-display">{parameters.innerDiameter}mm</span>
              </div>
            </div>

            {/* Admin-only: Ring Height */}
            {isAdminMode && (
              <div className="input-group">
                <label htmlFor="ringHeight" className="text-sm font-medium text-gray-700">
                  Ring Height:
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    id="ringHeight"
                    min="1"
                    max="5"
                    step="0.1"
                    value={parameters.ringHeight}
                    onChange={(e) => handleSliderChange('ringHeight', e.target.value)}
                    className="flex-1"
                  />
                  <span className="value-display">{parameters.ringHeight}mm</span>
                </div>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="ringX" className="text-sm font-medium text-gray-700">
                X Position:
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  id="ringX"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={parameters.ringX}
                  onChange={(e) => handleSliderChange('ringX', e.target.value)}
                  className="flex-1"
                />
                <span className="value-display">{parameters.ringX}mm</span>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="ringY" className="text-sm font-medium text-gray-700">
                Y Position:
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  id="ringY"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={parameters.ringY}
                  onChange={(e) => handleSliderChange('ringY', e.target.value)}
                  className="flex-1"
                />
                <span className="value-display">{parameters.ringY}mm</span>
              </div>
            </div>
              </>
            )}
          </div>
        )}

        {/* Color Settings Tab */}
        {activeTab === 'colors' && (
          <div className="space-y-4">
            <div className="input-group">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={parameters.twoColors}
                  onChange={(e) => onParameterChange('twoColors', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Two Colors</span>
              </label>
            </div>

            <div className="space-y-4">
              <div className="input-group">
                <label htmlFor="baseColor" className="text-sm font-medium text-gray-700">
                  Border Color:
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <ColorDropdown
                      value={parameters.baseColor}
                      onChange={(value) => onParameterChange('baseColor', value)}
                      options={colorOptions}
                      className="mt-1"
                    />
                  </div>
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm mt-1"
                    style={{ backgroundColor: parameters.baseColor }}
                  />
                </div>
              </div>

              {parameters.twoColors && (
                <div className="input-group">
                  <label htmlFor="textColor" className="text-sm font-medium text-gray-700">
                    Text Color:
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <ColorDropdown
                        value={parameters.textColor}
                        onChange={(value) => onParameterChange('textColor', value)}
                        options={colorOptions}
                        className="mt-1"
                      />
                    </div>
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm mt-1"
                      style={{ backgroundColor: parameters.textColor }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Border Settings Tab */}
        {activeTab === 'border' && (
          <div className="space-y-4">
            {/* Advanced Mode Toggle */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Border Settings</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Basic</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parameters.advancedBorderMode}
                      onChange={(e) => handleSliderChange('advancedBorderMode', e.target.checked.toString())}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs text-gray-500">Advanced</span>
                </div>
              </div>
              
              {/* Global Border Settings - Only show in basic mode */}
              {!parameters.advancedBorderMode && (
                <div className="space-y-3">
            <div className="input-group">
              <label htmlFor="borderThickness" className="text-sm font-medium text-gray-700">
                      Thickness:
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  id="borderThickness"
                  min="1"
                  max="5"
                  step="0.1"
                  value={parameters.borderThickness}
                        onChange={(e) => {
                          const value = e.target.value
                          handleSliderChange('borderThickness', value)
                          // In basic mode, sync line-specific settings with global settings
                          handleSliderChange('line1BorderThickness', value)
                          handleSliderChange('line2BorderThickness', value)
                        }}
                  className="flex-1"
                />
                <span className="value-display">{parameters.borderThickness}mm</span>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="borderHeight" className="text-sm font-medium text-gray-700">
                      Height:
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  id="borderHeight"
                  min="1"
                  max="5"
                  step="0.1"
                  value={parameters.borderHeight}
                  onChange={(e) => handleSliderChange('borderHeight', e.target.value)}
                  className="flex-1"
                />
                <span className="value-display">{parameters.borderHeight}mm</span>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="borderRoundedness" className="text-sm font-medium text-gray-700">
                      Roundedness:
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  id="borderRoundedness"
                  min="0.1"
                  max="4.0"
                  step="0.1"
                  value={parameters.borderRoundedness}
                        onChange={(e) => {
                          const value = e.target.value
                          handleSliderChange('borderRoundedness', value)
                          // In basic mode, sync line-specific settings with global settings
                          handleSliderChange('line1BorderRoundedness', value)
                          handleSliderChange('line2BorderRoundedness', value)
                        }}
                  className="flex-1"
                />
                <span className="value-display">{parameters.borderRoundedness}</span>
              </div>
            </div>
                </div>
              )}

            </div>

            {/* Advanced Mode: Line-Specific Border Settings */}
            {parameters.advancedBorderMode && (
              <div className="space-y-4">
                {/* Border Height - Show in advanced mode */}
                <div className="input-group">
                  <label htmlFor="borderHeight" className="text-sm font-medium text-gray-700">
                    Height:
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      id="borderHeight"
                      min="1"
                      max="5"
                      step="0.1"
                      value={parameters.borderHeight}
                      onChange={(e) => handleSliderChange('borderHeight', e.target.value)}
                      className="flex-1"
                    />
                    <span className="value-display">{parameters.borderHeight}mm</span>
                  </div>
                </div>

                <hr className="border-gray-200" />

                <h3 className="text-sm font-semibold text-gray-800">Advanced Border Settings</h3>
                
                {/* First Line Border Settings */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-gray-600">First Line Border</h4>
                  
                  <div className="input-group">
                    <label htmlFor="line1BorderThickness" className="text-sm font-medium text-gray-700">
                      Thickness:
                    </label>
                    <div className="slider-container">
                      <input
                        type="range"
                        id="line1BorderThickness"
                        min="1"
                        max="5"
                        step="0.1"
                        value={parameters.line1BorderThickness}
                        onChange={(e) => handleSliderChange('line1BorderThickness', e.target.value)}
                        className="flex-1"
                      />
                      <span className="value-display">{parameters.line1BorderThickness}mm</span>
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="line1BorderRoundedness" className="text-sm font-medium text-gray-700">
                      Roundedness:
                    </label>
                    <div className="slider-container">
                      <input
                        type="range"
                        id="line1BorderRoundedness"
                        min="0.1"
                        max="4.0"
                        step="0.1"
                        value={parameters.line1BorderRoundedness}
                        onChange={(e) => handleSliderChange('line1BorderRoundedness', e.target.value)}
                        className="flex-1"
                      />
                      <span className="value-display">{parameters.line1BorderRoundedness}</span>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Second Line Border Settings */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-gray-600">Second Line Border</h4>
                  
                  <div className="input-group">
                    <label htmlFor="line2BorderThickness" className="text-sm font-medium text-gray-700">
                      Thickness:
                    </label>
                    <div className="slider-container">
                      <input
                        type="range"
                        id="line2BorderThickness"
                        min="1"
                        max="5"
                        step="0.1"
                        value={parameters.line2BorderThickness}
                        onChange={(e) => handleSliderChange('line2BorderThickness', e.target.value)}
                        className="flex-1"
                      />
                      <span className="value-display">{parameters.line2BorderThickness}mm</span>
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="line2BorderRoundedness" className="text-sm font-medium text-gray-700">
                      Roundedness:
                    </label>
                    <div className="slider-container">
                      <input
                        type="range"
                        id="line2BorderRoundedness"
                        min="0.1"
                        max="4.0"
                        step="0.1"
                        value={parameters.line2BorderRoundedness}
                        onChange={(e) => handleSliderChange('line2BorderRoundedness', e.target.value)}
                        className="flex-1"
                      />
                      <span className="value-display">{parameters.line2BorderRoundedness}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bulk Order Tab */}
        {activeTab === 'bulk' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Quick Bulk Order</h3>
              <p className="text-xs text-blue-700">
                Add multiple keychains quickly. Each keychain can have custom text, font, and colors.
              </p>
            </div>

            {/* Add New Keychain */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Add New Keychain</h4>
              
              {/* Individual Input Method */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="First line"
                    value={individualBulkInput.firstLine}
                    onChange={(e) => {
                      const newValue = e.target.value.replace(/[^a-zA-Z0-9\s'"]/g, '')
                      if (newValue.length <= 12) {
                        setIndividualBulkInput(prev => ({
                          ...prev,
                          firstLine: newValue,
                          secondLine: newValue.length === 0 ? '' : prev.secondLine
                        }))
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                    {individualBulkInput.firstLine.length}/12
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Second line (optional)"
                    value={individualBulkInput.secondLine}
                    onChange={(e) => {
                      const newValue = e.target.value.replace(/[^a-zA-Z0-9\s'"]/g, '')
                      const maxSecondLineLength = 12 - individualBulkInput.firstLine.length
                      
                      if (newValue.length <= maxSecondLineLength) {
                        setIndividualBulkInput(prev => ({
                          ...prev,
                          secondLine: newValue
                        }))
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                    {individualBulkInput.secondLine.length}/{12 - individualBulkInput.firstLine.length}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  const firstLine = individualBulkInput.firstLine.trim()
                  const secondLine = individualBulkInput.secondLine.trim()
                  
                  if (firstLine.length === 0) return
                  if (firstLine.length > 12) return
                  if (secondLine.length > 0 && (firstLine.length + secondLine.length) > 12) return
                  
                  // Check if we have room for one more keychain
                  if (bulkKeychains.length >= 10) {
                    showToast('Maximum 10 keychains reached. Please remove some first.', 'warning')
                    return
                  }
                  
                  const newKeychain = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: firstLine,
                    secondLine: secondLine,
                    font: parameters.font,
                    fontUrl: parameters.fontUrl || '',
                    baseColor: parameters.baseColor,
                    textColor: parameters.textColor
                  }
                  
                  setBulkKeychains(prev => [...prev, newKeychain])
                  setIndividualBulkInput({firstLine: '', secondLine: ''})
                  showToast('Keychain added to bulk list!', 'success')
                }}
                disabled={!individualBulkInput.firstLine.trim()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 font-medium ${
                  !individualBulkInput.firstLine.trim()
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                <ListPlus className="w-4 h-4" />
                Add Keychain
              </button>
            </div>

            {/* Bulk Paste Method */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Bulk Paste Names</h4>
              <div className="space-y-2">
                <textarea
                  placeholder="Paste multiple names here (one per line)&#10;John Doe&#10;Jane Smith - Manager&#10;Mike Johnson - CEO"
                  value={bulkNames}
                  onChange={(e) => setBulkNames(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {bulkNames.split('\n').filter(name => name.trim().length > 0).length} names ready to add
                  </p>
                  <button
                    onClick={() => {
                      const lines = bulkNames.split('\n').filter(line => line.trim().length > 0)
                      if (lines.length === 0) return
                      
                      // Check if we have room for all names
                      if (bulkKeychains.length + lines.length > 10) {
                        showToast(`Can only add ${10 - bulkKeychains.length} more keychains. Please remove some first.`, 'warning')
                        return
                      }
                      
                      const newKeychains = lines.map(line => {
                        const parts = line.split(' - ')
                        const firstLine = parts[0].trim().replace(/[^a-zA-Z0-9\s'"]/g, '')
                        const secondLine = parts[1] ? parts[1].trim().replace(/[^a-zA-Z0-9\s'"]/g, '') : ''
                        
                        return {
                          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                          name: firstLine,
                          secondLine: secondLine,
                          font: parameters.font,
                          fontUrl: parameters.fontUrl || '',
                          baseColor: parameters.baseColor,
                          textColor: parameters.textColor
                        }
                      })
                      
                      setBulkKeychains(prev => [...prev, ...newKeychains])
                      setBulkNames('')
                      showToast(`Added ${newKeychains.length} keychain${newKeychains.length > 1 ? 's' : ''} to bulk list!`, 'success')
                    }}
                    disabled={bulkNames.trim().length === 0}
                    className={`px-3 py-1 text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      bulkNames.trim().length === 0
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                    }`}
                  >
                    Add All Names
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Keychains List */}
            {bulkKeychains.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    Bulk Keychains ({bulkKeychains.length})
                  </h4>
                  <button
                    onClick={async (e) => {
                      e.preventDefault()
                      // Add all bulk keychains to the main cart
                      const keychainsToAdd = [...bulkKeychains] // Create a copy
                      
                      // Add all keychains sequentially
                      for (const keychain of keychainsToAdd) {
                        const customParameters = {
                          ...parameters, // Use current parameters as base
                          line1: keychain.name,
                          line2: keychain.secondLine || '',
                          // Use individual bulk keychain parameters
                          font: keychain.font,
                          fontUrl: keychain.fontUrl,
                          baseColor: keychain.baseColor,
                          textColor: keychain.textColor
                        }
                        // Pass the bulk keychain's ID to ensure uniqueness
                        onAddToList(customParameters, keychain.id)
                        // Small delay to ensure state updates
                        await new Promise(resolve => setTimeout(resolve, 10))
                      }
                      
                      // Clear bulk keychains after all additions are complete
                      setBulkKeychains([])
                      // Use a single toast for all additions to prevent multiple toasts
                      showToast(`Added ${keychainsToAdd.length} keychain${keychainsToAdd.length > 1 ? 's' : ''} to cart!`, 'success')
                    }}
                    disabled={isGenerating || keychainList.length + bulkKeychains.length > 10}
                    className={`px-3 py-1 text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isGenerating || keychainList.length + bulkKeychains.length > 10
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                    }`}
                  >
                    Add All to Cart
                  </button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bulkKeychains.map((keychain, index) => (
                    <div key={keychain.id} className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm">
                      <div className="flex items-center gap-3">
                        {/* Gradient Preview */}
                        <div 
                          className="w-6 h-6 rounded-lg shadow-sm flex-shrink-0"
                          style={{ 
                            background: `linear-gradient(135deg, ${keychain.baseColor} 0%, ${keychain.textColor} 100%)`
                          }}
                        />
                        
                        {/* Keychain Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 truncate">
                              {keychain.name}
                              {keychain.secondLine && ` - ${keychain.secondLine}`}
                            </span>
                            <button
                              onClick={() => {
                                setBulkKeychains(prev => prev.filter(k => k.id !== keychain.id))
                              }}
                              className="p-1 flex-shrink-0 text-red-500 hover:text-red-700"
                              title="Remove keychain"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          
                          {/* Individual Parameter Controls */}
                          <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                            <select
                              value={keychain.font}
                              onChange={(e) => {
                                const selectedFont = fonts.find(f => f.name === e.target.value)
                                setBulkKeychains(prev => prev.map(k => 
                                  k.id === keychain.id ? { 
                                    ...k, 
                                    font: e.target.value,
                                    fontUrl: selectedFont?.fileUrl || ''
                                  } : k
                                ))
                              }}
                              className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                            >
                              {fonts.map(font => (
                                <option key={font.value} value={font.name}>
                                  {font.name}
                                </option>
                              ))}
                            </select>
                            
                            <ColorDropdown
                              value={keychain.baseColor}
                              onChange={(value) => {
                                setBulkKeychains(prev => prev.map(k => 
                                  k.id === keychain.id ? { ...k, baseColor: value } : k
                                ))
                              }}
                              options={colorOptions}
                              className="text-xs"
                            />
                            
                            <ColorDropdown
                              value={keychain.textColor}
                              onChange={(value) => {
                                setBulkKeychains(prev => prev.map(k => 
                                  k.id === keychain.id ? { ...k, textColor: value } : k
                                ))
                              }}
                              options={colorOptions}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Checkout Button for Bulk Order */}
            {activeTab === 'bulk' && keychainList.length > 0 && !disableCheckout && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center justify-end">
                  <button
                    onClick={onPurchase}
                    disabled={isGenerating}
                    className={`px-3 py-1 text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isGenerating 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500'
                    }`}
                  >
                    Checkout
                  </button>
                </div>
                
                {/* Main Cart Keychains List */}
                <div className="space-y-2 max-h-48 overflow-y-auto mt-3">
                  {keychainList.map((keychain) => (
                    <div
                      key={keychain.id}
                      className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm"
                    >
                      <div className="flex items-start gap-3">
                        {/* Gradient Preview */}
                        <div 
                          className="w-8 h-8 rounded-lg shadow-sm flex-shrink-0"
                          style={{ 
                            background: `linear-gradient(135deg, ${keychain.parameters.baseColor} 0%, ${keychain.parameters.textColor} 100%)`
                          }}
                        />
                        
                        {/* Keychain Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 truncate">
                              {keychain.parameters.line1}
                              {keychain.parameters.line2 && ` - ${keychain.parameters.line2}`}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            Font: {keychain.parameters.font} | Base: {colorOptions.find(c => c.value === keychain.parameters.baseColor)?.name || 'Unknown'} | Text: {colorOptions.find(c => c.value === keychain.parameters.textColor)?.name || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Settings Management</h3>
              <p className="text-sm text-blue-700 mb-4">
                Export your current keychain settings to a JSON file, or import settings from a previously exported file.
              </p>
              
              <div className="space-y-3">
                {/* Export Settings */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">Export Settings</h4>
                    <p className="text-xs text-gray-600">Download current settings as JSON file</p>
                  </div>
                  <button
                    onClick={() => {
                      const settingsData = {
                        ...parameters,
                        exportedAt: new Date().toISOString(),
                        version: '1.0'
                      }
                      const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `keygo-settings-${new Date().toISOString().split('T')[0]}.json`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                      showToast('Settings exported successfully!', 'success')
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Export
                  </button>
      </div>

                {/* Import Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800">Import from File</h4>
                      <p className="text-xs text-gray-600">Load settings from JSON file</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              try {
                                const importedSettings = JSON.parse(event.target?.result as string)
                                // Validate that it's a valid settings object
                                if (importedSettings.line1 !== undefined && importedSettings.font !== undefined) {
                                  // Update all parameters
                                  Object.keys(importedSettings).forEach(key => {
                                    if (key !== 'exportedAt' && key !== 'version') {
                                      onParameterChange(key as keyof KeychainParameters, importedSettings[key])
                                    }
                                  })
                                  showToast('Settings imported successfully!', 'success')
                                } else {
                                  showToast('Invalid settings file format', 'error')
                                }
                              } catch (error) {
                                showToast('Error reading settings file', 'error')
                              }
                            }
                            reader.readAsText(file)
                          }
                        }}
                        className="hidden"
                        id="import-settings"
                      />
                      <label
                        htmlFor="import-settings"
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                      >
                        Import File
                      </label>
                    </div>
                  </div>

                  {/* JSON Paste Area */}
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Paste JSON Settings</h4>
                    <p className="text-xs text-gray-600 mb-3">Paste your JSON settings directly into the text area below</p>
                    <textarea
                      placeholder="Paste your JSON settings here..."
                      className="w-full h-32 p-3 text-xs font-mono border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      onChange={(e) => {
                        const jsonText = e.target.value.trim()
                        if (jsonText) {
                          try {
                            const importedSettings = JSON.parse(jsonText)
                            // Validate that it's a valid settings object
                            if (importedSettings.line1 !== undefined && importedSettings.font !== undefined) {
                              // Update all parameters
                              Object.keys(importedSettings).forEach(key => {
                                if (key !== 'exportedAt' && key !== 'version') {
                                  onParameterChange(key as keyof KeychainParameters, importedSettings[key])
                                }
                              })
                              showToast('Settings imported from paste!', 'success')
                              e.target.value = '' // Clear the textarea
                            } else {
                              showToast('Invalid JSON format - missing required fields', 'error')
                            }
                          } catch (error) {
                            // Don't show error for incomplete JSON while typing
                            if (jsonText.length > 10) {
                              showToast('Invalid JSON format', 'error')
                            }
                          }
                        }
                      }}
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      💡 Tip: Copy JSON from the preview below or from an exported file
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Settings Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Current Settings Preview</h3>
                <button
                  onClick={() => {
                    const settingsJson = JSON.stringify({
                      // Text settings
                      showText: parameters.showText,
                      line1: parameters.line1,
                      line2: parameters.line2,
                      font: parameters.font,
                      fontUrl: parameters.fontUrl,
                      textHeight: parameters.textHeight,
                      textSize: parameters.textSize,
                      fontSize: parameters.fontSize,
                      line2FontSize: parameters.line2FontSize,
                      lineSpacing: parameters.lineSpacing,
                      textOffsetY: parameters.textOffsetY,
                      
                      // Border settings
                      borderThickness: parameters.borderThickness,
                      borderHeight: parameters.borderHeight,
                      borderRoundedness: parameters.borderRoundedness,
                      advancedBorderMode: parameters.advancedBorderMode,
                      
                      // Line-specific border settings
                      line1BorderThickness: parameters.line1BorderThickness,
                      line1BorderRoundedness: parameters.line1BorderRoundedness,
                      line2BorderThickness: parameters.line2BorderThickness,
                      line2BorderRoundedness: parameters.line2BorderRoundedness,
                      
                      // Ring settings
                      showRing: parameters.showRing,
                      outerDiameter: parameters.outerDiameter,
                      innerDiameter: parameters.innerDiameter,
                      ringHeight: parameters.ringHeight,
                      ringX: parameters.ringX,
                      ringY: parameters.ringY,
                      
                      // Color settings
                      twoColors: parameters.twoColors,
                      baseColor: parameters.baseColor,
                      textColor: parameters.textColor
                    }, null, 2)
                    navigator.clipboard.writeText(settingsJson).then(() => {
                      showToast('Settings copied to clipboard!', 'success')
                    }).catch(() => {
                      showToast('Failed to copy to clipboard', 'error')
                    })
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                  title="Copy settings to clipboard"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <pre className="text-xs text-gray-600 overflow-auto max-h-40">
                  {JSON.stringify({
                    // Text settings
                    showText: parameters.showText,
                    line1: parameters.line1,
                    line2: parameters.line2,
                    font: parameters.font,
                    fontUrl: parameters.fontUrl,
                    textHeight: parameters.textHeight,
                    textSize: parameters.textSize,
                    fontSize: parameters.fontSize,
                    line2FontSize: parameters.line2FontSize,
                    lineSpacing: parameters.lineSpacing,
                    textOffsetY: parameters.textOffsetY,
                    
                    // Border settings
                    borderThickness: parameters.borderThickness,
                    borderHeight: parameters.borderHeight,
                    borderRoundedness: parameters.borderRoundedness,
                    advancedBorderMode: parameters.advancedBorderMode,
                    
                    // Line-specific border settings
                    line1BorderThickness: parameters.line1BorderThickness,
                    line1BorderRoundedness: parameters.line1BorderRoundedness,
                    line2BorderThickness: parameters.line2BorderThickness,
                    line2BorderRoundedness: parameters.line2BorderRoundedness,
                    
                    // Ring settings
                    showRing: parameters.showRing,
                    outerDiameter: parameters.outerDiameter,
                    innerDiameter: parameters.innerDiameter,
                    ringHeight: parameters.ringHeight,
                    ringX: parameters.ringX,
                    ringY: parameters.ringY,
                    
                    // Color settings
                    twoColors: parameters.twoColors,
                    baseColor: parameters.baseColor,
                    textColor: parameters.textColor
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Add to List Section - Always visible at bottom (except bulk order and admin tabs) */}
      {activeTab !== 'bulk' && activeTab !== 'admin' && (
      <div className="border-t border-gray-200 pt-6 mt-6 p-1">
        <div className="space-y-4">
          <button
            onClick={() => onAddToList()}
            disabled={isGenerating || keychainList.length >= 10}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 font-medium ${
              isGenerating || keychainList.length >= 10
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
            }`}
          >
            <ListPlus className="w-5 h-5" />
            {keychainList.length >= 10 ? 'Max 10 Keychains' : 'Add Keychain to Cart'}
          </button>
          
          <button
            onClick={onReset}
            disabled={isGenerating}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 font-medium ${
              isGenerating 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
            }`}
          >
            <RotateCcw className="w-5 h-5" />
            Reset to Defaults
          </button>
        </div>

        {/* Keychain List Display */}
        {keychainList.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-end">
              {!disableCheckout && (
              <button
                onClick={onPurchase}
                disabled={isGenerating}
                className={`px-3 py-1 text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isGenerating 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500'
                }`}
              >
                Checkout
              </button>
              )}
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  )
}
