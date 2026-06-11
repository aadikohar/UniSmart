'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, LayoutDashboard, BrainCircuit, ShieldCheck, FileSpreadsheet, Zap, ChevronRight, HelpCircle, Activity } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body antialiased flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* TopNavBar */}
      <header className="bg-background/80 backdrop-blur-md fixed top-0 w-full z-50 border-b border-white/10 shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 text-2xl font-display font-black tracking-tight text-on-surface">
            <div className="bg-primary-fixed-dim/20 p-2 rounded-xl border border-primary-fixed-dim/30">
              <BrainCircuit className="w-6 h-6 text-primary-fixed-dim animate-pulse" />
            </div>
            <div>
              <span className="font-headline font-black text-primary-fixed-dim tracking-tight">UniSmart</span>
              <p className="text-[10px] text-on-surface-variant font-label font-semibold tracking-wider uppercase">ULMS Platform</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-label font-medium text-on-surface-variant">
            <a href="#features" className="hover:text-on-surface transition-colors duration-200">Features</a>
            <a href="#ai-insights" className="hover:text-on-surface transition-colors duration-200">AI Insights</a>
            <a href="#faq" className="hover:text-on-surface transition-colors duration-200">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/faculty/login" className="text-sm font-label font-medium text-on-surface-variant hover:text-on-surface transition-colors duration-200">
              Faculty Login
            </Link>
            <Link href="/admin/login" className="bg-primary-fixed-dim hover:bg-primary-fixed text-on-primary-fixed font-label font-semibold text-sm px-5 py-2.5 rounded-full transition-colors duration-200 shadow-lg shadow-primary-fixed-dim/15">
              Admin Access
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-24">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center px-6 overflow-hidden">
          {/* Decorative Glow Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-fixed-dim/10 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10 py-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-fixed-dim/10 border border-primary-fixed-dim/20 text-primary-fixed-dim text-xs font-semibold tracking-wide uppercase mb-8 animate-glow">
              <Zap className="w-3.5 h-3.5" />
              <span>Next-Gen University Management System</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-primary-dim via-on-surface to-on-surface-variant mb-6">
              AI-Powered Learning <br /> Management Platform
            </h1>
            
            <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed font-body">
              Transform attendance tracking, predict student absenteeism, and automate university workflows with UniSmart's advanced AI analytics.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/admin/login" className="w-full sm:w-auto px-8 py-4 bg-primary-fixed-dim hover:bg-primary-fixed text-on-primary-fixed rounded-full font-label font-semibold flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-primary-fixed-dim/20">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/faculty/login" className="w-full sm:w-auto px-8 py-4 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface rounded-full font-label font-semibold flex items-center justify-center gap-2 transition-colors duration-200">
                Faculty Portal
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6 relative bg-surface-container-low/40">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface mb-4">Enterprise-Grade Capabilities</h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto font-body">Everything you need to manage a modern university workflow, powered by deep analytics.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: ShieldCheck, title: "OTP Based Security", desc: "Secure passwordless authentication for admins and faculty via one-time passcodes." },
                { icon: FileSpreadsheet, title: "Bulk Management", desc: "Easily onboard thousands of students and sync rosters via CSV/Excel uploads." },
                { icon: LayoutDashboard, title: "Role-Based Access", desc: "Dedicated workspaces and dashboard views tailored for Admins vs Faculty Advisors." },
                { icon: CheckCircle2, title: "Fast Attendance", desc: "Mark attendance seamlessly with bulk selection, calendar feeds, and session triggers." },
                { icon: BrainCircuit, title: "Predictive Analytics", desc: "AI-driven algorithms score student dropout risks dynamically based on attendance patterns." },
                { icon: Zap, title: "Smart Reporting", desc: "Export detailed attendance statistics and intervention reports with a single click." }
              ].map((f, i) => (
                <div key={i} className="glass-panel p-8 rounded-2xl hover-card-trigger relative group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary-fixed-dim/5 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110"></div>
                  <div className="w-12 h-12 bg-primary-fixed-dim/10 border border-primary-fixed-dim/20 rounded-xl flex items-center justify-center text-primary-fixed-dim mb-6 relative z-10">
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-headline font-bold text-on-surface mb-3 relative z-10">{f.title}</h3>
                  <p className="text-on-surface-variant leading-relaxed text-sm relative z-10 font-body">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Insights Section */}
        <section id="ai-insights" className="py-32 px-6 relative">
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-secondary-dim/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-fixed/10 border border-secondary-fixed/20 text-secondary-fixed text-xs font-semibold tracking-wide uppercase mb-6">
                <BrainCircuit className="w-4 h-4 text-secondary-fixed" />
                <span>Smart Attendance Insights (SAI)</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-on-surface mb-6 leading-tight">
                Stop dropouts before <br /> they happen
              </h2>
              <p className="text-on-surface-variant text-base md:text-lg mb-8 leading-relaxed font-body">
                UniSmart's proprietary predictive algorithms analyze historical student attendances and calculate risk metrics to identify at-risk students weeks before they breach attendance rules.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  "Dynamic Risk Scoring (Low, Medium, High)",
                  "Automated Intervention Recommendations",
                  "Trend analysis across all academic batches"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-on-surface font-body text-sm">
                    <div className="w-5 h-5 rounded-full bg-secondary-fixed/20 text-secondary-fixed flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/admin/login" className="inline-flex items-center gap-2 text-secondary hover:text-secondary-fixed font-label font-semibold transition-colors">
                Explore AI Features <ChevronRight className="w-4 h-4 animate-pulse" />
              </Link>
            </div>
            
            <div className="lg:w-1/2 w-full">
              <div className="glass-panel rounded-3xl p-8 relative overflow-hidden border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-tr from-secondary-dim/10 to-transparent pointer-events-none" />
                <div className="space-y-4 relative z-10">
                  <div className="p-4 rounded-xl bg-background/60 border border-outline-variant/30 flex items-center justify-between">
                    <div>
                      <h4 className="font-headline font-bold text-sm text-on-surface">Student: John Doe</h4>
                      <p className="text-xs text-error font-medium mt-1">Attendance likely to drop below 75%</p>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-error-container/20 border border-error/20 text-error text-[10px] font-bold tracking-wide uppercase">High Risk</div>
                  </div>
                  <div className="p-4 rounded-xl bg-background/60 border border-outline-variant/30 flex items-center justify-between">
                    <div>
                      <h4 className="font-headline font-bold text-sm text-on-surface">Student: Alice Smith</h4>
                      <p className="text-xs text-tertiary-dim font-medium mt-1">Showing high vulnerability patterns</p>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-tertiary-container/10 border border-tertiary/20 text-tertiary text-[10px] font-bold tracking-wide uppercase">Medium Risk</div>
                  </div>
                  <div className="p-4 rounded-xl bg-background/60 border border-outline-variant/30 flex items-center justify-between">
                    <div>
                      <h4 className="font-headline font-bold text-sm text-on-surface">Student: Mark Lee</h4>
                      <p className="text-xs text-secondary font-medium mt-1">Attendance is stable and secure</p>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-secondary-container/20 border border-secondary/20 text-secondary text-[10px] font-bold tracking-wide uppercase">Low Risk</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Bar */}
        <section className="py-24 px-6 border-y border-outline-variant/30 bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Faculty Members", value: "200+" },
              { label: "Students Tracked", value: "10,000+" },
              { label: "Attendance Records", value: "1M+" },
              { label: "Intervention Success", value: "85%" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <h3 className="text-4xl md:text-5xl font-display font-black text-on-surface mb-2">{stat.value}</h3>
                <p className="text-on-surface-variant text-sm font-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface mb-4">Frequently Asked Questions</h2>
            <p className="text-on-surface-variant text-sm">Have queries about our platform? We've got answers.</p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: "How does the AI predictive analytics work?", a: "The AI model continuously evaluates students' individual attendance trends, records, and seasonal triggers to calculate a probability score of attendance falling below critical thresholds, suggesting proactive counseling sessions." },
              { q: "Can we upload students and faculties in bulk?", a: "Yes, administrators can upload thousands of records via standard CSV or Excel files, and our validation wizard pre-checks files for errors before database insertion." },
              { q: "Is the authentication mechanism secure?", a: "We utilize email-based One-Time Passcodes (OTP) for secure login access, meaning faculties and admins don't need to remember weak passwords, reducing phishing liabilities." }
            ].map((faq, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl text-left border border-white/5">
                <h4 className="text-base font-headline font-bold text-on-surface flex items-center gap-3 mb-3">
                  <HelpCircle className="w-5 h-5 text-primary-fixed-dim shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-on-surface-variant text-sm font-body leading-relaxed pl-8">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/30 bg-surface-container-lowest py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-5 h-5 text-primary-fixed-dim" />
            <span className="font-display font-black text-lg text-on-surface">UniSmart LMS</span>
          </div>
          <p className="text-xs text-on-surface-variant">© 2026 UniSmart ULMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

