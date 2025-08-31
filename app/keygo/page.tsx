'use client'

import KeychainGenerator from '@/components/KeychainGenerator'

export default function KeygoPage() {
  return (
    <main className="min-h-fit bg-gray-50">
      <div className="container mx-auto px-4 py-4 lg:py-8">
        <header className="text-start mb-4 lg:mb-8">
          <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2 font-rethink">
            KEYGO Maker
          </h1>
          <p className="text-sm lg:text-base text-gray-600">
            Create your personalized keychain here.
          </p>
        </header>
        
        <div className="h-full">
          <KeychainGenerator />
        </div>
      </div>
    </main>
  )
}
