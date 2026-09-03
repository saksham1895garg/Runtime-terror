'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export default function GodModeEntry() {
  const [step, setStep] = useState<'IDLE' | 'SENDING' | 'VERIFYING'>('IDLE');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRequestCode = async () => {
    setError('');
    setStep('SENDING');
    
    try {
      const res = await fetch('/api/auth/step-up', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      
      setStep('VERIFYING');
    } catch (err: any) {
      setError(err.message);
      setStep('IDLE');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    
    setError('');
    try {
      const res = await fetch('/api/auth/step-up/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Invalid code');
      }
      
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto p-8 rounded-2xl bg-[#050505] border border-[#1a1a1a] shadow-2xl relative overflow-hidden animate-slide-up">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 bg-dev-critical/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-[#0a0a0a] border border-dev-critical/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(225,29,72,0.15)]">
            <ShieldAlert className="h-8 w-8 text-dev-critical" />
          </div>
          <h2 className="text-2xl font-black tracking-widest uppercase text-white mb-2">Root Access</h2>
          <p className="text-neutral-500 text-sm mb-8 px-4 leading-relaxed">
            Highly secure step-up authentication required to enter this sector.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-dev-critical/10 border border-dev-critical/30 rounded-lg text-dev-critical text-xs font-mono flex items-start gap-3 text-left">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'IDLE' && (
            <button
              onClick={handleRequestCode}
              className="w-full py-4 px-4 bg-white text-black hover:bg-neutral-200 font-bold uppercase tracking-widest text-sm rounded-xl transition-all active:scale-[0.98]"
            >
              Request Access Code
            </button>
          )}

          {step === 'SENDING' && (
            <button disabled className="w-full py-4 px-4 bg-[#111] border border-[#222] text-neutral-500 font-bold uppercase tracking-widest text-sm rounded-xl flex items-center justify-center gap-3">
              <svg className="animate-spin h-4 w-4 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Transmitting...
            </button>
          )}

          {step === 'VERIFYING' && (
            <form onSubmit={handleVerify} className="space-y-6 text-left">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 text-center">Enter 6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl p-6 text-center text-3xl font-mono tracking-[0.5em] focus:border-dev-critical focus:ring-1 focus:ring-dev-critical transition-colors outline-none"
                  placeholder="------"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={code.length !== 6}
                className="w-full py-4 px-4 bg-dev-critical hover:bg-dev-critical/90 disabled:opacity-50 disabled:bg-[#111] disabled:text-neutral-600 disabled:border disabled:border-[#222] text-white font-bold uppercase tracking-widest text-sm rounded-xl transition-all active:scale-[0.98]"
              >
                Authenticate Session
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
