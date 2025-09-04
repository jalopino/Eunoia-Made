'use client'

import { useEffect, useState } from 'react'
import { KeychainParameters, FontOption, defaultFonts, colorOptions } from '@/types/keychain'
import { RotateCcw, X, Type, Palette, Eye, ListPlus } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'


interface ParameterControlsProps {
  parameters: KeychainParameters
  onParameterChange: (key: keyof KeychainParameters, value: any) => void
  onReset: () => void
  onGenerate: () => void
  onAddToList: (customParameters?: KeychainParameters, customId?: string) => void
  keychainList: any[]
  onRemoveKeychain: (id: string) => void
  onPurchase: () => void
  isGenerating?: boolean
}

export default function ParameterControls({
  parameters,
  onParameterChange,
  onReset,
  onGenerate,
  onAddToList,
  keychainList,
  onRemoveKeychain,
  onPurchase,
  isGenerating = false
}: ParameterControlsProps) {
  
  const { showToast } = useToast()
  
  // Helper function to convert hex colors to readable names
  const getColorName = (hexColor: string) => {
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
              {isGenerating ? 'Generating...' : 'Generate KEYGO'}
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
                      const newValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                      if ((newValue.length + (parameters.line2?.length || 0)) <= 12) {
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
                  {parameters.line1.length}/{12 - (parameters.line2?.length || 0)}
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
                      const newValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                      // Only allow input if first line has content
                      if (parameters.line1.length > 0 && (newValue.length + parameters.line1.length) <= 12) {
                        onParameterChange('line2', newValue);
                      }
                    }}
                    placeholder={parameters.line1.length === 0 ? "First line required" : ""}
                    disabled={parameters.line1.length === 0}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                  />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                  {parameters.line2?.length || 0}/{12 - parameters.line1.length}
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
          </div>
        )}

        {/* Ring Settings Tab */}
        {activeTab === 'ring' && (
          <div className="space-y-4">
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
                    placeholder="First line"
                    value={individualBulkInput.firstLine}
                    onChange={(e) => {
                      const newValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '')
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
                      const newValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '')
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
                        const firstLine = parts[0].trim().replace(/[^a-zA-Z0-9]/g, '')
                        const secondLine = parts[1] ? parts[1].trim().replace(/[^a-zA-Z0-9]/g, '') : ''
                        
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
                          ...parameters,
                          line1: keychain.name,
                          line2: keychain.secondLine || '',
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
                          
                          {/* Compact Controls */}
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Checkout Button for Bulk Order */}
            {activeTab === 'bulk' && keychainList.length > 0 && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    Your Keychains ({keychainList.length}/10)
                  </h4>
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
                            <button
                              onClick={() => onRemoveKeychain(keychain.id)}
                              disabled={isGenerating}
                              className={`p-1 flex-shrink-0 ${
                                isGenerating 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-red-500 hover:text-red-700'
                              }`}
                              title="Remove keychain"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
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


      </div>

      {/* Add to List Section - Always visible at bottom (except bulk order tab) */}
      {activeTab !== 'bulk' && (
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
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                Your Keychains ({keychainList.length}/10)
              </h4>
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
            
            <div className="space-y-2 min-h-fit overflow-y-auto">
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
                        <button
                          onClick={() => onRemoveKeychain(keychain.id)}
                          disabled={isGenerating}
                          className={`p-1 flex-shrink-0 ${
                            isGenerating 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-red-500 hover:text-red-700'
                          }`}
                          title="Remove keychain"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Font:</span> {keychain.parameters.font}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">Base:</span> {getColorName(keychain.parameters.baseColor)} • 
                        <span className="font-medium ml-1">Text:</span> {getColorName(keychain.parameters.textColor)}
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
    </div>
  )
}
