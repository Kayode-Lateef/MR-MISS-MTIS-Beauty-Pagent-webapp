const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const VERIFY_TIMEOUT_MS = 15000;

export interface PaystackVerifiedPayment {
  id: number;
  reference: string;
  amount: number; // kobo
  currency: string;
  status: 'success' | 'failed' | 'abandoned' | string;
  metadata?: Record<string, any> | null;
  customer?: { email?: string; first_name?: string; last_name?: string; phone?: string };
  channel?: string;
  [key: string]: any;
}

/**
 * Calls Paystack's server-to-server verify endpoint using our secret key.
 * This is the only source of truth for a transaction's real status,
 * amount, and currency — client-supplied statuses and webhook payloads
 * are never trusted on their own, only used to know which reference to
 * look up here.
 *
 * Note: like the Flutterwave equivalent, this returns whatever status
 * Paystack reports ('success', 'failed', 'abandoned', ...) rather than
 * throwing just because the payment itself wasn't successful. It only
 * throws when the verification call itself couldn't be completed
 * (network error, bad credentials, malformed response).
 */
export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifiedPayment> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error(
      'PAYSTACK_SECRET_KEY is not configured. Add it to your environment (this is your Paystack secret key, separate from the public key).'
    );
  }

  if (!reference) {
    throw new Error('Missing transaction reference to verify.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Timed out while verifying payment with Paystack.');
    }
    throw new Error(`Network error while verifying payment: ${err?.message || 'unknown error'}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let detail = '';
    try {
      const errBody = await response.json();
      detail = errBody?.message ? `: ${errBody.message}` : '';
    } catch {
      // ignore parse errors on the error body
    }
    throw new Error(`Paystack verification call failed (HTTP ${response.status})${detail}.`);
  }

  const result = await response.json();

  if (result?.status !== true || !result?.data) {
    // The API call itself didn't return a usable result — not that the
    // payment failed. A failed/abandoned payment still comes back with
    // result.status === true and result.data.status === 'failed'.
    throw new Error(result?.message || 'Paystack verification did not return a usable result.');
  }

  return result.data as PaystackVerifiedPayment;
}
