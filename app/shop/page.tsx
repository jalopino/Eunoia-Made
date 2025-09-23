'use client'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import KeychainPreview from '@/components/KeychainPreview'

const products = [
  {
    id: 1,
    name: 'KEYGO',
    price: 40,
    description: 'Create custom keychains with your own text and designs.',
    link: '/keygo',
    category: 'maker',
    type: 'regular' as const
  },
  {
    id: 2,
    name: 'KEYTONE',
    price: 45,
    description: 'Design rounded keychains with personalized text and colors.',
    link: '/keytone',
    category: 'maker',
    type: 'rounded' as const
  },
]

export default function ShopPage() {

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="max-w-3xl text-start mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-rethink">
            Eunoia Made Shop
          </h1>
          <p className="text-lg text-gray-600">
            Create custom keychains with our interactive design tools.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="aspect-w-1 aspect-h-1 bg-gray-50">
                {/* 3D Keychain Preview */}
                <KeychainPreview type={product.type} />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">₱{product.price}</span>
                  <Link 
                    href={product.link}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Design Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
