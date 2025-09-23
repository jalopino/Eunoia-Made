import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log headers for debugging
    console.log('Request headers:', {
      'user-agent': request.headers.get('user-agent'),
      'origin': request.headers.get('origin'),
      'referer': request.headers.get('referer'),
      'content-type': request.headers.get('content-type'),
      'accept': request.headers.get('accept'),
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'x-real-ip': request.headers.get('x-real-ip'),
      'host': request.headers.get('host'),
      'all-headers': Object.fromEntries(request.headers.entries())
    })
    
    // Log the order for debugging (remove in production)
    console.log('Received order:', {
      customerInfo: body.customerInfo,
      orderItems: body.order?.items?.length || 0,
      payment: body.payment?.method,
      totalAmount: body.order?.totalAmount
    })

    // Forward the order to the external webhook (same as individual generators)
    const webhookUrl = 'https://workflows.eunoiadigitalph.com/webhook/keygo-order'
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
    
    try {
      // Forward important headers to the webhook
      const forwardHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'NextJS-API',
        'Origin': request.headers.get('origin') || 'localhost:3000',
        'Referer': request.headers.get('referer') || '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        'X-Real-IP': request.headers.get('x-real-ip') || '',
        'X-Request-ID': randomUUID(), // Add unique request ID
      }

      console.log('Forwarding headers to webhook:', forwardHeaders)

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: forwardHeaders,
        body: JSON.stringify(body),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Webhook HTTP ${response.status}: ${response.statusText}`)
      }
      
      // Return success response with CORS headers
      return NextResponse.json({ 
        success: true, 
        message: 'Order submitted successfully' 
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      })
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      console.error('Webhook error:', fetchError)
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'Request timed out. Please try again or contact support.' },
          { status: 408 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to submit order. Please try again or contact support.' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Order processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Invalid request data' },
      { status: 400 }
    )
  }
}
