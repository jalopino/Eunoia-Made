'use client'

import { useEffect, useState } from 'react'
import { KeychainParameters, FontOption, defaultFonts, colorOptions } from '@/types/keychain'
import { Plus, RotateCcw, X, Type, Palette, Settings, Eye, ListPlus } from 'lucide-react'
import FontModal from './FontModal'


interface ParameterControlsProps {
  parameters: KeychainParameters
  onParameterChange: (key: keyof KeychainParameters, value: any) => void
  onReset: () => void
  onGenerate: () => void
  onAddToList: () => void
  keychainList: any[]
  onRemoveKeychain: (id: string) => void
  onPurchase: () => void
}

export default function ParameterControls({
  parameters,
  onParameterChange,
  onReset,
  onGenerate,
  onAddToList,
  keychainList,
  onRemoveKeychain,
  onPurchase
}: ParameterControlsProps) {
  const [fonts, setFonts] = useState<FontOption[]>(defaultFonts)
  const [showFontModal, setShowFontModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'text' | 'ring' | 'colors'>('text')

  // Auto-detect typeface.json in public/fonts and add to list
  useEffect(() => {
    let ignore = false
    fetch('/api/fonts')
      .then((r) => r.json())
      .then((data) => {
        if (ignore) return
        if (data?.fonts?.length) {
          const autoFonts: FontOption[] = data.fonts.map((f: any) => ({
            name: f.name,
            value: f.name,
            fileUrl: f.fileUrl,
          }))
          setFonts((prev) => {
            const map = new Map<string, FontOption>()
            ;[...prev, ...autoFonts].forEach((f) => map.set(f.name, f))
            return Array.from(map.values())
          })
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

  const handleAddFont = (newFont: FontOption) => {
    setFonts(prev => [...prev, newFont])
    // Set display font name and fontUrl if a file URL was provided
    onParameterChange('font', newFont.name)
    const url = newFont.fileUrl || newFont.value
    if (url && /\.typeface\.json$/i.test(url)) onParameterChange('fontUrl', url)
    setShowFontModal(false)
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
    { id: 'colors', label: 'Colors', icon: Palette }
  ] as const

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        {tabs.map((tab) => {
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

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Generate Button - Always visible at top */}
        <div className="mb-6">
          <button
            onClick={onGenerate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 font-medium"
          >
            Generate 3D Model
          </button>
        </div>

        {/* Text Settings Tab */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div className="input-group">
              <label htmlFor="line1" className="text-sm font-medium text-gray-700">
                First Line:
              </label>
              <input
                type="text"
                id="line1"
                value={parameters.line1}
                onChange={(e) => onParameterChange('line1', e.target.value)}
                maxLength={20}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div className="input-group">
              <label htmlFor="line2" className="text-sm font-medium text-gray-700">
                Second Line (Optional):
              </label>
              <input
                type="text"
                id="line2"
                value={parameters.line2}
                onChange={(e) => onParameterChange('line2', e.target.value)}
                maxLength={20}
                placeholder="Leave empty for single line"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div className="input-group">
              <label htmlFor="font" className="text-sm font-medium text-gray-700">
                Font:
              </label>
              <div className="flex gap-2">
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
                <button
                  onClick={() => setShowFontModal(true)}
                  className="mt-1 px-3 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <Plus className="w-4 h-4" />
                </button>
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
                  max="2"
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
              <div className="space-y-4 pl-4 border-l-2 border-gray-200">
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

            <div className="input-group">
              <label htmlFor="baseColor" className="text-sm font-medium text-gray-700">
                Base Color:
              </label>
              <select
                id="baseColor"
                value={parameters.baseColor}
                onChange={(e) => onParameterChange('baseColor', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              >
                {colorOptions.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>

            {parameters.twoColors && (
              <div className="input-group">
                <label htmlFor="textColor" className="text-sm font-medium text-gray-700">
                  Text Color:
                </label>
                <select
                  id="textColor"
                  value={parameters.textColor}
                  onChange={(e) => onParameterChange('textColor', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                >
                  {colorOptions.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add to List Section - Always visible at bottom */}
      <div className="border-t border-gray-200 pt-6 mt-6 p-1">
        <div className="space-y-4">
          <button
            onClick={onAddToList}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 font-medium"
          >
            <ListPlus className="w-5 h-5" />
            Add Keychain to List
          </button>
          
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
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
                Your Keychains ({keychainList.length})
              </h4>
              <button
                onClick={onPurchase}
                className="px-3 py-1 text-xs bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Buy All
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {keychainList.map((keychain) => (
                <div
                  key={keychain.id}
                  className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm"
                >
                  <div className="flex items-start gap-3">
                    {/* Preview Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={keychain.previewImage}
                        alt="Keychain preview"
                        className="w-16 h-12 object-contain bg-white rounded border border-gray-200"
                      />
                    </div>
                    
                    {/* Keychain Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 truncate">
                          {keychain.parameters.line1}
                          {keychain.parameters.line2 && ` - ${keychain.parameters.line2}`}
                        </span>
                        <button
                          onClick={() => onRemoveKeychain(keychain.id)}
                          className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                          title="Remove keychain"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Font:</span> {keychain.parameters.font} • 
                        <span className="font-medium ml-1">Ring:</span> {keychain.parameters.showRing ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Font Modal */}
      {showFontModal && (
        <FontModal
          onClose={() => setShowFontModal(false)}
          onAddFont={handleAddFont}
        />
      )}
    </div>
  )
}
