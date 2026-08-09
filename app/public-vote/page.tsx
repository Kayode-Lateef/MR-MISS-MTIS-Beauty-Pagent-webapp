// app/public-vote/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import ContestantProfileModal from "../components/ContestantProfileModal";
import { 
  Search, User, Award, Heart, Star, Clock, 
  CheckCircle2, AlertCircle, X, Upload, 
  Eye, MessageCircle, Phone, Mail, MapPin,
  Loader2, TrendingUp, Crown, Shield, CreditCard,
  Timer, Trophy, Medal, ChevronDown, ChevronUp,
  RefreshCw, PartyPopper, Calendar, Wallet
} from "lucide-react";

// Generates a unique tx_ref for a new payment attempt.
function generateTxRef(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `MTIS-${crypto.randomUUID()}`;
  }
  return `MTIS-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Add Flutterwave script to the page
const loadFlutterwaveScript = () => {
  return new Promise((resolve) => {
    if (document.querySelector('script[src*="flutterwave"]')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Add Paystack script to the page
const loadPaystackScript = () => {
  return new Promise((resolve) => {
    if (document.querySelector('script[src*="paystack"]')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface Contestant {
  id: number;
  name: string;
  gender: 'male' | 'female';
  division: 'senior' | 'junior' | 'primary';
  category: string;
  signature_style: string;
  age: number;
  hometown: string;
  talent: string;
  representing: string;
  bio: string;
  achievements: string[];
  avatar_url?: string;
  stage_name?: string | null;
  contestant_number?: string | null;
  class?: string | null;
  religion?: string | null;
  nationality?: string | null;
  state_of_origin?: string | null;
  favourite_subject?: string | null;
  role_model?: string | null;
  dream_career?: string | null;
  favourite_food?: string | null;
  favourite_drink?: string | null;
  favourite_music_genre?: string | null;
  favourite_movie_tv_show?: string | null;
  favourite_book?: string | null;
  fun_facts?: string | null;
  gallery_images?: string[] | null;
}

interface ContestantWithVotes extends Contestant {
  total_votes: number;
  rank: number;
}

function pageantTitle(division: 'senior' | 'junior' | 'primary', gender: 'male' | 'female'): string {
  if (division === 'senior') return gender === 'male' ? 'Mr. MTIS' : 'Miss MTIS';
  if (division === 'junior') return gender === 'male' ? 'Prince MTIS' : 'Princess MTIS';
  return gender === 'male' ? 'Little Star Prince' : 'Little Star Princess';
}

const VOTE_SETS: Array<{ division: 'senior' | 'junior' | 'primary'; gender: 'male' | 'female' }> = [
  { division: 'senior', gender: 'male' },
  { division: 'senior', gender: 'female' },
  { division: 'junior', gender: 'male' },
  { division: 'junior', gender: 'female' },
  { division: 'primary', gender: 'male' },
  { division: 'primary', gender: 'female' },
];

// Countdown Timer Component
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const targetDate = new Date(2026, 7, 1, 12, 0, 0).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const difference = targetDate - now;

      if (difference <= 0) {
        setIsExpired(true);
        clearInterval(interval);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-mtis-gold to-amber-500 rounded-xl p-4 text-white text-center animate-pulse">
        <PartyPopper size={24} className="mx-auto mb-2" />
        <p className="font-bold text-lg">Voting has Ended!</p>
        <p className="text-sm opacity-90">Thank you for participating in Mr. & Mrs. MTIS 2024</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-mtis-blue to-mtis-wine rounded-xl p-4 text-white shadow-lg">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Timer size={20} className="text-mtis-gold" />
        <span className="font-semibold">Voting Ends In:</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
            <span className="text-2xl font-bold">{String(timeLeft.days).padStart(2, '0')}</span>
          </div>
          <p className="text-xs mt-1 text-white/70">Days</p>
        </div>
        <div>
          <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
            <span className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
          </div>
          <p className="text-xs mt-1 text-white/70">Hours</p>
        </div>
        <div>
          <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
            <span className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
          </div>
          <p className="text-xs mt-1 text-white/70">Minutes</p>
        </div>
        <div>
          <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
            <span className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
          </div>
          <p className="text-xs mt-1 text-white/70">Seconds</p>
        </div>
      </div>
      <p className="text-xs text-center mt-3 text-white/60">
        Ends on August 1, 2026 at 12:00 PM
      </p>
    </div>
  );
}

// Mini Leaderboard Component
function MiniLeaderboard({ contestants }: { contestants: ContestantWithVotes[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayContestants = expanded ? contestants : contestants.slice(0, 5);
  const totalVotes = contestants.reduce((sum, c) => sum + c.total_votes, 0);

  if (contestants.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <Trophy size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-gray-400">No votes cast yet</p>
        <p className="text-xs text-gray-400">Be the first to vote!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-mtis-gold/10 to-amber-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-mtis-gold" />
            <h3 className="font-bold text-gray-800">Live Leaderboard</h3>
          </div>
          <Link href="/leaderboard" className="text-xs text-mtis-blue hover:text-mtis-wine transition">
            View Full →
          </Link>
        </div>
        <p className="text-xs text-gray-500 mt-1">{totalVotes} total votes • {contestants.length} contestants</p>
      </div>

      <div className="divide-y divide-gray-100">
        {displayContestants.map((contestant, index) => (
          <div key={contestant.id} className="px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition">
            <div className="w-6 text-center flex-shrink-0">
              {index === 0 && <Crown size={14} className="text-yellow-500 mx-auto" />}
              {index === 1 && <Medal size={14} className="text-gray-400 mx-auto" />}
              {index === 2 && <Medal size={14} className="text-amber-600 mx-auto" />}
              {index > 2 && <span className="text-xs text-gray-400">{index + 1}</span>}
            </div>
            <div className="flex-shrink-0">
              {contestant.avatar_url ? (
                <img
                  src={contestant.avatar_url}
                  alt={contestant.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mtis-blue to-mtis-wine flex items-center justify-center text-white font-bold text-xs">
                  {contestant.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{contestant.name}</p>
              <p className="text-xs text-gray-400">{contestant.representing}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-mtis-wine">{contestant.total_votes}</p>
              <p className="text-[10px] text-gray-400">votes</p>
            </div>
          </div>
        ))}
      </div>

      {contestants.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-2 text-center text-xs text-mtis-blue hover:text-mtis-wine transition border-t border-gray-100 flex items-center justify-center gap-1"
        >
          {expanded ? (
            <>Show Less <ChevronUp size={14} /></>
          ) : (
            <>Show All {contestants.length} Contestants <ChevronDown size={14} /></>
          )}
        </button>
      )}
    </div>
  );
}

export default function PublicVotePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [filteredContestants, setFilteredContestants] = useState<Contestant[]>([]);
  const [selectedSet, setSelectedSet] = useState<{ division: 'senior' | 'junior' | 'primary'; gender: 'male' | 'female' } | null>(null);
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [calculatedVotes, setCalculatedVotes] = useState(0);
  const [voterName, setVoterName] = useState("");
  const [voterEmail, setVoterEmail] = useState("");
  const [voterPhone, setVoterPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState<{ votes: number; message: string; transactionId?: string } | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [flutterwaveReady, setFlutterwaveReady] = useState(false);
  const [paystackReady, setPaystackReady] = useState(false);
  const [votePrice, setVotePrice] = useState(50);
  const [leaderboardData, setLeaderboardData] = useState<ContestantWithVotes[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'flutterwave' | 'paystack'>('paystack');

  const FLW_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || "";
  const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

  // Load the current price-per-vote from the CMS
  useEffect(() => {
    fetch('/api/site-content')
      .then((res) => res.json())
      .then((data) => {
        const parsed = Number(data?.content?.vote_price);
        if (Number.isFinite(parsed) && parsed > 0) setVotePrice(parsed);
      })
      .catch(() => {});
  }, []);

  // Load both payment scripts
  useEffect(() => {
    Promise.all([
      loadFlutterwaveScript(),
      loadPaystackScript()
    ]).then(([flwReady, psReady]) => {
      setFlutterwaveReady(Boolean(flwReady));
      setPaystackReady(Boolean(psReady));
    });
  }, []);

  // Load contestants
  useEffect(() => {
    loadContestants();
  }, []);

  // Load leaderboard data
  useEffect(() => {
    loadLeaderboard();
  }, []);

  // Filter contestants based on search + the chosen set
  useEffect(() => {
    if (!selectedSet || searchTerm.trim() === "") {
      setFilteredContestants([]);
    } else {
      const filtered = contestants.filter(c =>
        c.division === selectedSet.division &&
        c.gender === selectedSet.gender &&
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContestants(filtered);
    }
  }, [searchTerm, contestants, selectedSet]);

  const loadContestants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contestants')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setContestants(data || []);
    } catch (error) {
      console.error("Error loading contestants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load leaderboard');
      }

      const contestantsWithVotes: ContestantWithVotes[] = (data.contestants || []).map((c: Contestant) => ({
        ...c,
        total_votes: data.voteMap[c.id] || 0,
        rank: 0
      }));

      const sorted = contestantsWithVotes
        .sort((a, b) => b.total_votes - a.total_votes)
        .map((c, index) => ({ ...c, rank: index + 1 }));

      setLeaderboardData(sorted);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Calculate votes based on amount
  const handleAmountChange = (value: string) => {
    setAmount(value);
    const numAmount = parseInt(value);
    if (!isNaN(numAmount) && numAmount > 0) {
      if (numAmount % votePrice === 0) {
        setCalculatedVotes(numAmount / votePrice);
        setErrorModal(null);
      } else {
        setCalculatedVotes(0);
        setErrorModal(`Amount must be in multiples of ₦${votePrice}. Valid amounts: ₦${votePrice}, ₦${votePrice * 2}, ₦${votePrice * 3}, etc.`);
      }
    } else {
      setCalculatedVotes(0);
    }
  };

  // ============ PAYSTACK PAYMENT ============
const initializePaystackPayment = () => {
  if (!PAYSTACK_PUBLIC_KEY) {
    setErrorModal("Paystack public key is not configured.");
    return;
  }

  if (!paystackReady) {
    setErrorModal("Payment system is loading. Please try again.");
    return;
  }

  if (!voterName || !voterEmail) {
    setErrorModal("Please enter your name and email address");
    return;
  }

  if (calculatedVotes === 0) {
    setErrorModal(`Please enter a valid amount in multiples of ₦${votePrice}`);
    return;
  }

  if (!selectedContestant) {
    setErrorModal("Please select a contestant first");
    return;
  }

  const paymentAmount = parseInt(amount);
  const reference = generateTxRef();

  // Set processing state
  setIsProcessing(true);

  try {
    // @ts-expect-error - PaystackPop is loaded globally
    if (typeof PaystackPop === 'undefined') {
      setErrorModal("Paystack is not loaded. Please refresh the page.");
      setIsProcessing(false);
      return;
    }

    // @ts-expect-error - PaystackPop is loaded globally
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: voterEmail,
      amount: paymentAmount * 100, // Paystack uses kobo (multiply by 100)
      currency: 'NGN',
      ref: reference,
      metadata: {
        // Flat keys are what our webhook actually reads (metadata.gender,
        // metadata.division, etc. — see app/api/lib/paystack.ts). Keep
        // these in sync with the `meta` object sent to Flutterwave below,
        // so both providers' webhooks can attribute a vote to the right
        // contestant/gender/division even without the client's own
        // request body (which the webhook never sees).
        contestant_id: selectedContestant.id,
        contestant_name: selectedContestant.name,
        gender: selectedContestant.gender,
        division: selectedContestant.division,
        votes_purchased: calculatedVotes,
        voter_name: voterName,
        voter_email: voterEmail,
        voter_phone: voterPhone || null,
        expected_amount: paymentAmount,
        // custom_fields is purely cosmetic — it's what Paystack renders
        // on their own dashboard/receipt views.
        custom_fields: [
          { display_name: "Voter Name", variable_name: "voter_name", value: voterName },
          { display_name: "Contestant", variable_name: "contestant_name", value: selectedContestant.name },
          { display_name: "Votes Purchased", variable_name: "votes_purchased", value: calculatedVotes.toString() },
        ]
      },
      // Use function declarations instead of arrow functions for better compatibility
      callback: function(response: any) {
        console.log("Paystack callback received:", response);
        handleSuccessfulPayment(response, reference, 'paystack');
      },
      onClose: function() {
        console.log("Paystack modal closed");
        setIsProcessing(false);
      }
    });

    handler.openIframe();
  } catch (error: any) {
    console.error("Error initializing Paystack payment:", error);
    setErrorModal(error.message || "Failed to initialize payment. Please try again.");
    setIsProcessing(false);
  }
};

// ============ FLUTTERWAVE PAYMENT ============
const initializeFlutterwavePayment = () => {
  if (!FLW_PUBLIC_KEY) {
    setErrorModal("Flutterwave public key is not configured.");
    return;
  }

  if (!flutterwaveReady) {
    setErrorModal("Payment system is loading. Please try again.");
    return;
  }

  if (!voterName || !voterEmail) {
    setErrorModal("Please enter your name and email address");
    return;
  }

  if (calculatedVotes === 0) {
    setErrorModal(`Please enter a valid amount in multiples of ₦${votePrice}`);
    return;
  }

  if (!selectedContestant) {
    setErrorModal("Please select a contestant first");
    return;
  }

  const tx_ref = generateTxRef();
  const paymentAmount = parseInt(amount);

  // Set processing state
  setIsProcessing(true);

  if (typeof window === 'undefined' || !(window as any).FlutterwaveCheckout) {
    setErrorModal("Payment system is not ready. Please refresh the page.");
    setIsProcessing(false);
    return;
  }

  try {
    // @ts-expect-error - FlutterwaveCheckout is loaded globally
    FlutterwaveCheckout({
      public_key: FLW_PUBLIC_KEY,
      tx_ref: tx_ref,
      amount: paymentAmount,
      currency: "NGN",
      payment_options: "card, banktransfer, ussd, mobilemoney",
      customer: {
        email: voterEmail,
        phone_number: voterPhone || "08012345678",
        name: voterName,
      },
      customizations: {
        title: `Vote for ${selectedContestant?.name}`,
        description: `${calculatedVotes} votes for ${selectedContestant?.name} at ₦${votePrice} per vote`,
        logo: "/img/mtislogo.png",
      },
      meta: {
        votes_purchased: calculatedVotes,
        contestant_id: selectedContestant?.id,
        contestant_name: selectedContestant?.name,
        gender: selectedContestant?.gender,
        division: selectedContestant?.division,
        voter_name: voterName,
        voter_email: voterEmail,
        voter_phone: voterPhone || null,
        expected_amount: paymentAmount,
      },
      callback: function(response: any) {
        console.log("Flutterwave callback received:", response);
        handleSuccessfulPayment(response, tx_ref, 'flutterwave');
      },
      onclose: function() {
        console.log("Flutterwave modal closed");
        setIsProcessing(false);
      },
    });
  } catch (error: any) {
    console.error("Error initializing Flutterwave payment:", error);
    setErrorModal("Failed to initialize payment. Please try again.");
    setIsProcessing(false);
  }
};

// ============ SHARED PAYMENT HANDLER ============
const handleSuccessfulPayment = async (response: any, reference: string, provider: 'flutterwave' | 'paystack') => {
  setIsProcessing(true);
  
  try {
    console.log(`Processing successful ${provider} payment:`, response);

    // For Paystack, the transaction reference is in response.reference
    // For Flutterwave, it's in response.transaction_id
    const transactionId = provider === 'paystack' ? response.reference : response.transaction_id;

    if (!transactionId) {
      throw new Error("No transaction ID was returned by the payment provider.");
    }

    const verificationResponse = await fetch('/api/verify-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction_id: transactionId,
        tx_ref: reference,
        expected_amount: parseInt(amount),
        votes_purchased: calculatedVotes,
        contestant_id: selectedContestant!.id,
        contestant_name: selectedContestant!.name,
        gender: selectedContestant!.gender,
        division: selectedContestant!.division,
        voter_name: voterName,
        voter_email: voterEmail,
        voter_phone: voterPhone || null,
        provider: provider
      })
    });

    const verification = await verificationResponse.json();

    if (!verificationResponse.ok || !verification.success || !verification.verified) {
      throw new Error(verification.error || "Payment could not be verified.");
    }

    setSuccessModal({
      votes: verification.votesAdded || calculatedVotes,
      message: verification.alreadyProcessed
        ? `Votes already added! ${verification.votesAdded || calculatedVotes} vote(s) were already recorded for ${selectedContestant?.name}.`
        : `Payment verified! ${verification.votesAdded || calculatedVotes} vote(s) have been added for ${selectedContestant?.name}.`,
      transactionId: verification.transactionId || transactionId
    });

    setTimeout(() => {
      setShowVoteModal(false);
      setSelectedContestant(null);
      setSelectedSet(null);
      setSearchTerm("");
      setAmount("");
      setCalculatedVotes(0);
      setVoterName("");
      setVoterEmail("");
      setVoterPhone("");
      setIsProcessing(false);
      loadLeaderboard();
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }, 3000);

  } catch (error: any) {
    console.error("Error processing payment:", error);
    setErrorModal(error.message || "Failed to process payment.");
    setIsProcessing(false);
  }
};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mtis-blue to-mtis-wine flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-mtis-gold mx-auto mb-4" />
          <p className="text-white">Loading contestants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-mtis-blue to-mtis-wine text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20">
              <Image
                src="/img/mtislogo.png"
                alt="MTIS Logo"
                width={60}
                height={60}
                className="object-contain"
              />
            </div>
          </div>
          
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-4">
            <Heart size={16} className="text-mtis-gold" />
            <span className="text-sm">Support Your Favorite Contestant</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Public Voting Portal</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Show your support by voting for your favorite contestant. Each vote costs ₦{votePrice} and helps them win!
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Voting Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Countdown Timer */}
            <CountdownTimer />

            {/* Set Selector */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Crown size={24} className="text-mtis-gold" />
                <h2 className="text-xl font-bold text-gray-800">Who are you voting for?</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">Choose a set first, then search for your favorite contestant.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {VOTE_SETS.map((set) => {
                  const isActive = selectedSet?.division === set.division && selectedSet?.gender === set.gender;
                  return (
                    <button
                      key={`${set.division}-${set.gender}`}
                      onClick={() => {
                        setSelectedSet(set);
                        setSelectedContestant(null);
                        setSearchTerm("");
                      }}
                      className={`rounded-xl border-2 p-4 text-center transition ${isActive ? 'border-mtis-gold bg-mtis-gold/10' : 'border-gray-200 hover:border-mtis-gold/50'}`}
                    >
                      <p className={`font-bold ${isActive ? 'text-mtis-blue' : 'text-gray-700'}`}>{pageantTitle(set.division, set.gender)}</p>
                      <p className="text-xs text-gray-400 mt-1 capitalize">{set.division} · {set.gender}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Search size={24} className="text-mtis-gold" />
                <h2 className="text-xl font-bold text-gray-800">Search Contestant</h2>
              </div>
              {!selectedSet ? (
                <p className="text-sm text-gray-400 text-center py-6">Pick a set above to start searching.</p>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Search among ${pageantTitle(selectedSet.division, selectedSet.gender)} contestants...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mtis-gold focus:border-transparent"
                  />
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              )}

              {/* Search Results */}
              {selectedSet && searchTerm && filteredContestants.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <p className="text-sm text-gray-500 mb-3">Found {filteredContestants.length} contestant(s)</p>
                  <div className="space-y-2">
                    {filteredContestants.map((contestant) => (
                      <button
                        key={contestant.id}
                        onClick={() => {
                          setSelectedContestant(contestant);
                          setSearchTerm("");
                          setFilteredContestants([]);
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mtis-blue to-mtis-wine flex items-center justify-center text-white font-bold">
                          {contestant.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{contestant.name}</p>
                          <p className="text-xs text-gray-500">{contestant.category} • {contestant.representing}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedSet && searchTerm && filteredContestants.length === 0 && (
                <div className="mt-4 text-center py-8 bg-gray-50 rounded-xl">
                  <User size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No {pageantTitle(selectedSet.division, selectedSet.gender)} contestant found with name "{searchTerm}"</p>
                </div>
              )}
            </div>

            {/* Contestant Details */}
            {selectedContestant && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-mtis-blue to-mtis-wine px-6 py-8 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-white/20 flex items-center justify-center text-3xl font-bold">
                      {selectedContestant.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedContestant.name}</h2>
                      <p className="text-white/80">{selectedContestant.signature_style}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-white/20">
                          {selectedContestant.category}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-white/20">
                          {pageantTitle(selectedContestant.division, selectedContestant.gender)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Personal Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Age:</span> {selectedContestant.age} years</p>
                        <p><span className="text-gray-500">Hometown:</span> {selectedContestant.hometown}</p>
                        <p><span className="text-gray-500">Talent:</span> {selectedContestant.talent}</p>
                        <p><span className="text-gray-500">Representing:</span> {selectedContestant.representing}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Achievements</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedContestant.achievements?.map((ach, idx) => (
                          <span key={idx} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">🏆 {ach}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Bio</h3>
                    <p className="text-gray-600 text-sm">{selectedContestant.bio}</p>
                  </div>

                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="w-full mb-3 py-3 border-2 border-mtis-blue text-mtis-blue font-semibold rounded-xl hover:bg-mtis-blue/5 transition-all"
                  >
                    View Full Profile                  </button>

                  <button
                    onClick={() => setShowVoteModal(true)}
                    className="w-full py-3 bg-gradient-to-r from-mtis-gold to-amber-500 text-mtis-blue font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Heart size={18} /> Vote for {selectedContestant.name}
                  </button>
                </div>
              </div>
            )}

            {showProfileModal && selectedContestant && (
              <ContestantProfileModal contestant={selectedContestant} onClose={() => setShowProfileModal(false)} />
            )}
          </div>

          {/* Right Column - Leaderboard Sidebar */}
          <div className="space-y-6">
            <MiniLeaderboard contestants={leaderboardData} />
            
            {/* Info Cards */}
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <div className="w-10 h-10 rounded-full bg-mtis-gold/20 flex items-center justify-center mx-auto mb-2">
                  <Heart size={20} className="text-mtis-gold" />
                </div>
                <h4 className="font-semibold text-gray-800 text-sm">Support Your Favorite</h4>
                <p className="text-xs text-gray-500">₦{votePrice} per vote</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <div className="w-10 h-10 rounded-full bg-mtis-blue/20 flex items-center justify-center mx-auto mb-2">
                  <Shield size={20} className="text-mtis-blue" />
                </div>
                <h4 className="font-semibold text-gray-800 text-sm">Secure Payments</h4>
                <p className="text-xs text-gray-500">Via Paystack & Flutterwave</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <div className="w-10 h-10 rounded-full bg-mtis-wine/20 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp size={20} className="text-mtis-wine" />
                </div>
                <h4 className="font-semibold text-gray-800 text-sm">Vote Multiple Times</h4>
                <p className="text-xs text-gray-500">No limit!</p>
              </div>
            </div>

            <Link 
              href="/leaderboard" 
              className="block w-full py-3 bg-mtis-blue text-white text-center font-semibold rounded-xl hover:bg-mtis-blue/90 transition text-sm"
            >
              View Full Leaderboard →
            </Link>
          </div>
        </div>
      </div>

      {/* Vote Modal with Both Payment Options */}
      {showVoteModal && selectedContestant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-mtis-blue">Vote for {selectedContestant.name}</h2>
                <p className="text-sm text-gray-500">Support your favorite contestant</p>
              </div>
              <button onClick={() => setShowVoteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contestant Info */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-mtis-blue to-mtis-wine flex items-center justify-center text-white font-bold text-xl">
                  {selectedContestant.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{selectedContestant.name}</p>
                  <p className="text-xs text-gray-500">{selectedContestant.category}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} className="text-mtis-gold" />
                    <span className="text-xs text-gray-500">Public Voting</span>
                  </div>
                </div>
              </div>

              {/* Voter Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Full Name *</label>
                  <input
                    type="text"
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mtis-gold focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Email *</label>
                  <input
                    type="email"
                    value={voterEmail}
                    onChange={(e) => setVoterEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mtis-gold focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={voterPhone}
                    onChange={(e) => setVoterPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mtis-gold focus:border-transparent"
                  />
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Amount (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder={`Min ₦${votePrice}`}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mtis-gold focus:border-transparent"
                  />
                </div>
                {calculatedVotes > 0 && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg">
                    <p className="text-green-700">
                      🎉 This will give <strong>{calculatedVotes} vote(s)</strong> to {selectedContestant.name}!
                    </p>
                  </div>
                )}
                {errorModal && errorModal.includes("multiples") && (
                  <div className="mt-2 p-3 bg-red-50 rounded-lg">
                    <p className="text-red-600 text-sm">{errorModal}</p>
                  </div>
                )}
              </div>

              {/* Payment Method Selection - Two Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Payment Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Paystack Button */}
                  <button
                    onClick={() => setSelectedPaymentMethod('paystack')}
                    className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                      selectedPaymentMethod === 'paystack'
                        ? 'border-mtis-blue bg-mtis-blue/5'
                        : 'border-gray-200 hover:border-mtis-blue/30'
                    }`}
                  >
                    <Wallet size={24} className={selectedPaymentMethod === 'paystack' ? 'text-mtis-blue' : 'text-gray-400'} />
                    <span className={`font-semibold ${selectedPaymentMethod === 'paystack' ? 'text-mtis-blue' : 'text-gray-600'}`}>
                      Paystack
                    </span>
                    <span className="text-xs text-gray-400 text-center">Card, Bank Transfer, USSD, OPay</span>
                  </button>

                  {/* Flutterwave Button */}
                  <button
                    onClick={() => setSelectedPaymentMethod('flutterwave')}
                    className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                      selectedPaymentMethod === 'flutterwave'
                        ? 'border-mtis-gold bg-mtis-gold/5'
                        : 'border-gray-200 hover:border-mtis-gold/30'
                    }`}
                  >
                    <CreditCard size={24} className={selectedPaymentMethod === 'flutterwave' ? 'text-mtis-gold' : 'text-gray-400'} />
                    <span className={`font-semibold ${selectedPaymentMethod === 'flutterwave' ? 'text-mtis-gold' : 'text-gray-600'}`}>
                      Flutterwave
                    </span>
                    <span className="text-xs text-gray-400 text-center">Card, Bank Transfer, USSD</span>
                  </button>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Shield size={16} /> Secure Payment
                </h3>
                <p className="text-sm text-blue-700">
                  Each vote costs ₦{votePrice}. You will be redirected to {selectedPaymentMethod === 'paystack' ? 'Paystack' : 'Flutterwave'} secure payment page.
                </p>
              </div>

              {/* Submit Button - Changes based on selected method */}
              <button
                onClick={selectedPaymentMethod === 'paystack' ? initializePaystackPayment : initializeFlutterwavePayment}
                disabled={isProcessing || calculatedVotes === 0 || !voterName || !voterEmail}
                className="w-full py-3 bg-gradient-to-r from-mtis-blue to-mtis-wine text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    {selectedPaymentMethod === 'paystack' ? <Wallet size={18} /> : <CreditCard size={18} />}
                    Pay ₦{amount || '0'} via {selectedPaymentMethod === 'paystack' ? 'Paystack' : 'Flutterwave'}
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Your votes will be added immediately after successful payment.
                A confirmation email will be sent to you.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-mtis-blue mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-4">{successModal.message}</p>
            {successModal.transactionId && (
              <p className="text-xs text-gray-400 mb-4">Transaction ID: {successModal.transactionId}</p>
            )}
            <div className="bg-green-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-700">✓ {successModal.votes} vote(s) added successfully!</p>
            </div>
            <button
              onClick={() => {
                setSuccessModal(null);
                window.location.reload();
              }}
              className="px-6 py-2 bg-mtis-blue text-white rounded-xl hover:bg-mtis-blue/90"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal && !errorModal.includes("multiples") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Payment Failed</h3>
            <p className="text-gray-600 mb-4">{errorModal}</p>
            <button
              onClick={() => setErrorModal(null)}
              className="px-6 py-2 bg-mtis-blue text-white rounded-xl hover:bg-mtis-blue/90"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}