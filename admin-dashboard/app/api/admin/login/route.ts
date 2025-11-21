import { NextResponse } from 'next/server';
import {
  verifyAdminCredentials,
  createAdminSession,
  setAdminSessionCookie,
} from '@/lib/adminAuth';
import {
  rateLimitMiddleware,
  recordAttempt,
  resetRateLimit,
  getClientIp,
} from '@/lib/rateLimit';
import { logAuditEvent, getUserAgentFromRequest } from '@/lib/auditLogger';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const normalizedUsername = username.trim().toLowerCase();
    const clientIp = getClientIp(request);

    // Apply rate limiting (stricter for admin - 3 attempts per 15 min)
    const rateLimit = await rateLimitMiddleware(request, `admin:${normalizedUsername}`);
    if (rateLimit.limited && rateLimit.response) {
      return rateLimit.response;
    }

    // Verify credentials
    const result = await verifyAdminCredentials(normalizedUsername, password);

    if (!result.success) {
      // Record failed attempt
      recordAttempt(clientIp, 'ip');
      recordAttempt(`admin:${normalizedUsername}`, 'email');

      console.warn('Failed admin login attempt:', normalizedUsername);

      // Log failed login attempt (we don't have userId here, so we use username as resourceName)
      await logAuditEvent({
        actionType: 'LOGIN',
        resourceType: 'ADMIN_SESSION',
        resourceName: normalizedUsername,
        status: 'failed',
        errorMessage: result.error || 'Invalid credentials',
        ipAddress: clientIp,
        userAgent: getUserAgentFromRequest(request),
      });

      return NextResponse.json(
        { error: result.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Reset rate limits on successful login
    resetRateLimit(clientIp, 'ip');
    resetRateLimit(`admin:${normalizedUsername}`, 'email');

    // Create admin session
    const userAgent = request.headers.get('user-agent') || undefined;
    const session = await createAdminSession(result.userId!, clientIp, userAgent);
    await setAdminSessionCookie(session.session_token);

    // Log successful login
    await logAuditEvent({
      actionType: 'LOGIN',
      resourceType: 'ADMIN_SESSION',
      resourceName: normalizedUsername,
      adminUserId: result.userId!,
      status: 'success',
      ipAddress: clientIp,
      userAgent,
    });

    console.log('✅ Successful admin login:', normalizedUsername);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Failed to log in. Please try again.' },
      { status: 500 }
    );
  }
}
