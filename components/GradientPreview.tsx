'use client'

import { KeychainParameters } from '@/types/keychain'

interface GradientPreviewProps {
  parameters: KeychainParameters
}

export default function GradientPreview({ parameters }: GradientPreviewProps) {
  const { baseColor, textColor, line1, line2 } = parameters

  return (
    <div className=" p-4">
      <div className="space-y-3">
        {/* Base Color Preview */}
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: baseColor }}
          />
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-600">Base Color</div>
          </div>
        </div>

        {/* Text Color Preview */}
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: textColor }}
          />
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-600">Text Color</div>
          </div>
        </div>
      </div>
    </div>
  )
}
