// app/(dashboard)/results/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Trophy, Award, Star, TrendingUp, Crown, Medal, 
  Calendar, Users, Eye, Heart, ChevronDown, ChevronUp,
  Sparkles, BarChart3,
  CheckCircle2, Clock, Gift, PartyPopper, Music, Mic,
  Globe, Gem, Vote as VoteIcon, User, Users as UsersIcon,
  Loader2, EyeOff, Lock, Unlock, RefreshCw, Mars, Venus
} from "lucide-react";

type Gender = 'male' | 'female';
type Division = 'senior' | 'junior' | 'primary';
type Group = `${Division}${'Male' | 'Female'}`; // 'seniorMale' | 'seniorFemale' | 'juniorMale' | 'juniorFemale' | 'primaryMale' | 'primaryFemale'

const GROUPS: { key: Group; division: Division; gender: Gender }[] = [
  { key: 'seniorMale', division: 'senior', gender: 'male' },
  { key: 'seniorFemale', division: 'senior', gender: 'female' },
  { key: 'juniorMale', division: 'junior', gender: 'male' },
  { key: 'juniorFemale', division: 'junior', gender: 'female' },
  { key: 'primaryMale', division: 'primary', gender: 'male' },
  { key: 'primaryFemale', division: 'primary', gender: 'female' },
];

function pageantTitle(division: Division, gender: Gender): string {
  if (division === 'senior') return gender === 'male' ? 'Mr. MTIS' : 'Miss MTIS';
  if (division === 'junior') return gender === 'male' ? 'Prince MTIS' : 'Princess MTIS';
  return gender === 'male' ? 'Little Star Prince' : 'Little Star Princess';
}

const groupColor = (gender: Gender) => (gender === 'male' ? 'mtis-blue' : 'mtis-wine');

function GroupIcon({ gender, size = 20, className }: { gender: Gender; size?: number; className?: string }) {
  return gender === 'male' ? <Mars size={size} className={className} /> : <Venus size={size} className={className} />;
}

// Types
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
}

interface CategoryResult {
  id: string;
  name: string;
  icon: any;
  color: string;
  contestants: {
    name: string;
    votes: number;
    percentage: number;
    avatar: string;
    place: number;
  }[];
}

interface OverallPlacement {
  name: string;
  votes: number;
  avatar: string;
  region: string;
  percentage: number;
  place: number;
}

interface VoteSummary {
  category_id: string;
  contestant_id: number;
}

interface AdminVoteSummary extends VoteSummary {
  votes_to_add: number;
}

// Helper function to format large numbers
const formatNumber = (num: number) => {
  return num.toLocaleString();
};

const getPlaceLabel = (place: number) => {
  if (place === 1) return "Winner";
  if (place === 2) return "1st Runner Up";
  if (place === 3) return "2nd Runner Up";
  return `${place}`;
};

