'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCircuit, Mail, KeyRound, ArrowRight, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FacultyLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState('');

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'faculty' }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('otp');
        setCooldown(60);
        try {
          const otpRes = await fetch('/latest_otp.json?t=' + Date.now());
          if (otpRes.ok) {
            const otpData = await otpRes.json();
            if (otpData.email === email) setDevOtp(otpData.otp);
          }
        } catch {}
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, role: 'faculty' }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/faculty/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'faculty' }),
      });
      if (res.ok) {
        setCooldown(60);
        try {
          const otpRes = await fetch('/latest_otp.json?t=' + Date.now());
          if (otpRes.ok) {
            const otpData = await otpRes.json();
            if (otpData.email === email) setDevOtp(otpData.otp);
          }
        } catch {}
      }
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden font-body text-on-surface antialiased selection:bg-primary/30 px-6">
      {/* Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary-fixed-dim/10 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="relative z-10 w-full max-w-[440px]">
        {/* Glassmorphism Card */}
        <div className="bg-surface-container-highest/60 backdrop-blur-xl rounded-[1.5rem] border border-white/10 shadow-2xl p-8 sm:p-10 relative overflow-hidden">
          {/* Subtle internal top highlight for glass effect */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="bg-secondary-fixed-dim/20 p-2.5 rounded-xl border border-secondary-fixed-dim/30 group-hover:border-secondary-fixed-dim/60 transition-colors">
                <BrainCircuit className="h-8 w-8 text-secondary" />
              </div>
              <div className="text-left">
                <span className="text-xl font-display font-black text-on-surface">UniSmart</span>
                <p className="text-[10px] text-secondary font-label font-bold tracking-widest uppercase">Faculty Portal</p>
              </div>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface mb-2">
              {step === 'email' ? 'Faculty Portal' : 'Verification'}
            </h1>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">
              {step === 'email'
                ? 'Enter your registered faculty email to receive a secure verification code'
                : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-error-container/20 border border-error/20 rounded-xl px-4 py-3 mb-6">
              <p className="text-xs text-error font-medium">{error}</p>
            </div>
          )}

          {/* Dev Mode OTP Helper */}
          {devOtp && step === 'otp' && (
            <div className="bg-secondary/10 border border-secondary/20 rounded-xl px-4 py-3 mb-6 flex flex-col items-center gap-1.5">
              <p className="text-[10px] text-secondary font-bold tracking-wider uppercase">Development OTP Code</p>
              <span className="font-mono text-on-surface text-lg font-bold tracking-[0.25em]">{devOtp}</span>
            </div>
          )}

          {/* Forms */}
          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="sr-only" htmlFor="email">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="faculty@university.edu"
                    className="block w-full pl-11 pr-4 py-3.5 bg-surface-variant/50 border border-outline-variant/50 rounded-xl text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-secondary/30 focus:border-secondary focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-full shadow-sm text-sm font-label font-semibold text-on-secondary-fixed bg-secondary-dim hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-secondary transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Send Code
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="sr-only" htmlFor="otp">One-time passcode</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="block w-full pl-11 pr-4 py-3.5 bg-surface-variant/50 border border-outline-variant/50 rounded-xl text-on-surface placeholder-on-surface-variant/40 font-mono tracking-[0.3em] text-center focus:ring-2 focus:ring-secondary/30 focus:border-secondary focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-full shadow-sm text-sm font-label font-semibold text-on-secondary-fixed bg-secondary-dim hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-secondary transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Verify & Login
              </button>

              <div className="flex items-center justify-between mt-4">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setDevOtp(''); }}
                  className="text-xs text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-colors duration-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Email
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0}
                  className="text-xs text-secondary hover:text-secondary-fixed font-semibold disabled:text-on-surface-variant/40 transition-colors duration-200"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link
              href="/admin/login"
              className="font-label text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors duration-200 inline-flex items-center gap-1 group"
            >
              Administrator? Login here
              <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

