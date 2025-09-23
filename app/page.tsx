'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import BouncingBalls from '@/components/BouncingBalls'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  // const router = useRouter()

  // useEffect(() => {
  //   router.replace('/keygo')
  // }, [router])

  return (
    <main className="min-h-screen bg-transparent">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <BouncingBalls />
        <div className="container mx-auto px-4 py-16 text-center relative z-10">
          <div className="p-8 md:p-12 max-w-4xl mx-auto">
            <img src="/EUNOIA LOGO.png" alt="Eunoia Made" className="h-24 mx-auto mb-8" />
            <p className="text-lg md:text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
              Bringing your ideas to life through custom 3D printing. From personalized accessories to bespoke creations, we craft unique products that tell your story.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
              href="/keygo"
              className="inline-flex items-center gap-2 px-6 py-3 text-lg font-medium text-brand-blue bg-brand-blue/10 rounded-lg hover:bg-brand-blue hover:text-white transition-colors"
            >
              Try KEYGO Maker
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/keytone"
              className="inline-flex items-center gap-2 px-6 py-3 text-lg font-medium text-brand-green bg-brand-green/10 rounded-lg hover:bg-brand-green hover:text-white transition-colors"
            >
              Try KEYTONE Designer
              <ArrowRight className="w-5 h-5" />
            </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative z-10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Why Choose Eunoia Made?
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-brand-blue/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Custom Innovation</h3>
              <p className="text-gray-600">Advanced 3D printing technology to bring your ideas to reality.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-brand-green/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Bespoke Designs</h3>
              <p className="text-gray-600">Personalized creations tailored to your unique vision.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-brand-yellow/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Local Craftsmanship</h3>
              <p className="text-gray-600">Quality products crafted with care in Bacolod City.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-brand-blue relative z-10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Ready to Create Your Own KEYGO?
          </h2>
          <Link
            href="/keygo"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-primary-600 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            Start Designing
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  )
}