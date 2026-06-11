'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from '@/components/providers';
import { useToast } from '@/components/ui/toast';
import { 
  Users, Percent, AlertTriangle, CalendarCheck, RefreshCw, 
  TrendingUp, Mail, UserCheck, Calendar as CalendarIcon, 
  MoreHorizontal, Check, X, Search, Filter, Download
} from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  
  // Mark Attendance panel states
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
  );
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Student Risk table states
  const [studentRisks, setStudentRisks] = useState<any[]>([]);
  const [risksLoading, setRisksLoading] = useState(false);
  const [riskPage, setRiskPage] = useState(1);
  const itemsPerPage = 4;

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/ai/risk-overview');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      } else {
        toast('Failed to load overview statistics', 'error');
      }
    } catch {
      toast('Network error loading statistics', 'error');
    }
  };

  const fetchAttendance = useCallback(async (date: string) => {
    try {
      setAttendanceLoading(true);
      const res = await fetch(`/api/attendance?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceRecords(data.records || []);
      } else {
        toast('Failed to load attendance list', 'error');
      }
    } catch {
      toast('Network error loading attendance list', 'error');
    } finally {
      setAttendanceLoading(false);
    }
  }, [toast]);

  const fetchStudentRisks = useCallback(async () => {
    try {
      setRisksLoading(true);
      const res = await fetch('/api/ai/student-risk');
      if (res.ok) {
        const data = await res.json();
        setStudentRisks(data.studentRisks || []);
      } else {
        toast('Failed to load student risk analysis', 'error');
      }
    } catch {
      toast('Network error loading student risk analysis', 'error');
    } finally {
      setRisksLoading(false);
    }
  }, [toast]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchOverview(),
      fetchStudentRisks(),
      fetchAttendance(selectedDate)
    ]);
    setLoading(false);
  }, [selectedDate, fetchStudentRisks, fetchAttendance]);

  useEffect(() => {
    loadAllData();
  }, []); // Run on mount

  // Fetch attendance when date changes
  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate, fetchAttendance]);

  const handleToggleStatus = (studentId: string) => {
    setAttendanceRecords(prev => prev.map(r => {
      if (r.id === studentId) {
        const newStatus = (r.status === 'PRESENT' || r.status === 'NOT_MARKED') ? 'ABSENT' : 'PRESENT';
        return { ...r, status: newStatus };
      }
      return r;
    }));
  };

  const handleSaveAttendance = async () => {
    try {
      setSavingAttendance(true);
      const dataToSave = attendanceRecords.map(r => ({
        studentId: r.id,
        status: (r.status === 'NOT_MARKED' || r.status === 'PRESENT') ? 'PRESENT' : 'ABSENT'
      }));

      if (dataToSave.length === 0) {
        toast('No students found to mark attendance', 'error');
        return;
      }

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(selectedDate).toISOString(),
          records: dataToSave
        })
      });

      if (res.ok) {
        toast('Attendance submitted successfully!', 'success');
        // Refresh stats and risk metrics
        fetchOverview();
        fetchStudentRisks();
        fetchAttendance(selectedDate);
      } else {
        toast('Failed to submit attendance', 'error');
      }
    } catch {
      toast('Network error saving attendance', 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleActionClick = (actionName: string, studentName: string) => {
    toast(`${actionName} action triggered for ${studentName}`, 'success');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Client side pagination for risk table
  const totalPages = Math.ceil(studentRisks.length / itemsPerPage);
  const paginatedRisks = studentRisks.slice((riskPage - 1) * itemsPerPage, riskPage * itemsPerPage);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-96 bg-surface-container-high rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-surface-container-high rounded-2xl border border-outline-variant" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 h-96 bg-surface-container-high rounded-2xl border border-outline-variant" />
          <div className="lg:col-span-2 h-96 bg-surface-container-high rounded-2xl border border-outline-variant" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-headline font-black bg-gradient-to-r from-primary-dim to-on-surface-variant bg-clip-text text-transparent">
            Welcome back, Professor {user?.name || 'Faculty'}
          </h2>
          <p className="text-on-surface-variant mt-2 max-w-2xl font-body leading-relaxed text-sm">
            Your {user?.department || 'academic'} seminars are seeing an{' '}
            <span className="text-secondary font-semibold">8% increase</span> in engagement this week. AI-generated risk reports for the cohorts are ready for review.
          </p>
        </div>
        <button 
          onClick={loadAllData} 
          className="self-start md:self-auto p-3 rounded-xl border border-outline-variant bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all active:scale-95 flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Dashboard
        </button>
      </div>

      {/* 4 Stats Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="glass-panel p-6 rounded-2xl stats-gradient group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20">
              <span className="material-symbols-outlined select-none">group</span>
            </div>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">+4 this month</span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">Total Students</p>
          <p className="text-4xl font-headline font-black mt-1 text-on-surface">{stats?.totalStudents || 0}</p>
        </div>

        {/* Today Attendance */}
        <div className="glass-panel p-6 rounded-2xl stats-gradient group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary border border-secondary/20">
              <span className="material-symbols-outlined select-none">how_to_reg</span>
            </div>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Above Average</span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">Today Attendance</p>
          <p className="text-4xl font-headline font-black mt-1 text-secondary">
            {stats?.todayAttendanceRate !== undefined ? `${stats.todayAttendanceRate}%` : '0%'}
          </p>
        </div>

        {/* Attendance Rate */}
        <div className="glass-panel p-6 rounded-2xl stats-gradient group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-tertiary/10 rounded-xl text-tertiary border border-tertiary/20">
              <span className="material-symbols-outlined select-none">auto_graph</span>
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Stable</span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">Attendance Rate</p>
          <p className="text-4xl font-headline font-black mt-1 text-on-surface">
            {stats?.overallAttendanceRate !== undefined ? `${stats.overallAttendanceRate}%` : '100%'}
          </p>
        </div>

        {/* At Risk Students */}
        <div className="glass-panel p-6 rounded-2xl stats-gradient group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-error/10 rounded-xl text-error border border-error/20">
              <span className="material-symbols-outlined select-none">warning</span>
            </div>
            <span className="text-[10px] font-bold text-error uppercase tracking-widest">Needs Action</span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">At-Risk Students</p>
          <p className="text-4xl font-headline font-black mt-1 text-error">{stats?.highRiskCount || 0}</p>
        </div>
      </div>

      {/* Main Interactive Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mark Attendance Section */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-bold text-xl text-on-surface">Mark Attendance</h3>
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-surface-container-high border-none text-xs rounded-lg text-primary font-bold focus:ring-1 focus:ring-primary py-1.5 px-2.5 text-right outline-none cursor-pointer"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[440px] sidebar-scrollbar">
              {attendanceLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-xs">Loading cohort...</p>
                </div>
              ) : attendanceRecords.length === 0 ? (
                <div className="text-center py-20 text-on-surface-variant text-xs">
                  No students assigned for today.
                </div>
              ) : (
                attendanceRecords.map((record) => {
                  const isPresent = record.status === 'PRESENT' || record.status === 'NOT_MARKED';
                  return (
                    <div 
                      key={record.id}
                      onClick={() => handleToggleStatus(record.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isPresent 
                          ? 'bg-surface-container-low/40 border-white/5 hover:border-primary/30' 
                          : 'bg-error-container/5 border-error/10 opacity-70 hover:opacity-100 hover:border-error/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                          isPresent 
                            ? 'bg-surface-container-highest text-primary border-primary/20' 
                            : 'bg-error/10 text-error border-error/20'
                        }`}>
                          {getInitials(record.name)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface leading-tight">{record.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                            {record.rollNumber} • {record.batch}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isPresent 
                          ? 'bg-primary border-primary text-on-primary' 
                          : 'bg-transparent border-outline'
                      }`}>
                        {isPresent && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button 
              onClick={handleSaveAttendance}
              disabled={savingAttendance || attendanceLoading || attendanceRecords.length === 0}
              className="w-full mt-6 py-3.5 bg-primary text-on-primary font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:bg-primary-fixed shadow-lg shadow-primary/20"
            >
              {savingAttendance ? 'Submitting...' : 'Submit Attendance'}
            </button>
          </div>
        </div>

        {/* Student Academic Risk Analysis Table */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-2xl h-full flex flex-col overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/40">
              <div>
                <h3 className="font-headline font-bold text-xl text-on-surface">Student Academic Risk Analysis</h3>
                <p className="text-xs text-on-surface-variant mt-1">Real-time attendance & engagement tracking</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={fetchStudentRisks} 
                  className="p-2 bg-surface-container hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${risksLoading ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={() => toast('Exporting report...', 'info')}
                  className="p-2 bg-surface-container hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-on-surface-variant bg-surface-container-highest/20 border-b border-outline-variant">
                    <th className="px-6 py-4 font-bold">Student Name</th>
                    <th className="px-6 py-4 font-bold">Attendance %</th>
                    <th className="px-6 py-4 font-bold text-center">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {risksLoading && studentRisks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                        Loading risk profiles...
                      </td>
                    </tr>
                  ) : studentRisks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRisks.map((risk) => {
                      const rate = risk.attendancePercentage;
                      const progressColor = rate < 75 ? 'bg-error' : rate < 85 ? 'bg-tertiary' : 'bg-secondary';
                      const badgeColor = risk.riskLevel === 'Red' 
                        ? 'bg-error/10 text-error border-error/20' 
                        : risk.riskLevel === 'Yellow' 
                          ? 'bg-tertiary/10 text-tertiary border-tertiary/20'
                          : 'bg-secondary/10 text-secondary border-secondary/20';

                      return (
                        <tr key={risk.id} className="hover:bg-primary/5 transition-colors group">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-on-surface text-sm leading-tight">{risk.name}</p>
                              <p className="text-xs text-on-surface-variant mt-0.5">{risk.rollNumber} • {risk.batch}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${rate}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-on-surface">{rate}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${badgeColor}`}>
                              {risk.riskLevel} Risk
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="relative inline-block text-left">
                              <button 
                                onClick={() => handleActionClick('Advising Email', risk.name)}
                                className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant group-hover:text-primary active:scale-95"
                                title="Send Alert Email"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-low/20">
                <p className="text-xs text-on-surface-variant">
                  Showing {Math.min(studentRisks.length, (riskPage - 1) * itemsPerPage + 1)} - {Math.min(studentRisks.length, riskPage * itemsPerPage)} of {studentRisks.length} students
                </p>
                <div className="flex gap-2">
                  <button 
                    disabled={riskPage === 1}
                    onClick={() => setRiskPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-40 disabled:hover:text-on-surface-variant transition-colors"
                  >
                    Prev
                  </button>
                  <button 
                    disabled={riskPage === totalPages}
                    onClick={() => setRiskPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-on-primary hover:bg-primary-fixed transition-colors disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extra AI Context Section */}
      <div className="glass-panel rounded-2xl p-8 relative overflow-hidden border border-primary/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h4 className="text-primary font-headline font-bold text-xs tracking-widest uppercase mb-2">Next Smart Task</h4>
            <h3 className="text-2xl font-headline font-black text-on-surface mb-3">Review Grade Discrepancies</h3>
            <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
              UniSmart AI has detected that 5 students in Section B have attendance rates below 75% which is highly correlated with academic dropouts. We recommend scheduling an advising session.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => toast('Advising session scheduled. Calendar invites sent.', 'success')}
                className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl active:scale-95 hover:bg-primary-fixed transition-all shadow-md shadow-primary/20"
              >
                Schedule Session
              </button>
              <button 
                onClick={() => toast('Alert dismissed', 'info')}
                className="px-5 py-2.5 border border-outline text-on-surface font-bold text-xs rounded-xl active:scale-95 hover:bg-surface-container transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className="hidden md:block relative h-40">
            <div className="relative w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[100px] text-primary/25 select-none animate-pulse">analytics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
