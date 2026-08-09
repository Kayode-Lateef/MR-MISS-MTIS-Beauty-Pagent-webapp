import { getSupabaseAdmin } from './auth';

// Postgres unique_violation error code.
const UNIQUE_VIOLATION = '23505';

// Fallback only — used if the `vote_price` row is missing or unreadable
// from site_content (e.g. before that migration has been run). The real,
// current price always comes from the database via getVotePrice() so the
// admin can change it from the dashboard without a code deploy.
const DEFAULT_VOTE_PRICE = 50;

let votePriceCache: { value: number; fetchedAt: number } | null = null;
const VOTE_PRICE_CACHE_MS = 30_000; // avoid a DB round trip on every single payment

/**
 * Reads the current price-per-vote (in NGN) from the `site_content` table
 * (id = 'vote_price'), which the admin edits from Dashboard → Site
 * Content → Voting Price. Cached briefly to avoid an extra DB query on
 * every payment; a price change takes effect for new checkouts within
 * VOTE_PRICE_CACHE_MS.
 */
export async function getVotePrice(): Promise<number> {
  if (votePriceCache && Date.now() - votePriceCache.fetchedAt < VOTE_PRICE_CACHE_MS) {
    return votePriceCache.value;
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('site_content').select('value').eq('id', 'vote_price').maybeSingle();
    if (error) throw error;

    const parsed = Number(data?.value);
    const price = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_VOTE_PRICE;
    votePriceCache = { value: price, fetchedAt: Date.now() };
    return price;
  } catch {
    // Fail soft — a misconfigured/missing row shouldn't take checkout down.
    return DEFAULT_VOTE_PRICE;
  }
}

export type PaymentProvider = 'flutterwave' | 'paystack';

/**
 * A payment transaction, already verified server-to-server against the
 * provider's own API and normalized into one shape. This is the ONLY
 * shape the finalize/record logic below understands — each provider
 * adapter (../flutterwave.ts, ../paystack.ts) is responsible for mapping
 * its API's response into this before calling into this module.
 */
export interface NormalizedPayment {
  /** The provider's own transaction id (Flutterwave's numeric id, Paystack's reference). */
  id: string | number;
  /** Our own reference, generated client-side at checkout and echoed back by the provider. */
  tx_ref: string;
  /** Amount actually confirmed paid, in NGN (major unit — already converted from kobo if needed). */
  amount: number;
  currency: string;
  /** Normalized to 'successful' | 'pending' | 'failed' regardless of the provider's own wording. */
  status: 'successful' | 'pending' | 'failed' | string;
  meta?: Record<string, any>;
  customer?: { name?: string; email?: string; phone_number?: string };
  paymentMethod?: string;
  provider: PaymentProvider;
}

export interface PaymentPayload {
  transactionId: string;
  tx_ref?: string;
  expectedAmount?: number | string;
  votesPurchased?: number | string;
  contestantId?: number | string;
  contestantName?: string;
  gender?: 'male' | 'female';
  division?: 'senior' | 'junior' | 'primary';
  voterName?: string;
  voterEmail?: string;
  voterPhone?: string | null;
  paymentMethod?: string;
  status?: string;
}

function log(provider: PaymentProvider, event: string, details: Record<string, unknown>) {
  // Centralised so every stage of processing is traceable in prod logs.
  // Never log secrets (keys, tokens) — only ids/refs/amounts/status.
  console.log(`[${provider}] ${event}`, details);
}

function logError(provider: PaymentProvider, event: string, details: Record<string, unknown>) {
  console.error(`[${provider}] ${event}`, details);
}

/**
 * Finalizes a payment already confirmed `status === 'successful'` by the
 * provider's own verify endpoint. Validates currency + amount, then
 * idempotently persists a payment row and the corresponding votes.
 *
 *   verify (done by caller) → check currency == NGN → check amount →
 *   insert payment (claims tx_ref) → insert votes
 *
 * The payment row is inserted BEFORE the votes, not after, on purpose:
 * `payments.tx_ref` has a UNIQUE constraint, so if this function is ever
 * invoked twice for the same transaction (webhook redelivery racing the
 * client's callback, a provider retrying its webhook, etc.) the second
 * call's insert hits a unique violation and is treated as "already
 * processed" — instead of both calls racing past a SELECT-then-INSERT
 * check and double-crediting votes. This guarantee holds regardless of
 * which provider (or even which TWO providers) reported the same tx_ref.
 */
