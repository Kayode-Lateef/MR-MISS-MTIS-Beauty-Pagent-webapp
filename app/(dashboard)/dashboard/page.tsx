// app/(dashboard)/dashboard/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Users, TrendingUp, Vote as VoteIcon, Award, CheckCircle2,
  ChevronLeft, ChevronRight, Clock, Calendar, Trophy, Star,
  Mic, Globe, Gem, Heart, Crown, Music, Zap, BarChart3,
  Sparkles, Eye, User, HelpCircle, Shield, Lock,
  Bell, Settings, ArrowRight, Gift, Coffee, Smile, LogOut
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";

// Event schedule data
const upcomingEvents = [
  { name: "Casual Wear & Talent Showcase", date: "Today", time: "8:00 AM - 5:00 PM", status: "ongoing", icon: Mic, description: "Creativity & entertainment showcase" },
  { name: "Native Wear & Cultural Round", date: "Tomorrow", time: "9:00 AM - 4:00 PM", status: "upcoming", icon: Globe, description: "Culture & heritage presentation" },
  { name: "Formal Evening Wear - GRAND FINALE", date: "Dec 24, 2026", time: "6:00 PM - 10:00 PM", status: "upcoming", icon: Crown, description: "Elegance & leadership finale" },
];

// Motivational messages
const motivationalMessages = [
  "Your vote helps shape the future of MTIS!",
  "Every vote counts - make your voice heard!",
  "Support your favorite contestant today!",
  "Be part of the excitement - vote now!",
  "Your participation makes a difference!",
];

