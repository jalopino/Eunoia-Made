'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { FontOption } from '@/types/keychain'

interface FontModalProps {
  onClose: () => void
  onAddFont: (font: FontOption) => void
}

export default function FontModal({ onClose, onAddFont }: FontModalProps) {
  const [fontName, setFontName] = useState('')
  const [fontUrl, setFontUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fontName.trim()) return

    setIsLoading(true)

    try {
      // If a Google Fonts URL is provided, load it
      let resolvedFontFileUrl = ''
      if (fontUrl && fontUrl.includes('fonts.googleapis.com')) {
        // Load CSS to extract actual font file URL (woff2/ttf)
        const css = await fetch(fontUrl).then(r => r.text())
        const match = css.match(/url\(([^)]+)\) format\('(woff2|woff|truetype)'\)/)
        if (match && match[1]) {
          resolvedFontFileUrl = match[1].replace(/"/g, '')
        }

        // Also inject the stylesheet for general page font availability
        const link = document.createElement('link')
        link.href = fontUrl
        link.rel = 'stylesheet'
        document.head.appendChild(link)

        // Small delay to allow font to become available
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const isTypefaceJson = /\.typeface\.json$/i.test(fontUrl)
      const isDirectFile = /\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/.test(fontUrl) || isTypefaceJson
      const newFont: FontOption = {
        name: fontName.trim(),
        value: fontName.trim(),
        fileUrl: isDirectFile ? fontUrl : resolvedFontFileUrl,
        googleFont: !!fontUrl && fontUrl.includes('fonts.googleapis.com')
      }

      onAddFont(newFont)
      setFontName('')
      setFontUrl('')
    } catch (error) {
      console.error('Error loading font:', error)
      alert('Error loading font. Please check the URL and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Custom Font</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-group">
            <label htmlFor="font-name" className="text-sm font-medium text-gray-700">
              Font Name:
            </label>
            <input
              type="text"
              id="font-name"
              value={fontName}
              onChange={(e) => setFontName(e.target.value)}
              placeholder="Enter font family name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="font-url" className="text-sm font-medium text-gray-700">
              Google Fonts URL (Optional):
            </label>
            <input
              type="url"
              id="font-url"
              value={fontUrl}
              onChange={(e) => setFontUrl(e.target.value)}
              placeholder="https://fonts.googleapis.com/css2?family=..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div className="text-sm text-gray-600">
            <p className="mb-2">To add a Google Font:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Go to <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Google Fonts</a></li>
              <li>Select your desired font</li>
              <li>Copy the CSS import URL</li>
              <li>Paste it in the URL field above</li>
            </ol>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fontName.trim() || isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Add Font'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
