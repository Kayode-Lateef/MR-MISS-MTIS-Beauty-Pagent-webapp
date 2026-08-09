// components/Layout.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import {
  LayoutDashboard, Vote, Settings, LogOut,
  Bell, HelpCircle, User, Menu, Trophy, Calendar,
  Crown, X
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

// Notification Modal Component
function NotificationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const recentActivities = [
    { action: "New vote cast", category: "Most Talented", user: "Maria Santos", time: "2 min ago", icon: Vote },
    { action: "Category unlocked", category: "Best Speaker", user: "Admin", time: "15 min ago", icon: Unlock },
    { action: "Contestant added", category: "Talent Showcase", user: "Organizer", time: "1 hour ago", icon: User },
    { action: "Voting closed", category: "Most Elegant", user: "System", time: "2 hours ago", icon: Lock },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-mtis-blue">Notifications</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          {recentActivities.map((activity, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition">
              <div className="w-8 h-8 rounded-full bg-mtis-blue/10 flex items-center justify-center flex-shrink-0">
                <activity.icon size={16} className="text-mtis-blue" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.category} • {activity.user}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Help Modal Component
function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-mtis-blue">Voting Guide & Help</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-mtis-wine mb-2">📋 How to Vote</h4>
              <p className="text-sm text-gray-600">1. Navigate to the Vote page from the sidebar<br/>
              2. Select your favorite contestant in each active category<br/>
              3. Click the VOTE button to submit your choice<br/>
              4. Once voted, the category will be locked</p>
            </div>
            <div>
              <h4 className="font-semibold text-mtis-wine mb-2">🎭 Voting Categories</h4>
              <p className="text-sm text-gray-600"><strong>Most Talented Contestant</strong> - Based on talent showcase performance<br/>
              <strong>Best Speaker Round</strong> - Impromptu speech quality<br/>
              <strong>Best Cultural Representation</strong> - Cultural wear and heritage presentation<br/>
              <strong>Most Elegant Contestant</strong> - Evening wear and poise<br/>
              <strong>People's Choice Award</strong> - Overall fan favorite</p>
            </div>
            <div>
              <h4 className="font-semibold text-mtis-wine mb-2">⏰ Important Dates</h4>
              <p className="text-sm text-gray-600">Casual Wear & Talent: December 22, 2026<br/>
              Native Wear & Cultural: December 23, 2026<br/>
              Grand Finale: December 24, 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for icons
type IconProps = React.SVGProps<SVGSVGElement>;

function Unlock(props: IconProps) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
    </svg>
  );
}

function Lock(props: IconProps) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
}

