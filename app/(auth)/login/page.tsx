// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, LogIn, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password");
      setIsLoading(false);
      return;
    }

    try {
      // First, check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Supabase is not configured. Please check your environment variables.");
      }

      console.log("Attempting login with:", email);
      
      // Sign in with Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        throw signInError;
      }

      if (data.user) {
        console.log("Login successful for user:", data.user.id);
        
        // Get user profile from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error("Error fetching user data:", userError);
        }

        // Store user info
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("user", JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          name: userData?.full_name || data.user.email?.split('@')[0],
          role: userData?.role || "voter",
          voterId: userData?.voter_id || `MTIS-${Math.floor(Math.random() * 10000)}`
        }));

        // Redirect based on role
        if (userData?.role === 'super_admin' || userData?.role === 'admin') {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      console.error("Login error details:", err);
      
      // Handle specific error messages
      if (err.message?.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (err.message?.includes("Email not confirmed")) {
        setError("Please verify your email address before logging in.");
      } else if (err.message?.includes("Supabase is not configured")) {
        setError("System configuration error. Please contact administrator.");
      } else if (err.message?.includes("Invalid path specified")) {
        setError("Configuration error: Invalid API endpoint. Please check your Supabase URL.");
      } else {
        setError(err.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mtis-blue via-mtis-blue to-mtis-wine flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <Image
                src="/img/mtislogo.png"
                alt="MTIS Logo"
                width={80}
                height={80}
                className="object-contain "
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
          <p className="text-white/70">Sign in to cast your votes</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-300 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@mtis.edu.ph"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-mtis-gold focus:border-transparent"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-mtis-gold focus:border-transparent"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-white/60 text-sm">
                <input type="checkbox" className="rounded border-white/20 bg-white/10" />
                Remember me
              </label>
              <button type="button" className="text-mtis-gold text-sm hover:text-mtis-gold/80">
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-mtis-gold text-mtis-blue font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-mtis-blue border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Don't have an account?{" "}
              <Link href="/register" className="text-mtis-gold hover:text-mtis-gold/80 font-medium">
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8">
          <p className="text-white/40 text-xs">
            Secure voting system for Mr. & Mrs. MTIS 2026
          </p>
        </div>
      </div>
    </div>
  );
}