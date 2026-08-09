import { NextRequest, NextResponse } from 'next/server';
import { processFlutterwavePayment } from '../lib/flutterwave';
import { processPaystackPayment } from '../lib/paystack';
import { PaymentPayload } from '../lib/payments';

/**
 * Client-facing endpoint: called by the browser right after the
 * Flutterwave inline checkout modal or the Paystack inline popup reports
 * a successful payment.
 *
 * This is NOT a webhook (see /api/webhooks/flutterwave and
 * /api/webhooks/paystack) and must never require a webhook secret — the
 * browser has no business knowing that secret. Instead, trust is
 * established by independently re-verifying the transaction against the
 * provider's own API using our server-side secret key inside
 * processFlutterwavePayment() / processPaystackPayment(), so a malicious
 * client can't just POST a fake "successful" status.
 */
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const {
    transaction_id: transactionId,
    tx_ref: txRef,
    expected_amount: expectedAmount,
    votes_purchased: votesPurchased,
    contestant_id: contestantId,
    contestant_name: contestantName,
    gender,
    division,
    voter_name: voterName,
    voter_email: voterEmail,
    voter_phone: voterPhone,
    provider,
  } = body || {};

  if (provider !== 'flutterwave' && provider !== 'paystack') {
    return NextResponse.json({ success: false, error: "Missing or invalid 'provider'. Expected 'flutterwave' or 'paystack'." }, { status: 400 });
  }

  if (!transactionId) {
    return NextResponse.json({ success: false, error: 'Missing transaction_id.' }, { status: 400 });
  }

  if (!txRef) {
    return NextResponse.json({ success: false, error: 'Missing tx_ref.' }, { status: 400 });
  }

  if (!contestantId || !contestantName || !voterName || !voterEmail) {
    return NextResponse.json({ success: false, error: 'Missing required payment details.' }, { status: 400 });
  }

  const payload: PaymentPayload = {
    transactionId: String(transactionId),
    tx_ref: String(txRef),
    expectedAmount,
    votesPurchased,
    contestantId,
    contestantName,
    gender: gender === 'male' || gender === 'female' ? gender : undefined,
    division: division === 'senior' || division === 'junior' || division === 'primary' ? division : undefined,
    voterName,
    voterEmail,
    voterPhone: voterPhone ?? null,
    paymentMethod: provider,
  };

  try {
    const result = provider === 'paystack'
      ? await processPaystackPayment(payload)
      : await processFlutterwavePayment(payload);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`[verify-payments] ${provider} verification error:`, error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Payment processing failed' },
      { status: 400 }
    );
  }
}
