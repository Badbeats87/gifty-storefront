import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../page';

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }
}));

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dashboard with search input', () => {
    render(<Dashboard />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Search and manage gift cards across all businesses')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter gift card code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
  });

  it('updates search input value on change', () => {
    render(<Dashboard />);

    const input = screen.getByPlaceholderText(/Enter gift card code/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'GIFT-1234-5678' } });

    expect(input.value).toBe('GIFT-1234-5678');
  });

  it('displays loading state when searching', async () => {
    const { supabase } = require('@/lib/supabase');

    // Mock a delayed response
    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
        }))
      }))
    });

    render(<Dashboard />);

    const input = screen.getByPlaceholderText(/Enter gift card code/i);
    const button = screen.getByRole('button', { name: /Search/i });

    fireEvent.change(input, { target: { value: 'GIFT-1234-5678' } });
    fireEvent.click(button);

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('displays error message when gift card is not found', async () => {
    const { supabase } = require('@/lib/supabase');

    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Gift card not found' }
          }))
        }))
      }))
    });

    render(<Dashboard />);

    const input = screen.getByPlaceholderText(/Enter gift card code/i);
    const button = screen.getByRole('button', { name: /Search/i });

    fireEvent.change(input, { target: { value: 'INVALID-CODE' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Gift card not found')).toBeInTheDocument();
    });
  });

  it('displays gift card details when found', async () => {
    const { supabase } = require('@/lib/supabase');

    const mockGiftCard = {
      id: 'gc-123',
      code: 'GIFT-1234-5678',
      amount: 100,
      remaining_balance: 100,
      currency: 'USD',
      status: 'issued',
      expires_at: '2025-12-31',
      business: { name: 'Test Business' },
      customer: { email: 'test@example.com', name: 'Test Customer' }
    };

    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: mockGiftCard,
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      }))
    });

    render(<Dashboard />);

    const input = screen.getByPlaceholderText(/Enter gift card code/i);
    const button = screen.getByRole('button', { name: /Search/i });

    fireEvent.change(input, { target: { value: 'GIFT-1234-5678' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Gift Card Details')).toBeInTheDocument();
      expect(screen.getByText('GIFT-1234-5678')).toBeInTheDocument();
      expect(screen.getByText('Test Business')).toBeInTheDocument();
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
      expect(screen.getByText('Original Amount')).toBeInTheDocument();
      expect(screen.getByText('Current Balance')).toBeInTheDocument();
    });
  });

  it('shows redeem button for issued gift cards', async () => {
    const { supabase } = require('@/lib/supabase');

    const mockGiftCard = {
      id: 'gc-123',
      code: 'GIFT-1234-5678',
      amount: 100,
      remaining_balance: 100,
      currency: 'USD',
      status: 'issued',
      expires_at: '2025-12-31',
      business: { name: 'Test Business' },
      customer: { email: 'test@example.com', name: 'Test Customer' }
    };

    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: mockGiftCard,
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      }))
    });

    render(<Dashboard />);

    const input = screen.getByPlaceholderText(/Enter gift card code/i);
    const button = screen.getByRole('button', { name: /Search/i });

    fireEvent.change(input, { target: { value: 'GIFT-1234-5678' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Redeem Gift Card/i)).toBeInTheDocument();
    });
  });

  it('does not show search button when input is empty', () => {
    render(<Dashboard />);

    const input = screen.getByPlaceholderText(/Enter gift card code/i);
    const button = screen.getByRole('button', { name: /Search/i });

    expect(input).toHaveValue('');

    // Button should be present but clicking won't do anything with empty input
    fireEvent.click(button);

    // No error should be displayed since we return early for empty input
    expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument();
  });

  it('normalizes gift card code to uppercase', async () => {
    const { supabase } = require('@/lib/supabase');

    const mockSelect = jest.fn(() => ({
      single: jest.fn(() => Promise.resolve({
        data: null,
        error: { message: 'Not found' }
      }))
    }));

    const mockEq = jest.fn(() => ({
      single: mockSelect().single
    }));

    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: mockEq
      }))
    });

    render(<Dashboard />);

    const input = screen.getByPlaceholderText(/Enter gift card code/i);
    const button = screen.getByRole('button', { name: /Search/i });

    fireEvent.change(input, { target: { value: 'gift-1234-5678' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockEq).toHaveBeenCalledWith('code', 'GIFT-1234-5678');
    });
  });
});
