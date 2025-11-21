/**
 * Mock Payment Processor
 * Simulates payment processing for development/demo purposes
 * In production, replace with real payment provider (Stripe, Wise, etc.)
 */

export interface MockPaymentRequest {
  amount: number;
  currency: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  email: string;
}

export interface MockPaymentResponse {
  success: boolean;
  transactionId: string;
  message: string;
  timestamp: Date;
}

/**
 * Process a mock payment
 * Simulates payment processing with a small delay
 * 90% of payments succeed, 10% randomly fail for testing
 */
export async function processMockPayment(request: MockPaymentRequest): Promise<MockPaymentResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 10% chance of failure for testing
  const shouldFail = Math.random() < 0.1;

  if (shouldFail) {
    return {
      success: false,
      transactionId: '',
      message: 'Payment failed. Please try again or use a different payment method.',
      timestamp: new Date(),
    };
  }

  // Validate basic card info (just for demo)
  if (
    !request.cardNumber ||
    !request.cardExpiry ||
    !request.cardCvc ||
    request.amount <= 0
  ) {
    return {
      success: false,
      transactionId: '',
      message: 'Invalid payment information. Please check your details.',
      timestamp: new Date(),
    };
  }

  // Generate a mock transaction ID
  const transactionId = `MOCK_TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  return {
    success: true,
    transactionId,
    message: `Payment of $${request.amount.toFixed(2)} processed successfully. Transaction ID: ${transactionId}`,
    timestamp: new Date(),
  };
}

/**
 * Validate card number (basic Luhn algorithm check for demo)
 */
export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate expiry date (MM/YY format)
 */
export function validateExpiryDate(expiry: string): boolean {
  const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  if (!regex.test(expiry)) return false;

  const [month, year] = expiry.split('/');
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;

  const expiryYear = parseInt(year, 10);
  const expiryMonth = parseInt(month, 10);

  if (expiryYear < currentYear) return false;
  if (expiryYear === currentYear && expiryMonth < currentMonth) return false;

  return true;
}

/**
 * Validate CVC (3-4 digit security code)
 */
export function validateCvc(cvc: string): boolean {
  return /^\d{3,4}$/.test(cvc);
}
