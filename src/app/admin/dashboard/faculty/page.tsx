'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { Users, Plus, Search, Edit2, Trash2, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  academicYear: string;
  status: string;
  createdAt: string;
}

export default function FacultyManagementPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', department: '', academicYear: '2025-2026' });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/faculty?search=${search}&page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setFaculty(data.faculty);
        setTotalPages(data.pagination.totalPages);
      }
    } catch { toast('Failed to load faculty.', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFaculty(); }, [page, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingFaculty ? `/api/faculty/${editingFaculty.id}` : '/api/faculty';
      const method = editingFaculty ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast(editingFaculty ? 'Faculty updated successfully' : 'Faculty created successfully', 'success');
        setShowForm(false);
        setEditingFaculty(null);
        setFormData({ name: '', email: '', department: '', academicYear: '2025-2026' });
        fetchFaculty();
      } else {
        toast(data.error || 'Operation failed', 'error');
      }
    } catch { toast('Network error', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this faculty member?')) return;
    try {
      const res = await fetch(`/api/faculty/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Faculty deleted successfully', 'success');
        fetchFaculty();
      } else {
        const data = await res.json();
        toast(data.error || 'Failed to delete', 'error');
      }
    } catch { toast('Network error', 'error'); }
  };

  const handleToggleStatus = async (f: Faculty) => {
    try {
      const newStatus = f.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await fetch(`/api/faculty/${f.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast(`Faculty ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`, 'success');
        fetchFaculty();
      }
    } catch { toast('Failed to update status', 'error'); }
  };

  const openEdit = (f: Faculty) => {
    setEditingFaculty(f);
    setFormData({ name: f.name, email: f.email, department: f.department, academicYear: f.academicYear });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Faculty Management</h2>
          <p className="text-xs text-on-surface-variant mt-1">Create, edit, and manage faculty advisor accounts.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingFaculty(null); setFormData({ name: '', email: '', department: '', academicYear: '2025-2026' }); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Add Faculty
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, or department..."
          className="w-full bg-surface-container border border-outline-variant rounded-xl py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Faculty Table */}
      <div className="glass-panel rounded-2xl border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container/50">
                <th className="text-left py-3 px-4 text-xs text-on-surface-variant font-semibold uppercase tracking-wide">Name</th>
                <th className="text-left py-3 px-4 text-xs text-on-surface-variant font-semibold uppercase tracking-wide">Email</th>
                <th className="text-left py-3 px-4 text-xs text-on-surface-variant font-semibold uppercase tracking-wide hidden md:table-cell">Department</th>
                <th className="text-left py-3 px-4 text-xs text-on-surface-variant font-semibold uppercase tracking-wide hidden lg:table-cell">Year</th>
                <th className="text-center py-3 px-4 text-xs text-on-surface-variant font-semibold uppercase tracking-wide">Status</th>
                <th className="text-center py-3 px-4 text-xs text-on-surface-variant font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="py-4 px-4"><div className="h-4 bg-surface-container-high rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : faculty.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-on-surface-variant">No faculty members found</p>
                  </td>
                </tr>
              ) : (
                faculty.map((f) => (
                  <tr key={f.id} className="border-b border-outline-variant/50 hover:bg-surface-container/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-on-surface">{f.name}</td>
                    <td className="py-3.5 px-4 text-on-surface-variant">{f.email}</td>
                    <td className="py-3.5 px-4 text-on-surface-variant hidden md:table-cell">{f.department}</td>
                    <td className="py-3.5 px-4 text-on-surface-variant hidden lg:table-cell">{f.academicYear}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button onClick={() => handleToggleStatus(f)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${f.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' : 'text-on-surface-variant bg-surface-container-high border-outline hover:bg-surface-variant'}`}>
                        {f.status}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant">
            <span className="text-xs text-on-surface-variant">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-30 text-on-surface-variant transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-30 text-on-surface-variant transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass-panel border border-outline-variant rounded-2xl p-8 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface">{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</h3>
              <button onClick={() => setShowForm(false)} className="text-on-surface-variant hover:text-on-surface"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1.5">Full Name</label>
                <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-surface-container border border-outline-variant rounded-xl py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors" placeholder="Dr. John Smith" />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1.5">Email</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-surface-container border border-outline-variant rounded-xl py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors" placeholder="john.smith@unismart.edu" />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1.5">Department</label>
                <input required value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-surface-container border border-outline-variant rounded-xl py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors" placeholder="Computer Science & Engineering" />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-medium block mb-1.5">Academic Year</label>
                <input required value={formData.academicYear} onChange={(e) => setFormData({...formData, academicYear: e.target.value})} className="w-full bg-surface-container border border-outline-variant rounded-xl py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors" placeholder="2025-2026" />
              </div>
              <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-primary/20 mt-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingFaculty ? 'Update Faculty' : 'Create Faculty'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