// Logout Confirmation Modal
function LogoutModal({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-mtis-blue">Sign Out</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <LogOut size={32} className="text-red-500" />
            </div>
          </div>
          <p className="text-center text-gray-700 mb-2">
            Are you sure you want to sign out?
          </p>
          <p className="text-center text-xs text-gray-500">
            You will need to sign in again to access your account
          </p>
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const savedState = window.localStorage.getItem("sidebarOpen");
    return savedState === null ? true : JSON.parse(savedState);
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // ✅ NEW: State for user data from Supabase
  const [userName, setUserName] = useState("Juan Dela Cruz");
  const [userVoterId, setUserVoterId] = useState("MTIS-2026-001");
  const [userInitial, setUserInitial] = useState("JD");
  const [isLoading, setIsLoading] = useState(true);

  // ✅ NEW: Fetch user data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Get user profile from users table
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error("Error fetching user data:", error);
            // Fallback to auth user data
            const email = user.email || "User";
            const name = user.user_metadata?.full_name || email.split('@')[0];
            setUserName(name);
            setUserInitial(name.charAt(0).toUpperCase());
            setUserVoterId(`MTIS-${user.id.slice(0, 8)}`);
          } else if (userData) {
            setUserName(userData.full_name || user.email?.split('@')[0] || "User");
            setUserVoterId(userData.voter_id || `MTIS-${user.id.slice(0, 8)}`);
            setUserInitial((userData.full_name || "U").charAt(0).toUpperCase());
          }
        } else {
          // Fallback to localStorage
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUserName(userData.name || "Voter");
            setUserVoterId(userData.voterId || "MTIS-2026-001");
            setUserInitial(userData.name?.charAt(0).toUpperCase() || "U");
          }
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error);
        // Keep default values
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Logout function
  const handleLogout = async () => {
    setShowLogoutModal(false);
    await supabase.auth.signOut();
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    localStorage.removeItem("votingCategoriesState");
    router.push("/login");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Vote, label: "Vote Now", href: "/vote" },
    { icon: Calendar, label: "Schedule", href: "/schedule" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] max-w-[85vw] flex-col py-6 shadow-mtis transition-transform duration-300 lg:static lg:z-20 lg:max-w-none lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: mobileSidebarOpen || sidebarOpen ? 280 : 80,
          background: "linear-gradient(180deg, #1a2c5e 0%, #0f1e3d 100%)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 mb-8">
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image
              src="/img/mtislogo.png"
              alt="MTIS Logo"
              width={40}
              height={40}
              className="object-contain brightness-0 invert"
            />
          </div>
          {(sidebarOpen || mobileSidebarOpen) && (
            <div>
              <span className="font-bold text-xl tracking-tight text-white">
                MTIS <span className="text-mtis-gold">VOTE</span>
              </span>
              <p className="text-xs text-white/60">Mr. & Mrs. MTIS 2026</p>
            </div>
          )}
          <button
            type="button"
            aria-label="Close navigation"
            className="ml-auto rounded-lg p-1 text-white/70 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* ✅ User profile - Now dynamic from Supabase */}
        {(sidebarOpen || mobileSidebarOpen) && (
          <div className="flex flex-col items-center mb-8 px-4">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-mtis-gold shadow-lg">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-mtis-blue to-mtis-wine">
                <span className="text-white text-2xl font-bold">
                  {isLoading ? "..." : userInitial}
                </span>
              </div>
            </div>
            <p className="font-semibold text-white">
              {isLoading ? "Loading..." : userName}
            </p>
            <p className="text-xs text-white/60">
              {isLoading ? "..." : `Voter ID: ${userVoterId}`}
            </p>
            <button className="text-xs mt-2 text-mtis-gold hover:text-mtis-gold/80 transition">
              View Profile
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-3">
          {navItems.map(({ icon: Icon, label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
                style={{
                  background: isActive ? "rgba(196, 164, 62, 0.15)" : "transparent",
                  color: isActive ? "#c4a43e" : "rgba(255,255,255,0.7)",
                }}
              >
                <Icon size={18} />
                {(sidebarOpen || mobileSidebarOpen) && <span className="text-sm font-medium">{label}</span>}
                {isActive && (sidebarOpen || mobileSidebarOpen) && (
                  <Crown size={14} className="ml-auto text-mtis-gold" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="px-3 mt-auto">
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-white/50 hover:text-white/80 hover:bg-white/10 transition group"
          >
            <LogOut size={18} />
            {(sidebarOpen || mobileSidebarOpen) && <span className="text-sm font-medium">Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shadow-sm z-10">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button 
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileSidebarOpen(true);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }} 
              className="text-mtis-blue hover:text-mtis-wine transition p-1 rounded-lg hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden min-w-0 flex-1 sm:block lg:max-w-80">
              <input
                type="text"
                placeholder="Search contestants, events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-none bg-gray-100 py-2 pl-9 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-mtis-gold"
              />
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setShowHelp(true)}
              className="text-gray-400 hover:text-mtis-wine transition p-1 rounded-lg hover:bg-gray-100"
            >
              <HelpCircle size={20} />
            </button>
            <button 
              onClick={() => setShowNotifications(true)}
              className="text-gray-400 hover:text-mtis-wine relative transition p-1 rounded-lg hover:bg-gray-100"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-mtis-wine"></span>
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mtis-blue to-mtis-wine flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">
                  {isLoading ? "..." : userInitial}
                </span>
              </div>
              <span className="hidden text-sm font-medium text-gray-700 sm:inline">
                {isLoading ? "Loading..." : userName.split(' ')[0]}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Modals */}
      <NotificationModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}