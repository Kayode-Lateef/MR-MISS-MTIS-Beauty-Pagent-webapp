import { verifyFlutterwaveTransaction } from './flutterwave/verify';
import {
  finalizeSuccessfulPayment,
  recordNonSuccessfulPayment,
  NormalizedPayment,
  PaymentPayload,
} from './payments';

function log(event: string, details: Record<string, unknown>) {
  console.log(`[flutterwave] ${event}`, details);
}

function logError(event: string, details: Record<string, unknown>) {
  console.error(`[flutterwave] ${event}`, details);
}

/**
 * Re-verifies a transaction directly against Flutterwave and normalizes
 * the result into the shape ../payments.ts understands. This is the ONLY
 * place a Flutterwave transaction's status/amount/currency are considered
 * trusted — everything else (webhook body, client callback) is just
 * "here's an id to go check".
 */
export async function verifyTransaction(transactionId: string): Promise<NormalizedPayment> {
  log('verifying_transaction', { transactionId });
  const payment = await verifyFlutterwaveTransaction(transactionId);
  log('verification_result', {
    transactionId,
    tx_ref: payment.tx_ref,
    status: payment.status,
    currency: payment.currency,
    amount: payment.amount,
  });

  return {
    id: payment.id,
    tx_ref: String(payment.tx_ref),
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status === 'successful' ? 'successful' : payment.status,
    meta: payment.meta,
    customer: payment.customer,
    paymentMethod: payment.payment_type || payment.payment_options || 'flutterwave',
    provider: 'flutterwave',
  };
}

/**
 * Convenience wrapper for the client-facing /api/verify-payments route:
 * verifies the transaction and, if successful, finalizes it. If the
 * transaction is not successful, this throws (the client callback path
 * only ever calls this after Flutterwave's inline modal already reported
 * a successful charge, so pending/failed here means something is off and
 * should surface as an error to the browser).
 */
export async function processFlutterwavePayment(payload: PaymentPayload) {
  if (!payload.transactionId) {
    throw new Error('Missing Flutterwave transaction id.');
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
