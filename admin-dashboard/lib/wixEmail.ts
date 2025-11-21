/**
 * Wix Triggered Emails API Integration
 *
 * Uses Wix REST API to send emails (works even when site is paused)
 * Docs: https://dev.wix.com/docs/rest/api-reference/marketing/triggered-emails
 */

interface WixEmailVariables {
  [key: string]: string;
}

interface SendWixEmailParams {
  recipientEmail: string;
  recipientName?: string;
  variables: WixEmailVariables;
}

/**
 * Send an email via Wix Triggered Emails API
 *
 * @param templateId - The Wix email template ID
 * @param params - Email parameters
 * @returns Success status
 */
export async function sendWixTriggeredEmail(
  templateId: string,
  params: SendWixEmailParams
): Promise<{ success: boolean; error?: string }> {
  const wixApiToken = process.env.WIX_API_TOKEN;
  const wixSiteId = process.env.WIX_SITE_ID;
  const wixAccountId = process.env.WIX_ACCOUNT_ID;

  if (!wixApiToken || !wixSiteId || !wixAccountId) {
    return {
      success: false,
      error: 'Wix credentials not configured (WIX_API_TOKEN, WIX_SITE_ID, WIX_ACCOUNT_ID)',
    };
  }

  if (!templateId) {
    return {
      success: false,
      error: 'Email template ID not provided',
    };
  }

  try {
    const authHeader = wixApiToken.startsWith('Bearer ')
      ? wixApiToken
      : `Bearer ${wixApiToken}`;

    const response = await fetch(
      `https://www.wixapis.com/email-marketing/v1/triggered-emails/${templateId}/send`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'wix-site-id': wixSiteId,
          'wix-account-id': wixAccountId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: params.recipientEmail,
          ...(params.recipientName && { recipientName: params.recipientName }),
          variables: params.variables,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Wix Triggered Email API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      return {
        success: false,
        error: `Wix API error: ${response.status} - ${JSON.stringify(errorData)}`,
      };
    }

    const data = await response.json();
    console.log('✅ Email sent via Wix Triggered Emails:', {
      emailId: data.emailId,
      recipient: params.recipientEmail,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending Wix triggered email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a magic link email via Wix
 *
 * @param email - Recipient email
 * @param name - Recipient name
 * @param businessName - Business name
 * @param magicLink - The magic link URL
 * @returns Success status
 */
export async function sendMagicLinkEmailViaWix(
  email: string,
  name: string,
  businessName: string,
  magicLink: string
): Promise<{ success: boolean; error?: string }> {
  const templateId = process.env.WIX_MAGIC_LINK_EMAIL_TEMPLATE_ID;

  if (!templateId) {
    return {
      success: false,
      error: 'WIX_MAGIC_LINK_EMAIL_TEMPLATE_ID not configured',
    };
  }

  return sendWixTriggeredEmail(templateId, {
    recipientEmail: email,
    recipientName: name,
    variables: {
      name: name,
      businessName: businessName,
      magicLink: magicLink,
      expiresInMinutes: '15',
      buttonText: 'Open Dashboard',
    },
  });
}

/**
 * Test if Wix Triggered Emails API is accessible
 *
 * @returns True if API is accessible
 */
export async function testWixEmailAPI(): Promise<{
  accessible: boolean;
  error?: string;
}> {
  const wixApiToken = process.env.WIX_API_TOKEN;
  const wixSiteId = process.env.WIX_SITE_ID;
  const wixAccountId = process.env.WIX_ACCOUNT_ID;

  if (!wixApiToken || !wixSiteId || !wixAccountId) {
    return {
      accessible: false,
      error: 'Wix credentials not configured',
    };
  }

  try {
    const authHeader = wixApiToken.startsWith('Bearer ')
      ? wixApiToken
      : `Bearer ${wixApiToken}`;

    // Try to list email templates (read-only, safe)
    const response = await fetch(
      'https://www.wixapis.com/email-marketing/v1/email-templates',
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'wix-site-id': wixSiteId,
          'wix-account-id': wixAccountId,
        },
      }
    );

    if (response.ok) {
      return { accessible: true };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        accessible: false,
        error: `API returned ${response.status}: ${JSON.stringify(errorData)}`,
      };
    }
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
