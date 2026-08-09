// app/(dashboard)/vote/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabaseClient";
import ContestantProfileModal from "../../components/ContestantProfileModal";
import { CheckCircle2, Lock, Unlock, Info, Eye, EyeOff, X, Shield, Loader2, AlertCircle, Sparkles } from "lucide-react";

type Gender = 'male' | 'female';
type Division = 'senior' | 'junior' | 'primary';

interface Contestant {
  id: number;
  name: string;
  gender: Gender;
  division: Division;
  category: string;
  signature_style: string;
  age: number;
  hometown: string;
  talent: string;
  representing: string;
  bio: string;
  achievements: string[];
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
  avatar_url?: string | null;
  gallery_images?: string[] | null;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  gender: 'male' | 'female' | 'both';
  // Whether the admin has "switched this category on". While false, this
  // category is completely hidden from voters — it isn't just locked, it
  // doesn't render at all. This is what keeps the page from showing every
  // category (now x 3 divisions x 2 genders) at once; the admin turns on
  // exactly the round that's live right now.
  is_active: boolean;
}

// Every category now has SIX independently-lockable, independently-votable
// sub-sections: (senior, male), (senior, female), (junior, male), (junior,
// female), (primary, male), (primary, female) - Mr. MTIS, Miss MTIS, Prince
// MTIS, Princess MTIS, Little Star Prince, Little Star Princess. Locks and
// per-user votes are tracked per (category, division, gender) triple.
const DIVISIONS: Division[] = ['senior', 'junior', 'primary'];
const GENDERS: Gender[] = ['male', 'female'];

const lockKey = (categoryId: string, division: Division, gender: Gender) => `${categoryId}::${division}::${gender}`;

function pageantTitle(division: Division, gender: Gender): string {
  if (division === 'senior') return gender === 'male' ? 'Mr. MTIS' : 'Miss MTIS';
  if (division === 'junior') return gender === 'male' ? 'Prince MTIS' : 'Princess MTIS';
  return gender === 'male' ? 'Little Star Prince' : 'Little Star Princess';
}

const divisionLabel = (division: Division) => (division === 'senior' ? 'Senior' : division === 'junior' ? 'Junior' : 'Primary');

// Ensure user exists in public.users
const ensureUserRecord = async (userId: string, email: string, fullName: string) => {
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (!existingUser) {
      const voterId = `MTIS-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      await supabase.from('users').insert({
        id: userId,
        email: email,
        full_name: fullName,
        voter_id: voterId,
        role: 'voter',
        is_verified: true,
        created_at: new Date().toISOString(),
      });
    }
    return true;
  } catch (error) {
    console.error("Error ensuring user record:", error);
    return false;
  }
};

function ContestantCard({ contestant, selected, isLocked, onVote, onViewDetails, isSubmitting }: any) {
  const isDisabled = isLocked || isSubmitting;
  
  return (
    <div className={`bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm transition-all duration-200 border-2 ${selected ? "scale-[1.02] shadow-md ring-2 ring-mtis-gold" : "hover:shadow-md"} ${isDisabled ? "opacity-60" : ""}`}
         style={{ borderColor: selected ? "#c4a43e" : "transparent" }}>
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-mtis-blue to-mtis-wine flex items-center justify-center text-2xl font-bold text-white mb-1 shadow-md">
        {contestant.name.charAt(0)}
      </div>
      <p className="text-sm font-bold text-gray-800 text-center">{contestant.name}</p>
      <p className="text-xs text-gray-400 text-center">{contestant.signature_style}</p>
      <div className="flex gap-2 mt-2 w-full">
        <button 
          className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${selected ? "bg-green-500 text-white" : (isDisabled ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700")}`}
          onClick={onVote} 
          disabled={isDisabled}>
          {selected ? "✓ Selected" : (isLocked ? "Locked" : "VOTE")}
        </button>
        <button 
          className="flex-1 py-1.5 rounded-full text-xs font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
          onClick={onViewDetails}>
          <Eye size={14} className="inline mr-1" /> Details
        </button>
      </div>
    </div>
  );
}

