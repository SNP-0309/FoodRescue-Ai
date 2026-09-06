'use client';

import { useApp } from '@/lib/store';
import { useState, useMemo } from 'react';
import { Zap, Plus, Target, Users, Package, CheckCircle, X, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { FoodCategory, UrgencyLevel, MatchResult } from '@/types';
import { rankNGOs, getScoreColor, getScoreLabel } from '@/lib/ai/matchingEngine';
import { DEMO_NGO_PROFILES } from '@/lib/mockData';
import { getCategoryLabel } from '@/lib/ai/foodAnalysis';

const CATEGORIES: { value: FoodCategory; label: string }[] = [
  { value: 'cooked_meals', label: '🍽️ Cooked Meals' },
  { value: 'bakery', label: '🥖 Bakery' },
  { value: 'fresh_produce', label: '🥦 Fresh Produce' },
  { value: 'dairy', label: '🥛 Dairy' },
  { value: 'packaged_goods', label: '📦 Packaged' },
  { value: 'beverages', label: '🥤 Beverages' },
  { value: 'snacks', label: '🍿 Snacks' },
];

const URGENCIES: { value: UrgencyLevel; label: string }[] = [
  { value: 'critical', label: '🔴 Critical' },
  { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
];

export default function NgoDashboard() {
  const { donations, requirements, deliveries, ngoProfiles, currentUser, addRequirement, updateDonation, addNotification } = useApp();
  const [showReqForm, setShowReqForm] = useState(false);
  const [showMatches, setShowMatches] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [runningMatch, setRunningMatch] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(null);

  const myNgo = DEMO_NGO_PROFILES[0];

  const [reqForm, setReqForm] = useState({
    category: 'cooked_meals' as FoodCategory,
    quantityNeeded: '',
    urgency: 'medium' as UrgencyLevel,
    beneficiariesCount: '',
    notes: '',
  });

  const pendingDonations = donations.filter(d => d.status === 'pending');
  const myAccepted = deliveries.filter(d => d.ngoName === myNgo.organizationName && d.status === 'delivered');
  const myRequirements = requirements.filter(r => r.ngoId === 'ngo-1' || r.ngoId === myNgo.userId);
  const available = myNgo.capacity - myNgo.currentLoad;

  const handleRunMatching = async (donationId: string) => {
    setRunningMatch(donationId);
    const donation = donations.find(d => d.id === donationId);
    if (!donation) { setRunningMatch(null); return; }

    await new Promise(r => setTimeout(r, 1200));
    const results = rankNGOs(donation, DEMO_NGO_PROFILES, requirements);
    setMatches(results);
    setShowMatches(donationId);
    setRunningMatch(null);
  };

  const handleAccept = (donationId: string) => {
    updateDonation(donationId, { status: 'matched' });
    addNotification({
      userId: currentUser?.id || 'user-ngo-1',
      title: '✅ Donation Accepted',
      message: 'A donation has been accepted and is awaiting volunteer pickup.',
      type: 'accepted',
      isRead: false,
    });
    setShowMatches(null);
  };

  const handleSubmitReq = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    addRequirement({
      ngoId: myNgo.userId,
      ngoName: myNgo.organizationName,
      location: myNgo.location,
      category: reqForm.category,
      quantityNeeded: parseInt(reqForm.quantityNeeded) || 100,
      urgency: reqForm.urgency,
      beneficiariesCount: parseInt(reqForm.beneficiariesCount) || 50,
      notes: reqForm.notes,
      isActive: true,
    });
    await new Promise(r => setTimeout(r, 600));
    setSubmitting(false);
    setShowReqForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">NGO Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">{myNgo.organizationName}</p>
        </div>
        <button onClick={() => setShowReqForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Create Requirement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Available Capacity', value: `${available}/${myNgo.capacity}`, icon: Target, color: 'text-blue-600 bg-blue-50' },
          { label: 'Beneficiaries Served', value: myNgo.beneficiariesServed.toLocaleString(), icon: Users, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Active Requirements', value: myRequirements.filter(r => r.isActive).length, icon: Package, color: 'text-orange-600 bg-orange-50' },
          { label: 'Donations Received', value: myAccepted.length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className="text-2xl font-extrabold text-gray-800 mt-0.5">{s.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Capacity Bar */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Current Capacity Utilization</span>
          <span className="text-sm font-bold text-blue-600">{Math.round((myNgo.currentLoad / myNgo.capacity) * 100)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(myNgo.currentLoad / myNgo.capacity) * 100}%`, background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)' }} />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>{myNgo.currentLoad} meals/day current load</span>
          <span>{available} remaining capacity</span>
        </div>
      </div>

      {/* Available Donations */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Available Donations Near You</h3>
          <span className="badge badge-available text-xs">{pendingDonations.length} available</span>
        </div>
        <div className="divide-y divide-gray-50">
          {pendingDonations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No pending donations available</p>
            </div>
          ) : (
            pendingDonations.slice(0, 6).map(d => (
              <div key={d.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-800 text-sm">{d.foodName}</h4>
                      <span className={`badge text-[10px] ${d.urgencyLevel === 'critical' ? 'badge-critical' : d.urgencyLevel === 'high' ? 'badge-high' : d.urgencyLevel === 'medium' ? 'badge-medium' : 'badge-low'}`}>
                        {d.urgencyLevel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {d.quantity} meals · {d.quantityKg} kg · {getCategoryLabel(d.category)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{d.donorOrgName} · {d.pickupAddress.split(',')[0]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunMatching(d.id)}
                      disabled={runningMatch === d.id}
                      className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                    >
                      {runningMatch === d.id ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Matching...</>
                      ) : (
                        <><Zap className="w-3 h-3" /> AI Match</>
                      )}
                    </button>
                    <button
                      onClick={() => handleAccept(d.id)}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      Accept
                    </button>
                  </div>
                </div>

                {/* Match Results */}
                {showMatches === d.id && matches.length > 0 && (
                  <div className="mt-3 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                      <Zap className="w-3 h-3" />
                      AI Match Rankings (Urgency 30% · Distance 25% · Demand 25% · Compatibility 10% · Capacity 10%)
                    </div>
                    {matches.slice(0, 3).map((m, i) => (
                      <div
                        key={m.ngoId}
                        className={`rounded-xl border p-3 ${i === 0 ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`score-ring text-sm ${i === 0 ? 'border-emerald-500 text-emerald-700' : 'border-gray-300 text-gray-600'}`}>
                              {m.score.total}
                            </span>
                            <div>
                              <p className="font-semibold text-sm text-gray-800">
                                {i === 0 ? '🏆 ' : `#${m.rank} `}{m.ngoName}
                              </p>
                              <p className="text-xs text-gray-500">{m.score.distanceKm} km away · {getScoreLabel(m.score.total)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setExpandedExplanation(expandedExplanation === m.ngoId ? null : m.ngoId)}
                              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <Info className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                          </div>
                        </div>
                        {/* Score Breakdown */}
                        <div className="mt-2 grid grid-cols-5 gap-1 text-center">
                          {[
                            { label: 'Urgency', val: m.score.urgencyScore, weight: '30%' },
                            { label: 'Distance', val: m.score.distanceScore, weight: '25%' },
                            { label: 'Demand', val: m.score.demandScore, weight: '25%' },
                            { label: 'Compat.', val: m.score.compatibilityScore, weight: '10%' },
                            { label: 'Capacity', val: m.score.capacityScore, weight: '10%' },
                          ].map(s => (
                            <div key={s.label} className="bg-white rounded-lg p-1">
                              <p className="text-[9px] text-gray-400 leading-none">{s.label}</p>
                              <p className="text-xs font-bold text-gray-700 mt-0.5">{s.val}</p>
                              <p className="text-[9px] text-gray-400">{s.weight}</p>
                            </div>
                          ))}
                        </div>
                        {expandedExplanation === m.ngoId && (
                          <p className="text-xs text-gray-600 mt-2 p-2 bg-white rounded-lg border border-gray-100">
                            {m.score.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setShowMatches(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Close results
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Requirements */}
      {myRequirements.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Active Food Requirements</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {myRequirements.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm text-gray-800">{getCategoryLabel(r.category)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.quantityNeeded} meals needed · {r.beneficiariesCount} beneficiaries</p>
                </div>
                <span className={`badge text-[10px] ${r.urgency === 'critical' ? 'badge-critical' : r.urgency === 'high' ? 'badge-high' : 'badge-medium'}`}>
                  {r.urgency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Requirement Modal */}
      {showReqForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md glass-card rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Create Food Requirement</h3>
              <button onClick={() => setShowReqForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmitReq} className="p-5 space-y-4">
              <div>
                <label className="form-label">Food Category Needed</label>
                <select className="form-input" value={reqForm.category} onChange={e => setReqForm(p => ({ ...p, category: e.target.value as FoodCategory }))}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Quantity Needed (meals)</label>
                  <input type="number" className="form-input" placeholder="e.g. 200" value={reqForm.quantityNeeded} onChange={e => setReqForm(p => ({ ...p, quantityNeeded: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Beneficiaries</label>
                  <input type="number" className="form-input" placeholder="e.g. 100" value={reqForm.beneficiariesCount} onChange={e => setReqForm(p => ({ ...p, beneficiariesCount: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="form-label">Urgency Level</label>
                <select className="form-input" value={reqForm.urgency} onChange={e => setReqForm(p => ({ ...p, urgency: e.target.value as UrgencyLevel }))}>
                  {URGENCIES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea className="form-input resize-none" rows={2} placeholder="Dietary restrictions, preferences..." value={reqForm.notes} onChange={e => setReqForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowReqForm(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
