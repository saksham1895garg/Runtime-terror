"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2, Building, User as UserIcon, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function DeveloperOnboardingPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    employeeId: ""
  });
  
  const router = useRouter();

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No active session found. Please login again.");
      }

      // Update the user's name in auth metadata (which Supabase syncs to users table usually)
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          name: formData.name,
          department: formData.department,
          onboarded: true
        }
      });

      if (updateError) throw updateError;

      // Update the public.users table directly just to be safe
      await supabase.from('users').update({
        name: formData.name
      }).eq('id', user.id);

      // Redirect to dev dashboard
      router.push('/dev-dashboard');
      
    } catch (err) {
      console.error(err);
      alert("Failed to complete onboarding. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 selection:bg-black selection:text-white">
      
      {/* Sleek Corporate Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-black rounded flex items-center justify-center">
            <Building className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 tracking-tight">DHARA-SOOCHAK INTERNAL</span>
        </div>
        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">
          Developer Onboarding
        </div>
      </div>

      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-2xl shadow-gray-200/50 overflow-hidden mt-16">
        
        {/* Progress Bar */}
        <div className="flex w-full h-1 bg-gray-100">
          <div className={`h-full bg-black transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
        </div>

        <div className="p-10">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-8">
                <ShieldCheck className="h-8 w-8 text-black" />
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Legal & Security Consent</h1>
              </div>

              <div className="prose prose-sm text-gray-600 space-y-4">
                <p>
                  You are being granted administrative access to the DHARA-SOOCHAK operational environment. 
                  This system processes sensitive geospatial data, national infrastructure vulnerabilities, and 
                  security intelligence.
                </p>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                  <h4 className="font-bold text-gray-900 m-0">Terms of Access</h4>
                  <ul className="list-disc pl-5 m-0 space-y-1">
                    <li>I acknowledge that all actions performed under my identity are permanently audited.</li>
                    <li>I will not exfiltrate, copy, or distribute operational data outside authorized channels.</li>
                    <li>I will use my permissions strictly for authorized system maintenance and development.</li>
                    <li>I understand that unauthorized modification of risk predictions carries legal consequences.</li>
                  </ul>
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="checkbox" 
                  className="mt-1 w-5 h-5 accent-black cursor-pointer"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                />
                <div>
                  <span className="font-bold text-gray-900 block">I agree to the Terms of Access</span>
                  <span className="text-xs text-gray-500 block mt-0.5">By checking this box, you sign a binding Non-Disclosure and Security Agreement.</span>
                </div>
              </label>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => setStep(2)}
                  disabled={!consentGiven}
                  className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Profile <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center gap-3 mb-8">
                <UserIcon className="h-8 w-8 text-black" />
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Identity Registration</h1>
              </div>

              <form onSubmit={handleComplete} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Full Legal Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Department / Team</label>
                    <input 
                      type="text" 
                      required
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value})}
                      placeholder="e.g. Data Science"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Employee/Gov ID</label>
                    <input 
                      type="text" 
                      required
                      value={formData.employeeId}
                      onChange={e => setFormData({...formData, employeeId: e.target.value})}
                      placeholder="e.g. DS-4921"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-between">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-gray-500 font-medium hover:text-gray-900 transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting || !formData.name || !formData.department || !formData.employeeId}
                    className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/20"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" /> Initialize Access
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
      
      <p className="mt-8 text-xs text-gray-400">
        Secure Enclave &copy; {new Date().getFullYear()} DHARA-SOOCHAK Systems
      </p>
    </div>
  );
}
