// components/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        const publicPaths = ['/login', '/register', '/'];
        const isPublicPath = publicPaths.includes(pathname);
        
        if (!session && !isPublicPath) {
          // Not authenticated and trying to access protected page
          router.push('/login');
        } else if (session && isPublicPath) {
          // Authenticated but trying to access login/register page
          router.push('/dashboard');
        } else {
          setIsAuthenticated(!!session);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (pathname !== '/login' && pathname !== '/register') {
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
        router.push('/login');
      } else if (session && (pathname === '/login' || pathname === '/register')) {
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  // Show loading spinner while checking auth
  if (isLoading && pathname !== '/' && pathname !== '/login' && pathname !== '/register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mtis-blue to-mtis-wine">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-mtis-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}