export default function DashboardPage() {
  const router = useRouter();
  const [currentMessage, setCurrentMessage] = useState(0);
  const [userName, setUserName] = useState("Voter");
  const [userRole, setUserRole] = useState("voter");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVoters: 0,
    totalVotes: 0,
    totalContestants: 0,
    activeCategories: 0
  });
  const [contestants, setContestants] = useState<any[]>([]);
  const [votingLocks, setVotingLocks] = useState<Record<string, boolean>>({});

  // Load user data and stats
  useEffect(() => {
    loadUserData();
    loadStats();
    loadContestants();
    loadVotingLocks();
  }, []);

  // Rotate motivational messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % motivationalMessages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get user profile from users table
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setUserName(userData?.full_name || user.email?.split('@')[0] || "Voter");
        setUserRole(userData?.role || "voter");
      } else {
        // Check localStorage as fallback
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUserName(userData.name || "Voter");
          setUserRole(userData.role || "voter");
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      // Fallback to localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUserName(userData.name || "Voter");
      }
    }
  };

  const loadStats = async () => {
    try {
      // Get total voters count
      const { count: votersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      // Get total votes count
      const { count: votesCount } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true });
      
      // Get contestants count
      const { count: contestantsCount } = await supabase
        .from('contestants')
        .select('*', { count: 'exact', head: true });
      
      setStats({
        totalVoters: votersCount || 0,
        totalVotes: votesCount || 0,
        totalContestants: contestantsCount || 0,
        activeCategories: 0
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadContestants = async () => {
    try {
      const { data, error } = await supabase
        .from('contestants')
        .select('*')
        .limit(6);
      
      if (!error && data) {
        setContestants(data);
      }
    } catch (error) {
      console.error("Error loading contestants:", error);
    }
  };

  const loadVotingLocks = async () => {
    try {
      const { data, error } = await supabase
        .from('voting_locks')
        .select('*');
      
      if (!error && data) {
        const locksMap: Record<string, boolean> = {};
        data.forEach(lock => {
          locksMap[lock.category_id] = lock.is_locked;
        });
        setVotingLocks(locksMap);
        
        // Calculate active categories (unlocked)
        const activeCount = Object.values(locksMap).filter(locked => !locked).length;
        setStats(prev => ({ ...prev, activeCategories: activeCount }));
      } else {
        // Default: Most Talented is open
        setStats(prev => ({ ...prev, activeCategories: 1 }));
      }
    } catch (error) {
      console.error("Error loading voting locks:", error);
    }
  };

  // Get voting categories with real lock status
  const votingCategories = [
    { name: "Most Talented Contestant", icon: Star, color: "mtis-gold", description: "Based on Talent Showcase performance", categoryId: "mostTalented", message: "Cast your vote for the most impressive talent!" },
    { name: "Best Speaker Round", icon: Mic, color: "mtis-blue", description: "Impromptu speech quality", categoryId: "bestSpeaker", message: "Voting opens after speeches" },
    { name: "Best Cultural Representation", icon: Globe, color: "mtis-wine", description: "Cultural wear & heritage", categoryId: "bestCultural", message: "Voting opens after cultural round" },
    { name: "Most Elegant Contestant", icon: Gem, color: "mtis-gold", description: "Evening wear & poise", categoryId: "mostElegant", message: "Voting opens during grand finale" },
    { name: "People's Choice Award", icon: Heart, color: "mtis-wine", description: "Overall fan favorite", categoryId: "peoplesChoice", message: "Final voting round" },
  ].map(cat => ({
    ...cat,
    status: votingLocks[cat.categoryId] === false ? "open" : "locked",
    message: votingLocks[cat.categoryId] === false ? cat.message : "Coming soon - " + cat.message.toLowerCase()
  }));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <Layout>
    <div className="min-h-full bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-mtis-blue to-mtis-wine p-5 text-white shadow-mtis-lg sm:p-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
                Welcome, <span className="text-mtis-gold">{userName}!</span>
              </h1>
              <p className="text-white/80 mb-4 max-w-xl">
                Your voice matters in choosing our Mr. & Mrs. MTIS 2026. 
                Cast your votes with confidence - every ballot is confidential and equal.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link 
                  href="/vote"
                  className="px-6 py-2.5 bg-mtis-gold text-mtis-blue rounded-xl font-semibold text-sm hover:shadow-lg transition inline-flex items-center gap-2"
                >
                  <VoteIcon size={16} /> Cast Your Vote
                </Link>
                <Link 
                  href="/schedule"
                  className="px-6 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl font-semibold text-sm hover:bg-white/20 transition inline-flex items-center gap-2"
                >
                  <Calendar size={16} /> View Schedule
                </Link>
                {userRole === 'super_admin' && (
                  <Link 
                    href="/admin"
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition inline-flex items-center gap-2"
                  >
                    <Shield size={16} /> Admin Panel
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden shrink-0 rounded-xl bg-white/10 p-3 backdrop-blur-sm md:block">
              <Link href="/">
                <Image
                  src="/img/mtislogo.png"
                  alt="MTIS Logo"
                  width={80}
                  height={80}
                  className="object-contain cursor-pointer"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* Voting Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-mtis-gold hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <Users size={20} className="text-mtis-blue" />
              <Heart size={16} className="text-mtis-wine" />
            </div>
            <p className="text-2xl font-bold text-gray-800">Blind Voting</p>
            <p className="text-xs text-gray-400 mt-1">All votes are confidential</p>
            <p className="text-xs text-mtis-blue mt-2">✓ Your identity is protected</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-mtis-wine hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <Shield size={20} className="text-mtis-wine" />
              <Lock size={16} className="text-mtis-blue" />
            </div>
            <p className="text-2xl font-bold text-gray-800">Secure</p>
            <p className="text-xs text-gray-400 mt-1">Encrypted voting system</p>
            <p className="text-xs text-mtis-wine mt-2">✓ One vote per category</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-mtis-blue hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <Award size={20} className="text-mtis-blue" />
              <Sparkles size={16} className="text-mtis-gold" />
            </div>
            <p className="text-2xl font-bold text-gray-800">Fair</p>
            <p className="text-xs text-gray-400 mt-1">Equal opportunity for all</p>
            <p className="text-xs text-mtis-blue mt-2">✓ Results revealed at finale</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-mtis-gold hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <Smile size={20} className="text-mtis-gold" />
              <Coffee size={16} className="text-mtis-wine" />
            </div>
            <p className="text-2xl font-bold text-gray-800">Exciting</p>
            <p className="text-xs text-gray-400 mt-1">Suspense until the finale</p>
            <p className="text-xs text-mtis-gold mt-2">✓ Winners announced live!</p>
          </div>
        </div>

        {/* Motivational Banner */}
        <div className="mb-8 rounded-2xl border border-mtis-gold/30 bg-gradient-to-r from-mtis-gold/10 to-amber-50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-mtis-gold/20 flex items-center justify-center flex-shrink-0">
              <Gift size={20} className="text-mtis-gold" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-mtis-blue animate-pulse">
                ✨ {motivationalMessages[currentMessage]}
              </p>
            </div>
            <Link href="/vote" className="text-mtis-gold hover:text-mtis-wine transition">
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Event Schedule */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-mtis-blue uppercase tracking-wide">Today's Schedule</p>
                <p className="text-sm text-gray-500 mt-1">Mr. & Mrs. MTIS 2026 Timeline</p>
              </div>
              <Calendar size={16} className="text-mtis-gold" />
            </div>

            <div className="space-y-4">
              {upcomingEvents.map((event, idx) => (
                <div key={idx} className={`p-4 rounded-xl ${event.status === "ongoing" ? "bg-gradient-to-r from-mtis-gold/10 to-amber-50 border-l-4 border-mtis-gold" : "bg-gray-50"} transition-all hover:scale-[1.01] cursor-pointer`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className={`w-12 h-12 rounded-full shadow-sm flex items-center justify-center flex-shrink-0 ${event.status === "ongoing" ? "bg-mtis-gold text-white" : "bg-white"}`}>
                      <event.icon size={20} className={event.status === "ongoing" ? "text-white" : "text-mtis-blue"} />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-base font-semibold text-gray-800">{event.name}</p>
                        {event.status === "ongoing" && (
                          <span className="text-xs px-3 py-1 rounded-full bg-mtis-gold text-white font-medium animate-pulse">
                            LIVE NOW
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{event.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <Clock size={12} />
                        <span>{event.time}</span>
                        <span>•</span>
                        <span>{event.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/schedule" className="block mt-4 text-center text-xs text-mtis-blue hover:text-mtis-wine transition py-2">
              View Full Schedule →
            </Link>
          </div>

          {/* Voting Categories */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-mtis-gold" />
              <p className="text-xs font-semibold text-mtis-blue uppercase tracking-wide">Voting Categories</p>
            </div>
            <div className="space-y-3">
              {votingCategories.map((category, idx) => (
                <div key={idx} className={`p-3 rounded-xl transition-all ${category.status === "open" ? "bg-gradient-to-r from-mtis-gold/5 to-transparent border border-mtis-gold/30" : "bg-gray-50"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${category.status === "open" ? "bg-mtis-gold/20" : "bg-gray-200"}`}>
                      <category.icon size={18} className={category.status === "open" ? "text-mtis-gold" : "text-gray-400"} />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-gray-800">{category.name}</p>
                        {category.status === "open" ? (
                          <Link href="/vote" className="text-xs text-mtis-gold hover:text-mtis-wine font-medium">
                            Vote Now →
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">Locked</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{category.description}</p>
                      <p className="text-xs text-mtis-blue mt-1 italic">{category.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <Users size={24} className="mx-auto mb-2 text-mtis-blue" />
              <p className="text-2xl font-bold text-gray-800">{stats.totalVoters}</p>
              <p className="text-xs text-gray-500">Registered Voters</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <VoteIcon size={24} className="mx-auto mb-2 text-mtis-gold" />
              <p className="text-2xl font-bold text-gray-800">{stats.totalVotes}</p>
              <p className="text-xs text-gray-500">Total Votes Cast</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <Award size={24} className="mx-auto mb-2 text-mtis-wine" />
              <p className="text-2xl font-bold text-gray-800">{stats.totalContestants}</p>
              <p className="text-xs text-gray-500">Total Contestants</p>
            </div>
          </div>

          {/* Announcement Section */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={16} className="text-mtis-gold" />
              <p className="text-xs font-semibold text-mtis-blue uppercase tracking-wide">Important Announcement</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-mtis-blue" />
                  <span className="text-sm font-medium text-gray-800">Blind Voting System</span>
                </div>
                <p className="text-xs text-gray-600">All votes are confidential. Results revealed during Grand Coronation Night.</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-mtis-gold" />
                  <span className="text-sm font-medium text-gray-800">Voting Periods</span>
                </div>
                <p className="text-xs text-gray-600">Each category opens after its respective round. Stay tuned!</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={16} className="text-mtis-wine" />
                  <span className="text-sm font-medium text-gray-800">Fair Play</span>
                </div>
                <p className="text-xs text-gray-600">One vote per category per voter. Multiple votes are filtered.</p>
              </div>
            </div>
          </div>

          {/* Contestants Preview */}
          <div className="lg:col-span-3 bg-gradient-to-r from-mtis-blue to-mtis-wine rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold mb-1">Meet Our Contestants</h3>
                <p className="text-white/70 text-sm">Get to know the candidates before you vote</p>
              </div>
              <Eye size={20} className="text-mtis-gold" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {contestants.slice(0, 6).map((contestant, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center hover:bg-white/20 transition">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2 text-white font-bold">
                    {contestant.name?.charAt(0) || '?'}
                  </div>
                  <p className="text-sm font-medium">{contestant.name}</p>
                  <p className="text-xs text-white/60">{contestant.category}</p>
                </div>
              ))}
            </div>
            <Link href="/vote" className="block mt-4 text-center text-sm text-mtis-gold hover:text-white transition">
              View All Contestants →
            </Link>
          </div>

          {/* Judging Criteria */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle size={16} className="text-mtis-gold" />
              <p className="text-xs font-semibold text-mtis-blue uppercase tracking-wide">How Winners Are Chosen</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Music size={18} className="text-mtis-wine" />
                  <h4 className="font-semibold text-gray-800">Casual Wear & Talent</h4>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>• Creativity & Originality</p>
                  <p>• Stage Presence & Confidence</p>
                  <p>• Clarity of Speech</p>
                  <p>• Audience Engagement</p>
                </div>
                <div className="mt-2 pt-2 border-t border-purple-200">
                  <p className="text-xs font-medium text-mtis-wine">🗳️ Vote: Most Talented • Best Speaker</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={18} className="text-mtis-gold" />
                  <h4 className="font-semibold text-gray-800">Native Wear & Culture</h4>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>• Cultural Knowledge & Authenticity</p>
                  <p>• Traditional Wear Presentation</p>
                  <p>• Heritage Expression</p>
                  <p>• Proverb/Story Interpretation</p>
                </div>
                <div className="mt-2 pt-2 border-t border-amber-200">
                  <p className="text-xs font-medium text-mtis-gold">🗳️ Vote: Best Cultural Representation</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={18} className="text-mtis-blue" />
                  <h4 className="font-semibold text-gray-800">Formal Evening Wear</h4>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>• Poise, Elegance & Grace</p>
                  <p>• Leadership Mindset</p>
                  <p>• Emotional Intelligence</p>
                  <p>• Confidence & Maturity</p>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <p className="text-xs font-medium text-mtis-blue">🗳️ Vote: Most Elegant • People's Choice</p>
                </div>
              </div>
            </div>
          </div>

          {/* Voting Tips */}
          <div className="lg:col-span-3 bg-gradient-to-r from-mtis-gold/10 via-amber-50 to-mtis-gold/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-mtis-gold" />
              <p className="text-xs font-semibold text-mtis-blue uppercase tracking-wide">Voting Tips</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-mtis-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-mtis-gold">1</span>
                </div>
                <p className="text-xs text-gray-600">Read contestant profiles carefully before voting</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-mtis-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-mtis-gold">2</span>
                </div>
                <p className="text-xs text-gray-600">You can only vote once per category - make it count!</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-mtis-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-mtis-gold">3</span>
                </div>
                <p className="text-xs text-gray-600">Votes are final - review your choice before submitting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
}
