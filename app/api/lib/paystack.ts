import { verifyPaystackTransaction } from './paystack/verify';
import {
  finalizeSuccessfulPayment,
  recordNonSuccessfulPayment,
  NormalizedPayment,
  PaymentPayload,
} from './payments';

function log(event: string, details: Record<string, unknown>) {
  console.log(`[paystack] ${event}`, details);
}

function logError(event: string, details: Record<string, unknown>) {
  console.error(`[paystack] ${event}`, details);
}

/**
 * Maps Paystack's own status vocabulary onto the normalized
 * 'successful' | 'pending' | 'failed' used throughout ../payments.ts.
 */
function normalizeStatus(paystackStatus: string): 'successful' | 'pending' | 'failed' {
  if (paystackStatus === 'success') return 'successful';
  if (paystackStatus === 'abandoned' || paystackStatus === 'failed' || paystackStatus === 'reversed') return 'failed';
  return 'pending';
}

/**
 * Re-verifies a transaction directly against Paystack and normalizes the
 * result into the shape ../payments.ts understands. This is the ONLY
 * place a Paystack transaction's status/amount/currency are considered
 * trusted — everything else (webhook body, client callback) is just
 * "here's a reference to go check".
 */
export async function verifyTransaction(reference: string): Promise<NormalizedPayment> {
  log('verifying_transaction', { reference });
  const payment = await verifyPaystackTransaction(reference);
  log('verification_result', {
    reference,
    status: payment.status,
    currency: payment.currency,
    amountKobo: payment.amount,
  });

  const metadata = normalizeMetadata(payment.metadata);
  const customerName = metadata.voter_name || [payment.customer?.first_name, payment.customer?.last_name].filter(Boolean).join(' ') || undefined;

  return {
    id: payment.id,
    tx_ref: payment.reference,
    // Paystack reports amount in kobo; the rest of the system works in
    // whole Naira (matching Flutterwave and the site's vote pricing).
    amount: Number(payment.amount) / 100,
    currency: payment.currency || 'NGN',
    status: normalizeStatus(payment.status),
    meta: metadata,
    customer: {
      name: customerName,
      email: payment.customer?.email,
      phone_number: payment.customer?.phone,
    },
    paymentMethod: payment.channel || 'paystack',
    provider: 'paystack',
  };
}

/**
 * Paystack metadata comes back exactly as we sent it, but if it was ever
 * sent as the literal string "unknown" (an old Paystack convention for
 * "no metadata set") or is otherwise not an object, normalize to {}.
 * Also flattens an optional `custom_fields` array (Paystack's own
 * dashboard-display convention) into plain key/value pairs alongside any
 * flat keys we send directly, so callers can just read metadata.foo
 * either way.
 */
function normalizeMetadata(raw: unknown): Record<string, any> {
  if (!raw || typeof raw !== 'object') return {};
  const metadata = { ...(raw as Record<string, any>) };

  if (Array.isArray(metadata.custom_fields)) {
    for (const field of metadata.custom_fields) {
      if (field?.variable_name && !(field.variable_name in metadata)) {
        metadata[field.variable_name] = field.value;
      }
    }
  }

  return metadata;
}

/**
 * Convenience wrapper for the client-facing /api/verify-payments route:
 * verifies the transaction and, if successful, finalizes it. If the
 * transaction is not successful, this throws (the client callback path
 * only ever calls this after Paystack's inline popup already reported a
 * successful charge, so pending/failed here means something is off and
 * should surface as an error to the browser).
 */
export async function processPaystackPayment(payload: PaymentPayload) {
  if (!payload.transactionId) {
    throw new Error('Missing Paystack transaction reference.');
  }

  const payment = await verifyTransaction(payload.transactionId);

  if (payload.tx_ref && payment.tx_ref && String(payment.tx_ref) !== String(payload.tx_ref)) {
    throw new Error('Payment reference does not match.');
  }

  if (payment.status !== 'successful') {
    // Keep an audit trail even for the client-triggered path.
    await recordNonSuccessfulPayment(payment, payload).catch((e) => logError('failed_to_record_non_successful', { error: e }));
    throw new Error(`Payment unsuccessful (status: ${payment.status}).`);
  }

  return finalizeSuccessfulPayment(payment, payload);
}
