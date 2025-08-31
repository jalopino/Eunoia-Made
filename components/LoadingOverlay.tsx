'use client'

import { useEffect, useState } from 'react'

interface LoadingOverlayProps {
  isLoading: boolean
  progress?: number // 0 to 100
}

export default function LoadingOverlay({ isLoading, progress = 0 }: LoadingOverlayProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setShow(true)
    } else {
      // Delay hiding to allow fade out animation
      const timer = setTimeout(() => setShow(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!show) return null

  return (
    <div 
      className={`fixed inset-0 bg-white backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-500 ${isLoading ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="relative flex flex-col items-center gap-8">
        {/* Logo */}
        <img src="/EUNOIA LOGO.png" alt="Eunoia Made" className="h-16 w-auto" />
        
        {/* Loading bar container */}
        <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden relative">
          {/* Static progress bar */}
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-blue via-brand-green via-brand-yellow to-brand-red rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
          {/* Animated gradient overlay */}
          <div 
            className="absolute inset-0 animate-gradient bg-gradient-to-r from-brand-blue via-brand-green via-brand-yellow to-brand-red bg-[length:300%_auto] opacity-50" 
          />
        </div>

        {/* Loading text */}
        <div className="text-lg font-medium text-gray-600">
          {progress < 100 ? 'Loading...' : 'Ready!'}
        </div>
      </div>
    </div>
  )
}