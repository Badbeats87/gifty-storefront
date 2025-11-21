
import { getEmailConfig } from '../email-config';

export type AdminNotificationType = 'high-order' | 'new-application' | 'system-error' | 'payment-failure';

export interface AdminNotificationData {
  to: string;
  type: AdminNotificationType;
  subject: string;
  title: string;
  message: string;
  details: Record<string, string | number>;
  actionUrl?: string;
  actionLabel?: string;
  severity?: 'info' | 'warning' | 'error';
}

export async function sendAdminNotificationEmail(data: AdminNotificationData) {
  const config = getEmailConfig();

  const html = generateNotificationHTML({
    type: data.type,
    title: data.title,
    message: data.message,
    details: data.details,
    actionUrl: data.actionUrl,
    actionLabel: data.actionLabel,
    severity: data.severity || 'info',
  });

  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'RESEND_API_KEY not configured' };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: config.fromEmail,
        to: data.to,
        subject: data.subject,
        html,
      }),
    });

    if (response.ok) {
      console.log(`✅ Admin notification email sent to ${data.to}`);
      return { success: true };
    } else {
      const error = await response.text();
      console.error(`❌ Failed to send admin notification:`, error);
      return { success: false, error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error sending admin notification:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

interface HTMLParams {
  type: AdminNotificationType;
  title: string;
  message: string;
  details: Record<string, string | number>;
  actionUrl?: string;
  actionLabel?: string;
  severity: 'info' | 'warning' | 'error';
}

function generateNotificationHTML(params: HTMLParams): string {
  const severityColors = {
    info: { bg: '#f0f4ff', border: '#667eea', icon: 'ℹ️' },
    warning: { bg: '#fef3c7', border: '#f59e0b', icon: '⚠️' },
    error: { bg: '#fecaca', border: '#ef4444', icon: '🔴' },
  };

  const colors = severityColors[params.severity];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Notification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #1f2937;
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
    }
    .content {
      padding: 30px;
    }
    .alert {
      background-color: ${colors.bg};
      border-left: 4px solid ${colors.border};
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .alert-title {
      font-size: 18px;
      font-weight: bold;
      margin: 0 0 10px 0;
      color: #333;
    }
    .alert-message {
      margin: 0;
      color: #555;
      line-height: 1.6;
    }
    .details-table {
      width: 100%;
      margin: 25px 0;
      border-collapse: collapse;
    }
    .details-table td {
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    .details-table td:first-child {
      font-weight: 600;
      width: 35%;
      color: #666;
      background-color: #f9fafb;
    }
    .details-table td:last-child {
      color: #333;
    }
    .details-table tr:last-child td {
      border-bottom: none;
    }
    .action-button {
      display: inline-block;
      background-color: #1f2937;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 20px 0;
      text-align: center;
    }
    .action-button:hover {
      background-color: #111827;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #eee;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 Admin Notification</h1>
    </div>

    <div class="content">
      <div class="alert">
        <div class="alert-title">${params.title}</div>
        <div class="alert-message">${params.message}</div>
      </div>

      ${
        Object.keys(params.details).length > 0
          ? `
      <table class="details-table">
        ${Object.entries(params.details)
          .map(([key, value]) => `<tr><td>${key}:</td><td>${value}</td></tr>`)
          .join('')}
      </table>
      `
          : ''
      }

      ${
        params.actionUrl
          ? `
      <div style="text-align: center;">
        <a href="${params.actionUrl}" class="action-button">${params.actionLabel || 'View Details'} →</a>
      </div>
      `
          : ''
      }

      <div style="margin-top: 30px; padding: 15px; background-color: #f9fafb; border-radius: 4px; font-size: 13px; color: #666;">
        <p style="margin: 0 0 8px 0;"><strong>How to manage notifications:</strong></p>
        <p style="margin: 0;">You can configure email notifications in your admin dashboard settings.</p>
      </div>
    </div>

    <div class="footer">
      <p><strong>Gifty</strong> - Gift Card Management Made Simple</p>
      <p>© ${new Date().getFullYear()} Gifty. All rights reserved.</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