// Error Modal Component
function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Cannot Vote</h3>
          <p className="text-gray-600">{message}</p>
          <button
            onClick={onClose}
            className="mt-6 px-6 py-2 bg-mtis-blue text-white rounded-xl hover:bg-mtis-blue/90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VotePage() {
  const router = useRouter();
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [globalLocks, setGlobalLocks] = useState<Record<string, boolean>>({});
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState<{ categoryName: string; contestantName: string } | null>(null);
  const [errorModal, setErrorModal] = useState<{ message: string } | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [detailsModal, setDetailsModal] = useState<Contestant | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login");
        return;
      }

      await ensureUserRecord(user.id, user.email!, user.user_metadata?.full_name || user.email!.split('@')[0]);

      // Load all data in parallel
      const [contestantsRes, categoriesRes, locksRes, votesRes] = await Promise.all([
        supabase.from('contestants').select('*').order('id'),
        supabase.from('categories').select('*'),
        supabase.from('voting_locks').select('*'),
        supabase.from('votes').select('category_id, contestant_id, gender, division').eq('voter_id', user.id)
      ]);

      if (contestantsRes.error) throw contestantsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setContestants(contestantsRes.data || []);
      setCategories(categoriesRes.data || []);

      if (locksRes.data) {
        const locksMap: Record<string, boolean> = {};
        locksRes.data.forEach(lock => {
          locksMap[lockKey(lock.category_id, lock.division, lock.gender)] = lock.is_locked;
        });
        setGlobalLocks(locksMap);
      }

      if (votesRes.data) {
        const votesMap: Record<string, number> = {};
        votesRes.data.forEach(vote => {
          if (vote.gender && vote.division) votesMap[lockKey(vote.category_id, vote.division, vote.gender)] = vote.contestant_id;
        });
        setUserVotes(votesMap);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        setIsAdminMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleVote = async (categoryId: string, contestantId: number, division: Division, gender: Gender) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const key = lockKey(categoryId, division, gender);
    const sideLabel = `${category.name} (${pageantTitle(division, gender)})`;

    // Check global lock first
    if (globalLocks[key]) {
      setErrorModal({
        message: `"${sideLabel}" is currently locked by the administrator. Please wait for it to be unlocked.`
      });
      return;
    }

    // Check if user already voted on this side
    if (userVotes[key]) {
      setErrorModal({
        message: `You have already voted in "${sideLabel}".`
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from('votes').insert({
        voter_id: user.id,
        contestant_id: contestantId,
        category_id: categoryId,
        gender,
        division,
        vote_timestamp: new Date().toISOString()
      });
      
      if (error) {
        if (error.message?.includes('duplicate') || error.message?.includes('unique constraint')) {
          setErrorModal({
            message: `You have already voted in "${sideLabel}".`
          });
          // Refresh user votes to update UI
          const { data: freshVotes } = await supabase
            .from('votes')
            .select('category_id, contestant_id, gender, division')
            .eq('voter_id', user.id);
          if (freshVotes) {
            const votesMap: Record<string, number> = {};
            freshVotes.forEach(vote => {
              if (vote.gender && vote.division) votesMap[lockKey(vote.category_id, vote.division, vote.gender)] = vote.contestant_id;
            });
            setUserVotes(votesMap);
          }
          return;
        }
        throw error;
      }

      const contestant = contestants.find((c) => c.id === contestantId);
      if (contestant) {
        // Update local state to show this side as voted
        setUserVotes(prev => ({ ...prev, [key]: contestantId }));
        setSuccessModal({
          categoryName: sideLabel,
          contestantName: contestant.name,
        });
      }
    } catch (error: any) {
      console.error("Error casting vote:", error);
      setErrorModal({ message: error.message || "Failed to cast vote. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlockSide = async (categoryId: string, division: Division, gender: Gender) => {
    try {
      const { error } = await supabase
        .from('voting_locks')
        .update({ is_locked: false, unlocked_at: new Date().toISOString() })
        .eq('category_id', categoryId)
        .eq('division', division)
        .eq('gender', gender);

      if (error) throw error;

      setGlobalLocks(prev => ({ ...prev, [lockKey(categoryId, division, gender)]: false }));
      const category = categories.find(c => c.id === categoryId);
      alert(`✅ "${category?.name}" (${pageantTitle(division, gender)}) has been UNLOCKED!`);
    } catch (error: any) {
      console.error("Error unlocking:", error);
      alert(error.message || "Failed to unlock");
    }
  };

  const handleLockSide = async (categoryId: string, division: Division, gender: Gender) => {
    try {
      const { error } = await supabase
        .from('voting_locks')
        .update({ is_locked: true, locked_at: new Date().toISOString() })
        .eq('category_id', categoryId)
        .eq('division', division)
        .eq('gender', gender);

      if (error) throw error;

      setGlobalLocks(prev => ({ ...prev, [lockKey(categoryId, division, gender)]: true }));
      const category = categories.find(c => c.id === categoryId);
      alert(`🔒 "${category?.name}" (${pageantTitle(division, gender)}) has been LOCKED!`);
    } catch (error: any) {
      console.error("Error locking:", error);
      alert(error.message || "Failed to lock");
    }
  };

  // Show/hide a whole category for voters. This is separate from
  // lock/unlock: "on" just means it's visible on this page at all; it can
  // still be locked underneath (e.g. admin turns a category on before
  // voting technically opens, so people can see it's coming next).
  const handleToggleCategoryVisibility = async (category: Category) => {
    const nextActive = !category.is_active;
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: nextActive })
        .eq('id', category.id);

      if (error) throw error;

      setCategories(prev => prev.map(c => c.id === category.id ? { ...c, is_active: nextActive } : c));
    } catch (error: any) {
      console.error("Error toggling category visibility:", error);
      alert(error.message || "Failed to toggle category visibility");
    }
  };

  const visibleCategories = categories.filter(c => c.is_active);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin text-mtis-gold mx-auto mb-4" />
            <p className="text-gray-500">Loading voting data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-full bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold text-mtis-blue sm:text-3xl">Cast Your Votes</h1>
                <p className="text-gray-500 mt-1">Vote for Mr. & Miss MTIS (Senior), Prince & Princess MTIS (Junior), and Little Star Prince & Princess (Primary)</p>
              </div>
              {isAdminMode && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-2">
                  <Shield size={16} className="text-yellow-600 inline mr-2" />
                  <span className="text-xs text-yellow-700 font-medium">Admin Mode Active (Ctrl+Shift+A)</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Panel */}
          {isAdminMode && (
            <div className="mb-8 space-y-6">
              {/* Category visibility (show/hide) */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={18} className="text-indigo-600" />
                  <h3 className="font-semibold text-indigo-800">Category Visibility</h3>
                </div>
                <p className="text-xs text-indigo-700 mb-3">⚠️ Turn a category ON to make it appear below for voters (it stays hidden otherwise, no matter its lock state). Keep only the current round switched on to avoid overwhelming voters.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 shadow-sm">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700">{category.icon} {category.name}</span>
                      <button
                        onClick={() => handleToggleCategoryVisibility(category)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${category.is_active ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                      >
                        {category.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                        {category.is_active ? 'On' : 'Off'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Locks — only for currently-visible categories, to match what voters can actually see */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={18} className="text-yellow-700" />
                  <h3 className="font-semibold text-yellow-800">Voting Locks (visible categories only)</h3>
                </div>
                <p className="text-xs text-yellow-700 mb-3">⚠️ Each category has six independent locks: Mr. MTIS, Miss MTIS, Prince MTIS, Princess MTIS, Little Star Prince, and Little Star Princess.</p>
                {visibleCategories.length === 0 ? (
                  <p className="text-sm text-yellow-700 italic">No categories are switched on yet — turn one on above first.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleCategories.flatMap((category) =>
                      DIVISIONS.flatMap((division) =>
                        GENDERS.map((gender) => {
                          const key = lockKey(category.id, division, gender);
                          return (
                            <div key={key} className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm">
                              <span className="min-w-0 flex-1 text-sm font-medium text-gray-700">
                                {category.name} <span className="text-gray-400">· {pageantTitle(division, gender)}</span>
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${globalLocks[key] ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {globalLocks[key] ? 'Locked' : 'Open'}
                              </span>
                              {globalLocks[key] ? (
                                <button
                                  onClick={() => handleUnlockSide(category.id, division, gender)}
                                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition flex items-center gap-1"
                                >
                                  <Unlock size={12} /> Unlock
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleLockSide(category.id, division, gender)}
                                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition flex items-center gap-1"
                                >
                                  <Lock size={12} /> Lock
                                </button>
                              )}
                            </div>
                          );
                        })
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <Info size={18} className="mt-0.5 shrink-0 text-blue-500" />
            <p className="text-sm text-blue-700">Each open category lets you cast one vote in each set it applies to — Mr. MTIS, Miss MTIS, Prince MTIS, Princess MTIS, Little Star Prince, and Little Star Princess. Each set locks independently once you've voted on it.</p>
          </div>

          {/* No categories open */}
          {visibleCategories.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
              <Sparkles size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No voting categories are open right now.</p>
              <p className="text-sm text-gray-400 mt-1">Check back once the admin opens the next round.</p>
            </div>
          )}

          {/* Display Categories — only ones the admin has switched on */}
          {visibleCategories.map((category) => (
            <div key={category.id} className="mb-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-xl font-bold text-mtis-blue">{category.name}</h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">{category.description}</p>
              </div>

              {DIVISIONS.map((division) => (
                <div key={division} className="mb-6 last:mb-0">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-mtis-wine">
                    {divisionLabel(division)} Division
                  </h3>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {GENDERS.map((gender) => {
                      const key = lockKey(category.id, division, gender);
                      const isGloballyLocked = globalLocks[key];
                      const hasUserVoted = !!userVotes[key];
                      const sideContestants = contestants.filter(c => c.gender === gender && c.division === division);

                      let statusText = "";
                      let statusColor = "";
                      let statusBg = "";
                      if (hasUserVoted) {
                        statusText = "✓ You have already voted";
                        statusColor = "text-green-700";
                        statusBg = "bg-green-50";
                      } else if (isGloballyLocked) {
                        statusText = "🔒 Voting closed by admin";
                        statusColor = "text-red-700";
                        statusBg = "bg-red-50";
                      } else {
                        statusText = "✅ Open for voting";
                        statusColor = "text-green-700";
                        statusBg = "bg-green-50";
                      }

                      return (
                        <div key={key} className="rounded-xl border border-gray-100 p-4">
                          <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <h4 className="text-sm font-bold text-gray-700">
                              {pageantTitle(division, gender)}
                            </h4>
                            <span className={`inline-block w-fit px-3 py-1 rounded-full text-xs font-medium ${statusBg} ${statusColor}`}>
                              {statusText}
                            </span>
                          </div>

                          {sideContestants.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No contestants registered for {pageantTitle(division, gender)} yet.</p>
                          ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              {sideContestants.map((contestant) => (
                                <ContestantCard
                                  key={contestant.id}
                                  contestant={contestant}
                                  selected={userVotes[key] === contestant.id}
                                  isLocked={isGloballyLocked || hasUserVoted}
                                  isSubmitting={isSubmitting}
                                  onVote={() => handleVote(category.id, contestant.id, division, gender)}
                                  onViewDetails={() => setDetailsModal(contestant)}
                                />
                              ))}
                            </div>
                          )}

                          {hasUserVoted && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg text-center border border-green-200">
                              <p className="text-sm text-green-700">✓ You have already voted here.</p>
                            </div>
                          )}

                          {isGloballyLocked && !hasUserVoted && (
                            <div className="mt-4 p-3 bg-red-50 rounded-lg text-center border border-red-200">
                              <p className="text-sm text-red-700">🔒 Currently locked by the administrator.</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSuccessModal(null)}>
          <div className="w-full max-w-sm animate-in rounded-2xl bg-white p-6 text-center duration-200 zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-mtis-blue mb-2">Vote Recorded!</h3>
            <p className="text-gray-600">
              Your vote for <span className="font-semibold">{successModal.contestantName}</span> in{" "}
              <span className="font-semibold">{successModal.categoryName}</span> has been submitted.
            </p>
            <button
              onClick={() => setSuccessModal(null)}
              className="mt-6 px-6 py-2 bg-mtis-blue text-white rounded-xl hover:bg-mtis-blue/90 transition"
            >
              Continue Voting
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal && (
        <ErrorModal
          message={errorModal.message}
          onClose={() => setErrorModal(null)}
        />
      )}

      {/* Contestant Details Modal */}
      {detailsModal && (
        <ContestantProfileModal
          contestant={detailsModal}
          onClose={() => setDetailsModal(null)}
        />
      )}
    </Layout>
  );
}
