'use client';

import { useApp } from '@/lib/store';
import { useState } from 'react';
import { Plus, Package, TrendingUp, Clock, CheckCircle, Loader2, X, AlertTriangle, Leaf, Upload, Sparkles } from 'lucide-react';
import { FoodDonation, FoodCategory, StorageCondition, AIAnalysisResult } from '@/types';
import { analyzeFoodItem, getCategoryLabel, getUrgencyColor } from '@/lib/ai/foodAnalysis';
import { DEMO_DONOR_PROFILES } from '@/lib/mockData';

const CATEGORIES: { value: FoodCategory; label: string }[] = [
  { value: 'cooked_meals', label: '🍽️ Cooked Meals' },
  { value: 'bakery', label: '🥖 Bakery & Bread' },
  { value: 'fresh_produce', label: '🥦 Fresh Produce' },
  { value: 'dairy', label: '🥛 Dairy Products' },
  { value: 'packaged_goods', label: '📦 Packaged Goods' },
  { value: 'beverages', label: '🥤 Beverages' },
  { value: 'snacks', label: '🍿 Snacks' },
  { value: 'other', label: '🍱 Other' },
];

const STORAGE: { value: StorageCondition; label: string }[] = [
  { value: 'heated', label: '🔥 Heated (60°C+)' },
  { value: 'refrigerated', label: '❄️ Refrigerated (4°C)' },
  { value: 'frozen', label: '🧊 Frozen (-18°C)' },
  { value: 'ambient', label: '🌡️ Ambient (Room Temp)' },
];

const STATUS_COLORS: Record<FoodDonation['status'], string> = {
  pending: 'badge-pending',
  matched: 'badge-matched',
  picked_up: 'badge-picked_up',
  delivered: 'badge-delivered',
  expired: 'badge-expired',
};

const STATUS_LABELS: Record<FoodDonation['status'], string> = {
  pending: '⏳ Pending',
  matched: '🎯 Matched',
  picked_up: '📦 Picked Up',
  delivered: '✅ Delivered',
  expired: '❌ Expired',
};