// Winner Card Component with Hide/Reveal Feature
function WinnerCard({ winner, title, color, isRevealed, onToggle }: any) {
  return (
    <div className="relative">
      {!isRevealed && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-2xl z-10 flex flex-col items-center justify-center gap-3 cursor-pointer"
             onClick={onToggle}>
          <Eye size={32} className="text-mtis-gold animate-pulse" />
          <p className="text-white text-sm font-medium">Click to reveal winner</p>
          <p className="text-white/50 text-xs">Winner details are hidden</p>
        </div>
      )}
      
      <div className={`bg-gradient-to-br from-mtis-blue to-mtis-wine rounded-2xl p-6 text-white shadow-xl transition-all duration-300 ${!isRevealed ? 'blur-sm' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown size={24} className="text-mtis-gold" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <button 
            onClick={onToggle}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition z-20 relative"
          >
            {isRevealed ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 text-4xl font-bold">
            {isRevealed ? winner.avatar : '?'}
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {isRevealed ? winner.name : '???? ???? ?????'}
          </h2>
          <p className="text-white/70 text-sm mb-3">
            {isRevealed ? winner.region : '••••••••••••'}
          </p>
          {isRevealed ? (
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
              <p className="text-xs text-white/60 mb-1">Total Votes</p>
              <p className="text-4xl font-bold text-mtis-gold">{formatNumber(winner.votes)}</p>
              <p className="text-xs text-white/60 mt-1">{winner.percentage}% of votes</p>
            </div>
          ) : (
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
              <p className="text-xs text-white/60 mb-1">Total Votes</p>
              <div className="flex gap-1 justify-center">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-white/30 rounded-full"></div>
                ))}
              </div>
              <p className="text-xs text-white/60 mt-1">••• locked •••</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverallPlacementCard({ placement, isRevealed, onToggle }: { placement: OverallPlacement; isRevealed: boolean; onToggle: () => void }) {
  const label = getPlaceLabel(placement.place);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
      {!isRevealed && (
        <button
          onClick={onToggle}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/60 text-white backdrop-blur-md"
        >
          <Eye size={24} className="text-mtis-gold" />
          <span className="text-sm font-semibold">Reveal {label}</span>
        </button>
      )}

      <div className={!isRevealed ? "blur-sm" : ""}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {placement.place === 1 ? <Crown size={20} className="text-mtis-gold" /> : <Medal size={20} className={placement.place === 2 ? "text-gray-400" : "text-amber-600"} />}
            <p className="font-bold text-gray-800">{label}</p>
          </div>
          <button onClick={onToggle} className="rounded-lg bg-gray-100 p-2 hover:bg-gray-200">
            {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-mtis-blue/10 to-mtis-wine/10 text-lg font-bold text-mtis-blue">
            {isRevealed ? placement.avatar : "?"}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-gray-900">{isRevealed ? placement.name : "Hidden"}</h3>
            <p className="truncate text-sm text-gray-500">{isRevealed ? placement.region : "Result locked"}</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Total Votes Across All Categories</p>
          <p className="text-2xl font-bold text-mtis-wine">{isRevealed ? formatNumber(placement.votes) : "••••"}</p>
          <p className="text-xs text-gray-500">{isRevealed ? `${placement.percentage}% of total votes` : "locked"}</p>
        </div>
      </div>
    </div>
  );
}

// Category Table Component with Hide/Reveal for Vote Counts
function CategoryTable({ category, color, isRevealed, onToggleReveal }: any) {
  const [expanded, setExpanded] = useState(false);
  const Icon = category.icon;

  const totalVotes = category.contestants.reduce((sum: number, c: any) => sum + c.votes, 0);
  const displayedContestants = expanded ? category.contestants : category.contestants.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <div className="flex flex-col justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-4 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-${color}/10 flex items-center justify-center`}>
            <Icon size={20} className={`text-${color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{category.name}</h3>
            <p className="text-xs text-gray-500">
              Total votes: {isRevealed ? formatNumber(totalVotes) : '••••'}
            </p>
          </div>
        </div>
        <button 
          onClick={onToggleReveal}
          className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 p-2 transition hover:bg-gray-200"
        >
          {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
          <span className="text-xs font-medium">
            {isRevealed ? 'Hide Votes' : 'Reveal Votes'}
          </span>
        </button>
      </div>
      
      {category.contestants.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-gray-400">No contestants in this group yet.</p>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contestant</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Votes</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedContestants.map((contestant: any, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {contestant.place === 1 && <Crown size={16} className="text-mtis-gold" />}
                    {contestant.place === 2 && <Medal size={16} className="text-gray-400" />}
                    {contestant.place === 3 && <Medal size={16} className="text-amber-600" />}
                    {contestant.place > 3 && <span className="text-sm text-gray-400">{contestant.place}</span>}
                    <span className="text-sm font-medium text-gray-700">{getPlaceLabel(contestant.place)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mtis-blue/10 to-mtis-wine/10 flex items-center justify-center text-sm font-bold text-mtis-blue">
                      {contestant.avatar}
                    </div>
                    <span className="font-medium text-gray-800">{contestant.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {isRevealed ? (
                    <span className="text-2xl font-bold text-mtis-blue">{formatNumber(contestant.votes)}</span>
                  ) : (
                    <div className="flex gap-1 justify-end">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {isRevealed ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-mtis-gold">{contestant.percentage}%</span>
                      <div className="w-24 bg-gray-100 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-mtis-blue to-mtis-wine h-1.5 rounded-full"
                          style={{ width: `${contestant.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-gray-400">•••</span>
                      <div className="w-24 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-gray-300 h-1.5 rounded-full w-1/2"></div>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      
      {category.contestants.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-6 py-3 text-center text-sm text-mtis-blue hover:text-mtis-wine transition border-t border-gray-100 flex items-center justify-center gap-2"
        >
          {expanded ? (
            <>Show Less <ChevronUp size={16} /></>
          ) : (
            <>Show All {category.contestants.length} Contestants <ChevronDown size={16} /></>
          )}
        </button>
      )}
    </div>
  );
}

