import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Eunoia Made',
  description: 'Custom 3D Printing Services in Bacolod City, Philippines',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
