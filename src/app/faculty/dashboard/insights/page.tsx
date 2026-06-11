'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { BrainCircuit, AlertOctagon, TrendingDown, CheckCircle2, ShieldAlert, Mail, Calendar as CalendarIcon, UserCheck } from 'lucide-react';

export default function SmartAttendanceInsights() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const { toast } = useToast();

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const url = new URL(window.location.origin + '/api/ai/student-risk');
      if (filter) url.searchParams.set('riskLevel', filter);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setInsights(data.studentRisks || []);
      } else {
        toast('Failed to load AI insights', 'error');
      }
    } catch {
      toast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [filter]);

  const handleAction = (action: string, studentName: string) => {
    toast(`${action} initiated for ${studentName}`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-500" />
            Smart Attendance Insights (SAI)
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">AI-powered predictive analytics for student attendance.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-on-surface-variant">Filter Risk:</span>
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="px-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-on-surface text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Risk Levels</option>
            <option value="Red">High Risk (Red)</option>
            <option value="Yellow">Medium Risk (Yellow)</option>
            <option value="Green">Low Risk (Green)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-surface-container/50 rounded-2xl border border-outline-variant" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="p-12 border border-outline-variant rounded-2xl bg-surface-container/50 flex flex-col items-center justify-center text-center">
          <ShieldAlert className="w-12 h-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-bold text-on-surface mb-2">No active insights</h3>
          <p className="text-on-surface-variant">There are no students matching your risk filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {insights.map((risk) => (
            <div key={risk.id} className="relative rounded-2xl border border-outline-variant bg-surface-container/50 overflow-hidden flex flex-col group hover:border-outline transition-colors">
              {/* Top Banner indicating Risk Level */}
              <div className={`h-2 w-full ${
                risk.riskLevel === 'Red' ? 'bg-red-500' : 
                risk.riskLevel === 'Yellow' ? 'bg-yellow-500' : 'bg-teal-500'
              }`} />
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">{risk.name}</h3>
                    <p className="text-xs text-zinc-700 font-mono mt-1">{risk.rollNumber} • {risk.batch}</p>
                  </div>
                  <div className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    risk.riskLevel === 'Red' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                    risk.riskLevel === 'Yellow' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                    'bg-teal-500/10 text-teal-400 border-teal-500/20'
                  }`}>
                    {risk.riskLevel === 'Red' ? 'High Risk' : risk.riskLevel === 'Yellow' ? 'Med Risk' : 'Low Risk'}
                  </div>
                </div>

                {/* Score & Rate */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-surface-container border border-outline-variant">
                    <p className="text-[10px] text-zinc-700 uppercase font-semibold mb-1">Attendance</p>
                    <p className={`text-xl font-bold ${risk.attendancePercentage < 75 ? 'text-red-400' : 'text-on-surface'}`}>
                      {risk.attendancePercentage}%
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container border border-outline-variant">
                    <p className="text-[10px] text-zinc-700 uppercase font-semibold mb-1">Risk Score</p>
                    <p className="text-xl font-bold text-on-surface">{(risk.riskScore * 100).toFixed(0)}</p>
                  </div>
                </div>

                {/* Prediction */}
                <div className="mb-4 flex-1">
                  <div className="flex items-start gap-2">
                    {risk.riskLevel === 'Red' ? <AlertOctagon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> : 
                     risk.riskLevel === 'Yellow' ? <TrendingDown className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" /> : 
                     <CheckCircle2 className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />}
                    <p className="text-sm text-on-surface-variant leading-relaxed">{risk.prediction}</p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="mt-auto pt-4 border-t border-outline-variant/50">
                  <p className="text-xs text-zinc-700 uppercase font-semibold mb-3">AI Recommendation</p>
                  <p className="text-sm text-indigo-300 font-medium mb-4">{risk.recommendation}</p>
                  
                  {/* Action Buttons based on risk level */}
                  <div className="grid grid-cols-2 gap-2">
                    {risk.riskLevel === 'Red' ? (
                      <>
                        <button onClick={() => handleAction('Parent Notification', risk.name)} className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Notify Parent</button>
                        <button onClick={() => handleAction('Academic Intervention', risk.name)} className="px-3 py-2 bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> Intervention</button>
                      </>
                    ) : risk.riskLevel === 'Yellow' ? (
                      <>
                        <button onClick={() => handleAction('Send Reminder', risk.name)} className="px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Reminder</button>
                        <button onClick={() => handleAction('Schedule Follow-up', risk.name)} className="px-3 py-2 bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> Follow-up</button>
                      </>
                    ) : (
                      <div className="col-span-2 px-3 py-2 bg-teal-500/5 text-teal-500 text-xs font-medium rounded-lg text-center">
                        No immediate action required
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
