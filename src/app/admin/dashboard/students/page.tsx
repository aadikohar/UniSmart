'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/toast';
import { 
  BookOpen, Search, Edit2, Trash2, X, Loader2, ChevronLeft, ChevronRight, 
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, Filter, Download, Info
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  batch: string;
  faculty: { id: string; name: string; department: string } | null;
  attendancePercentage: number;
  risk: { riskLevel: string; riskScore: number } | null;
}

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
}

export default function StudentDirectoryPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [batches, setBatches] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', rollNumber: '', batch: '', facultyId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [faculties, setFaculties] = useState<Faculty[]>([]);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFacultyId, setUploadFacultyId] = useState('');
  const [uploadPreview, setUploadPreview] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/students?search=${search}&batch=${batchFilter}&page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setBatches(data.batches || []);
        setTotalPages(data.pagination.totalPages);
      }
    } catch { toast('Failed to load students.', 'error'); }
    finally { setLoading(false); }
  };

  const fetchFaculties = async () => {
    try {
      const res = await fetch('/api/faculty?limit=100');
      if (res.ok) {
        const data = await res.json();
        setFaculties(data.faculty);
      }
    } catch {}
  };

  useEffect(() => { fetchStudents(); }, [page, search, batchFilter]);
  useEffect(() => { fetchFaculties(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student? This will also remove their attendance records.')) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) { toast('Student deleted', 'success'); fetchStudents(); }
      else { toast('Failed to delete', 'error'); }
    } catch { toast('Network error', 'error'); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (res.ok) {
        toast('Student updated', 'success');
        setShowEdit(false);
        fetchStudents();
      } else { toast(data.error || 'Update failed', 'error'); }
    } catch { toast('Network error', 'error'); }
    finally { setSubmitting(false); }
  };

  const handlePreviewUpload = async () => {
    if (!uploadFile || !uploadFacultyId) { toast('Select a file and faculty advisor', 'warning'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('facultyId', uploadFacultyId);
      fd.append('preview', 'true');
      const res = await fetch('/api/students/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) { setUploadPreview(data); }
      else { toast(data.error || 'Preview failed', 'error'); }
    } catch { toast('Network error', 'error'); }
    finally { setUploading(false); }
  };

  const handleConfirmUpload = async () => {
    if (!uploadFile || !uploadFacultyId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('facultyId', uploadFacultyId);
      const res = await fetch('/api/students/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        toast(data.message || 'Upload successful', 'success');
        setShowUpload(false);
        setUploadFile(null);
        setUploadPreview(null);
        fetchStudents();
      } else { toast(data.error || 'Upload failed', 'error'); }
    } catch { toast('Network error', 'error'); }
    finally { setUploading(false); }
  };

  const riskBadge = (level: string) => {
    if (level === 'Red') return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error-container/20 text-error border border-error/20">High</span>;
    if (level === 'Yellow') return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tertiary-container/10 text-tertiary border border-tertiary/20">Medium</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-container/20 text-secondary border border-secondary/20">Low</span>;
  };

  const progressColor = (pct: number) => {
    if (pct < 75) return 'bg-error';
    if (pct < 85) return 'bg-tertiary';
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
            <span className="text-primary-fixed-dim">Student Management</span>
          </nav>
          <h2 className="text-2xl font-headline font-bold text-on-surface tracking-tight">Student Management</h2>
          <p className="text-xs text-on-surface-variant mt-1">Manage enrolled student profiles, track risk statistics, and upload rosters in bulk.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => { setShowUpload(true); setUploadPreview(null); setUploadFile(null); }} 
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
          >
            <Upload className="w-4 h-4 text-primary-fixed-dim" /> Bulk Upload Excel
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-grow min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
            placeholder="Search roll number or student name..." 
            className="w-full bg-surface-container/60 border border-outline-variant/40 rounded-xl pl-10 pr-4 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary-fixed focus:border-primary-fixed focus:outline-none transition-colors duration-200" 
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <select 
            value={batchFilter} 
            onChange={(e) => { setBatchFilter(e.target.value); setPage(1); }} 
            className="bg-surface-container/60 border border-outline-variant/40 rounded-xl py-2.5 pl-10 pr-8 text-xs text-on-surface-variant focus:ring-1 focus:ring-primary-fixed focus:border-primary-fixed focus:outline-none transition-colors duration-200 cursor-pointer appearance-none"
          >
            <option value="">All Batches</option>
            {batches.map(b => <option key={b} value={b}>Batch {b}</option>)}
          </select>
        </div>
      </div>

      {/* Student Data Table */}
      <div className="glass-panel rounded-2xl border border-outline-variant/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface-container/70 text-on-surface-variant text-xs uppercase tracking-wider font-bold border-b border-outline-variant/30">
                <th className="px-6 py-4">Roll Number</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Batch</th>
                <th className="px-6 py-4">Faculty Advisor</th>
                <th className="px-6 py-4">Attendance %</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/10">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-surface-container-highest/60 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-on-surface-variant">
                    <BookOpen className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
                    <p className="text-sm font-medium">No students found matching current filters</p>
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-variant/50 transition-colors duration-150">
                    <td className="px-6 py-4 font-mono text-xs text-primary-fixed font-bold">{s.rollNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-bold text-xs uppercase">
                          {s.name[0] + (s.name.split(' ')[1]?.[0] || '')}
                        </div>
                        <div>
                          <div className="font-semibold text-on-surface">{s.name}</div>
                          <div className="text-xs text-on-surface-variant font-body">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs font-semibold">{s.batch}</td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs">{s.faculty?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4 whitespace-nowrap min-w-[150px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div className={`h-full ${progressColor(s.attendancePercentage)}`} style={{ width: `${s.attendancePercentage}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-on-surface font-mono">{s.attendancePercentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {s.risk ? riskBadge(s.risk.riskLevel) : riskBadge('Green')}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => { 
                            setEditingStudent(s); 
                            setEditFormData({ 
                              name: s.name, 
                              email: s.email, 
                              rollNumber: s.rollNumber, 
                              batch: s.batch, 
                              facultyId: s.faculty?.id || '' 
                            }); 
                            setShowEdit(true); 
                          }} 
                          className="p-1.5 rounded-lg hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(s.id)} 
                          className="p-1.5 rounded-lg hover:bg-error-container/20 text-on-surface-variant hover:text-error transition-colors"
                        >
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

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/30 bg-surface-container-lowest/30">
            <span className="text-xs text-on-surface-variant font-medium">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1} 
                className="p-1.5 border border-outline-variant/40 rounded-lg bg-surface-container/30 hover:bg-surface-variant/50 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages} 
                className="p-1.5 border border-outline-variant/40 rounded-lg bg-surface-container/30 hover:bg-surface-variant/50 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
          <div className="glass-panel border border-outline-variant/50 rounded-[1.5rem] p-6 w-full max-w-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-6">
              <h3 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary-fixed-dim" /> Bulk Student Upload
              </h3>
              <button onClick={() => setShowUpload(false)} className="text-on-surface-variant hover:text-on-surface"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs text-on-surface-variant font-semibold block mb-2">Assign Faculty Advisor</label>
                <select 
                  value={uploadFacultyId} 
                  onChange={(e) => setUploadFacultyId(e.target.value)} 
                  className="w-full bg-surface-container border border-outline-variant/40 rounded-xl py-3 px-4 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors cursor-pointer"
                >
                  <option value="">Select advisor...</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.name} ({f.department})</option>)}
                </select>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="border-2 border-dashed border-outline-variant/50 rounded-2xl p-8 text-center cursor-pointer hover:border-primary-fixed-dim/40 bg-surface-container-low/40 hover:bg-surface-container-low transition-all duration-200 group"
              >
                <Upload className="w-8 h-8 text-on-surface-variant/50 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
                <p className="text-sm font-semibold text-on-surface">{uploadFile ? uploadFile.name : 'Drag and drop your roster file'}</p>
                <p className="text-[10px] text-on-surface-variant mt-1.5">Supports .xlsx or .csv (Max 10MB)</p>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { setUploadFile(e.target.files?.[0] || null); setUploadPreview(null); }} />
              </div>

              {/* Requirements box */}
              <div className="p-4 bg-surface-container-low/40 border border-outline-variant/20 rounded-xl flex items-start gap-3">
                <Info className="w-4 h-4 text-tertiary-dim shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-on-surface mb-1">Roster Format Requirements</p>
                  <ul className="text-[10px] text-on-surface-variant list-disc pl-4 space-y-1">
                    <li>Roster file must include columns: Roll Number, Name, Email, Batch.</li>
                    <li>Roll numbers and emails must be unique in the system.</li>
                  </ul>
                </div>
              </div>

              {uploadFile && !uploadPreview && (
                <button 
                  onClick={handlePreviewUpload} 
                  disabled={uploading || !uploadFacultyId} 
                  className="w-full flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold py-3.5 rounded-xl border border-outline-variant/40 transition-colors disabled:opacity-40"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Validate Roster Data
                </button>
              )}

              {uploadPreview && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 p-3 rounded-xl bg-secondary/5 border border-secondary/20 text-center">
                      <CheckCircle className="w-4 h-4 text-secondary mx-auto mb-1" />
                      <p className="text-lg font-bold text-secondary font-mono">{uploadPreview.validCount}</p>
                      <p className="text-[9px] text-on-surface-variant font-medium">Valid Records</p>
                    </div>
                    <div className="flex-1 p-3 rounded-xl bg-error/5 border border-error/20 text-center">
                      <AlertCircle className="w-4 h-4 text-error mx-auto mb-1" />
                      <p className="text-lg font-bold text-error font-mono">{uploadPreview.invalidCount}</p>
                      <p className="text-[9px] text-on-surface-variant font-medium">Errors Found</p>
                    </div>
                  </div>

                  {uploadPreview.errors.length > 0 && (
                    <div className="bg-error-container/5 border border-error-container/10 rounded-xl p-3 max-h-36 overflow-y-auto">
                      <p className="text-[11px] font-semibold text-error mb-2">Errors list:</p>
                      {uploadPreview.errors.map((err: any, i: number) => (
                        <p key={i} className="text-[10px] text-on-surface-variant mb-1 font-mono">Row {err.row}: {err.details}</p>
                      ))}
                    </div>
                  )}

                  {uploadPreview.validCount > 0 && uploadPreview.invalidCount === 0 && (
                    <button 
                      onClick={handleConfirmUpload} 
                      disabled={uploading} 
                      className="w-full flex items-center justify-center gap-2 bg-primary-fixed-dim hover:bg-primary-fixed text-on-primary-fixed font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-primary-fixed-dim/20 disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Import {uploadPreview.validCount} Students
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEdit && editingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEdit(false)}>
          <div className="glass-panel border border-outline-variant/50 rounded-[1.5rem] p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-6">
              <h3 className="text-lg font-headline font-bold text-on-surface">Modify Student Profile</h3>
              <button onClick={() => setShowEdit(false)} className="text-on-surface-variant hover:text-on-surface"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-on-surface-variant font-semibold block mb-1.5">Full Name</label>
                <input required value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="w-full bg-surface-container border border-outline-variant/40 rounded-xl py-3 px-4 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim" />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-semibold block mb-1.5">Roll Number</label>
                <input required value={editFormData.rollNumber} onChange={(e) => setEditFormData({...editFormData, rollNumber: e.target.value})} className="w-full bg-surface-container border border-outline-variant/40 rounded-xl py-3 px-4 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim" />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-semibold block mb-1.5">Institutional Email</label>
                <input required type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} className="w-full bg-surface-container border border-outline-variant/40 rounded-xl py-3 px-4 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim" />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-semibold block mb-1.5">Class Batch</label>
                <input required value={editFormData.batch} onChange={(e) => setEditFormData({...editFormData, batch: e.target.value})} className="w-full bg-surface-container border border-outline-variant/40 rounded-xl py-3 px-4 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim" />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-semibold block mb-1.5">Faculty Advisor</label>
                <select value={editFormData.facultyId} onChange={(e) => setEditFormData({...editFormData, facultyId: e.target.value})} className="w-full bg-surface-container border border-outline-variant/40 rounded-xl py-3 px-4 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim cursor-pointer">
                  <option value="">Unassigned</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 bg-primary-fixed-dim hover:bg-primary-fixed text-on-primary-fixed font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-primary-fixed-dim/20 disabled:opacity-50 mt-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Update Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

