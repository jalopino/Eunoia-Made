import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const fontsDir = path.join(process.cwd(), 'public', 'fonts')
    let entries: string[] = []
    try {
      entries = await fs.readdir(fontsDir)
    } catch {
      entries = []
    }
    const fonts = entries
      .filter((f) => f.toLowerCase().endsWith('.typeface.json'))
      .map((f) => ({
        name: f.replace(/_/g, ' ').replace(/\.typeface\.json$/i, ''),
        value: f,
        fileUrl: `/fonts/${f}`,
      }))
    return NextResponse.json({ fonts })
  } catch {
    return NextResponse.json({ fonts: [] }, { status: 200 })
  }
}


