'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { FontOption, defaultFonts } from '@/types/keychain'

interface FontDropdownProps {
  id: string
  value: string
  onChange: (fontName: string) => void
  className?: string
  fonts?: FontOption[]
  label?: string
}

function toGoogleFontUrlFamily(fontName: string): string {
  // Convert display name to Google Fonts URL family param, e.g. "Changa One" -> "Changa+One"
  return fontName.trim().replace(/\s+/g, '+')
}

export default function FontDropdown({
  id,
  value,
  onChange,
  className = 'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border',
  fonts = defaultFonts,
  label
}: FontDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Only include fonts that have a .typeface.json file available (usable by 3D generator)
  const filteredFonts = useMemo(
    () => fonts.filter((f) => f.fileUrl?.toLowerCase().endsWith('.typeface.json')),
    [fonts]
  )

  // Load Google Fonts stylesheet once for all families we show, to enable visual previews
  useEffect(() => {
    if (typeof document === 'undefined') return
    const linkId = 'eunoia-google-fonts'
    if (document.getElementById(linkId)) return

    const families = filteredFonts.map((f) => toGoogleFontUrlFamily(f.name))
    if (families.length === 0) return

    const href = `https://fonts.googleapis.com/css2?${families
      .map((fam) => `family=${fam}:wght@400;600`)
      .join('&')}&display=swap`

    const linkEl = document.createElement('link')
    linkEl.id = linkId
    linkEl.rel = 'stylesheet'
    linkEl.href = href
    document.head.appendChild(linkEl)
  }, [filteredFonts])

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

  const selectedFont = filteredFonts.find((f) => f.name === value) || filteredFonts[0]

  const handleFontSelect = (fontName: string) => {
    onChange(fontName)
    setIsOpen(false)
  }

  return (
    <div className="relative w-full font-dropdown-container" ref={dropdownRef}>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} w-full flex items-center justify-between cursor-pointer`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className="truncate"
          style={{ fontFamily: `"${selectedFont?.name}", sans-serif` }}
        >
          {selectedFont?.name || 'Select Font'}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredFonts.map((font) => (
            <button
              key={font.value}
              type="button"
              onClick={() => handleFontSelect(font.name)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between ${
                value === font.name ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
              }`}
            >
              <span className="truncate" style={{ fontFamily: `"${font.name}", sans-serif` }}>
                {font.name}
              </span>
              {value === font.name && <span className="ml-2 text-primary-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


