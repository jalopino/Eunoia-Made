import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        <p className="text-sm text-center text-gray-600">
          &copy; {new Date().getFullYear()} Eunoia Made. All rights reserved.
        </p>
        <p className="text-center text-sm text-gray-600">
        Bacolod City, Negros Occidental, Philippines
        </p>
        <p className="text-center text-sm">
            <Link href="/contact" className="text-sm text-brand-blue hover:text-brand-yellow font-bold transition-colors">Contact Us</Link>
        </p>
      </div>
    </footer>
  )
}