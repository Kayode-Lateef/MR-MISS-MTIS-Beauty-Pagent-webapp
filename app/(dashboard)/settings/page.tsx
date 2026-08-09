// app/(dashboard)/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import {
  User, Bell, Lock, Palette, Globe, Shield, Smartphone,
  Save, Camera, Mail, Phone, MapPin, Calendar, CheckCircle2,
  AlertCircle, Eye, EyeOff, Moon, Sun, Monitor, Volume2,
  VolumeX, RefreshCw, Database, Trash2, Download, Upload,
  Key, Fingerprint, Smartphone as SmartphoneIcon, ChevronRight,
  Plus, X, Edit2, Award, Heart, Star, Users, Vote,
  Settings as SettingsIcon, LogOut, HelpCircle, Loader2
} from "lucide-react";

// Types
interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  voter_id: string;
  role: string;
  location: string;
  avatar: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    votes: boolean;
    results: boolean;
    events: boolean;
    system: boolean;
  };
  preferences: {
    theme: string;
    language: string;
    timezone: string;
    autoRefresh: boolean;
    soundEffects: boolean;
    compactView: boolean;
  };
  privacy: {
    showInLeaderboard: boolean;
    shareVotes: boolean;
    publicProfile: boolean;
  };
  created_at: string;
  updated_at: string;
}

