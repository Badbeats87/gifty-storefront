/**
 * Email Configuration
 * Supports flexible domain setup for development and production
 */

export interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'smtp' | 'wix';
  fromEmail: string;
  fromName: string;
  senderDomain: string;
  supportEmail: string;
  replyToEmail: string;
  isDevelopment: boolean;
}

export function getEmailConfig(): EmailConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Support multiple domain configurations
  const domainConfig = process.env.EMAIL_DOMAIN || 'noreply.gifty.local';
  const supportDomainConfig = process.env.EMAIL_SUPPORT_DOMAIN || 'support.gifty.local';

  // From email - use custom domain if available, fall back to Resend test domain
  let fromEmail = process.env.EMAIL_FROM || `noreply@${domainConfig}`;

  // For Resend specifically, use onboarding@resend.dev in development
  if (isDevelopment && process.env.EMAIL_PROVIDER === 'resend') {
    fromEmail = 'onboarding@resend.dev';
  }

  return {
    provider: (process.env.EMAIL_PROVIDER || 'resend') as EmailConfig['provider'],
    fromEmail,
    fromName: process.env.EMAIL_FROM_NAME || 'Gifty',
    senderDomain: domainConfig,
    supportEmail: process.env.EMAIL_SUPPORT || `support@${supportDomainConfig}`,
    replyToEmail: process.env.EMAIL_REPLY_TO || `support@${supportDomainConfig}`,
    isDevelopment,
  };
}

/**
 * Build a safe email address with fallback for test environments
 */
export function getEmailAddress(username: string, domain?: string): string {
  const emailDomain = domain || getEmailConfig().senderDomain;

  // In test/dev, use a safe test domain
  if (process.env.NODE_ENV === 'development') {
    // Resend test domain is safe for development
    if (process.env.EMAIL_PROVIDER === 'resend') {
      return `${username}@resend.dev`;
    }
  }

  return `${username}@${emailDomain}`;
}

/**
 * Get the proper subject line with branding
 */
export function formatSubject(subject: string): string {
  const brandName = process.env.BRAND_NAME || 'Gifty';
  return subject; // Subject is already formatted in templates
}

/**
 * Email configuration documentation
 */
export const EMAIL_CONFIG_DOCS = `
# Email Configuration Guide

## Environment Variables

### Required
- EMAIL_PROVIDER: 'resend' | 'sendgrid' | 'smtp' | 'wix'
- RESEND_API_KEY: Your Resend API key (if using Resend)

### Optional (Domain Configuration)
- EMAIL_DOMAIN: Your custom domain (e.g., 'gifty.com')
  - Default: 'noreply.gifty.local'
  - Used for: noreply@{EMAIL_DOMAIN}

- EMAIL_SUPPORT_DOMAIN: Support domain
  - Default: 'support.gifty.local'
  - Used for: support@{EMAIL_SUPPORT_DOMAIN}

- EMAIL_FROM: Full from email address
  - Default: 'noreply@{EMAIL_DOMAIN}'
  - Only set if you want to override completely

- EMAIL_FROM_NAME: Brand name in email
  - Default: 'Gifty'

- EMAIL_SUPPORT: Full support email address
  - Default: 'support@{EMAIL_SUPPORT_DOMAIN}'

- EMAIL_REPLY_TO: Reply-to email address
  - Default: same as EMAIL_SUPPORT

## Development Configuration (.env.local)

\`\`\`
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_key_here
EMAIL_DOMAIN=localhost:3000
NODE_ENV=development
\`\`\`

## Production Configuration (.env.production)

\`\`\`
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_production_key
EMAIL_DOMAIN=yourdomain.com
EMAIL_SUPPORT_DOMAIN=support.yourdomain.com
EMAIL_FROM_NAME=Your Brand Name
\`\`\`

## Using Your Own Domain

1. Update your .env.production:
   EMAIL_DOMAIN=yourdomain.com

2. Set up DKIM/SPF records with Resend:
   - Follow: https://resend.com/docs/get-started/send-with-custom-domain

3. Test the configuration:
   - Send a test email
   - Check spam folder
   - Verify DKIM/SPF passed

## Troubleshooting

- Emails going to spam? Check DKIM/SPF records
- Test domain showing? You're in development mode
- No emails sent? Check RESEND_API_KEY
- Queue not working? Install Redis: brew install redis
`;
