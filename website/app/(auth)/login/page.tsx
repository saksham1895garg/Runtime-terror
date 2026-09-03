"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { AlertCircle, Lock } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(searchParams.get("error"));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    
    // Check role and redirect
    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();
        
      if (profile) {
        if (profile.role === 'developer') router.push('/dev-dashboard');
        else if (profile.role === 'officer') router.push('/dashboard');
        else router.push('/');
      } else {
        router.push('/');
      }
    }
  };



  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Officer Command Center</h3>
        <p className="text-sm text-slate-500 mt-1">Sign in with your official credentials.</p>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-start gap-2 text-sm border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error.replace(/\+/g, ' ')}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="officer@demo.gov.in"
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <a href="#" className="text-xs text-blue-600 hover:underline">Forgot password?</a>
          </div>
          <input 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="••••••••"
          />
        </div>
        
        <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
          {loading ? "Signing in..." : (
            <>
              <Lock className="mr-2 h-4 w-4" /> Sign in securely
            </>
          )}
        </Button>
      </form>


      
      <p className="text-center text-sm text-slate-600 mt-6">
        Don't have an account?{" "}
        <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-40">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
