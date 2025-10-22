'use client'

import { useState } from 'react'
import { X, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // Helper function to convert hex colors to readable names
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
    '#967BB6': 'Lavender Purple'
  }

  const getColorName = (hexColor: string) => {
    return colorMap[hexColor.toUpperCase()] || colorMap[hexColor] || hexColor
  }

  if (!isOpen) return null

  const handleCheckout = () => {
    setIsCheckingOut(true)
    // Here you would typically redirect to a checkout page or open a checkout modal
    // For now, we'll just show an alert
    setTimeout(() => {
      alert('Checkout functionality would be implemented here!')
      setIsCheckingOut(false)
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-brand-blue" />
              <h3 className="text-lg font-semibold text-gray-900">
                Shopping Cart ({getTotalItems()})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 overflow-y">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start adding some keychains to your cart!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {item.parameters.line1 || 'No text'}
                        {item.parameters.line2 && `, ${item.parameters.line2}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        [{getColorName(item.parameters.baseColor)}]
                        {item.parameters.twoColors && `, [${getColorName(item.parameters.textColor)}]`}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        ₱{item.price}
                      </p>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Clear Cart Button */}
              {items.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear your cart? This action cannot be undone.')) {
                      clearCart()
                    }
                  }}
                  className="w-full text-sm text-gray-500 hover:text-red-600 py-2"
                >
                  Clear Cart
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">
                Total: ₱{getTotalPrice()}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full inline-flex justify-center rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50"
            >
              {isCheckingOut ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