// Category breakdown for one group (e.g. Senior Male / "Mr. MTIS")
function GroupCategoryResults({ title, color, gender, categoryResults, revealPrefix, categoryRevealed, toggleCategoryReveal, loadResults }: any) {
  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <GroupIcon gender={gender} size={24} className={`text-${color}`} />
            <h2 className={`text-xl font-bold text-${color}`}>{title} Category Scores</h2>
          </div>
          <p className="text-sm text-gray-500">Complete breakdown by category</p>
        </div>
        <button onClick={loadResults} className="p-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-2">
          <RefreshCw size={18} className="text-gray-400" />
        </button>
      </div>
      
      <div className="space-y-6">
        {categoryResults.map((category: CategoryResult, idx: number) => (
          <CategoryTable 
            key={idx} 
            category={category} 
            color={category.color}
            isRevealed={categoryRevealed[`${revealPrefix}-${category.id}`] || false}
            onToggleReveal={() => toggleCategoryReveal(`${revealPrefix}-${category.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

// Category definitions
const categoryDefinitions = [
  { id: "mostTalented", name: "Most Talented Contestant", icon: Star, color: "mtis-gold" },
  { id: "bestSpeaker", name: "Best Speaker Round", icon: Mic, color: "mtis-blue" },
  { id: "bestCultural", name: "Best Cultural Representation", icon: Globe, color: "mtis-wine" },
  { id: "mostElegant", name: "Most Elegant Contestant", icon: Gem, color: "mtis-gold" },
  { id: "peoplesChoice", name: "People's Choice Award", icon: Heart, color: "mtis-wine" }
];

export default function ResultsPage() {
  const [activeView, setActiveView] = useState<"grand" | Group>("grand");
  const [loading, setLoading] = useState(true);
  const [winnersRevealed, setWinnersRevealed] = useState<Record<Group, boolean>>({
    seniorMale: false, seniorFemale: false, juniorMale: false, juniorFemale: false, primaryMale: false, primaryFemale: false,
  });
  const [categoryRevealed, setCategoryRevealed] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState({
    totalVotes: 0,
    totalVoters: 0,
    totalContestants: 0
  });
  const [winners, setWinners] = useState<Record<Group, { name: string; votes: number; avatar: string; region: string; percentage: number }>>({
    seniorMale: { name: "TBD", votes: 0, avatar: "MT", region: "TBD", percentage: 0 },
    seniorFemale: { name: "TBD", votes: 0, avatar: "MT", region: "TBD", percentage: 0 },
    juniorMale: { name: "TBD", votes: 0, avatar: "MT", region: "TBD", percentage: 0 },
    juniorFemale: { name: "TBD", votes: 0, avatar: "MT", region: "TBD", percentage: 0 },
    primaryMale: { name: "TBD", votes: 0, avatar: "MT", region: "TBD", percentage: 0 },
    primaryFemale: { name: "TBD", votes: 0, avatar: "MT", region: "TBD", percentage: 0 },
  });
  const [runnersUp, setRunnersUp] = useState<Record<Group, OverallPlacement[]>>({
    seniorMale: [], seniorFemale: [], juniorMale: [], juniorFemale: [], primaryMale: [], primaryFemale: [],
  });
  const [runnersUpRevealed, setRunnersUpRevealed] = useState<Record<string, boolean>>({});
  const [groupCategoryResults, setGroupCategoryResults] = useState<Record<Group, CategoryResult[]>>({
    seniorMale: [], seniorFemale: [], juniorMale: [], juniorFemale: [], primaryMale: [], primaryFemale: [],
  });

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/results-summary');
      const summary = await response.json();

      if (!response.ok) {
        throw new Error(summary.error || "Failed to load results");
      }

      const votesData: VoteSummary[] = summary.votes || [];
      const adminVotesData: AdminVoteSummary[] = summary.adminVotes || [];
      const contestantsData: Contestant[] = summary.contestants || [];

      setStats({
        totalVotes: summary.totalVotes || 0,
        totalVoters: summary.totalVoters || 0,
        totalContestants: contestantsData.length || 0
      });

      if (votesData && contestantsData) {
        const totalAllVotes = summary.totalVotes || 1;

        // ---- Per-category breakdown, split into the 6 groups ----
        const newGroupCategoryResults: Record<Group, CategoryResult[]> = {
          seniorMale: [], seniorFemale: [], juniorMale: [], juniorFemale: [], primaryMale: [], primaryFemale: [],
        };

        for (const category of categoryDefinitions) {
          const categoryVotes = votesData.filter(v => v.category_id === category.id);

          const voteCounts: Record<number, number> = {};
          categoryVotes.forEach(vote => {
            voteCounts[vote.contestant_id] = (voteCounts[vote.contestant_id] || 0) + 1;
          });

          adminVotesData
            .filter((adminVote: any) => adminVote.category_id === category.id)
            .forEach((adminVote: any) => {
              voteCounts[adminVote.contestant_id] = (voteCounts[adminVote.contestant_id] || 0) + (Number(adminVote.votes_to_add) || 0);
            });

          const contestantsWithVotes = contestantsData
            .map(c => ({ ...c, votes: voteCounts[c.id] || 0 }))
            .sort((a, b) => b.votes - a.votes);

          for (const group of GROUPS) {
            const groupContestants = contestantsWithVotes.filter(c => c.gender === group.gender && c.division === group.division);
            const groupTotalVotes = groupContestants.reduce((sum, c) => sum + c.votes, 0);

            newGroupCategoryResults[group.key].push({
              id: category.id,
              name: category.name,
              icon: category.icon,
              color: category.color,
              contestants: groupContestants.map((c, idx) => ({
                name: c.name,
                votes: c.votes,
                percentage: groupTotalVotes > 0 ? Math.round((c.votes / groupTotalVotes) * 100) : 0,
                avatar: c.name.split(' ').map((n: string) => n[0]).join(''),
                place: idx + 1
              })),
            });
          }
        }

        setGroupCategoryResults(newGroupCategoryResults);

        // ---- Winners + runners-up per group (total votes across all categories) ----
        const totalVotesPerContestant: Record<number, number> = {};
        votesData.forEach(vote => {
          totalVotesPerContestant[vote.contestant_id] = (totalVotesPerContestant[vote.contestant_id] || 0) + 1;
        });
        adminVotesData.forEach((adminVote: any) => {
          totalVotesPerContestant[adminVote.contestant_id] = (totalVotesPerContestant[adminVote.contestant_id] || 0) + (Number(adminVote.votes_to_add) || 0);
        });

        const contestantsWithTotalVotes = contestantsData.map(c => ({
          ...c,
          totalVotes: totalVotesPerContestant[c.id] || 0
        }));

        const toPlacement = (contestant: any, place: number): OverallPlacement => ({
          name: contestant.name,
          votes: contestant.totalVotes,
          avatar: contestant.name?.split(' ').map((n: string) => n[0]).join('') || "MT",
          region: contestant.representing || "TBD",
          percentage: Math.round((contestant.totalVotes / totalAllVotes) * 100),
          place
        });

        const newWinners = { ...winners };
        const newRunnersUp: Record<Group, OverallPlacement[]> = { seniorMale: [], seniorFemale: [], juniorMale: [], juniorFemale: [], primaryMale: [], primaryFemale: [] };

        for (const group of GROUPS) {
          const ranked = contestantsWithTotalVotes
            .filter(c => c.gender === group.gender && c.division === group.division)
            .sort((a, b) => b.totalVotes - a.totalVotes);

          const winner = ranked[0];
          newWinners[group.key] = {
            name: winner?.name || "TBD",
            votes: winner?.totalVotes || 0,
            avatar: winner?.name?.split(' ').map((n: string) => n[0]).join('') || "MT",
            region: winner?.representing || "TBD",
            percentage: winner ? Math.round((winner.totalVotes / totalAllVotes) * 100) : 0,
          };

          newRunnersUp[group.key] = ranked
            .slice(1, 3)
            .filter(c => c.totalVotes > 0)
            .map((c, idx) => toPlacement(c, idx + 2));
        }

        setWinners(newWinners);
        setRunnersUp(newRunnersUp);
      }
    } catch (error) {
      console.error("Error loading results:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWinner = (group: Group) => {
    setWinnersRevealed(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleRunnerUp = (key: string) => {
    setRunnersUpRevealed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const revealAllRunnersUp = (group: Group) => {
    setRunnersUpRevealed(prev => {
      const next = { ...prev };
      runnersUp[group].forEach((_, idx) => { next[`${group}-${idx}`] = true; });
      return next;
    });
  };

  const toggleCategoryReveal = (categoryId: string) => {
    setCategoryRevealed(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-mtis-gold mx-auto mb-4" />
          <p className="text-gray-500">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Celebration */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-mtis-gold/10 px-4 py-2 rounded-full mb-4">
            <PartyPopper size={16} className="text-mtis-gold" />
            <span className="text-xs font-semibold text-mtis-gold uppercase">Official Results</span>
          </div>
          <h1 className="mb-3 text-3xl font-bold text-mtis-blue sm:text-4xl md:text-5xl">
            MTIS Pageant 2026
          </h1>
          <p className="text-gray-500">Mr. & Miss and Prince & Princess MTIS • Grand Coronation Night • {new Date().toLocaleDateString()}</p>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
            <div className="text-center">
              <p className="text-3xl font-bold text-mtis-gold">{formatNumber(stats.totalVotes)}</p>
              <p className="text-xs text-gray-500">Total Votes Cast</p>
            </div>
            <div className="hidden h-10 w-px bg-gray-200 sm:block"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-mtis-wine">{formatNumber(stats.totalVoters)}</p>
              <p className="text-xs text-gray-500">Total Voters</p>
            </div>
            <div className="hidden h-10 w-px bg-gray-200 sm:block"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-mtis-blue">{stats.totalContestants}</p>
              <p className="text-xs text-gray-500">Contestants</p>
            </div>
          </div>
        </div>

        {/* Main View Toggle */}
        <div className="mb-8">
          <div className="grid grid-cols-2 justify-center gap-3 sm:grid-cols-4 lg:grid-cols-7 sm:gap-4">
            <button
              onClick={() => setActiveView("grand")}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all ${
                activeView === "grand"
                  ? "bg-gradient-to-r from-mtis-blue to-mtis-wine text-white shadow-lg scale-105"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <Crown size={20} />
              Grand Champions
            </button>
            {GROUPS.map((group) => {
              const color = groupColor(group.gender);
              return (
                <button
                  key={group.key}
                  onClick={() => setActiveView(group.key)}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all ${
                    activeView === group.key
                      ? `bg-${color} text-white shadow-lg scale-105`
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  <GroupIcon gender={group.gender} size={20} />
                  {pageantTitle(group.division, group.gender)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grand Champions View */}
        {activeView === "grand" && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex flex-wrap items-center justify-center gap-3">
                {GROUPS.map((group) => (
                  <button
                    key={group.key}
                    onClick={() => toggleWinner(group.key)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm"
                  >
                    {winnersRevealed[group.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                    {winnersRevealed[group.key] ? `Hide ${pageantTitle(group.division, group.gender)}` : `Reveal ${pageantTitle(group.division, group.gender)}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {GROUPS.map((group) => (
                <WinnerCard
                  key={group.key}
                  winner={winners[group.key]}
                  title={`${pageantTitle(group.division, group.gender)} 2026`}
                  color={groupColor(group.gender)}
                  isRevealed={winnersRevealed[group.key]}
                  onToggle={() => toggleWinner(group.key)}
                />
              ))}
            </div>

            {/* Runners-up per group */}
            {GROUPS.map((group) => {
              const color = groupColor(group.gender);
              return (
                <div key={group.key} className="mt-8">
                  <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <GroupIcon gender={group.gender} size={20} className={`text-${color}`} />
                        <h2 className={`text-xl font-bold text-${color}`}>{pageantTitle(group.division, group.gender)} Runners-Up</h2>
                      </div>
                      <p className="text-sm text-gray-500">1st and 2nd Runner Up</p>
                    </div>
                    <button
                      onClick={() => revealAllRunnersUp(group.key)}
                      className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm transition hover:bg-gray-200"
                    >
                      <Eye size={16} /> Reveal All
                    </button>
                  </div>
                  {runnersUp[group.key].length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
                      Not enough votes yet to determine runners-up.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {runnersUp[group.key].map((placement, idx) => (
                        <OverallPlacementCard
                          key={`${group.key}-${idx}`}
                          placement={placement}
                          isRevealed={runnersUpRevealed[`${group.key}-${idx}`] || false}
                          onToggle={() => toggleRunnerUp(`${group.key}-${idx}`)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Vote Summary Banner */}
            <div className="mt-8 bg-gradient-to-r from-mtis-blue to-mtis-wine rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <VoteIcon size={32} className="text-mtis-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Total Votes Cast in All Categories</p>
                    <p className="text-4xl font-bold text-mtis-gold">{formatNumber(stats.totalVotes)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Per-group category breakdown views */}
        {GROUPS.map((group) => (
          activeView === group.key && (
            <GroupCategoryResults
              key={group.key}
              title={pageantTitle(group.division, group.gender)}
              color={groupColor(group.gender)}
              gender={group.gender}
              categoryResults={groupCategoryResults[group.key]}
              revealPrefix={group.key}
              categoryRevealed={categoryRevealed}
              toggleCategoryReveal={toggleCategoryReveal}
              loadResults={loadResults}
            />
          )
        ))}

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Results are final and certified by the MTIS Board of Judges.
            Congratulations to all winners and participants!
          </p>
        </div>
      </div>
    </div>
  );
}
