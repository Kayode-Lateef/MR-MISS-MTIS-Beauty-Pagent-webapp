const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const VERIFY_TIMEOUT_MS = 15000;

export interface FlutterwaveVerifiedPayment {
  id: number | string;
  tx_ref: string;
  amount: number;
  currency: string;
  status: 'successful' | 'pending' | 'failed' | string;
  payment_type?: string;
  payment_options?: string;
  meta?: Record<string, any>;
  customer?: { name?: string; email?: string; phone_number?: string };
  [key: string]: any;
}

/**
 * Calls Flutterwave's server-to-server verify endpoint using our secret
 * key. This is the only source of truth for a transaction's real status,
 * amount, and currency — client-supplied statuses and webhook payloads
 * are never trusted on their own, only used to know which transaction id
 * to look up here.
 *
 * Note: this returns whatever status Flutterwave reports — 'successful',
 * 'pending', 'failed', etc. It does NOT throw just because the payment
 * itself wasn't successful; callers are expected to branch on
 * `result.status` (see finalizeSuccessfulPayment / recordNonSuccessfulPayment
 * in ../flutterwave.ts). It only throws when the verification call itself
 * couldn't be completed (network error, bad credentials, malformed
 * response) — i.e. when we genuinely don't know the transaction's status.
 */
export async function verifyFlutterwaveTransaction(transactionId: string): Promise<FlutterwaveVerifiedPayment> {
  if (!FLUTTERWAVE_SECRET_KEY) {
    throw new Error(
      'FLUTTERWAVE_SECRET_KEY is not configured. Add it to your environment (this is your Flutterwave secret key, separate from the public key and the webhook secret).'
    );
  }

  if (!transactionId) {
    throw new Error('Missing transaction id to verify.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Timed out while verifying payment with Flutterwave.');
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
    throw new Error(`Flutterwave verification call failed (HTTP ${response.status})${detail}.`);
  }

  const result = await response.json();

  if (result?.status !== 'success' || !result?.data) {
    // This means the API call itself didn't return a usable result — not
    // that the payment failed. A payment that failed still comes back as
    // `result.status === 'success'` with `result.data.status === 'failed'`.
    throw new Error(result?.message || 'Flutterwave verification did not return a usable result.');
  }

  return result.data as FlutterwaveVerifiedPayment;
}
