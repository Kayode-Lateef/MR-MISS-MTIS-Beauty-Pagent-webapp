// app/leaderboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Crown, Trophy, Medal, Star, Eye, EyeOff, ChevronDown, ChevronUp,
  RefreshCw, Loader2, Mars, Venus, PartyPopper, Sparkles
} from "lucide-react";

// Types
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
  created_at: string;
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

function getCategoryKey(division: 'senior' | 'junior' | 'primary', gender: 'male' | 'female'): string {
  return `${division}-${gender}`;
}

// Category Card Component
function CategoryLeaderboard({ 
  title, 
  icon: Icon, 
  contestants, 
  color, 
  isRevealed, 
  onToggle 
}: any) {
  const [expanded, setExpanded] = useState(false);
  const displayContestants = expanded ? contestants : contestants.slice(0, 5);
  const totalVotes = contestants.reduce((sum: number, c: any) => sum + c.total_votes, 0);

  if (contestants.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Icon size={24} className={`text-${color}`} />
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
        <p className="text-center text-gray-400 py-8">No contestants in this category yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-${color}/10 flex items-center justify-center`}>
              <Icon size={20} className={`text-${color}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{title}</h2>
              <p className="text-xs text-gray-500">{contestants.length} contestants • {totalVotes} total votes</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition flex items-center gap-2"
          >
            {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="text-xs font-medium">{isRevealed ? 'Hide' : 'Reveal'}</span>
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="divide-y divide-gray-100">
        {displayContestants.map((contestant: ContestantWithVotes, index: number) => {
          const isTop3 = index < 3;
          const rankIcon = index === 0 ? <Crown size={20} className="text-yellow-500" /> :
                          index === 1 ? <Medal size={20} className="text-gray-400" /> :
                          index === 2 ? <Medal size={20} className="text-amber-600" /> : null;

          return (
            <div 
              key={contestant.id} 
              className={`px-6 py-4 transition hover:bg-gray-50 ${isTop3 ? 'bg-gradient-to-r from-transparent to-yellow-50/30' : ''}`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="w-8 text-center flex-shrink-0">
                  {rankIcon || <span className="text-sm text-gray-400 font-medium">{index + 1}</span>}
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  {contestant.avatar_url ? (
                    <img
                      src={contestant.avatar_url}
                      alt={contestant.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mtis-blue to-mtis-wine flex items-center justify-center text-white font-bold text-lg">
                      {contestant.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 truncate">{contestant.name}</h3>
                    {isTop3 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                        Top {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{contestant.representing}</span>
                    <span>•</span>
                    <span>{contestant.signature_style}</span>
                  </div>
                </div>

                {/* Votes */}
                <div className="text-right flex-shrink-0">
                  {isRevealed ? (
                    <>
                      <p className="text-2xl font-bold text-mtis-wine">{contestant.total_votes}</p>
                      <p className="text-xs text-gray-400">votes</p>
                    </>
                  ) : (
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More / Less */}
      {contestants.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-6 py-3 text-center text-sm text-mtis-blue hover:text-mtis-wine transition border-t border-gray-100 flex items-center justify-center gap-2"
        >
          {expanded ? (
            <>Show Less <ChevronUp size={16} /></>
          ) : (
            <>Show All {contestants.length} Contestants <ChevronDown size={16} /></>
          )}
        </button>
      )}
    </div>
  );
}

// Overall Top 3 Banner
function TopThreeBanner({ contestants, isRevealed }: { contestants: ContestantWithVotes[]; isRevealed: boolean }) {
  if (contestants.length === 0) return null;

  const top3 = contestants.slice(0, 3);
  
  return (
    <div className="bg-gradient-to-r from-mtis-blue via-mtis-blue to-mtis-wine rounded-2xl p-6 text-white shadow-xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">🏆 Overall Leaders</h2>
        <p className="text-white/70 text-sm">Top 3 contestants across all categories</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {top3.map((contestant, index) => {
          const medals = ['🥇', '🥈', '🥉'];
          const colors = ['from-yellow-400 to-amber-500', 'from-gray-300 to-gray-400', 'from-amber-500 to-orange-500'];
          
          return (
            <div key={contestant.id} className="text-center">
              <div className={`inline-block p-1 rounded-full bg-gradient-to-r ${colors[index]} mb-2`}>
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-4xl">
                  {isRevealed ? contestant.name.charAt(0) : '?'}
                </div>
              </div>
              <p className="text-sm font-medium">
                {isRevealed ? contestant.name : 'Hidden'}
              </p>
              <p className="text-xs text-white/60">
                {isRevealed ? contestant.representing : '••••••'}
              </p>
              <div className="mt-2 text-2xl font-bold text-mtis-gold">
                {isRevealed ? contestant.total_votes : '••••'}
              </div>
              <p className="text-xs text-white/50">votes</p>
              {isRevealed && (
                <div className="mt-1 text-sm">{medals[index]}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [contestants, setContestants] = useState<ContestantWithVotes[]>([]);
  const [voteMap, setVoteMap] = useState<Record<number, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalContestants: 0,
    totalVotes: 0,
    topContestant: { name: "", votes: 0 }
  });

  // Category configurations
  const categories = [
    { key: 'senior-male', title: 'Mr. MTIS', icon: Crown, color: 'mtis-blue', division: 'senior' as const, gender: 'male' as const },
    { key: 'senior-female', title: 'Miss MTIS', icon: Crown, color: 'mtis-wine', division: 'senior' as const, gender: 'female' as const },
    { key: 'junior-male', title: 'Prince MTIS', icon: Star, color: 'mtis-gold', division: 'junior' as const, gender: 'male' as const },
    { key: 'junior-female', title: 'Princess MTIS', icon: Star, color: 'mtis-blue', division: 'junior' as const, gender: 'female' as const },
    { key: 'primary-male', title: 'Little Star Prince', icon: Sparkles, color: 'mtis-wine', division: 'primary' as const, gender: 'male' as const },
    { key: 'primary-female', title: 'Little Star Princess', icon: Sparkles, color: 'mtis-gold', division: 'primary' as const, gender: 'female' as const },
  ];

  // Load data from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load leaderboard');
      }

      // Set contestants with votes
      const contestantsWithVotes: ContestantWithVotes[] = (data.contestants || []).map((c: Contestant) => ({
        ...c,
        total_votes: data.voteMap[c.id] || 0,
        rank: 0
      }));

      // Sort by votes
      const sorted = contestantsWithVotes
        .sort((a, b) => b.total_votes - a.total_votes)
        .map((c, index) => ({ ...c, rank: index + 1 }));

      setContestants(sorted);
      setVoteMap(data.voteMap || {});
      setStats(data.stats || {
        totalContestants: 0,
        totalVotes: 0,
        topContestant: { name: "", votes: 0 }
      });
      setLastUpdated(new Date(data.timestamp));
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get contestants with votes for a specific category
  const getCategoryContestants = (division: 'senior' | 'junior' | 'primary', gender: 'male' | 'female'): ContestantWithVotes[] => {
    return contestants
      .filter(c => c.division === division && c.gender === gender)
      .sort((a, b) => b.total_votes - a.total_votes)
      .map((c, index) => ({ ...c, rank: index + 1 }));
  };

  // Get all contestants for overall ranking
  const allRanked = contestants;
  const topThree = allRanked.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-mtis-gold mx-auto mb-4" />
          <p className="text-gray-500">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-mtis-gold/10 px-4 py-2 rounded-full mb-4">
            <Trophy size={16} className="text-mtis-gold" />
            <span className="text-xs font-semibold text-mtis-gold uppercase">Public Voting</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-mtis-blue mb-3">
            Leaderboard
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            See who's leading the public voting! Votes are counted from all successful payments.
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-mtis-blue">{stats.totalContestants}</p>
              <p className="text-xs text-gray-500">Contestants</p>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-mtis-gold">{stats.totalVotes.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Votes</p>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-mtis-blue">{stats.topContestant.votes}</p>
              <p className="text-xs text-gray-500">Top Contestant Votes</p>
              <p className="text-xs text-mtis-gold font-medium">{stats.topContestant.name}</p>
            </div>
          </div>

          {/* Reveal Controls */}
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => setRevealed(!revealed)}
              className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
            >
              {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
              {revealed ? 'Hide All Votes' : 'Reveal All Votes'}
            </button>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-6 py-2 bg-mtis-blue text-white rounded-xl hover:bg-mtis-blue/90 transition text-sm font-medium"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-2">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>

        {/* Top 3 Banner */}
        <div className="mb-8">
          <TopThreeBanner contestants={topThree} isRevealed={revealed} />
        </div>

        {/* Category Leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {categories.map((category) => {
            const categoryContestants = getCategoryContestants(category.division, category.gender);
            const key = getCategoryKey(category.division, category.gender);
            const isRevealed = revealed || (activeCategory === key);

            return (
              <CategoryLeaderboard
                key={key}
                title={category.title}
                icon={category.icon}
                color={category.color}
                contestants={categoryContestants}
                isRevealed={isRevealed}
                onToggle={() => {
                  if (activeCategory === key) {
                    setActiveCategory(null);
                  } else {
                    setActiveCategory(key);
                  }
                }}
              />
            );
          })}
        </div>

        {/* Full Rankings Table */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-mtis-blue">Complete Rankings</h2>
                <p className="text-xs text-gray-500">All contestants ranked by total votes</p>
              </div>
              <div className="text-xs text-gray-400">
                {allRanked.length} contestants
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contestant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Representing</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Votes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allRanked.map((contestant, index) => (
                  <tr key={contestant.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Crown size={16} className="text-yellow-500" />}
                        {index === 1 && <Medal size={16} className="text-gray-400" />}
                        {index === 2 && <Medal size={16} className="text-amber-600" />}
                        <span className={`font-semibold ${index < 3 ? 'text-gray-800' : 'text-gray-400'}`}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
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
                        <span className="font-medium text-gray-800">{contestant.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {pageantTitle(contestant.division, contestant.gender)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{contestant.representing}</td>
                    <td className="px-6 py-4 text-right">
                      {revealed ? (
                        <span className="text-xl font-bold text-mtis-wine">{contestant.total_votes}</span>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Votes are calculated from successful payments made through the public voting portal.
          </p>
        </div>
      </div>
    </div>
  );
}