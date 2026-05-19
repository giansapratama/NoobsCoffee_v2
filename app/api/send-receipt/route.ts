import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

interface LineItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

interface ReceiptData {
  transactionId: string
  storeName: string
  storeEmail?: string
  storeAddress: string
  storePhone: string
  customerName: string
  customerEmail: string
  tableNumber: string
  serviceType: 'dine-in' | 'takeaway'
  paymentMethod: string
  subtotal: number
  discount: number
  total: number
  lineItems: LineItem[]
  createdAt: string
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

// Helper function to generate HTML email template
function generateEmailTemplate(data: ReceiptData): string {
  const itemsHtml = data.lineItems
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: left;">${item.name}</td>
      <td style="padding: 12px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right;">${formatCurrency(item.price)}</td>
      <td style="padding: 12px; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `
    )
    .join('')

  const serviceTypeLabel = data.serviceType === 'dine-in' ? 'Dine In' : 'Takeaway'
  const tableInfo = data.serviceType === 'dine-in' ? `<p style="margin: 4px 0;"><strong>Table:</strong> ${data.tableNumber}</p>` : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .receipt {
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #f59e0b;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .store-name {
      font-size: 24px;
      font-weight: bold;
      color: #111827;
      margin: 0;
    }
    .store-info {
      font-size: 12px;
      color: #6b7280;
      margin: 8px 0 0 0;
    }
    .transaction-details {
      margin: 20px 0;
      font-size: 14px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-label {
      font-weight: 600;
      color: #374151;
    }
    .detail-value {
      color: #6b7280;
    }
    table {
      width: 100%;
      margin: 20px 0;
      border-collapse: collapse;
    }
    table th {
      background-color: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    .totals {
      margin: 20px 0;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 16px;
    }
    .total-row.grand-total {
      font-weight: bold;
      font-size: 18px;
      color: #f59e0b;
      border-top: 2px solid #e5e7eb;
      padding-top: 15px;
      margin-top: 10px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    .payment-method {
      background-color: #fef3c7;
      padding: 12px;
      border-radius: 6px;
      margin: 15px 0;
      text-align: center;
      font-weight: 600;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="receipt">
      <!-- Header -->
      <div class="header">
        <p class="store-name">${data.storeName.toUpperCase()}</p>
        <p class="store-info">${data.storeAddress}</p>
        <p class="store-info">Tel: ${data.storePhone}</p>
      </div>

      <!-- Transaction Details -->
      <div class="transaction-details">
        <div class="detail-row">
          <span class="detail-label">Transaction ID:</span>
          <span class="detail-value">${data.transactionId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Customer:</span>
          <span class="detail-value">${data.customerName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Service Type:</span>
          <span class="detail-value">${serviceTypeLabel}</span>
        </div>
        ${tableInfo}
        <div class="detail-row">
          <span class="detail-label">Date & Time:</span>
          <span class="detail-value">${new Date(data.createdAt).toLocaleString('id-ID')}</span>
        </div>
      </div>

      <!-- Items Table -->
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(data.subtotal)}</span>
        </div>
        ${
          data.discount > 0
            ? `
        <div class="total-row">
          <span>Discount:</span>
          <span style="color: #10b981;">-${formatCurrency(data.discount)}</span>
        </div>
        `
            : ''
        }
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>${formatCurrency(data.total)}</span>
        </div>
      </div>

      <!-- Payment Method -->
      <div class="payment-method">
        Payment Method: ${data.paymentMethod.toUpperCase()}
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>Thank you for your purchase!</p>
        <p>Please keep this receipt for your records.</p>
        <p style="margin-top: 20px; font-size: 11px;">This is a digital receipt sent via email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

// Simple email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const data: ReceiptData = await request.json()

    // Validate required fields
    if (!data.customerEmail || !isValidEmail(data.customerEmail)) {
      return NextResponse.json(
        { error: 'Valid customer email is required' },
        { status: 400 }
      )
    }

    if (!data.transactionId || !data.storeName || !data.lineItems || data.lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Missing required transaction data' },
        { status: 400 }
      )
    }

    // Check for Resend API key
    const resendApiKey = process.env.RESEND_API_KEY
    
    if (!resendApiKey) {
      console.log('[v0] RESEND_API_KEY not configured - email cannot be sent')
      return NextResponse.json(
        {
          success: false,
          error: 'Email service not configured. Please add RESEND_API_KEY environment variable.',
        },
        { status: 500 }
      )
    }

    // Generate HTML email
    const htmlContent = generateEmailTemplate(data)
    const subject = `Receipt - ${data.transactionId} from ${data.storeName}`

    console.log('[v0] Processing receipt email request')
    console.log('[v0] Transaction:', data.transactionId)
    console.log('[v0] Customer Email:', data.customerEmail)
    console.log('[v0] Store Email:', data.storeEmail)

    // Initialize Resend
    const resend = new Resend(resendApiKey)

    // Send email using Resend
    // Note: For production, you need to verify your domain with Resend
    // For testing, Resend allows sending to any email from onboarding@resend.dev
    const { data: emailResult, error } = await resend.emails.send({
      from: data.storeEmail 
        ? `${data.storeName} <onboarding@resend.dev>` 
        : `${data.storeName} <onboarding@resend.dev>`,
      to: [data.customerEmail],
      subject: subject,
      html: htmlContent,
      replyTo: data.storeEmail || undefined,
    })

    if (error) {
      console.error('[v0] Resend error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to send email',
        },
        { status: 500 }
      )
    }

    console.log('[v0] Email sent successfully!')
    console.log('[v0] Email ID:', emailResult?.id)

    return NextResponse.json(
      {
        success: true,
        message: `Receipt sent to ${data.customerEmail}`,
        transactionId: data.transactionId,
        emailId: emailResult?.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error sending receipt:', error)
    return NextResponse.json(
      { error: 'Failed to send receipt email', details: String(error) },
      { status: 500 }
    )
  }
}
