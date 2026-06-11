'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import { Search, Filter, RefreshCw, AlertTriangle, Users } from 'lucide-react';

export default function AssignedStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/students?page=${page}&limit=10&search=${search}&batch=${batchFilter}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setBatches(data.batches);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast('Failed to load students', 'error');
      }
    } catch {
      toast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, batchFilter, toast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Assigned Students</h2>
          <p className="text-sm text-on-surface-variant mt-1">View and monitor your assigned students.</p>
        </div>
        <button onClick={fetchStudents} className="p-2.5 rounded-xl border border-outline-variant bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
          <select
            value={batchFilter}
            onChange={(e) => { setBatchFilter(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-on-surface appearance-none focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Batches</option>
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-surface-container/50 border border-outline-variant rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container/80">
                <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase">Roll Number</th>
                <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase">Name</th>
                <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase">Email</th>
                <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase">Batch</th>
                <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase">Attendance</th>
                <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && students.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-zinc-700">Loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-zinc-700"><Users className="w-8 h-8 mx-auto mb-3 opacity-20" /> No students found.</td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="border-b border-outline-variant/50 hover:bg-surface-container-high/20 transition-colors">
                    <td className="p-4 text-sm font-mono text-on-surface-variant">{s.rollNumber}</td>
                    <td className="p-4 text-sm font-medium text-on-surface">{s.name}</td>
                    <td className="p-4 text-sm text-on-surface-variant">{s.email}</td>
                    <td className="p-4 text-sm text-on-surface-variant"><span className="px-2 py-1 rounded bg-surface-container-high text-xs">{s.batch}</span></td>
                    <td className="p-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <span className={s.attendancePercentage < 75 ? 'text-red-400' : 'text-teal-400'}>{s.attendancePercentage}%</span>
                        {s.attendancePercentage < 75 && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                    </td>
                    <td className="p-4">
                      {s.risk?.riskLevel === 'Red' ? (
                        <span className="px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">High Risk</span>
                      ) : s.risk?.riskLevel === 'Yellow' ? (
                         <span className="px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold">Medium Risk</span>
                      ) : (
                         <span className="px-2 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold">Low Risk</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container/50">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface-variant disabled:opacity-50 text-sm font-medium"
            >
              Previous
            </button>
            <span className="text-sm text-on-surface-variant">Page {page} of {totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface-variant disabled:opacity-50 text-sm font-medium"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
