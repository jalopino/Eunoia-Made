'use client'

import { useEffect, useState } from 'react'
import { KeychainParameters, FontOption, defaultFonts, colorOptions } from '@/types/keychain'
import { RotateCcw, X, Type, Palette, Eye, ListPlus } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'


interface RoundedParameterControlsProps {
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

export default function RoundedParameterControls({
  parameters,
  onParameterChange,
  onReset,
  onGenerate,
  onAddToList,
  keychainList,
  onPurchase,
  isGenerating = false,
  disableCheckout = false
}: RoundedParameterControlsProps) {
  
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
  const [activeTab, setActiveTab] = useState<'text' | 'ring' | 'colors' | 'bulk'>('text')
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
    onParameterChange(key, parseFloat(value))
  }



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
    { id: 'text', label: 'Text', icon: Type },
    { id: 'ring', label: 'Ring', icon: Eye },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'bulk', label: 'Bulk Order', icon: ListPlus }
  ] as const

  return (
    <div className="bg-white flex flex-col">
      {/* Tab Navigation */}
      <div className="flex flex-col border-b border-gray-200 flex-shrink-0">
        {/* Original three tabs */}
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
        
        {/* Bulk order tab on separate row */}
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
        {/* Generate Button - Always visible at top (except bulk order tab) */}
        {activeTab !== 'bulk' && (
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
              {isGenerating ? 'Generating...' : 'Generate KEYTONE'}
            </button>
          </div>
        )}

        {/* Text Settings Tab */}
        {activeTab === 'text' && (
          <div className="space-y-4">
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
              <label htmlFor="font" className="text-sm font-medium text-gray-700">
                Font:
              </label>
              <select
                id="font"
                value={parameters.font}
                onChange={handleFontSelect}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              >
                {fonts
                  .filter((f) => f.fileUrl?.toLowerCase().endsWith('.typeface.json'))
                  .map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.name}
                    </option>
                  ))}
              </select>
            </div>

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

            <div className="input-group">
              <label htmlFor="borderThickness" className="text-sm font-medium text-gray-700">
                Border Width:
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  id="borderThickness"
                  min="1"
                  max="2.5"
                  step="0.1"
                  value={parameters.borderThickness}
                  onChange={(e) => handleSliderChange('borderThickness', e.target.value)}
                  className="flex-1"
                />
                <span className="value-display">{parameters.borderThickness}mm</span>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="borderRoundedness" className="text-sm font-medium text-gray-700">
                Border Roundedness:
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  id="borderRoundedness"
                  min="0.1"
                  max="4.0"
                  step="0.1"
                  value={parameters.borderRoundedness}
                  onChange={(e) => handleSliderChange('borderRoundedness', e.target.value)}
                  className="flex-1"
                />
                <span className="value-display">{parameters.borderRoundedness}</span>
              </div>
            </div>

            {/* Admin-only: Border Height */}
            {isAdminMode && (
              <div className="input-group">
                <label htmlFor="borderHeight" className="text-sm font-medium text-gray-700">
                  Border Height:
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
                  Base Color:
                </label>
                <div className="flex items-center gap-3">
                  <select
                    id="baseColor"
                    value={parameters.baseColor}
                    onChange={(e) => onParameterChange('baseColor', e.target.value)}
                    className="mt-1 block flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                  >
                    {colorOptions.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.name}
                      </option>
                    ))}
                  </select>
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
                    <select
                      id="textColor"
                      value={parameters.textColor}
                      onChange={(e) => onParameterChange('textColor', e.target.value)}
                      className="mt-1 block flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                    >
                      {colorOptions.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.name}
                        </option>
                      ))}
                    </select>
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
                    placeholder="Text"
                    value={individualBulkInput.firstLine}
                    onChange={(e) => {
                      const newValue = e.target.value.replace(/[^a-zA-Z0-9\s'"]/g, '')
                      if (newValue.length <= 12) {
                        setIndividualBulkInput(prev => ({
                          ...prev,
                          firstLine: newValue,
                          secondLine: ''
                        }))
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                    {individualBulkInput.firstLine.length}/12
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  const firstLine = individualBulkInput.firstLine.trim()
                  
                  if (firstLine.length === 0) return
                  if (firstLine.length > 12) return
                  
                  // Check if we have room for one more keychain
                  if (bulkKeychains.length >= 10) {
                    showToast('Maximum 10 keychains reached. Please remove some first.', 'warning')
                    return
                  }
                  
                  const newKeychain = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: firstLine,
                    secondLine: '',
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

            {/* Bulk Keychains List */}
            {bulkKeychains.length > 0 && (
              <div className="space-y-3">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bulkKeychains.map((keychain) => (
                    <div key={keychain.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {keychain.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {keychain.font} • {getColorName(keychain.baseColor)} • {getColorName(keychain.textColor)}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setBulkKeychains(prev => prev.filter(k => k.id !== keychain.id))
                            showToast('Keychain removed from bulk list', 'info')
                          }}
                          className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Individual Parameter Controls */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
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
                        
                        <select
                          value={keychain.baseColor}
                          onChange={(e) => {
                            setBulkKeychains(prev => prev.map(k => 
                              k.id === keychain.id ? { ...k, baseColor: e.target.value } : k
                            ))
                          }}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                        >
                          {colorOptions.map(color => (
                            <option key={color.value} value={color.value}>
                              {color.name}
                            </option>
                          ))}
                        </select>
                        
                        <select
                          value={keychain.textColor}
                          onChange={(e) => {
                            setBulkKeychains(prev => prev.map(k => 
                              k.id === keychain.id ? { ...k, textColor: e.target.value } : k
                            ))
                          }}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                        >
                          {colorOptions.map(color => (
                            <option key={color.value} value={color.value}>
                              {color.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {bulkKeychains.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    bulkKeychains.forEach(keychain => {
                      const customParams = {
                        ...parameters, // Use current parameters as base
                        line1: keychain.name,
                        line2: '',
                        // Use individual bulk keychain parameters
                        font: keychain.font,
                        fontUrl: keychain.fontUrl,
                        baseColor: keychain.baseColor,
                        textColor: keychain.textColor
                      }
                      onAddToList(customParams, keychain.id)
                    })
                    setBulkKeychains([])
                    showToast(`Added ${bulkKeychains.length} keychains to cart!`, 'success')
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium"
                >
                  <ListPlus className="w-4 h-4" />
                  Add All to Cart ({bulkKeychains.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Keychain List */}
      {keychainList.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-end mb-3">
            {!disableCheckout && (
              <button
                onClick={onPurchase}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Purchase
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .input-group {
          margin-bottom: 1rem;
        }
        
        .slider-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .slider-container input[type="range"] {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: #e5e7eb;
          outline: none;
          -webkit-appearance: none;
        }
        
        .slider-container input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider-container input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .value-display {
          min-width: 60px;
          text-align: right;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }
      `}</style>
    </div>
  )
}