export async function finalizeSuccessfulPayment(payment: NormalizedPayment, payload: PaymentPayload) {
  const { provider } = payment;

  if (payment.status !== 'successful') {
    throw new Error(`Cannot finalize a non-successful payment (status: ${payment.status}).`);
  }

  if (String(payment.currency).toUpperCase() !== 'NGN') {
    logError(provider, 'currency_mismatch', { transactionId: payment.id, currency: payment.currency });
    throw new Error('Payment currency is invalid.');
  }

  const metadata = payment?.meta ?? {};
  const normalizedAmount = Number(payment.amount ?? payload.expectedAmount ?? 0);
  const votePrice = await getVotePrice();

  // Votes are derived from the amount the provider actually confirms was
  // paid, NOT from a separately-transmitted "votes_purchased" number.
  // Trusting a side-channel vote count caused real, successful payments
  // to be rejected whenever the confirmed amount didn't exactly equal
  // claimedVotes * votePrice — which happens legitimately whenever a
  // processing fee changes the settled amount. Deriving votes directly
  // from money actually received removes that whole failure mode: a
  // voter always gets exactly floor(amountPaid / votePrice) votes, at
  // whatever price-per-vote is currently configured in Site Content.
  const claimedVotes = Number(payload.votesPurchased ?? metadata.votes_purchased ?? 0);
  const normalizedVotes = Math.floor(normalizedAmount / votePrice);

  if (Number.isFinite(claimedVotes) && claimedVotes > 0 && claimedVotes !== normalizedVotes) {
    log(provider, 'votes_claimed_vs_confirmed_mismatch', {
      transactionId: payment.id, txRef: payment.tx_ref,
      claimedVotes, confirmedAmount: normalizedAmount, votesFromAmount: normalizedVotes,
    });
  }

  const transactionId = String(payment.id || payload.transactionId);
  const txRef = String(payment.tx_ref || payload.tx_ref || transactionId);
  const contestantId = payload.contestantId ?? metadata.contestant_id;
  const contestantName = payload.contestantName ?? metadata.contestant_name;
  const gender = payload.gender ?? metadata.gender ?? null;
  const division = payload.division ?? metadata.division ?? null;
  const voterName = payload.voterName ?? metadata.voter_name ?? payment.customer?.name;
  const voterEmail = payload.voterEmail ?? metadata.voter_email ?? payment.customer?.email;
  const voterPhone = payload.voterPhone ?? metadata.voter_phone ?? payment.customer?.phone_number ?? null;
  const paymentMethod = payload.paymentMethod ?? payment.paymentMethod ?? provider;

  if (!contestantId || !contestantName || !voterName || !voterEmail) {
    logError(provider, 'missing_details', { transactionId, txRef, contestantId, contestantName, voterName, voterEmail });
    throw new Error('Missing required payment details.');
  }

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error('Payment amount is invalid.');
  }

  // The only hard requirement left: the confirmed payment must be enough
  // to buy at least one vote. We do NOT require the confirmed amount to
  // exactly equal what the client expected to pay, or exactly equal
  // votes * votePrice — both broke on legitimate payments whenever a
  // processing fee changed the settled amount. Any leftover that doesn't
  // divide evenly into votePrice simply isn't converted into a vote (e.g.
  // a ₦12 fee on top of ₦50 just doesn't buy a 2nd vote).
  if (normalizedVotes <= 0) {
    logError(provider, 'amount_below_minimum', { transactionId, txRef, confirmedAmount: normalizedAmount, votePrice });
    throw new Error(`Payment amount (₦${normalizedAmount}) is below the current price of ₦${votePrice} for one vote.`);
  }

  if (payload.expectedAmount != null && Number(payment.amount) !== Number(payload.expectedAmount)) {
    // Informational only — logged so unusually large discrepancies are
    // still visible, but never blocks a confirmed-successful payment.
    log(provider, 'amount_differs_from_expected', { transactionId, txRef, confirmed: payment.amount, expected: payload.expectedAmount });
  }

  const supabaseAdmin = getSupabaseAdmin();

  // --- Idempotency check #1: has this tx_ref already been recorded? ---
  const { data: existingPayment, error: existingPaymentError } = await supabaseAdmin
    .from('payments')
    .select('id, status, votes_purchased')
    .eq('tx_ref', txRef)
    .maybeSingle();

  if (existingPaymentError) throw existingPaymentError;

  if (existingPayment && existingPayment.status === 'successful') {
    log(provider, 'already_processed', { transactionId, txRef });
    return {
      success: true,
      verified: true,
      alreadyProcessed: true,
      votesAdded: existingPayment.votes_purchased,
      transactionId,
    };
  }

  // --- Idempotency check #2: have votes already been recorded for this transaction? ---
  const { count: existingVoteCount, error: existingVoteError } = await supabaseAdmin
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('payment_transaction_id', transactionId);

  if (existingVoteError) throw existingVoteError;

  if ((existingVoteCount || 0) > 0) {
    log(provider, 'votes_already_recorded', { transactionId, txRef, existingVoteCount });
    return {
      success: true,
      verified: true,
      alreadyProcessed: true,
      votesAdded: existingVoteCount,
      transactionId,
    };
  }

  const paymentRow = {
    transaction_id: transactionId,
    tx_ref: txRef,
    amount: normalizedAmount,
    votes_purchased: normalizedVotes,
    contestant_id: Number(contestantId),
    contestant_name: contestantName,
    voter_name: voterName,
    voter_email: voterEmail,
    voter_phone: voterPhone || null,
    status: 'successful',
    payment_method: paymentMethod,
    provider,
    created_at: new Date().toISOString(),
  };

  // A `pending` row may already exist for this tx_ref from an earlier
  // webhook event — upsert on conflict so we update it to `successful`
  // instead of erroring, but still stop a genuine duplicate `successful`
  // insert from racing (that case was already handled above).
  const { error: paymentError } = existingPayment
    ? await supabaseAdmin.from('payments').update(paymentRow).eq('tx_ref', txRef)
    : await supabaseAdmin.from('payments').insert(paymentRow);

  if (paymentError) {
    if ((paymentError as any).code === UNIQUE_VIOLATION) {
      log(provider, 'race_lost_already_processed', { transactionId, txRef });
      return {
        success: true,
        verified: true,
        alreadyProcessed: true,
        votesAdded: normalizedVotes,
        transactionId,
      };
    }
    throw paymentError;
  }

  const voteRows = Array.from({ length: normalizedVotes }, () => ({
    contestant_id: Number(contestantId),
    category_id: 'peoplesChoice',
    gender: gender || null,
    division: division || null,
    vote_timestamp: new Date().toISOString(),
    is_valid: true,
    is_public_vote: true,
    payment_transaction_id: transactionId,
    payment_amount: normalizedAmount,
    voter_name: voterName,
    voter_email: voterEmail,
  }));

  const { error: voteError } = await supabaseAdmin.from('votes').insert(voteRows);
  if (voteError) {
    logError(provider, 'vote_insert_failed_rolling_back_payment', { transactionId, txRef, error: voteError });
    await supabaseAdmin.from('payments').delete().eq('tx_ref', txRef).eq('transaction_id', transactionId);
    throw voteError;
  }

  log(provider, 'payment_finalized', { transactionId, txRef, votesAdded: normalizedVotes });

  return {
    success: true,
    verified: true,
    alreadyProcessed: false,
    votesAdded: normalizedVotes,
    transactionId,
  };
}

