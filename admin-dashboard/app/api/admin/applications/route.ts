import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabaseAdmin';
import { requireAdminAuth } from '@/lib/adminAuth';
import { logAuditEvent, getClientIpFromRequest, getUserAgentFromRequest } from '@/lib/auditLogger';
import { validateCsrfToken, getCsrfTokenFromRequest } from '@/lib/csrf';
import { randomBytes } from 'crypto';
import { hashPassword } from '@/lib/password';

export async function POST(request: Request) {
  try {
    await requireAdminAuth(); // Ensure only authenticated admins can access

    // Validate CSRF token for state-changing operation
    const csrfToken = getCsrfTokenFromRequest(request);
    if (!validateCsrfToken(csrfToken)) {
      return NextResponse.json({ error: 'CSRF token invalid or missing' }, { status: 403 });
    }

    const { applicationId, status, rejectionReason } = await request.json();

    if (!applicationId || !status) {
      return NextResponse.json({ error: 'Application ID and status are required' }, { status: 400 });
    }

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'Invalid application status' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    if (status === 'approved') {
      // Fetch the application details first
      const { data: appData, error: fetchError } = await supabase
        .from('business_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (fetchError || !appData) {
        console.error('Error fetching application:', fetchError?.message || 'Application not found');
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      // Generate a slug from the business name
      let slug = appData.business_name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Remove multiple hyphens

      // Ensure slug is unique by checking for existing slugs
      let uniqueSlug = slug;
      let counter = 1;
      while (true) {
        const { data: existing } = await supabase
          .from('businesses')
          .select('id')
          .eq('slug', uniqueSlug)
          .limit(1);

        if (!existing || existing.length === 0) {
          slug = uniqueSlug;
          break;
        }

        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }

      // Create a new business account from the application
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: appData.business_name,
          slug: slug,
          contact_name: appData.contact_name,
          contact_email: appData.contact_email,
          phone: appData.phone,
          iban: appData.iban,
          status: 'active',
          is_visible: false, // Hidden by default, admin must explicitly make it visible
        })
        .select()
        .single();

      if (businessError) {
        console.error('Error creating business:', businessError.message);
        return NextResponse.json({ error: `Failed to create business: ${businessError.message}` }, { status: 500 });
      }

      // Generate a temporary password for the business owner
      const tempPassword = randomBytes(12).toString('hex');
      const passwordHash = await hashPassword(tempPassword);

      // Create business credentials for the owner
      const { error: credError } = await supabase
        .from('business_credentials')
        .insert({
          email: appData.contact_email,
          password_hash: passwordHash,
          failed_login_attempts: 0,
        })
        .select()
        .single();

      if (credError) {
        console.error('Error creating business credentials:', credError.message);
        return NextResponse.json({ error: `Failed to create login credentials: ${credError.message}` }, { status: 500 });
      }

      // Update the application status to approved
      const { error: updateError } = await supabase
        .from('business_applications')
        .update({ status: 'approved' })
        .eq('id', applicationId);

      if (updateError) {
        console.error('Error updating application status:', updateError.message);
        return NextResponse.json({ error: `Failed to update application: ${updateError.message}` }, { status: 500 });
      }

      // Log successful approval
      await logAuditEvent({
        actionType: 'APPROVE',
        resourceType: 'APPLICATION',
        resourceId: applicationId,
        status: 'success',
        ipAddress: getClientIpFromRequest(request),
        userAgent: getUserAgentFromRequest(request),
      });

      // TODO: Send credentials to business owner via email (Resend)
      // For now, log the credentials securely (this log should be cleared in production)
      console.log(`[SECURE LOG - DELETE THIS LINE] Business credentials created for ${appData.contact_email}`);

      return NextResponse.json({
        message: 'Application approved successfully. Temporary credentials have been prepared and should be sent to the business owner via secure email.',
        business: businessData
      }, { status: 200 });
    } else if (status === 'rejected') {
      const { error: updateError } = await supabase
        .from('business_applications')
        .update({ status: 'rejected', rejection_reason: rejectionReason })
        .eq('id', applicationId);

      if (updateError) {
        console.error('Error rejecting application:', updateError.message);
        // Log failed rejection attempt
        await logAuditEvent({
          actionType: 'REJECT',
          resourceType: 'APPLICATION',
          resourceId: applicationId,
          status: 'failed',
          errorMessage: updateError.message,
          ipAddress: getClientIpFromRequest(request),
          userAgent: getUserAgentFromRequest(request),
        });
        return NextResponse.json({ error: `Failed to reject application: ${updateError.message}` }, { status: 500 });
      }

      // Log successful rejection
      await logAuditEvent({
        actionType: 'REJECT',
        resourceType: 'APPLICATION',
        resourceId: applicationId,
        details: { rejectionReason },
        status: 'success',
        ipAddress: getClientIpFromRequest(request),
        userAgent: getUserAgentFromRequest(request),
      });

      return NextResponse.json({ message: 'Application rejected successfully' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });

  } catch (error: any) {
    console.error('API Error (POST /api/admin/applications):', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminAuth(); // Ensure only authenticated admins can access

    // Validate CSRF token for state-changing operation
    const csrfToken = getCsrfTokenFromRequest(request);
    if (!validateCsrfToken(csrfToken)) {
      return NextResponse.json({ error: 'CSRF token invalid or missing' }, { status: 403 });
    }

    const { applicationId } = await request.json();

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from('business_applications')
      .delete()
      .eq('id', applicationId);

    if (error) {
      console.error('Error deleting application:', error.message);
      // Log failed deletion attempt
      await logAuditEvent({
        actionType: 'DELETE',
        resourceType: 'APPLICATION',
        resourceId: applicationId,
        status: 'failed',
        errorMessage: error.message,
        ipAddress: getClientIpFromRequest(request),
        userAgent: getUserAgentFromRequest(request),
      });
      return NextResponse.json({ error: `Failed to delete application: ${error.message}` }, { status: 500 });
    }

    // Log successful deletion
    await logAuditEvent({
      actionType: 'DELETE',
      resourceType: 'APPLICATION',
      resourceId: applicationId,
      status: 'success',
      ipAddress: getClientIpFromRequest(request),
      userAgent: getUserAgentFromRequest(request),
    });

    return NextResponse.json({ message: 'Application deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('API Error (DELETE /api/admin/applications):', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
