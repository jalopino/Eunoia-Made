'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import CartSidebar from '@/components/CartSidebar'
import Footer from '@/components/Footer'
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <>
      <Navbar onCartOpen={() => setIsCartOpen(true)} />
      <div className="pt-16">
        {children}
      </div>
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <Footer />
    </> 
  )
}
