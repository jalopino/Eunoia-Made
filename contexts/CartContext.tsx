'use client'

import { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react'
import { CartItem, CartContextType } from '@/types/keychain'

interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id' | 'addedAt'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'RESTORE_CART'; payload: CartItem[] }

const CartContext = createContext<CartContextType | undefined>(undefined)

// localStorage key for cart data
const CART_STORAGE_KEY = 'eunoia-cart'

// Helper functions for localStorage
const saveCartToStorage = (items: CartItem[]) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch (error) {
    console.warn('Failed to save cart to localStorage:', error)
  }
}

const loadCartFromStorage = (): CartItem[] => {
  // Only run on client side to avoid hydration errors
  if (typeof window === 'undefined') {
    return []
  }
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate that the parsed data is an array
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (error) {
    console.warn('Failed to load cart from localStorage:', error)
  }
  return []
}

function cartReducer(state: CartState, action: CartAction): CartState {
  let newState: CartState

  switch (action.type) {
    case 'ADD_ITEM': {
      const newItem: CartItem = {
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        addedAt: new Date().toISOString(),
      }
      
      // Check if item with same parameters already exists
      const existingItemIndex = state.items.findIndex(
        item => 
          item.name === newItem.name &&
          item.type === newItem.type &&
          JSON.stringify(item.parameters) === JSON.stringify(newItem.parameters)
      )
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...state.items]
        updatedItems[existingItemIndex].quantity += newItem.quantity
        newState = { items: updatedItems }
      } else {
        // Add new item
        newState = { items: [...state.items, newItem] }
      }
      break
    }
    
    case 'REMOVE_ITEM':
      newState = {
        items: state.items.filter(item => item.id !== action.payload)
      }
      break
    
    case 'UPDATE_QUANTITY':
      newState = {
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0) // Remove items with 0 quantity
      }
      break
    
    case 'CLEAR_CART':
      newState = { items: [] }
      break
    
    case 'RESTORE_CART':
      newState = { items: action.payload }
      break
    
    default:
      return state
  }

  // Save to localStorage after each state change (except for RESTORE_CART)
  if (action.type !== 'RESTORE_CART') {
    saveCartToStorage(newState.items)
  }
  return newState
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize with empty cart to avoid hydration mismatch
  const [state, dispatch] = useReducer(cartReducer, { items: [] })
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage after hydration
  useEffect(() => {
    const savedItems = loadCartFromStorage()
    if (savedItems.length > 0) {
      // Dispatch a special action to restore the cart without saving to localStorage again
      dispatch({ type: 'RESTORE_CART', payload: savedItems })
    }
    setIsHydrated(true)
  }, [])

  const addItem = (item: Omit<CartItem, 'id' | 'addedAt'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
  }

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id })
  }

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }

  const value: CartContextType = {
    items: state.items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    isHydrated,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
