'use client'

import { useState } from 'react'
import { KeychainListItem } from '@/types/keychain'
import { Trash2, ShoppingCart, Eye } from 'lucide-react'
import KeychainViewer from './KeychainViewer'

interface KeychainListProps {
  keychains: KeychainListItem[]
  onRemoveKeychain: (id: string) => void
  onPurchase: () => void
}

export default function KeychainList({ keychains, onRemoveKeychain, onPurchase }: KeychainListProps) {
  const [selectedKeychain, setSelectedKeychain] = useState<KeychainListItem | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  if (keychains.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No keychains added yet</p>
        <p className="text-sm">Generate a keychain and add it to your list to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Your Keychain List ({keychains.length})
        </h3>
        <button
          onClick={onPurchase}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 font-medium"
        >
          <ShoppingCart className="w-4 h-4" />
          Buy Keychains
        </button>
      </div>

      <div className="grid gap-4">
        {keychains.map((keychain) => (
          <div
            key={keychain.id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="font-medium text-gray-900">
                    {keychain.parameters.line1}
                    {keychain.parameters.line2 && ` - ${keychain.parameters.line2}`}
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {keychain.parameters.font}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Colors:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: keychain.parameters.baseColor }}
                      />
                      {keychain.parameters.twoColors && (
                        <div
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: keychain.parameters.textColor }}
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Ring:</span>
                    <span className="ml-1">
                      {keychain.parameters.showRing ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-400 mt-2">
                  Added {keychain.addedAt.toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    setSelectedKeychain(keychain)
                    setShowPreview(true)
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  title="Preview keychain"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRemoveKeychain(keychain.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                  title="Remove keychain"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedKeychain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Preview: {selectedKeychain.parameters.line1}
                {selectedKeychain.parameters.line2 && ` - ${selectedKeychain.parameters.line2}`}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="h-96">
                <KeychainViewer 
                  parameters={selectedKeychain.parameters} 
                  commitId={Date.now()} 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
