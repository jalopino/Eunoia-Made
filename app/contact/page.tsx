'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Send, Upload, X } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    honeypot: '' // Hidden field to catch bots
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState('')

  const validateFile = (file: File): string | null => {
    // Check file size (3MB limit)
    if (file.size > 3 * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is 3MB.`
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return `File "${file.name}" is not supported. Only images and PDFs are allowed.`
    }

    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFileError('')

    // Check total file count
    if (files.length + selectedFiles.length > 3) {
      setFileError('Maximum 3 files allowed.')
      return
    }

    // Validate each file
    for (const file of selectedFiles) {
      const error = validateFile(file)
      if (error) {
        setFileError(error)
        return
      }
    }

    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent double submission
    if (isSubmitting) {
      return
    }
    
    // Check honeypot - if filled, it's likely a bot
    if (formData.honeypot) {
      console.log('Bot detected via honeypot')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('phone', formData.phone)
      formDataToSend.append('subject', formData.subject)
      formDataToSend.append('message', formData.message)
      
      // Add files to FormData
      files.forEach((file, index) => {
        formDataToSend.append(`file_${index}`, file)
      })
      formDataToSend.append('fileCount', files.length.toString())

      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formDataToSend,
      })
      
      if (response.ok) {
        alert('Message sent successfully!')
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          honeypot: ''
        })
        setFiles([])
      } else {
        alert('Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-rethink">
            Get in Touch
          </h1>
          <p className="text-lg text-gray-600">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
              <div className="flex flex-col gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+63 912 345 6789"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              
              {/* File Upload Section - Compact */}
              <div>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSubmitting ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                  >
                    <Upload className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Add Attachments</span>
                  </label>
                  <span className="text-xs text-gray-500">
                    Max 3 files, 3MB each (Images & PDFs)
                  </span>
                </div>
                
                {/* File List - Compact */}
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                            {file.type.startsWith('image/') ? (
                              <Upload className="w-2 h-2 text-blue-600" />
                            ) : (
                              <Upload className="w-2 h-2 text-red-600" />
                            )}
                          </div>
                          <span className="text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(1)}MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          disabled={isSubmitting}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Error Message */}
                {fileError && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                    {fileError}
                  </div>
                )}
              </div>
              {/* Honeypot field - hidden from users */}
              <div style={{ display: 'none' }}>
                <label htmlFor="honeypot">Leave this field empty</label>
                <input
                  type="text"
                  id="honeypot"
                  name="honeypot"
                  value={formData.honeypot}
                  onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                    isSubmitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-brand-blue/20 text-brand-blue hover:bg-brand-blue hover:text-white'
                  }`}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