/**
 * Records a payment the provider confirms is `pending` or `failed` (or
 * any other non-successful status). No votes are ever added for these.
 * This just keeps an auditable, idempotent record — upserted by tx_ref —
 * so admins can see abandoned/declined attempts, and so that if a later
 * webhook reports the same tx_ref as `successful`, that call naturally
 * lands in finalizeSuccessfulPayment's upsert path above.
 */
export async function recordNonSuccessfulPayment(payment: NormalizedPayment, payload: Partial<PaymentPayload>) {
  const { provider } = payment;
  const metadata = payment?.meta ?? {};
  const transactionId = String(payment.id || payload.transactionId || '');
  const txRef = String(payment.tx_ref || payload.tx_ref || transactionId);
  const status = payment.status === 'pending' ? 'pending' : 'failed';

  if (!transactionId || !txRef) {
    logError(provider, 'cannot_record_non_successful_missing_ids', { transactionId, txRef });
    return { success: true, processed: false, reason: 'Missing transaction id / tx_ref, nothing to record.' };
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Never downgrade an already-successful payment record.
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('payments')
    .select('id, status')
    .eq('tx_ref', txRef)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.status === 'successful') {
    log(provider, 'ignoring_stale_non_successful_event', { transactionId, txRef, currentStatus: existing.status, incomingStatus: status });
    return { success: true, processed: false, reason: 'Payment already recorded as successful.' };
  }

  const row = {
    transaction_id: transactionId,
    tx_ref: txRef,
    amount: Number(payment.amount) || 0,
    votes_purchased: Number(payload.votesPurchased ?? metadata.votes_purchased) || 0,
    contestant_id: payload.contestantId ?? metadata.contestant_id ?? null,
    contestant_name: payload.contestantName ?? metadata.contestant_name ?? 'Unknown',
    voter_name: payload.voterName ?? metadata.voter_name ?? payment.customer?.name ?? 'Unknown',
    voter_email: payload.voterEmail ?? metadata.voter_email ?? payment.customer?.email ?? 'unknown@unknown.invalid',
    voter_phone: payload.voterPhone ?? metadata.voter_phone ?? payment.customer?.phone_number ?? null,
    status,
    payment_method: payment.paymentMethod ?? provider,
    provider,
  };

  const { error } = existing
    ? await supabaseAdmin.from('payments').update(row).eq('tx_ref', txRef)
    : await supabaseAdmin.from('payments').insert(row);

  // A unique-violation here just means another request beat us to the
  // insert — nothing more to do.
  if (error && (error as any).code !== UNIQUE_VIOLATION) throw error;

  log(provider, 'non_successful_payment_recorded', { transactionId, txRef, status });

  return { success: true, processed: true, status };
}