export default function DonorDashboard() {
  const { donations, impact, currentUser, addDonation, addNotification } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const myDonorProfile = DEMO_DONOR_PROFILES[0];

  const [form, setForm] = useState({
    foodName: '',
    category: 'cooked_meals' as FoodCategory,
    quantity: '',
    preparationTime: new Date(Date.now() - 3600000).toISOString().slice(0, 16),
    expiryTime: new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 16),
    storageCondition: 'heated' as StorageCondition,
    pickupAddress: myDonorProfile.location.address,
    notes: '',
  });

  const myDonations = donations.filter(d => d.donorId === currentUser?.id || d.donorId === 'user-donor-1').slice(0, 8);

  const stats = {
    total: myDonations.length,
    delivered: myDonations.filter(d => d.status === 'delivered').length,
    pending: myDonations.filter(d => d.status === 'pending').length,
    meals: myDonations.reduce((s, d) => s + d.quantity, 0),
  };

  const handleAnalyze = async () => {
    if (!form.foodName) return;
    setAnalyzing(true);
    const result = await analyzeFoodItem(
      form.foodName,
      form.preparationTime,
      form.expiryTime,
      form.storageCondition,
      form.category,
    );
    setAiAnalysis(result);
    setAnalyzing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const qty = parseInt(form.quantity) || 10;
    const newDonation = addDonation({
      donorId: currentUser?.id || 'user-donor-1',
      donorName: currentUser?.name || 'Demo Donor',
      donorOrgName: myDonorProfile.organizationName,
      foodName: form.foodName,
      category: form.category,
      quantity: qty,
      quantityKg: qty * 0.5,
      preparationTime: new Date(form.preparationTime).toISOString(),
      expiryTime: new Date(form.expiryTime).toISOString(),
      storageCondition: form.storageCondition,
      pickupAddress: form.pickupAddress,
      location: myDonorProfile.location,
      notes: form.notes,
      status: 'pending',
      urgencyLevel: aiAnalysis?.urgencyLevel || 'medium',
      aiAnalysis: aiAnalysis || undefined,
    });

    addNotification({
      userId: currentUser?.id || 'user-donor-1',
      title: 'Donation Created! 🎉',
      message: `Your donation "${form.foodName}" has been listed and is awaiting matching.`,
      type: 'info',
      isRead: false,
    });

    setTimeout(() => {
      setSubmitting(false);
      setShowForm(false);
      setAiAnalysis(null);
      setForm(prev => ({ ...prev, foodName: '', quantity: '', notes: '' }));
    }, 800);
  };

  const formatTime = (iso: string) => {
    const diff = (new Date(iso).getTime() - Date.now()) / 3600000;
    if (diff < 0) return 'Expired';
    if (diff < 1) return `${Math.round(diff * 60)}m left`;
    return `${diff.toFixed(1)}h left`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Donor Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">{myDonorProfile.organizationName}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Donation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Donations', value: stats.total, icon: Package, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Meals Donated', value: stats.meals, icon: Leaf, color: 'text-blue-600 bg-blue-50' },
          { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-orange-600 bg-orange-50' },
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

      {/* Impact Card */}
      <div className="glass-card rounded-2xl p-5 gradient-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-gray-800">Your Impact</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Meals', value: `${myDonorProfile.totalMeals.toLocaleString()}+`, unit: 'meals rescued' },
            { label: 'Food Saved', value: `${myDonorProfile.totalKg} kg`, unit: 'from landfill' },
            { label: 'CO₂ Reduced', value: `${(myDonorProfile.totalKg * 2.5).toFixed(0)} kg`, unit: 'carbon offset' },
            { label: 'Total Donations', value: myDonorProfile.totalDonations, unit: 'completed' },
          ].map(i => (
            <div key={i.label} className="text-center">
              <p className="impact-number text-2xl">{i.value}</p>
              <p className="text-xs text-gray-500 mt-1">{i.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Donations List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">My Donations</h3>
        </div>
        {myDonations.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No donations yet</p>
            <p className="text-sm mt-1">Click "Add Donation" to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {myDonations.map(d => (
              <div key={d.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-800 text-sm">{d.foodName}</h4>
                      <span className={`badge ${STATUS_COLORS[d.status]} text-[10px]`}>{STATUS_LABELS[d.status]}</span>
                      <span className={`badge ${d.urgencyLevel === 'critical' ? 'badge-critical' : d.urgencyLevel === 'high' ? 'badge-high' : d.urgencyLevel === 'medium' ? 'badge-medium' : 'badge-low'} text-[10px]`}>
                        {d.urgencyLevel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {d.quantity} meals · {d.quantityKg} kg · {getCategoryLabel(d.category)}
                    </p>
                    {d.aiAnalysis && (
                      <div className="flex items-center gap-1 mt-1">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span className="text-[10px] text-purple-600 font-medium">AI: {d.aiAnalysis.confidenceScore}% confidence</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-orange-600">{formatTime(d.expiryTime)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{d.pickupAddress.split(',')[0]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Donation Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-24 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-2xl glass-card rounded-2xl shadow-2xl mb-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                Add Food Donation
              </h3>
              <button onClick={() => { setShowForm(false); setAiAnalysis(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="form-label">Food Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Dal Makhani & Rice (50 portions)"
                    value={form.foodName}
                    onChange={e => setForm(p => ({ ...p, foodName: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Food Category</label>
                  <select
                    className="form-input"
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value as FoodCategory }))}
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">Quantity (Meals / Servings)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 50"
                    value={form.quantity}
                    onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Preparation Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={form.preparationTime}
                    onChange={e => setForm(p => ({ ...p, preparationTime: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Expiry / Best Before Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={form.expiryTime}
                    onChange={e => setForm(p => ({ ...p, expiryTime: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Storage Condition</label>
                  <select
                    className="form-input"
                    value={form.storageCondition}
                    onChange={e => setForm(p => ({ ...p, storageCondition: e.target.value as StorageCondition }))}
                  >
                    {STORAGE.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">Pickup Address</label>
                  <input
                    className="form-input"
                    value={form.pickupAddress}
                    onChange={e => setForm(p => ({ ...p, pickupAddress: e.target.value }))}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-input resize-none"
                    rows={2}
                    placeholder="Any special handling instructions..."
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>

              {/* AI Analysis Button */}
              <div className="border border-dashed border-purple-200 rounded-xl p-4 bg-purple-50/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-sm text-purple-800">AI Food Analysis</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={analyzing || !form.foodName}
                    className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                  >
                    {analyzing ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</> : <><Sparkles className="w-3 h-3" /> Analyze Food</>}
                  </button>
                </div>

                {!aiAnalysis && !analyzing && (
                  <p className="text-xs text-purple-600">Click "Analyze Food" to get AI predictions for urgency, shelf life, and storage recommendations.</p>
                )}

                {analyzing && (
                  <div className="flex items-center gap-2 text-purple-600 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running AI analysis on food properties...
                  </div>
                )}

                {aiAnalysis && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-lg p-2 text-center border border-purple-100">
                        <p className="text-xs text-gray-500">Urgency</p>
                        <span className={`badge ${getUrgencyColor(aiAnalysis.urgencyLevel)} text-[10px] mt-1`}>{aiAnalysis.urgencyLevel}</span>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center border border-purple-100">
                        <p className="text-xs text-gray-500">Shelf Life</p>
                        <p className="text-sm font-bold text-gray-800">{aiAnalysis.estimatedShelfLifeHours}h</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center border border-purple-100">
                        <p className="text-xs text-gray-500">Confidence</p>
                        <p className="text-sm font-bold text-emerald-600">{aiAnalysis.confidenceScore}%</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 bg-white p-2 rounded-lg border border-purple-100">{aiAnalysis.explanation}</p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                      <p className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Food Safety Note
                      </p>
                      <p className="text-[10px] text-amber-600 mt-0.5">{aiAnalysis.storageRecommendation}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setAiAnalysis(null); }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Donation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
