'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = Date.now().toString()
    const newToast: Toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  const toastStyles = {
    success: 'bg-[#1E3C96] border-[#1E3C96] text-white',
    error: 'bg-[#E31837] border-[#E31837] text-white',
    warning: 'bg-yellow-600 border-yellow-600 text-white',
    info: 'bg-[#1E3C96] border-[#1E3C96] text-white'
  }

  const toastIcons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: AlertCircle
  }

  const toastContent = (
    <div className="fixed top-20 right-4 z-[99999] space-y-2 flex flex-col items-end" style={{ right: '16px', position: 'fixed', zIndex: 99999 }}>
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type]
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg max-w-sm w-full transform transition-all duration-300 ${toastStyles[toast.type]}`}
            style={{ backgroundColor: toast.type === 'error' ? '#E31837' : '#1E3C96', color: 'white', borderColor: toast.type === 'error' ? '#E31837' : '#1E3C96' }}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )

  // Use portal to render at document body level
  if (typeof window !== 'undefined') {
    return createPortal(toastContent, document.body)
  }
  
  return toastContent
}
