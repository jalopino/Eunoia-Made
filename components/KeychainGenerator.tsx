'use client'

import { useState, useCallback, useRef } from 'react'
import ParameterControls from './ParameterControls'
import KeychainViewer from './KeychainViewer'

import { KeychainParameters, defaultParameters, KeychainListItem } from '@/types/keychain'
import { X, ShoppingCart } from 'lucide-react'


export default function KeychainGenerator() {
  const [parameters, setParameters] = useState<KeychainParameters>(defaultParameters)
  const [pendingParameters, setPendingParameters] = useState<KeychainParameters>(defaultParameters)
  const [commitId, setCommitId] = useState(0)
  const [keychainList, setKeychainList] = useState<KeychainListItem[]>([])
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  
  const previewRef = useRef<HTMLDivElement>(null)

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
      '#E6E6FA': 'Lavender Purple'
    }
    return colorMap[hexColor] || hexColor
  }

  const updateParameter = useCallback((key: keyof KeychainParameters, value: any) => {
    setPendingParameters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const resetToDefaults = useCallback(() => {
    setPendingParameters(defaultParameters)
  }, [])

  const handleGenerate = useCallback(() => {
    
    // Scroll to preview section on mobile
    if (window.innerWidth < 1024 && previewRef.current) {
      previewRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      })
    }
    
    // Simulate sync handoff; in real flow, heavy work kicks in within viewer
    requestAnimationFrame(() => {
      setParameters(pendingParameters)
      setCommitId((c) => c + 1)
    })
  }, [pendingParameters])

  const handleAddToList = useCallback(async () => {
    const newKeychain: KeychainListItem = {
      id: Date.now().toString(),
      parameters: { ...parameters },
      addedAt: new Date().toISOString()
    }
    setKeychainList(prev => [...prev, newKeychain])
  }, [parameters])

  const handleRemoveKeychain = useCallback((id: string) => {
    setKeychainList(prev => prev.filter(k => k.id !== id))
  }, [])

  const handlePurchase = useCallback(() => {
    setShowPurchaseForm(true)
  }, [])

  const handlePurchaseSubmit = useCallback((formData: any) => {
    // Here you would typically send the order to your backend
    console.log('Order submitted:', formData)
    alert('Order submitted successfully! We will contact you soon.')
    setShowPurchaseForm(false)
    setKeychainList([])
  }, [])

  return (
    <div className="flex flex-col lg:flex-row h-fit gap-5">
      {/* Parameter Controls - Above preview on mobile, sidebar on desktop */}
      <div className="lg:w-80 lg:bg-white lg:rounded-lg lg:p-3 lg:shadow-sm lg:border lg:border-gray-200">
        <div className="lg:h-full lg:flex lg:flex-col">
          <div className="lg:flex-1 lg:overflow-y-auto">
            <ParameterControls
              parameters={pendingParameters}
              onParameterChange={updateParameter}
              onReset={resetToDefaults}
              onGenerate={handleGenerate}
              onAddToList={handleAddToList}
              keychainList={keychainList}
              onRemoveKeychain={handleRemoveKeychain}
              onPurchase={handlePurchase}
            />
          </div>
        </div>
      </div>

      {/* 3D Viewer */}
      <div className="flex-1 min-h-0 relative" ref={previewRef}>
        <div className="relative h-full">
            <KeychainViewer parameters={parameters} commitId={commitId} />
        </div>
      </div>

      {/* Purchase Form Modal */}
      {showPurchaseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Purchase Keychains</h2>
                <button
                  onClick={() => setShowPurchaseForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Keychain List */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Selected Keychains</h3>
                <div className="space-y-3">
                  {keychainList.map((item) => (
                    <div key={item.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        {/* Gradient Preview */}
                        <div 
                          className="w-8 h-8 rounded-lg shadow-sm flex-shrink-0"
                          style={{ 
                            background: `linear-gradient(135deg, ${item.parameters.baseColor} 0%, ${item.parameters.textColor} 100%)`
                          }}
                        />
                        
                        {/* Keychain Details */}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">
                            {item.parameters.line1 || 'No text'}
                          </div>
                          {item.parameters.line2 && (
                            <div className="text-sm text-gray-600">
                              {item.parameters.line2}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Font: {item.parameters.font} | Ring: {item.parameters.showRing ? 'Yes' : 'No'} | Base: {getColorName(item.parameters.baseColor)} | Text: {getColorName(item.parameters.textColor)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Form */}
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery or Pickup</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select option</option>
                    <option value="delivery">Delivery</option>
                    <option value="pickup">Pickup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Receipt Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Order
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
