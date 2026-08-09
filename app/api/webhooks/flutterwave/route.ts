import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyTransaction } from '../../lib/flutterwave';
import { finalizeSuccessfulPayment, recordNonSuccessfulPayment } from '../../lib/payments';

const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

// Event types we actually act on. Flutterwave sends many event kinds
// (transfer.completed, subscription.cancelled, etc.) — anything not in
// this list is acknowledged with 200 and ignored, so we never try to
// process something that isn't a card/bank/ussd charge.
const HANDLED_EVENTS = new Set(['charge.completed']);

function log(event: string, details: Record<string, unknown>) {
  console.log(`[webhook] ${event}`, details);
}

function logError(event: string, details: Record<string, unknown>) {
  console.error(`[webhook] ${event}`, details);
}

/**
 * Constant-time string comparison so an attacker probing this endpoint
 * can't learn the webhook secret one byte at a time via response-timing
 * differences.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Flutterwave's docs describe two different webhook-verification schemes
 * depending on account/integration version:
 *   1. A static `verif-hash` header that must exactly equal your secret
 *      hash (simple string compare).
 *   2. An HMAC-SHA256 `flutterwave-signature` header, computed over the
 *      raw request body using your secret hash as the HMAC key.
 * Both use the same "Secret Hash" you set in Settings > Webhooks — we
 * just don't know in advance which header your account sends, so we
 * accept either one. If neither header is present, the request is
 * rejected.
 */
function isValidWebhookSignature(request: NextRequest, rawBody: string, secret: string): boolean {
  const staticHash = request.headers.get('verif-hash');
  if (staticHash) {
    return safeEqual(staticHash, secret);
  }

  const hmacSignature = request.headers.get('flutterwave-signature');
  if (hmacSignature) {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    return safeEqual(hmacSignature, expected);
  }

  return false;
}

/**
 * Validates the shape of a Flutterwave webhook body before we touch it.
 * Returns a list of problems (empty = valid).
 */
function validatePayload(payload: any): string[] {
  const problems: string[] = [];
  if (!payload || typeof payload !== 'object') {
    problems.push('Body is not a JSON object.');
    return problems;
  }
  if (payload.event !== undefined && typeof payload.event !== 'string') {
    problems.push('`event` must be a string.');
  }
  if (payload.data !== undefined) {
    if (typeof payload.data !== 'object' || payload.data === null) {
      problems.push('`data` must be an object.');
    } else {
      if (!payload.data.id) problems.push('`data.id` is missing.');
      if (!payload.data.tx_ref) problems.push('`data.tx_ref` is missing.');
    }
  }
  return problems;
}

/**
 * Real Flutterwave -> server webhook receiver.
 *
 *   verif-hash check
 *        │
 *        ▼
 *   payload validation
 *        │
 *        ▼
 *   event-type filter (charge.completed only)
 *        │
 *        ▼
 *   GET /v3/transactions/{id}/verify   (source of truth, not the webhook body)
 *        │
 *        ▼
 *   branch on verified status:
 *     successful → check currency → check amount → insert payment → insert votes
 *     pending    → upsert payments row (status=pending), no votes
 *     failed     → upsert payments row (status=failed), no votes
 *
 * Idempotent throughout — safe to receive the same event multiple times,
 * which Flutterwave will do on any non-2xx response.
 */
export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    logError('missing_webhook_secret', {});
    // 500 so Flutterwave retries once the secret is configured, instead
    // of silently accepting unverifiable webhooks.
    return NextResponse.json({ success: false, error: 'Webhook secret is not configured.' }, { status: 500 });
  }

  const rawBody = await request.text();

  if (!isValidWebhookSignature(request, rawBody, webhookSecret)) {
    logError('invalid_signature', {
      hasVerifHash: !!request.headers.get('verif-hash'),
      hasHmacSignature: !!request.headers.get('flutterwave-signature'),
    });
    return NextResponse.json({ success: false, error: 'Invalid webhook signature.' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    logError('invalid_json', {});
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  // Flutterwave sends a test ping with no `data` when the webhook URL is
  // first saved in the dashboard. Acknowledge it without erroring.
  if (!payload?.data) {
    log('ping_or_no_data', { event: payload?.event });
    return NextResponse.json({ success: true, message: 'No transaction data — acknowledged.' });
  }

  const validationProblems = validatePayload(payload);
  if (validationProblems.length > 0) {
    logError('payload_validation_failed', { problems: validationProblems });
    return NextResponse.json({ success: false, error: 'Invalid payload.', details: validationProblems }, { status: 400 });
  }

  const event = typeof payload.event === 'string' ? payload.event : 'unknown';
  if (!HANDLED_EVENTS.has(event)) {
    log('ignored_event_type', { event });
    return NextResponse.json({ success: true, processed: false, reason: `Ignored event type: ${event}` });
  }

  const data = payload.data;
  const transactionId = data.id;
  const txRef = data.tx_ref;

  log('webhook_received', { event, transactionId, txRef, reportedStatus: data.status });

  try {
    // Always re-verify server-to-server — the webhook body is only used
    // to learn which transaction id to look up.
    const verified = await verifyTransaction(String(transactionId));

    if (String(verified.tx_ref) !== String(txRef)) {
      logError('tx_ref_mismatch', { transactionId, webhookTxRef: txRef, verifiedTxRef: verified.tx_ref });
      return NextResponse.json({ success: false, error: 'tx_ref mismatch between webhook and verification.' }, { status: 400 });
    }

    const metadata = verified.meta ?? {};
    const sharedFields = {
      transactionId: String(verified.id),
      tx_ref: String(verified.tx_ref),
      expectedAmount: metadata.expected_amount,
      votesPurchased: metadata.votes_purchased,
      contestantId: metadata.contestant_id,
      contestantName: metadata.contestant_name,
      gender: metadata.gender,
      division: metadata.division,
      voterName: metadata.voter_name ?? verified.customer?.name,
      voterEmail: metadata.voter_email ?? verified.customer?.email,
      voterPhone: metadata.voter_phone ?? verified.customer?.phone_number ?? null,
    };

    if (verified.status === 'successful') {
      const result = await finalizeSuccessfulPayment(verified, sharedFields);
      log('webhook_processed_successful', { transactionId, txRef, votesAdded: result.votesAdded, alreadyProcessed: result.alreadyProcessed });
      return NextResponse.json(result);
    }

    // pending, failed, or anything else Flutterwave might report.
    const result = await recordNonSuccessfulPayment(verified, sharedFields);
    log('webhook_processed_non_successful', { transactionId, txRef, status: verified.status });
    return NextResponse.json(result);
  } catch (error: any) {
    logError('processing_error', { transactionId, txRef, error: error?.message });
    // 500 so Flutterwave retries — this is most likely transient (our DB,
    // or a temporary Flutterwave verify-endpoint hiccup), not a
    // permanently invalid request.
    return NextResponse.json({ success: false, error: error?.message || 'Payment processing failed' }, { status: 500 });
  }
}
