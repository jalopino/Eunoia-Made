'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'

const products = [
  {
    id: 1,
    name: 'Classic KEYGO',
    price: 19.99,
    image: '/images/classic-keygo.jpg',
    description: 'Our signature keychain with a timeless design.',
  },
  {
    id: 2,
    name: 'Premium KEYGO',
    price: 29.99,
    image: '/images/premium-keygo.jpg',
    description: 'Luxury materials with enhanced durability.',
  },
  {
    id: 3,
    name: 'Mini KEYGO',
    price: 14.99,
    image: '/images/mini-keygo.jpg',
    description: 'Compact size, perfect for minimalists.',
  },
  {
    id: 4,
    name: 'KEYGO Pro',
    price: 39.99,
    image: '/images/pro-keygo.jpg',
    description: 'Advanced features for the demanding user.',
  },
  {
    id: 5,
    name: 'KEYGO Glow',
    price: 24.99,
    image: '/images/glow-keygo.jpg',
    description: 'Unique glow-in-the-dark material.',
  },
  {
    id: 6,
    name: 'KEYGO Metal',
    price: 34.99,
    image: '/images/metal-keygo.jpg',
    description: 'Solid metal construction for durability.',
  },
]

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-rethink">
            Eunoia Made Shop
          </h1>
          <p className="text-lg text-gray-600">
            Browse our collection of premium keychains and accessories.
          </p>
        </div>

        {/* Categories */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-brand-blue text-white'
                : 'bg-white text-gray-600 hover:bg-brand-blue/5'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setSelectedCategory('classic')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'classic'
                ? 'bg-brand-blue text-white'
                : 'bg-white text-gray-600 hover:bg-brand-blue/5'
            }`}
          >
            Classic
          </button>
          <button
            onClick={() => setSelectedCategory('premium')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'premium'
                ? 'bg-brand-blue text-white'
                : 'bg-white text-gray-600 hover:bg-brand-blue/5'
            }`}
          >
            Premium
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                {/* Replace with actual product images */}
                <div className="w-full h-64 bg-brand-blue/5 flex items-center justify-center">
                  <span className="text-brand-blue font-medium">Product Image</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 transition-colors">
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
