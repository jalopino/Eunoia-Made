import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string
    const fileCount = parseInt(formData.get('fileCount') as string) || 0

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate files
    const files: File[] = []
    for (let i = 0; i < fileCount; i++) {
      const file = formData.get(`file_${i}`) as File
      if (file) {
        // Validate file size (3MB limit)
        if (file.size > 3 * 1024 * 1024) {
          return NextResponse.json(
            { error: `File "${file.name}" is too large. Maximum size is 3MB.` },
            { status: 400 }
          )
        }

        // Validate file type
        const allowedTypes = [
          'image/jpeg',
          'image/jpg', 
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf'
        ]
        
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: `File "${file.name}" is not supported. Only images and PDFs are allowed.` },
            { status: 400 }
          )
        }

        files.push(file)
      }
    }

    // Create zip file if there are attachments
    let zipBuffer: Buffer | null = null
    let zipFileName = ''
    
    if (files.length > 0) {
      const zip = new JSZip()
      
      // Add all files to the zip
      for (const file of files) {
        const fileBuffer = await file.arrayBuffer()
        zip.file(file.name, fileBuffer)
      }
      
      // Generate zip file
      zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
      
      // Create zip filename: "Name - Email.zip"
      const sanitizedName = name.replace(/[^a-zA-Z0-9\s]/g, '').trim()
      const sanitizedEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '')
      zipFileName = `${sanitizedName} - ${sanitizedEmail}.zip`
    }

    // Prepare webhook payload
    const webhookPayload = {
      name,
      email,
      phone: phone || '',
      subject: subject || 'Contact Form Inquiry',
      message,
      attachments: files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      })),
      zipFile: zipFileName || null,
      timestamp: new Date().toISOString(),
      source: 'Eunoia Made Contact Form'
    }

    // Send to webhook with zip file if available
    let webhookResponse: Response
    
    if (zipBuffer) {
      // Create FormData for webhook with zip file
      const webhookFormData = new FormData()
      webhookFormData.append('data', JSON.stringify(webhookPayload))
      webhookFormData.append('attachments', new Blob([new Uint8Array(zipBuffer)]), zipFileName)
      
      webhookResponse = await fetch('https://workflows.eunoiadigitalph.com/webhook/eunoia-made-inquries', {
        method: 'POST',
        body: webhookFormData,
      })
    } else {
      // Send JSON payload without attachments
      webhookResponse = await fetch('https://workflows.eunoiadigitalph.com/webhook/eunoia-made-inquries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      })
    }

    if (!webhookResponse.ok) {
      console.error('Webhook failed:', webhookResponse.status, webhookResponse.statusText)
      return NextResponse.json(
        { error: 'Failed to process inquiry' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Inquiry sent successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
