import { NextRequest, NextResponse } from 'next/server';
import * as sgMail from '@sendgrid/mail';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function jsonNoStore(payload: unknown, init?: { status?: number }) {
  const response = NextResponse.json(payload, init);
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}

export async function GET(request: NextRequest) {
  const testEmail = request.nextUrl.searchParams.get('email');
  
  const hasApiKey = !!process.env.SENDGRID_API_KEY;
  const apiKeyPrefix = process.env.SENDGRID_API_KEY?.substring(0, 10) || 'NOT SET';
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'NOT SET';
  
  const diagnostics = {
    hasApiKey,
    apiKeyPrefix: apiKeyPrefix === 'SG.xxx' ? '⚠️ PLACEHOLDER KEY' : apiKeyPrefix,
    fromEmail,
    testEmail: testEmail || 'No test email provided (add ?email=your@email.com)',
  };

  if (!testEmail) {
    return jsonNoStore({
      message: 'SendGrid Diagnostics - Add ?email=your@email.com to send a test',
      diagnostics,
    });
  }

  if (!hasApiKey || process.env.SENDGRID_API_KEY === 'SG.xxx') {
    return jsonNoStore({
      error: 'SendGrid API key not configured properly',
      diagnostics,
    }, { status: 500 });
  }

  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    
    const [response] = await sgMail.send({
      to: testEmail,
      from: { email: fromEmail, name: 'KeLatic Hair Lounge' },
      subject: '✅ Test Email - KeLatic Notifications Working!',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1 style="color: #9333ea;">🎉 Email Test Successful!</h1>
          <p>If you're reading this, SendGrid is properly configured.</p>
          <p><strong>From:</strong> ${fromEmail}</p>
          <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        </div>
      `,
    });

    const sendgridResponse = {
      statusCode: response?.statusCode,
      messageId: response?.headers?.['x-message-id'] || response?.headers?.['X-Message-Id'],
      requestId: response?.headers?.['x-request-id'] || response?.headers?.['X-Request-Id'],
    };

    return jsonNoStore({
      success: true,
      message: `Test email sent to ${testEmail}`,
      diagnostics,
      sendgridResponse,
    });
  } catch (error: any) {
    return jsonNoStore({
      error: 'Failed to send test email',
      message: error.message,
      code: error.code,
      details: error.response?.body || 'No additional details',
      diagnostics,
    }, { status: 500 });
  }
}
