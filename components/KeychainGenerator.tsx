'use client'

import { useState, useCallback } from 'react'
import ParameterControls from './ParameterControls'
import KeychainViewer from './KeychainViewer'
import PurchaseForm from './PurchaseForm'
import { KeychainParameters, defaultParameters, KeychainListItem } from '@/types/keychain'
import { Settings, X, ShoppingCart } from 'lucide-react'
import { generate3DPreview, generateStylizedPreview } from '@/utils/previewGenerator'

export default function KeychainGenerator() {
  const [parameters, setParameters] = useState<KeychainParameters>(defaultParameters)
  const [pendingParameters, setPendingParameters] = useState<KeychainParameters>(defaultParameters)
  const [isGenerating, setIsGenerating] = useState(false)
  const [commitId, setCommitId] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [keychainList, setKeychainList] = useState<KeychainListItem[]>([])
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)

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
    setIsGenerating(true)
    // Simulate sync handoff; in real flow, heavy work kicks in within viewer
    requestAnimationFrame(() => {
      setParameters(pendingParameters)
      setCommitId((c) => c + 1)
      setIsGenerating(false)
    })
  }, [pendingParameters])

  const handleAddToList = useCallback(async () => {
    // Wait a bit for the 3D scene to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Find the 3D viewer canvas and capture it
    const canvas = document.querySelector('canvas') as HTMLCanvasElement
    let previewImage: string
    
    // Generate a proper 3D preview
    previewImage = await generate3DPreview(parameters)
    
    const newKeychain: KeychainListItem = {
      id: Date.now().toString(),
      parameters: { ...parameters },
      previewImage,
      addedAt: new Date()
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div className="flex h-screen relative gap-5">
      {/* Mobile Sidebar Toggle Button - Only visible when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="lg:hidden fixed right-8 top-[20%] transform -translate-y-1/2 z-50 p-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}



      {/* Parameter Controls Sidebar */}
      <div className={`
        fixed lg:static top-1/2 -translate-y-1/2 md:top-0 md:-translate-y-0 inset-y-0 left-0 z-40 h-fit w-fit bg-white shadow-xl lg:shadow-none rounded-lg p-3
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full overflow-y-auto">
          {/* Close button for mobile modal */}
          <div className="lg:hidden flex justify-end mb-3">
            <button
              onClick={closeSidebar}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
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

      {/* Overlay for sidebar */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* 3D Viewer */}
      <div className="flex-1 min-h-0 relative">
        <div className="relative h-full">
          <div className={isGenerating ? 'blur-sm' : ''}>
            <KeychainViewer parameters={parameters} commitId={commitId} />
          </div>
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-4 py-2 rounded-md text-white text-sm" style={{ background: 'rgba(0,0,0,0.55)' }}>
                Generating…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Form Modal */}
      {showPurchaseForm && (
        <PurchaseForm
          keychains={keychainList}
          onClose={() => setShowPurchaseForm(false)}
          onSubmit={handlePurchaseSubmit}
        />
      )}
    </div>
  )
}
