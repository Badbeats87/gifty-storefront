'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface InviteData {
  id: string;
  email: string;
  invited_by: string;
  message: string | null;
  expires_at: string;
  status: string;
}

export default function BusinessRegistration() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    phone: '',
    iban: '',
    description: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });

  // Validate invite token on mount
  useEffect(() => {
    validateInvite();
  }, [token]);

  const validateInvite = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('business_invites')
        .select('*')
        .eq('invite_token', token)
        .single();

      if (fetchError || !data) {
        setError('Invalid or expired invitation link');
        setLoading(false);
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired');
        setLoading(false);
        return;
      }

      // Check if already accepted
      if (data.status !== 'pending') {
        setError('This invitation has already been used');
        setLoading(false);
        return;
      }

      setInvite(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to validate invitation');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Submit application via API endpoint (handles DB insertion and emails)
      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteId: invite!.id,
          businessName: formData.businessName,
          contactEmail: invite!.email,
          contactName: formData.contactName,
          phone: formData.phone,
          iban: formData.iban,
          description: formData.description,
          website: formData.website,
          address: formData.address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">✕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-black text-white hover:bg-gray-800"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 text-center">
          <div className="text-black text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for completing your registration. Your application is now pending review
            by our team. You'll receive an email once your application has been reviewed.
          </p>
          <div className="bg-gray-50 border border-gray-200 p-4 text-left">
            <h2 className="font-semibold text-black mb-2">What happens next?</h2>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Our team will review your application</li>
              <li>• You'll receive an email with the decision</li>
              <li>• Once approved, you'll get access to your dashboard</li>
              <li>• Your gift cards will appear on the storefront</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-8">
          <h1 className="text-3xl font-bold mb-2">Business Registration</h1>
          <p className="text-gray-600 mb-8">
            Complete your registration to join GiftySV as a business partner.
          </p>

          {invite?.message && (
            <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Message from {invite.invited_by}:</strong>
              </p>
              <p className="text-gray-800">{invite.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Business Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your Business Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of your business"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://yourbusiness.com"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={invite?.email || ''}
                    className="w-full px-4 py-2 border border-gray-300 bg-gray-50 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">This is your invitation email</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Payment Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IBAN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="DE89 3704 0044 0532 0130 00"
                />
                <p className="text-xs text-gray-500 mt-1">For receiving gift card sale payments</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 font-light"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
