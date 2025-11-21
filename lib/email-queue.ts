import Bull from 'bull';

// Email queue configuration
export type EmailJobType =
  | 'order-confirmation'
  | 'business-invitation'
  | 'magic-link'
  | 'password-reset'
  | 'gift-card-redemption'
  | 'admin-notification';

export interface EmailJob {
  type: EmailJobType;
  to: string;
  subject: string;
  data: Record<string, any>;
  retries?: number;
  delayMs?: number;
}

export interface EmailQueueResult {
  success: boolean;
  jobId?: string;
  error?: string;
  message?: string;
}

// Initialize Redis connection (will be created lazily)
let redisClient: any = null;
let emailQueue: Bull.Queue<EmailJob> | null = null;

// Get Redis configuration from environment
function getRedisConfig() {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  };
}

/**
 * Initialize email queue (call once on server startup)
 */
export async function initializeEmailQueue() {
  if (emailQueue) {
    return emailQueue;
  }

  try {
    const redisConfig = getRedisConfig();

    emailQueue = new Bull<EmailJob>('email-jobs', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 5, // Retry up to 5 times
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 second delay, exponential backoff
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
        },
      },
    });

    // Handle queue events
    emailQueue.on('completed', (job) => {
      console.log(`✅ Email job ${job.id} completed:`, job.data.type);
    });

    emailQueue.on('failed', (job, err) => {
      console.error(`❌ Email job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}):`, {
        type: job.data.type,
        error: err.message,
      });
    });

    emailQueue.on('error', (err) => {
      console.error('Email queue error:', err);
    });

    console.log('✅ Email queue initialized successfully');
    return emailQueue;
  } catch (error) {
    console.warn('⚠️  Email queue initialization failed (Redis may not be available):', error);
    console.warn('Falling back to direct email sending (no retries)');
    return null;
  }
}

/**
 * Add email to queue for processing
 */
export async function enqueueEmail(job: EmailJob): Promise<EmailQueueResult> {
  try {
    const queue = await initializeEmailQueue();

    if (!queue) {
      return {
        success: false,
        error: 'Email queue not available. Redis connection failed.',
        message: 'Install and run Redis, or configure REDIS_HOST environment variable',
      };
    }

    const jobId = await queue.add(job, {
      delay: job.delayMs,
    });

    return {
      success: true,
      jobId: jobId.toString(),
      message: `Email job queued (ID: ${jobId})`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to enqueue email:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get queue status
 */
export async function getEmailQueueStatus() {
  try {
    const queue = emailQueue;
    if (!queue) {
      return { available: false, message: 'Queue not initialized' };
    }

    const counts = await queue.getJobCounts();
    const isPaused = await queue.isPaused();

    return {
      available: true,
      paused: isPaused,
      pending: counts.active + counts.waiting,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
      delayed: counts.delayed,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      available: false,
      error: errorMessage,
    };
  }
}

/**
 * Get a specific job status
 */
export async function getEmailJobStatus(jobId: string) {
  try {
    const queue = await initializeEmailQueue();
    if (!queue) {
      return { found: false, error: 'Queue not available' };
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return { found: false, error: `Job ${jobId} not found` };
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      found: true,
      id: job.id,
      type: job.data.type,
      state,
      progress,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      failedReason: job.failedReason,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { found: false, error: errorMessage };
  }
}

/**
 * Close queue connection (call on server shutdown)
 */
export async function closeEmailQueue() {
  if (emailQueue) {
    await emailQueue.close();
    emailQueue = null;
    console.log('Email queue closed');
  }
}
