import Bull from 'bull';
import { EmailJob } from './email-queue';
import { sendOrderConfirmationEmail } from './email-templates/order-confirmation';
import { sendBusinessInvitationEmail } from './email-templates/business-invitation';
import { sendMagicLinkEmail } from './email-templates/magic-link';
import { sendPasswordResetEmail } from './email-templates/password-reset';
import { sendGiftCardRedemptionEmail } from './email-templates/gift-card-redemption';
import { sendAdminNotificationEmail } from './email-templates/admin-notification';

/**
 * Set up email job processor
 * This should be called in a separate worker process or in your Next.js API route
 */
export async function setupEmailProcessor(queue: Bull.Queue<EmailJob>) {
  // Process jobs with concurrency of 5 emails at a time
  queue.process(5, async (job) => {
    console.log(`📧 Processing email job ${job.id}:`, job.data.type);

    try {
      let result;

      switch (job.data.type) {
        case 'order-confirmation':
          result = await sendOrderConfirmationEmail(job.data as any);
          break;

        case 'business-invitation':
          result = await sendBusinessInvitationEmail(job.data as any);
          break;

        case 'magic-link':
          result = await sendMagicLinkEmail(job.data as any);
          break;

        case 'password-reset':
          result = await sendPasswordResetEmail(job.data as any);
          break;

        case 'gift-card-redemption':
          result = await sendGiftCardRedemptionEmail(job.data as any);
          break;

        case 'admin-notification':
          result = await sendAdminNotificationEmail(job.data as any);
          break;

        default:
          throw new Error(`Unknown email job type: ${job.data.type}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Email sending failed');
      }

      console.log(`✅ Email job ${job.id} sent successfully`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Email job ${job.id} error:`, errorMessage);
      throw error; // Re-throw to trigger retry
    }
  });

  console.log('✅ Email processor initialized');
}

/**
 * For testing: Process jobs synchronously without queue
 */
export async function processSingleEmail(job: EmailJob) {
  try {
    let result;

    switch (job.type) {
      case 'order-confirmation':
        result = await sendOrderConfirmationEmail(job.data as any);
        break;

      case 'business-invitation':
        result = await sendBusinessInvitationEmail(job.data as any);
        break;

      case 'magic-link':
        result = await sendMagicLinkEmail(job.data as any);
        break;

      case 'password-reset':
        result = await sendPasswordResetEmail(job.data as any);
        break;

      case 'gift-card-redemption':
        result = await sendGiftCardRedemptionEmail(job.data as any);
        break;

      case 'admin-notification':
        result = await sendAdminNotificationEmail(job.data as any);
        break;

      default:
        throw new Error(`Unknown email job type: ${job.type}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
