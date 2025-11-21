'use client';

import { useState } from 'react';

interface SendInviteFormProps {
  onInviteSent: () => void; // Callback to refresh data or show success message in parent
}

export default function SendInviteForm({ onInviteSent }: SendInviteFormProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const response = await fetch('/api/admin/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          invitedBy: 'Admin', // Assuming admin is sending the invite
          message: inviteMessage || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invite');
      }

      const data = await response.json();
      setInviteSuccess(`Invitation sent! Registration URL: ${data.invite.registrationUrl}`);
      setInviteEmail('');
      setInviteMessage('');
      onInviteSent(); // Notify parent of successful invite
    } catch (err: any) {
      console.error('Error sending invite:', err);
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-xl">
        <h2 className="text-xl font-semibold mb-4">Send Business Invitation</h2>
        <form onSubmit={sendInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="business@example.com"
              disabled={sending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Message (Optional)
            </label>
            <textarea
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a personal message to include in the invitation email..."
              disabled={sending}
            />
          </div>

          {inviteSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">✓ Success!</p>
              <p className="text-green-700 text-sm mt-1">{inviteSuccess}</p>
            </div>
          )}

          {inviteError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{inviteError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
          >
            {sending ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>
    </div>
  );
}
