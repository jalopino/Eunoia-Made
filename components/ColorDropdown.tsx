'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { colorOptions } from '@/types/keychain'

interface ColorDropdownProps {
  id: string
  value: string
  onChange: (value: string) => void
  className?: string
  label?: string
}

export default function ColorDropdown({ 
  id, 
  value, 
  onChange, 
  className = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border",
  label 
}: ColorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const selectedColor = colorOptions.find(color => color.value === value)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleColorSelect = (colorValue: string) => {
    onChange(colorValue)
    setIsOpen(false)
  }
  
  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Custom Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} w-full flex items-center justify-between cursor-pointer`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: value }}
          />
          <span>{selectedColor?.name || 'Select Color'}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => handleColorSelect(color.value)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                value === color.value ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
              }`}
            >
              <div 
                className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: color.value }}
              />
              <span className="text-sm">{color.name}</span>
              {value === color.value && (
                <span className="ml-auto text-primary-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
