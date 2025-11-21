import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabaseAdmin';
import { requireAdminAuth } from '@/lib/adminAuth';
import { logAuditEvent, getClientIpFromRequest, getUserAgentFromRequest } from '@/lib/auditLogger';
import { validateCsrfToken, getCsrfTokenFromRequest } from '@/lib/csrf';

export async function DELETE(request: Request) {
  try {
    await requireAdminAuth(); // Ensure only authenticated admins can access

    // Validate CSRF token for state-changing operation
    const csrfToken = getCsrfTokenFromRequest(request);
    if (!validateCsrfToken(csrfToken)) {
      return NextResponse.json({ error: 'CSRF token invalid or missing' }, { status: 403 });
    }

    const { businessIds } = await request.json();

    if (!businessIds || !Array.isArray(businessIds) || businessIds.length === 0) {
      return NextResponse.json({ error: 'Business IDs are required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Delete related records first (cascade delete workaround)
    // This is needed until the database constraint is updated to ON DELETE CASCADE
    try {
      // Delete gift cards associated with these businesses
      const { error: giftCardError } = await supabase
        .from('gift_cards')
        .delete()
        .in('business_id', businessIds);

      if (giftCardError) {
        console.warn('Warning: Failed to delete gift cards:', giftCardError.message);
      }

      // Delete orders associated with these businesses
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .in('business_id', businessIds);

      if (orderError) {
        console.warn('Warning: Failed to delete orders:', orderError.message);
      }

      // Delete business credentials
      const { error: credError } = await supabase
        .from('business_credentials')
        .delete()
        .in('email', await getBusinessEmails(supabase, businessIds));

      if (credError) {
        console.warn('Warning: Failed to delete credentials:', credError.message);
      }
    } catch (cascadeError) {
      console.warn('Warning: Cascade delete preparation failed:', cascadeError);
    }

    // Now delete the businesses themselves
    const { error } = await supabase
      .from('businesses')
      .delete()
      .in('id', businessIds);

    if (error) {
      console.error('Error deleting businesses:', error.message);
      // Log each failed deletion
      for (const businessId of businessIds) {
        await logAuditEvent({
          actionType: 'DELETE',
          resourceType: 'BUSINESS',
          resourceId: businessId,
          status: 'failed',
          errorMessage: error.message,
          ipAddress: getClientIpFromRequest(request),
          userAgent: getUserAgentFromRequest(request),
        });
      }
      return NextResponse.json({ error: `Failed to delete businesses: ${error.message}` }, { status: 500 });
    }

    // Log each successful deletion
    for (const businessId of businessIds) {
      await logAuditEvent({
        actionType: 'DELETE',
        resourceType: 'BUSINESS',
        resourceId: businessId,
        status: 'success',
        ipAddress: getClientIpFromRequest(request),
        userAgent: getUserAgentFromRequest(request),
      });
    }

    return NextResponse.json({ message: 'Businesses and associated records deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('API Error (DELETE /api/admin/businesses):', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Helper function to get email addresses for business credentials
async function getBusinessEmails(supabase: any, businessIds: string[]): Promise<string[]> {
  const { data } = await supabase
    .from('businesses')
    .select('contact_email')
    .in('id', businessIds);

  return data?.map((b: any) => b.contact_email).filter(Boolean) || [];
}
