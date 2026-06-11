'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { Cpu, AlertTriangle, Shield, TrendingDown, RefreshCw, Filter, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from 'recharts';

interface StudentRisk {
  id: string;
  studentId: string;
  name: string;
  rollNumber: string;
  batch: string;
  facultyName: string;
  attendancePercentage: number;
  riskScore: number;
  riskLevel: string;
  prediction: string;
  recommendation: string;
}

export default function AIRiskCenterPage() {
  const [risks, setRisks] = useState<StudentRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [batches, setBatches] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (riskFilter) params.set('riskLevel', riskFilter);
      if (batchFilter) params.set('batch', batchFilter);
      const res = await fetch(`/api/ai/student-risk?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRisks(data.studentRisks);
        const allBatches = [...new Set(data.studentRisks.map((r: StudentRisk) => r.batch))];
        if (!batchFilter && !riskFilter) setBatches(allBatches as string[]);
      }
    } catch { toast('Failed to load risk data.', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRisks(); }, [riskFilter, batchFilter]);

  const highRisk = risks.filter(r => r.riskLevel === 'Red');
  const medRisk = risks.filter(r => r.riskLevel === 'Yellow');
  const lowRisk = risks.filter(r => r.riskLevel === 'Green');

  const pieData = [
    { name: 'High Risk', value: highRisk.length, color: '#f97386' },
    { name: 'Medium Risk', value: medRisk.length, color: '#f59e0b' },
    { name: 'Low Risk', value: lowRisk.length, color: '#14b8a6' },
  ].filter(d => d.value > 0);

  const batchPerformance = batches.map(b => {
    const batchStudents = risks.filter(r => r.batch === b);
    const avgRate = batchStudents.length > 0 ? Math.round(batchStudents.reduce((sum, s) => sum + s.attendancePercentage, 0) / batchStudents.length) : 100;
    return { batch: b, rate: avgRate };
  });

  const riskCardStyle = (level: string) => {
    if (level === 'Red') return 'border-error/20 bg-error/5 hover:border-error/30';
    if (level === 'Yellow') return 'border-tertiary/20 bg-tertiary/5 hover:border-tertiary/30';
    return 'border-secondary/20 bg-secondary/5 hover:border-secondary/30';
  };

  const riskBadge = (level: string) => {
    if (level === 'Red') return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-error-container/20 text-error border border-error/20 uppercase tracking-wide">High Risk</span>;
    if (level === 'Yellow') return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-tertiary-container/10 text-tertiary border border-tertiary/20 uppercase tracking-wide">Medium Risk</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container/20 text-secondary border border-secondary/20 uppercase tracking-wide">Low Risk</span>;
  };

  const progressColor = (level: string) => {
    if (level === 'Red') return 'bg-error';
    if (level === 'Yellow') return 'bg-tertiary';
    return 'bg-secondary-fixed';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <nav className="flex text-[10px] text-on-surface-variant gap-2 mb-1.5 font-label font-bold uppercase tracking-wider">
            <span>Admin</span>
            <span>/</span>
            <span className="text-primary-fixed-dim">AI Risk Center</span>
          </nav>
          <h2 className="text-2xl font-headline font-bold text-on-surface tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary-fixed-dim" /> AI Risk Analysis Dashboard
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">Predictive student success analytics, risk scoring, and automation suggestions powered by UniSmart AI.</p>
        </div>
        <button onClick={fetchRisks} className="p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container/30 hover:bg-surface-variant/50 text-on-surface-variant hover:text-on-surface transition-colors duration-200"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* High Risk */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col relative overflow-hidden group border-error/20 bg-error/5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-error/10 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-2 bg-error-container/20 border border-error/30 rounded-lg text-error">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-xs text-error font-bold uppercase tracking-wider">High Risk</span>
          </div>
          <p className="text-3xl font-headline font-bold text-error mt-1 relative z-10">{highRisk.length}</p>
          <p className="text-[10px] text-on-surface-variant mt-3 relative z-10">Attendance &lt; 75% &bull; Immediate Action Needed</p>
        </div>

        {/* Medium Risk */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col relative overflow-hidden group border-tertiary/20 bg-tertiary/5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-tertiary/10 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-2 bg-tertiary-container/10 border border-tertiary/20 rounded-lg text-tertiary">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-xs text-tertiary font-bold uppercase tracking-wider">Medium Risk</span>
          </div>
          <p className="text-3xl font-headline font-bold text-tertiary mt-1 relative z-10">{medRisk.length}</p>
          <p className="text-[10px] text-on-surface-variant mt-3 relative z-10">Attendance 75%-85% &bull; Monitor closely</p>
        </div>

        {/* Low Risk */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col relative overflow-hidden group border-secondary/20 bg-secondary/5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-2 bg-secondary-container/20 border border-secondary/20 rounded-lg text-secondary">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xs text-secondary font-bold uppercase tracking-wider">Low Risk</span>
          </div>
          <p className="text-3xl font-headline font-bold text-secondary mt-1 relative z-10">{lowRisk.length}</p>
          <p className="text-[10px] text-on-surface-variant mt-3 relative z-10">Attendance &gt; 85% &bull; Safe and stable</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-outline-variant/30 flex flex-col">
          <h3 className="text-sm font-headline font-bold text-on-surface mb-4">Risk Profile Distribution</h3>
          <div className="h-56 relative flex-grow flex items-center justify-center">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-on-surface">{risks.length}</span>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Students</span>
                </div>
              </>
            ) : <div className="h-full flex items-center justify-center text-xs text-on-surface-variant">No data loaded</div>}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-outline-variant/30 flex flex-col">
          <h3 className="text-sm font-headline font-bold text-on-surface mb-4">Batch Average Attendance</h3>
          <div className="h-56 flex-grow">
            {batchPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={batchPerformance} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#25252b" vertical={false} />
                  <XAxis dataKey="batch" stroke="#abaab1" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#abaab1" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#19191e', borderColor: '#25252b', borderRadius: '12px' }} formatter={(val: any) => [`${val}%`, 'Average']} />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]} barSize={26}>
                    {batchPerformance.map((e, i) => <Cell key={i} fill={e.rate < 75 ? '#f97386' : e.rate < 85 ? '#f59e0b' : '#6366f1'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-xs text-on-surface-variant">No data loaded</div>}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="bg-surface-container/60 border border-outline-variant/40 rounded-xl py-2.5 pl-10 pr-8 text-xs text-on-surface-variant focus:ring-1 focus:ring-primary-fixed focus:border-primary-fixed focus:outline-none transition-colors duration-200 cursor-pointer appearance-none">
            <option value="">All Risk Levels</option>
            <option value="Red">High Risk</option>
            <option value="Yellow">Medium Risk</option>
            <option value="Green">Low Risk</option>
          </select>
        </div>
        <div className="relative">
          <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className="bg-surface-container/60 border border-outline-variant/40 rounded-xl py-2.5 px-4 text-xs text-on-surface-variant focus:ring-1 focus:ring-primary-fixed focus:border-primary-fixed focus:outline-none transition-colors duration-200 cursor-pointer">
            <option value="">All Batches</option>
            {batches.map(b => <option key={b} value={b}>Batch {b}</option>)}
          </select>
        </div>
      </div>

      {/* AI Recommendation Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-headline font-bold text-on-surface flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-secondary" /> AI Intervention Recommendations
        </h3>
        
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-28 bg-surface-container-highest/60 rounded-2xl animate-pulse border border-white/5" />)
        ) : risks.length === 0 ? (
          <p className="text-xs text-on-surface-variant py-4 font-body">No students found matching selected filters.</p>
        ) : (
          risks.map(r => (
            <div key={r.id} className={`p-5 rounded-2xl border ${riskCardStyle(r.riskLevel)} glass-panel transition-all hover-card-trigger`}>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-grow space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-on-surface">{r.name}</span>
                    <span className="text-xs font-mono text-on-surface-variant">{r.rollNumber}</span>
                    {riskBadge(r.riskLevel)}
                  </div>
                  
                  <p className="text-xs text-on-surface-variant font-body">Batch: <span className="text-on-surface font-medium">{r.batch}</span> &bull; Faculty Advisor: <span className="text-on-surface font-medium">{r.facultyName}</span></p>
                  
                  <div className="pt-2 space-y-1.5 border-t border-white/5">
                    <p className="text-xs text-on-surface flex items-start gap-1.5 font-medium leading-relaxed">
                      <span className="text-secondary shrink-0">Prediction:</span>
                      {r.prediction}
                    </p>
                    <p className="text-xs text-on-surface flex items-start gap-1.5 font-medium leading-relaxed">
                      <span className="text-primary-fixed-dim shrink-0">Recommendation:</span>
                      {r.recommendation}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <div>
                    <div className="text-2xl font-black font-mono leading-none" style={{ color: r.riskLevel === 'Red' ? '#f97386' : r.riskLevel === 'Yellow' ? '#f59e0b' : '#14b8a6' }}>
                      {r.attendancePercentage}%
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-1 font-semibold uppercase tracking-wider font-label">Attendance</p>
                  </div>
                  <div className="w-24 h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${progressColor(r.riskLevel)}`} style={{ width: `${r.attendancePercentage}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

