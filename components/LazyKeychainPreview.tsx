'use client'

import { lazy, Suspense } from 'react'
import { KeychainParameters } from '@/types/keychain'

// Lazy load the KeychainPreview component
const KeychainPreview = lazy(() => import('./KeychainPreview'))

interface LazyKeychainPreviewProps {
  type: 'regular' | 'rounded'
  parameters?: KeychainParameters
  className?: string
}

// Simple loading placeholder
function PreviewSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center ${className}`}>
      <div className="text-gray-400 text-sm">Loading preview...</div>
    </div>
  )
}

export default function LazyKeychainPreview({ type, parameters, className }: LazyKeychainPreviewProps) {
  return (
    <Suspense fallback={<PreviewSkeleton className={className} />}>
      <KeychainPreview type={type} parameters={parameters} className={className} />
    </Suspense>
  )
}
