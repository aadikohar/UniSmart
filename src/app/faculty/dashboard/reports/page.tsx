'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import { 
  FileSpreadsheet, Download, Search, RefreshCw, Calendar as CalendarIcon,
  TrendingUp, TrendingDown, Sparkles, Filter, Check, X, ShieldAlert,
  ArrowRight, FileText
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function AttendanceReports() {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<any[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Charts and statistics states
  const [trends, setTrends] = useState<any[]>([]);
  const [batchStats, setBatchStats] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA')
  );
  const [endDate, setEndDate] = useState(
    new Date().toLocaleDateString('en-CA')
  );
  const [batchFilter, setBatchFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/students?limit=1');
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch {
      // Ignore
    }
  };

  const fetchOverviewStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch('/api/ai/risk-overview');
      if (res.ok) {
        const data = await res.json();
        setTrends(data.attendanceTrends || []);
        setBatchStats(data.batchDistribution || []);
      }
    } catch {
      // Ignore
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL(window.location.origin + '/api/attendance/report');
      url.searchParams.set('startDate', startDate);
      url.searchParams.set('endDate', endDate);
      if (batchFilter) url.searchParams.set('batch', batchFilter);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setReportData(data.report || []);
      } else {
        toast('Failed to load report data', 'error');
      }
    } catch {
      toast('Network error generating report', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, batchFilter, toast]);

  useEffect(() => {
    fetchBatches();
    fetchOverviewStats();
    fetchReport();
  }, []);

  const handleGenerate = () => {
    fetchReport();
    fetchOverviewStats();
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      setExporting(true);
      const url = new URL(window.location.origin + '/api/attendance/report');
      url.searchParams.set('startDate', startDate);
      url.searchParams.set('endDate', endDate);
      if (batchFilter) url.searchParams.set('batch', batchFilter);
      url.searchParams.set('export', format);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Attendance_Report_${new Date().getTime()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast(`Exported to ${format.toUpperCase()} successfully`, 'success');
    } catch {
      toast('Failed to export report', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Client side filtering for table
  const filteredData = reportData.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sorting reports by attendance rate (highest to lowest) to rank them
  const sortedReportData = [...filteredData].sort((a, b) => b.attendancePercentage - a.attendancePercentage);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-headline font-black text-on-surface tracking-tight">Reports & Analytics</h2>
          <p className="text-sm text-on-surface-variant mt-1">Real-time performance metrics and attendance tracking</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => handleExport('csv')} 
            disabled={exporting || reportData.length === 0}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface hover:text-on-surface rounded-xl text-xs font-bold hover:bg-surface-container-high transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4 text-on-surface-variant" /> Export CSV
          </button>
          <button 
            onClick={() => handleExport('excel')} 
            disabled={exporting || reportData.length === 0}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary-fixed transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-primary/15"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Date and Batch filter Panel */}
      <div className="glass-panel border-outline-variant/40 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:flex-1 space-y-1.5">
          <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Start Date</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent outline-none cursor-pointer" 
            />
          </div>
        </div>

        <div className="w-full md:flex-1 space-y-1.5">
          <label className="text-[10px] font-bold text-outline uppercase tracking-wider">End Date</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent outline-none cursor-pointer" 
            />
          </div>
        </div>

        <div className="w-full md:flex-1 space-y-1.5">
          <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Batch</label>
          <select 
            value={batchFilter} 
            onChange={e => setBatchFilter(e.target.value)} 
            className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent outline-none cursor-pointer appearance-none"
          >
            <option value="">All Batches</option>
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <button 
          onClick={handleGenerate} 
          disabled={loading}
          className="w-full md:w-auto px-6 py-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant hover:text-on-surface rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Generate Report
        </button>
      </div>

      {/* Recharts Area Chart section */}
      <section className="glass-panel rounded-3xl p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[90px] pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <h3 className="text-xl font-headline font-bold text-on-surface">Attendance Trend</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Consolidated daily average across all active batches</p>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim"></span>
              <span className="text-xs font-semibold text-on-surface-variant">Class Attendance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
              <span className="text-xs font-semibold text-on-surface-variant">Threshold (75%)</span>
            </div>
          </div>
        </div>

        <div className="h-[280px] w-full mt-4">
          {statsLoading ? (
            <div className="h-full flex items-center justify-center text-xs text-on-surface-variant gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Loading trend data...
            </div>
          ) : trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportsColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#25252b" vertical={false} />
                <XAxis dataKey="date" stroke="#75757b" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#75757b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#19191e', borderColor: '#47474e', borderRadius: '12px', color: '#e6e4ec' }} 
                  formatter={(val: any) => [`${val}%`, 'Daily Rate']} 
                />
                <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2.5} fill="url(#reportsColor)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-on-surface-variant">
              No trend data available for the selected dates.
            </div>
          )}
        </div>
      </section>

      {/* Batch comparison grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {batchStats.length === 0 ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl p-6 h-36 animate-pulse" />
          ))
        ) : (
          batchStats.map((item, idx) => {
            const icons = ['hub', 'data_object', 'cloud', 'terminal'];
            const colors = ['text-primary bg-primary/10', 'text-secondary bg-secondary/10', 'text-tertiary bg-tertiary/10', 'text-error bg-error/10'];
            
            // Choose colors based on attendance level
            const isAtRisk = item.rate < 75;
            const rateColor = isAtRisk ? 'text-error' : item.rate < 85 ? 'text-tertiary' : 'text-secondary';
            const iconIndex = idx % 4;

            return (
              <div key={idx} className="glass-panel rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 select-none ${colors[iconIndex]}`}>
                    <span className="material-symbols-outlined text-base">{icons[iconIndex]}</span>
                  </div>
                  
                  <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isAtRisk ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'
                  }`}>
                    {isAtRisk ? (
                      <>
                        <TrendingDown className="w-3 h-3" /> -3.5%
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-3 h-3" /> +1.2%
                      </>
                    )}
                  </div>
                </div>

                <h4 className="text-on-surface-variant text-sm font-semibold mb-1 group-hover:text-on-surface transition-colors">
                  Batch {item.batch}
                </h4>
                
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black font-headline ${rateColor}`}>{item.rate}%</span>
                  <span className="text-[10px] text-outline font-bold uppercase">Avg. Attendance</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Main Grid: Data Table & Options Sidecard */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Table panel */}
        <section className="glass-panel rounded-3xl xl:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant/40 flex justify-between items-center bg-surface-container/30">
            <div>
              <h3 className="text-lg font-headline font-bold text-on-surface">Student Attendance Analysis</h3>
              <p className="text-xs text-on-surface-variant">Aggregated results for the current roster</p>
            </div>
            
            <div className="relative w-full max-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-1.5 pl-9 pr-3 text-xs text-on-surface focus:outline-none focus:border-primary placeholder:text-outline"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container/50 border-b border-outline-variant/40 text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Attendance</th>
                  <th className="px-6 py-4">Risk Level</th>
                  <th className="px-6 py-4 text-right">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" /> Calculating student analytics...
                    </td>
                  </tr>
                ) : sortedReportData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                      No records matched the selected query.
                    </td>
                  </tr>
                ) : (
                  sortedReportData.map((item, idx) => {
                    const isLow = item.attendancePercentage >= 85;
                    const isMed = item.attendancePercentage >= 75 && item.attendancePercentage < 85;
                    
                    const borderStyle = isLow 
                      ? 'hover:bg-primary/5' 
                      : isMed 
                        ? 'bg-tertiary/5 hover:bg-tertiary/10 border-l-2 border-tertiary' 
                        : 'bg-error/5 hover:bg-error/10 border-l-2 border-error';
                    
                    const badgeClass = isLow 
                      ? 'bg-secondary/10 text-secondary border-secondary/20' 
                      : isMed 
                        ? 'bg-tertiary/10 text-tertiary border-tertiary/20' 
                        : 'bg-error/10 text-error border-error/20';

                    const rankStyle = isLow 
                      ? 'bg-secondary/10 text-secondary' 
                      : isMed 
                        ? 'bg-tertiary/10 text-tertiary' 
                        : 'bg-error/10 text-error';

                    return (
                      <tr key={idx} className={`transition-colors group ${borderStyle}`}>
                        <td className="px-6 py-4">
                          <span className={`w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center ${rankStyle}`}>
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-[10px] text-primary select-none">
                              {getInitials(item.name)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-on-surface leading-tight">{item.name}</p>
                              <p className="text-[10px] text-on-surface-variant mt-0.5">{item.batch}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-on-surface-variant">
                          {item.rollNumber}
                        </td>
                        <td className="px-6 py-4 font-bold text-sm text-on-surface">
                          {item.attendancePercentage}%
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black border ${badgeClass}`}>
                            {isLow ? 'LOW' : isMed ? 'MEDIUM' : 'HIGH RISK'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-[10px] text-on-surface-variant font-mono">
                            {item.presentDays}P / {item.absentDays}A
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Options Sidebar Section */}
        <section className="space-y-6">
          {/* Export Options */}
          <div className="glass-panel rounded-3xl p-6 border-outline-variant shadow-xl">
            <h3 className="text-lg font-headline font-bold mb-6 flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary text-base select-none">ios_share</span>
              Export Settings
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] uppercase font-bold text-outline mb-2 block">Report Type</label>
                <select className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent outline-none cursor-pointer appearance-none">
                  <option className="bg-surface-container">Full Roster Report (Default)</option>
                  <option className="bg-surface-container">Attendance Only</option>
                  <option className="bg-surface-container">Risk Level Aggregates</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-outline mb-2 block">Target Format</label>
                <div className="pt-2 space-y-3">
                  <button 
                    onClick={() => handleExport('excel')}
                    className="w-full group flex justify-between items-center bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 p-4 rounded-xl transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center border border-green-500/15">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-on-surface">Export to Excel</p>
                        <p className="text-[10px] text-on-surface-variant">.xlsx spreadsheet format</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={() => handleExport('csv')}
                    className="w-full group flex justify-between items-center bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 p-4 rounded-xl transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/15">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-on-surface">Export CSV</p>
                        <p className="text-[10px] text-on-surface-variant">Raw comma-separated table</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights Mini Card */}
          <div className="bg-gradient-to-br from-primary-container/20 to-secondary-container/20 border border-primary/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-[40px] pointer-events-none"></div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-secondary select-none animate-pulse text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">AI Insight</span>
            </div>
            <p className="text-xs font-semibold leading-relaxed mb-4 text-on-surface">
              Student participation in Section A has dropped by 12% on Mondays. Consider scheduling interactive review sessions to boost engagement.
            </p>
            <button 
              onClick={() => toast('Loading detailed AI behavior analytics...', 'info')}
              className="text-xs font-black text-secondary hover:underline underline-offset-4"
            >
              Read Full Analysis
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
