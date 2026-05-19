# Email Receipt Configuration Guide

## Overview
The POS system's digital receipt feature is now ready to send emails. To enable actual email sending, you need to configure an email service provider.

## Email Service Setup Options

### Option 1: Using Resend (Recommended for Vercel)
[Resend](https://resend.com/) is the easiest option if you're using Vercel.

**Steps:**
1. Go to https://resend.com and sign up
2. Create a new API key from the dashboard
3. Add the following environment variables to your Vercel project:
   ```
   EMAIL_SERVICE_URL=https://api.resend.com/emails
   EMAIL_SERVICE_KEY=re_xxxxxxxxxxxxxxxxxxxxxx  (your Resend API key)
   ```

**Update the API code** in `/app/api/send-receipt/route.ts` to format for Resend:

The body should be formatted as:
```json
{
  "from": "noreply@yourdomain.com",
  "to": "customer@example.com",
  "subject": "Your Receipt",
  "html": "<html>...</html>"
}
```

### Option 2: Using SendGrid
[SendGrid](https://sendgrid.com/) provides enterprise-grade email sending.

**Steps:**
1. Sign up at https://sendgrid.com
2. Create an API key from Settings > API Keys
3. Add environment variables:
   ```
   EMAIL_SERVICE_URL=https://api.sendgrid.com/v3/mail/send
   EMAIL_SERVICE_KEY=SG.xxxxxxxxxxxxxxxxxxxxxx  (your SendGrid API key)
   ```

### Option 3: Using AWS SES
[AWS SES](https://aws.amazon.com/ses/) is cost-effective for high volumes.

**Steps:**
1. Set up an AWS account and verify email in SES
2. Create an IAM user with SES permissions
3. Get Access Key ID and Secret Access Key
4. Configure AWS credentials in your environment

### Option 4: Using Node Mailer (Self-hosted SMTP)
For Gmail, Office365, or your own SMTP server.

**Steps:**
1. Install nodemailer: `npm install nodemailer`
2. Configure SMTP settings as environment variables
3. Update the email API route to use Nodemailer

## Testing Email Sending

### Step 1: Set Environment Variables
In your Vercel project settings or local `.env.local`:
```
EMAIL_SERVICE_URL=your_service_url
EMAIL_SERVICE_KEY=your_api_key
```

### Step 2: Test the API Endpoint
```bash
curl -X POST http://localhost:3000/api/send-receipt \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "TXN-TEST-001",
    "storeName": "Noobs POS",
    "storeAddress": "Jl.Guru Saleh No.29, Cilandak, Jakarta Selatan",
    "storePhone": "(021) 1234-5678",
    "customerName": "Test Customer",
    "customerEmail": "your-email@example.com",
    "tableNumber": "1",
    "serviceType": "dine-in",
    "paymentMethod": "cash",
    "subtotal": 50000,
    "discount": 0,
    "total": 50000,
    "lineItems": [
      {
        "id": "prod-001",
        "name": "Sample Item",
        "price": 50000,
        "quantity": 1
      }
    ],
    "createdAt": "2026-05-19T10:00:00Z"
  }'
```

### Step 3: Check the Response
You should get a response like:
```json
{
  "success": true,
  "message": "Receipt sent to your-email@example.com",
  "transactionId": "TXN-TEST-001"
}
```

## Development/Testing Mode

When `EMAIL_SERVICE_URL` and `EMAIL_SERVICE_KEY` are not configured, the system will:
1. Log all email details to the console
2. Simulate successful email sending
3. Display in the UI as if the email was sent

This is useful for testing the UI and flow without actually sending emails.

## Troubleshooting

### "Email service unavailable" Error
- Check that `EMAIL_SERVICE_URL` and `EMAIL_SERVICE_KEY` are properly set
- Verify the API key is correct and not expired
- Check network connectivity to the email service

### No Email Received
- Check the customer email address is valid
- Verify the email service API response in browser console (F12 -> Console tab)
- Check spam/junk folder
- Verify sender domain is properly authenticated (SPF, DKIM, DMARC)

### Check Logs
In development, check the terminal output for `[v0]` prefixed logs showing:
- Email recipient
- Email subject
- Service being used
- Success or failure details

## Production Deployment

When deploying to production:
1. Set email service environment variables in Vercel project settings
2. Ensure the email domain is verified with your provider
3. Configure proper DNS records (SPF, DKIM, DMARC) for deliverability
4. Monitor email delivery rates in your provider's dashboard
5. Set up bounce/complaint handling if available

## Current Status

The POS system is ready for email sending. The backend includes:
- ✓ Email template generation with professional HTML formatting
- ✓ Email validation
- ✓ Flexible service provider integration
- ✓ Comprehensive error handling
- ✓ Detailed logging for debugging
- ✓ Development mode for testing without actual sending

Just add your email service configuration and you're ready to go!