type NotificationKey = keyof UserProfile["notifications"];
type PreferenceKey = keyof UserProfile["preferences"];
type PrivacyKey = keyof UserProfile["privacy"];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<UserProfile | null>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [votingStats, setVotingStats] = useState({ votesCast: 0, categoriesCount: 5 });

  // Load user data from Supabase
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      // Get user profile from users table
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get user's voting stats
      const { count: votesCount } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('voter_id', user.id);

      setVotingStats({
        votesCast: votesCount || 0,
        categoriesCount: 5
      });

      // Set form data with defaults for missing fields
      setFormData({
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name || "",
        phone: userData.phone || "",
        voter_id: userData.voter_id,
        role: userData.role || "voter",
        location: userData.location || "Not specified",
        avatar: userData.full_name?.charAt(0).toUpperCase() || "U",
        notifications: userData.notifications || {
          email: true,
          push: true,
          sms: false,
          votes: true,
          results: true,
          events: false,
          system: true,
        },
        preferences: userData.preferences || {
          theme: "light",
          language: "English",
          timezone: "Asia/Manila",
          autoRefresh: true,
          soundEffects: true,
          compactView: false,
        },
        privacy: userData.privacy || {
          showInLeaderboard: true,
          shareVotes: false,
          publicProfile: false,
        },
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      });
    } catch (error: any) {
      console.error("Error loading user data:", error);
      alert("Failed to load user data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // Save settings to Supabase
  const handleSaveSettings = async () => {
    if (!formData) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.location,
          notifications: formData.notifications,
          preferences: formData.preferences,
          privacy: formData.privacy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formData.id);

      if (error) throw error;

      setShowSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle password change via Supabase
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setShowPasswordModal(false);
      setTempPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Password changed successfully!");
    } catch (error: any) {
      console.error("Error changing password:", error);
      alert(error.message || "Failed to change password. Please try again.");
    }
  };

  // Handle profile update
  const handleProfileUpdate = (field: string, value: string) => {
    if (!formData) return;
    setFormData(prev => ({ ...prev!, [field]: value }));
  };

  // Handle notification toggle
  const handleNotificationToggle = (key: NotificationKey) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      notifications: { ...prev!.notifications, [key]: !prev!.notifications[key] }
    }));
  };

  // Handle preference toggle
  const handlePreferenceToggle = (key: PreferenceKey) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      preferences: { ...prev!.preferences, [key]: !prev!.preferences[key] }
    }));
  };

  // Handle privacy toggle
  const handlePrivacyToggle = (key: PrivacyKey) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      privacy: { ...prev!.privacy, [key]: !prev!.privacy[key] }
    }));
  };

  // Export data
  const handleExportData = () => {
    if (!formData) return;
    const data = {
      profile: formData,
      votingStats: votingStats,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mtis-user-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User, color: "mtis-blue" },
    { id: "security", label: "Security", icon: Shield, color: "mtis-wine" },
    { id: "notifications", label: "Notifications", icon: Bell, color: "mtis-gold" },
    { id: "preferences", label: "Preferences", icon: Palette, color: "mtis-blue" },
    { id: "privacy", label: "Privacy", icon: Lock, color: "mtis-wine" },
    { id: "data", label: "Data & Storage", icon: Database, color: "mtis-gold" },
  ];

  const notificationCategories: { id: NotificationKey; label: string; description: string }[] = [
    { id: "votes", label: "Vote Confirmations", description: "When your vote is successfully recorded" },
    { id: "results", label: "Results Updates", description: "When new results are announced" },
    { id: "events", label: "Event Reminders", description: "Upcoming pageant events and schedules" },
    { id: "system", label: "System Notifications", description: "Maintenance and updates" },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin text-mtis-gold mx-auto mb-4" />
            <p className="text-gray-500">Loading settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!formData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-gray-500">Failed to load user data. Please refresh the page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-full bg-gray-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon size={28} className="text-mtis-blue" />
              <h1 className="text-2xl font-bold text-mtis-blue sm:text-3xl">Settings</h1>
            </div>
            <p className="ml-0 text-gray-500 sm:ml-11">Manage your account preferences and voting settings</p>
          </div>

          {/* Save Success Alert */}
          {showSaveSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
              <CheckCircle2 size={20} className="text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-800">Settings saved successfully!</p>
                <p className="text-xs text-green-600">Your preferences have been updated.</p>
              </div>
            </div>
          )}

          {/* Button Tabs */}
          <div className="mb-8">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-medium transition-all duration-200 ${
                      isActive
                        ? `bg-${tab.color} text-white shadow-md scale-105`
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="ml-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-mtis-blue to-mtis-wine px-6 py-6 text-white">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Profile Information</h2>
                    <p className="text-white/70 text-sm mt-1">Manage your personal details</p>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/30 transition flex items-center gap-2"
                    >
                      <Edit2 size={14} /> Edit Profile
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="px-4 py-2 bg-mtis-gold text-mtis-blue rounded-xl text-sm font-medium hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="mb-6 flex flex-col items-start gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-mtis-blue to-mtis-wine flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {formData.avatar}
                    </div>
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-mtis-gold text-white flex items-center justify-center hover:scale-110 transition">
                        <Camera size={14} />
                      </button>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{formData.full_name}</h3>
                    <p className="text-sm text-gray-500">{formData.role}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">Verified Voter</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">Active</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => handleProfileUpdate("full_name", e.target.value)}
                        className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mtis-gold focus:border-transparent"
                      />
                    ) : (
                      <p className="mt-1 text-gray-800">{formData.full_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email Address</label>
                    <p className="mt-1 text-gray-800">{formData.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleProfileUpdate("phone", e.target.value)}
                        className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mtis-gold focus:border-transparent"
                      />
                    ) : (
                      <p className="mt-1 text-gray-800">{formData.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleProfileUpdate("location", e.target.value)}
                        className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mtis-gold focus:border-transparent"
                      />
                    ) : (
                      <p className="mt-1 text-gray-800">{formData.location}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Voter ID</label>
                    <p className="mt-1 text-gray-800 font-mono text-sm">{formData.voter_id}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Member Since</label>
                    <p className="mt-1 text-gray-800">{new Date(formData.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Shield size={24} className="text-mtis-blue" />
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Security Settings</h2>
                    <p className="text-xs text-gray-500">Manage your account security</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Key size={20} className="text-mtis-blue" />
                      <div className="text-left">
                        <p className="font-medium text-gray-800">Change Password</p>
                        <p className="text-xs text-gray-500">Update your password</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-3">
                      <AlertCircle size={20} className="text-amber-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">Security Tip</p>
                        <p className="text-xs text-amber-700">Use a strong, unique password for your account</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Bell size={24} className="text-mtis-blue" />
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Notification Preferences</h2>
                  <p className="text-xs text-gray-500">Choose what updates you receive</p>
                </div>
              </div>

              <div className="space-y-4">
                {notificationCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">{cat.label}</p>
                      <p className="text-xs text-gray-500">{cat.description}</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle(cat.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${formData.notifications[cat.id] ? "bg-mtis-blue" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${formData.notifications[cat.id] ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="font-medium text-gray-800 mb-3">Delivery Methods</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-mtis-blue" />
                      <span className="text-sm text-gray-600">Email Notifications</span>
                    </div>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev!, notifications: { ...prev!.notifications, email: !prev!.notifications.email } }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${formData.notifications.email ? "bg-mtis-blue" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${formData.notifications.email ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <SmartphoneIcon size={18} className="text-mtis-blue" />
                      <span className="text-sm text-gray-600">Push Notifications</span>
                    </div>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev!, notifications: { ...prev!.notifications, push: !prev!.notifications.push } }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${formData.notifications.push ? "bg-mtis-blue" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${formData.notifications.push ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Palette size={24} className="text-mtis-blue" />
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Appearance</h2>
                    <p className="text-xs text-gray-500">Customize your experience</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Theme</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {[
                        { value: "light", icon: Sun, label: "Light" },
                        { value: "dark", icon: Moon, label: "Dark" },
                        { value: "system", icon: Monitor, label: "System" },
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => setFormData(prev => ({ ...prev!, preferences: { ...prev!.preferences, theme: theme.value } }))}
                          className={`p-3 rounded-xl border-2 transition ${
                            formData.preferences.theme === theme.value
                              ? "border-mtis-gold bg-mtis-gold/10"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <theme.icon size={20} className={`mx-auto mb-1 ${formData.preferences.theme === theme.value ? "text-mtis-gold" : "text-gray-400"}`} />
                          <p className="text-xs">{theme.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Language</label>
                    <select
                      value={formData.preferences.language}
                      onChange={(e) => setFormData(prev => ({ ...prev!, preferences: { ...prev!.preferences, language: e.target.value } }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mtis-gold focus:border-transparent"
                    >
                      <option value="English">English</option>
                      <option value="Filipino">Filipino</option>
                      <option value="Cebuano">Cebuano</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Time Zone</label>
                    <select
                      value={formData.preferences.timezone}
                      onChange={(e) => setFormData(prev => ({ ...prev!, preferences: { ...prev!.preferences, timezone: e.target.value } }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mtis-gold focus:border-transparent"
                    >
                      <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                      <option value="America/New_York">America/New York (GMT-5)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">Voting Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Auto-refresh results</p>
                      <p className="text-xs text-gray-500">Automatically update live results</p>
                    </div>
                    <button
                      onClick={() => handlePreferenceToggle("autoRefresh")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${formData.preferences.autoRefresh ? "bg-mtis-blue" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${formData.preferences.autoRefresh ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Sound Effects</p>
                      <p className="text-xs text-gray-500">Play sounds for vote confirmations</p>
                    </div>
                    <button
                      onClick={() => handlePreferenceToggle("soundEffects")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${formData.preferences.soundEffects ? "bg-mtis-blue" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${formData.preferences.soundEffects ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Lock size={24} className="text-mtis-blue" />
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Privacy Settings</h2>
                  <p className="text-xs text-gray-500">Control your data visibility</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-medium text-gray-800">Show in Leaderboard</p>
                    <p className="text-xs text-gray-500">Display your name in public rankings</p>
                  </div>
                  <button
                    onClick={() => handlePrivacyToggle("showInLeaderboard")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${formData.privacy.showInLeaderboard ? "bg-mtis-blue" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${formData.privacy.showInLeaderboard ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>

                <div className="flex flex-col justify-between gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-medium text-gray-800">Share Voting History</p>
                    <p className="text-xs text-gray-500">Allow others to see your votes</p>
                  </div>
                  <button
                    onClick={() => handlePrivacyToggle("shareVotes")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${formData.privacy.shareVotes ? "bg-mtis-blue" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${formData.privacy.shareVotes ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>

                <div className="flex flex-col justify-between gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-medium text-gray-800">Public Profile</p>
                    <p className="text-xs text-gray-500">Make your profile visible to others</p>
                  </div>
                  <button
                    onClick={() => handlePrivacyToggle("publicProfile")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${formData.privacy.publicProfile ? "bg-mtis-blue" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${formData.privacy.publicProfile ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-start gap-3">
                  <Trash2 size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Delete Account</p>
                    <p className="text-xs text-red-600 mt-1">Permanently delete your account and all voting data</p>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === "data" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Database size={24} className="text-mtis-blue" />
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Data Management</h2>
                    <p className="text-xs text-gray-500">Export, backup, or clear your data</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleExportData}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Download size={20} className="text-mtis-blue" />
                      <div className="text-left">
                        <p className="font-medium text-gray-800">Export All Data</p>
                        <p className="text-xs text-gray-500">Download your voting history and preferences</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">Voting Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <Vote size={24} className="mx-auto mb-2 text-mtis-blue" />
                    <p className="text-2xl font-bold text-mtis-blue">{votingStats.votesCast}</p>
                    <p className="text-xs text-gray-500">Votes Cast</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <Award size={24} className="mx-auto mb-2 text-mtis-gold" />
                    <p className="text-2xl font-bold text-mtis-gold">{votingStats.categoriesCount}</p>
                    <p className="text-xs text-gray-500">Categories</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <HelpCircle size={18} className="text-mtis-blue" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Need help?</p>
                  <p className="text-xs text-gray-500">Contact support or view documentation</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button className="px-4 py-2 text-sm text-gray-600 hover:text-mtis-wine transition">
                  Privacy Policy
                </button>
                <button className="px-4 py-2 text-sm text-gray-600 hover:text-mtis-wine transition">
                  Terms of Service
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition flex items-center gap-2"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-mtis-blue">Change Password</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mtis-gold focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mtis-gold focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="rounded"
                />
                <label htmlFor="showPassword" className="text-sm text-gray-600">Show password</label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-mtis-blue to-mtis-wine text-white rounded-xl hover:shadow-lg transition"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-red-600">Delete Account</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your voting data.</p>
              <div className="bg-red-50 p-3 rounded-xl">
                <p className="text-xs text-red-600">⚠️ This will delete:</p>
                <ul className="text-xs text-red-600 mt-1 list-disc list-inside">
                  <li>Your voting history</li>
                  <li>Profile information</li>
                  <li>Saved preferences</li>
                </ul>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  try {
                    // Delete user from auth and users table
                    const { error } = await supabase.rpc('delete_user_account', { user_id: userId });
                    if (error) throw error;
                    alert("Account deletion request submitted. You will receive a confirmation email.");
                    await supabase.auth.signOut();
                    router.push("/login");
                  } catch (error: any) {
                    alert("Failed to delete account. Please contact support.");
                  }
                }}
                className="flex-1 px-4-py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
