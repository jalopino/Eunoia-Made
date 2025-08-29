'use client'

import { useState } from 'react'
import KeychainGenerator from '@/components/KeychainGenerator'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            KEYGO Viewer
          </h1>
          <p className="text-gray-600">
            See how your keychain will look like before you order it.
          </p>
        </header>
        
        <KeychainGenerator />
      </div>
    </main>
  )
}
