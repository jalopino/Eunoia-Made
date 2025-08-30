'use client'

import './globals.css'
import Navbar from '@/components/Navbar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body>
        <Navbar />
        <div className="pt-16">
          {children}
        </div>
      </body>
    </html>
  )
}