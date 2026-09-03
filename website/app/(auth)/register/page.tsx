"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { AlertCircle, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // In a real app we'd add email confirmation, but for demo we just sign up
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    });
    
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    
    // Automatically create the user record in public.users since we bypass triggers for the demo
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: email,
        name: name,
        role: 'public',
        email_verified: true // Demo mode
      });
      setSuccess(true);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Registration Successful</h3>
        <p className="text-slate-600 text-sm">
          Your account has been created. You can now submit reports and view public advisories.
        </p>
        <Button className="w-full mt-4" onClick={() => router.push("/login")}>
          Continue to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-slate-900">Create a Public Account</h3>
        <p className="text-sm text-slate-500 mt-1">Submit reports and view updates</p>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-start gap-2 text-sm border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input 
            type="text" 
            required 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="citizen@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="••••••••"
            minLength={6}
          />
        </div>
        
        <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </Button>
      </form>
      
      <p className="text-center text-sm text-slate-600 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
          Sign in
        </Link>
      </p>
    </div>
  );
}
