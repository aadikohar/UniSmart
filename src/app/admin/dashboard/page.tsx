'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { 
  Users, BookOpen, Layers, AlertTriangle, 
  TrendingUp, BarChart2, PieChart as PieChartIcon, RefreshCw,
  Clock, CheckCircle, FileText, ArrowRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart as ReBarChart, Bar, Cell,
  PieChart, Pie
} from 'recharts';
import Link from 'next/link';

interface Stats {
  totalStudents: number;
  totalFaculty: number;
  activeBatchesCount: number;
  overallAttendanceRate: number;
  highRiskCount: number;
}

interface RiskDistribution {
  Low: number;
  Medium: number;
  High: number;
}

interface TrendItem {
  date: string;
  rate: number;
}

interface BatchItem {
  batch: string;
  rate: number;
}

interface FacultyMember {
  id: string;
  name: string;
  email: string;
  department: string;
  academicYear: string;
  status: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [riskDist, setRiskDist] = useState<RiskDistribution | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [faculties, setFaculties] = useState<FacultyMember[]>([]);
  const { toast } = useToast();

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai/risk-overview');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRiskDist(data.riskDistribution);
        setTrends(data.attendanceTrends);
        setBatches(data.batchDistribution);
      } else {
        toast('Failed to load dashboard overview data.', 'error');
      }

      // Fetch active faculties for overview table
      const facRes = await fetch('/api/faculty?limit=5');
      if (facRes.ok) {
        const facData = await facRes.json();
        setFaculties(facData.faculty || []);
      }
    } catch (e) {
      console.error(e);
      toast('Network error while loading dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading || !mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-10 w-48 bg-surface-container-highest/60 rounded-xl"></div>
        
        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-surface-container-highest/60 rounded-2xl border border-white/5"></div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-surface-container-highest/60 rounded-2xl border border-white/5 lg:col-span-2"></div>
          <div className="h-96 bg-surface-container-highest/60 rounded-2xl border border-white/5"></div>
        </div>
      </div>
    );
  }

  // Risk Pie Chart Data
  const pieData = riskDist ? [
    { name: 'Low Risk', value: riskDist.Low, color: '#14b8a6' },     // Teal
    { name: 'Medium Risk', value: riskDist.Medium, color: '#f59e0b' }, // Amber
    { name: 'High Risk', value: riskDist.High, color: '#ef4444' },    // Red
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-8 relative">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Page Header */}
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h2 className="text-2xl font-headline font-bold tracking-tight text-on-surface">System Overview</h2>
          <p className="text-xs text-on-surface-variant mt-1">Aggregated statistics and risk metrics across all university departments.</p>
        </div>
        <button 
          onClick={fetchOverview}
          className="p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container/30 hover:bg-surface-variant/50 text-on-surface-variant hover:text-on-surface transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Row Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {/* Stat Card 1 - Faculty */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2.5 bg-primary-container/20 rounded-xl border border-primary/20 text-primary-dim">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-secondary flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded-full border border-secondary/20">
              <TrendingUp className="w-3.5 h-3.5" /> Stable
            </span>
          </div>
          <h4 className="text-on-surface-variant text-sm font-medium relative z-10">Total Faculty</h4>
          <p className="text-3xl font-headline font-bold text-on-surface mt-1 relative z-10">{stats?.totalFaculty}</p>
        </div>

        {/* Stat Card 2 - Students */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2.5 bg-secondary-container/20 rounded-xl border border-secondary/20 text-secondary-dim">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-secondary flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded-full border border-secondary/20">
              Active
            </span>
          </div>
          <h4 className="text-on-surface-variant text-sm font-medium relative z-10">Total Students</h4>
          <p className="text-3xl font-headline font-bold text-on-surface mt-1 relative z-10">{stats?.totalStudents}</p>
        </div>

        {/* Stat Card 3 - Active Sessions */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary-fixed/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2.5 bg-secondary-container/20 rounded-xl border border-secondary/20 text-secondary-fixed">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <h4 className="text-on-surface-variant text-sm font-medium relative z-10">Active Batches</h4>
          <p className="text-3xl font-headline font-bold text-on-surface mt-1 relative z-10">{stats?.activeBatchesCount}</p>
        </div>

        {/* Stat Card 4 - At-Risk Students */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group border-error/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-error/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2.5 bg-error-container/30 rounded-xl border border-error/30 text-error">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-error flex items-center gap-1 bg-error/10 px-2 py-1 rounded-full border border-error/20">
              Action Required
            </span>
          </div>
          <h4 className="text-on-surface-variant text-sm font-medium relative z-10">At-Risk Students</h4>
          <p className="text-3xl font-headline font-bold text-error mt-1 relative z-10">{stats?.highRiskCount}</p>
        </div>
      </div>

      {/* Two Column Layout: Activity & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Left: Recent Activity */}
        <div className="glass-panel rounded-2xl col-span-2 flex flex-col overflow-hidden border border-white/5">
          <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest/30">
            <h3 className="font-headline font-bold text-lg text-on-surface">Recent Faculty Activity</h3>
            <span className="text-xs text-on-surface-variant font-medium">Real-time logs</span>
          </div>
          <div className="p-6 flex-grow">
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 border border-primary/20 flex items-center justify-center text-primary-dim shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-on-surface font-body"><span className="font-bold text-on-surface">Dr. Sarah Smith</span> marked Attendance for <span className="text-primary-fixed-dim font-bold">CS101 (Intro to CS)</span></p>
                  <p className="text-[10px] text-on-surface-variant mt-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> 10 mins ago</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary-container/20 border border-secondary/20 flex items-center justify-center text-secondary-dim shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-on-surface font-body"><span className="font-bold text-on-surface">Prof. Michael Jones</span> uploaded new Student Roster file</p>
                  <p className="text-[10px] text-on-surface-variant mt-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> 45 mins ago</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-error-container/20 border border-error/20 flex items-center justify-center text-error shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-on-surface font-body"><span className="font-bold text-on-surface">System AI</span> generated weekly intervention report (Flagged <span className="text-error font-bold">{stats?.highRiskCount}</span> high-risk students)</p>
                  <p className="text-[10px] text-on-surface-variant mt-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> 2 hours ago</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Risk Distribution Chart */}
        <div className="glass-panel rounded-2xl flex flex-col overflow-hidden border border-white/5">
          <div className="p-6 border-b border-outline-variant/30 bg-surface-container-lowest/30">
            <h3 className="font-headline font-bold text-lg text-on-surface">Campus Risk Profile</h3>
            <p className="text-[10px] text-on-surface-variant mt-1">AI-predicted student success probability</p>
          </div>
          
          <div className="p-6 flex-grow flex flex-col items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-xs text-on-surface-variant py-12">No student data logged</div>
            ) : (
              <div className="h-48 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Total Active</span>
                  <span className="text-2xl font-black text-on-surface mt-0.5">{stats?.totalStudents}</span>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="w-full mt-6 space-y-3 pt-4 border-t border-outline-variant/30">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span className="text-xs text-on-surface-variant font-medium">{d.name}</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">{d.value} Students</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Attendance Trends */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-fixed-dim" />
              <span className="text-sm font-headline font-bold text-on-surface">System Attendance Trends</span>
            </div>
            <span className="text-[10px] text-on-surface-variant font-medium">Last 7 recorded sessions</span>
          </div>
          <div className="h-80 w-full flex-grow">
            {trends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-on-surface-variant">No historical data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rateColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#25252b" vertical={false} />
                  <XAxis dataKey="date" stroke="#abaab1" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#abaab1" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#19191e', borderColor: '#25252b', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#c0c1ff' }}
                    formatter={(val: any) => [`${val}%`, 'Attendance Rate']}
                  />
                  <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#rateColor)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Batch Attendance */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col border border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-4 h-4 text-secondary" />
            <span className="text-sm font-headline font-bold text-on-surface">Attendance Rate by Batch</span>
          </div>
          <div className="h-80 w-full flex-grow">
            {batches.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-on-surface-variant">No batch performance metrics available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={batches} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#25252b" vertical={false} />
                  <XAxis dataKey="batch" stroke="#abaab1" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#abaab1" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#19191e', borderColor: '#25252b', borderRadius: '12px' }}
                    formatter={(val: any) => [`${val}%`, 'Attendance Average']}
                  />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]} barSize={28}>
                    {batches.map((entry, index) => {
                      const color = entry.rate < 75 ? '#f97386' : entry.rate < 85 ? '#f59e0b' : '#6366f1';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Faculty Data Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 relative z-10">
        <div className="p-6 border-b border-outline-variant/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest/30">
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Faculty Directory Summary</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Manage teaching staff and departments.</p>
          </div>
          <Link href="/admin/dashboard/faculty" className="px-4 py-2.5 bg-primary-fixed-dim hover:bg-primary-fixed text-on-primary-fixed rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-primary-fixed-dim/20">
            Manage Faculty <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-surface-container-high/60 text-on-surface-variant text-xs uppercase tracking-wider font-bold border-b border-outline-variant/30">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Academic Year</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {faculties.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-xs text-on-surface-variant font-body">
                    No faculty members found. Register new staff in Faculty Management.
                  </td>
                </tr>
              ) : (
                faculties.map((f) => (
                  <tr key={f.id} className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-fixed-dim/20 text-primary-fixed flex items-center justify-center font-bold text-xs">
                          {f.name[0] + (f.name.split(' ')[1]?.[0] || '')}
                        </div>
                        <div>
                          <div className="font-semibold text-on-surface">{f.name}</div>
                          <div className="text-xs text-on-surface-variant font-body">{f.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant">{f.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant">{f.academicYear}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold tracking-wide uppercase ${
                        f.status === 'ACTIVE'
                          ? 'bg-secondary/10 text-secondary border-secondary/20'
                          : 'bg-on-surface-variant/10 text-on-surface-variant border-outline-variant/30'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

