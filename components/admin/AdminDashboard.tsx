'use client';

import { useApp } from '@/lib/store';
import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { getCombinedChartData, getCategoryChartData } from '@/lib/ai/demandForecasting';
import {
  TrendingUp, Package, Users, Truck, Leaf, Zap,
  AlertTriangle, BarChart2, Globe
} from 'lucide-react';
import FoodRescueMap from '@/components/map/FoodRescueMap';

const PIE_COLORS = ['#10B981', '#3B82F6', '#F97316', '#8B5CF6', '#EC4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-xl p-3 text-xs shadow-lg border border-white/60">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { donations, deliveries, ngoProfiles, volunteerProfiles, impact, requirements } = useApp();

  const chartData = useMemo(() => getCombinedChartData(donations, requirements), [donations, requirements]);
  const categoryData = useMemo(() => getCategoryChartData(), []);

  const stats = {
    activeDonations: donations.filter(d => d.status === 'pending' || d.status === 'matched').length,
    expiredDonations: donations.filter(d => d.status === 'expired').length,
    activeDeliveries: deliveries.filter(d => d.status === 'accepted' || d.status === 'picked_up').length,
    totalNgos: ngoProfiles.length,
    totalVolunteers: volunteerProfiles.length,
    criticalDonations: donations.filter(d => d.urgencyLevel === 'critical' && d.status === 'pending').length,
  };

  // Category pie data
  const pieData = [
    { name: 'Cooked Meals', value: donations.filter(d => d.category === 'cooked_meals').length, color: '#10B981' },
    { name: 'Bakery', value: donations.filter(d => d.category === 'bakery').length, color: '#3B82F6' },
    { name: 'Produce', value: donations.filter(d => d.category === 'fresh_produce').length, color: '#F97316' },
    { name: 'Dairy', value: donations.filter(d => d.category === 'dairy').length, color: '#8B5CF6' },
    { name: 'Other', value: donations.filter(d => !['cooked_meals','bakery','fresh_produce','dairy'].includes(d.category)).length, color: '#EC4899' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform-wide overview & analytics</p>
      </div>

      {/* Critical alert */}
      {stats.criticalDonations > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 text-sm">
              {stats.criticalDonations} critical donation{stats.criticalDonations > 1 ? 's' : ''} need immediate attention!
            </p>
            <p className="text-red-500 text-xs mt-0.5">These will expire within 4 hours. Assign volunteers immediately.</p>
          </div>
        </div>
      )}

      {/* Impact KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Meals Rescued', value: impact.totalMeals.toLocaleString(), icon: Leaf, color: 'text-emerald-600 bg-emerald-50', sub: 'total' },
          { label: 'Food Saved', value: `${impact.totalKgRescued.toLocaleString()} kg`, icon: Package, color: 'text-blue-600 bg-blue-50', sub: 'from landfill' },
          { label: 'CO₂ Saved', value: `${impact.co2SavedKg.toLocaleString()} kg`, icon: Globe, color: 'text-teal-600 bg-teal-50', sub: 'carbon offset' },
          { label: 'Beneficiaries', value: impact.beneficiariesServed.toLocaleString(), icon: Users, color: 'text-purple-600 bg-purple-50', sub: 'people helped' },
          { label: 'Deliveries', value: impact.totalDeliveries, icon: Truck, color: 'text-orange-600 bg-orange-50', sub: 'completed' },
          { label: 'Active Now', value: stats.activeDonations, icon: Zap, color: 'text-yellow-600 bg-yellow-50', sub: 'donations' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-extrabold text-gray-800 leading-none">{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-none">{s.label}</p>
            <p className="text-[9px] text-gray-300 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Platform Health */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Donations', value: stats.activeDonations, color: 'bg-blue-100 text-blue-700' },
          { label: 'Active Deliveries', value: stats.activeDeliveries, color: 'bg-orange-100 text-orange-700' },
          { label: 'Expired Donations', value: stats.expiredDonations, color: 'bg-red-100 text-red-700' },
          { label: 'Partner NGOs', value: stats.totalNgos, color: 'bg-emerald-100 text-emerald-700' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 7-Day Demand Forecast Chart */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-gray-800">14-Day Demand Forecast</h3>
          <span className="badge badge-low text-[10px]">AI Forecast</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">Historical donations (7 days) + 7-day AI demand prediction using moving average regression</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Area type="monotone" dataKey="actual" stroke="#10B981" fill="url(#gradActual)" strokeWidth={2} name="Actual Donations" dot={{ r: 3, fill: '#10B981' }} />
            <Area type="monotone" dataKey="predicted" stroke="#3B82F6" fill="url(#gradPredicted)" strokeWidth={2} strokeDasharray="6 3" name="AI Predicted Demand" dot={{ r: 3, fill: '#3B82F6' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category Charts */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Bar Chart */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-gray-800 text-sm">Supply vs Demand by Category</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="demand" name="Demand" fill="#3B82F6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="supply" name="Supply" fill="#10B981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-gray-800 text-sm">Donation Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Map */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-gray-800">Live Platform Map</h3>
        </div>
        <FoodRescueMap />
      </div>

      {/* Donations Management Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">All Donations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-xs text-gray-500 font-medium">
                <th className="text-left px-4 py-2.5">Food Item</th>
                <th className="text-left px-4 py-2.5">Donor</th>
                <th className="text-left px-4 py-2.5">Qty</th>
                <th className="text-left px-4 py-2.5">Urgency</th>
                <th className="text-left px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {donations.slice(0, 10).map(d => (
                <tr key={d.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{d.foodName}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{d.donorOrgName}</td>
                  <td className="px-4 py-2.5 text-gray-600">{d.quantity}m/{d.quantityKg}kg</td>
                  <td className="px-4 py-2.5">
                    <span className={`badge text-[10px] ${d.urgencyLevel === 'critical' ? 'badge-critical' : d.urgencyLevel === 'high' ? 'badge-high' : d.urgencyLevel === 'medium' ? 'badge-medium' : 'badge-low'}`}>
                      {d.urgencyLevel}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`badge text-[10px] badge-${d.status}`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NGO Summary */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Partner NGOs</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {ngoProfiles.map(ngo => {
            const utilization = Math.round((ngo.currentLoad / ngo.capacity) * 100);
            return (
              <div key={ngo.userId} className="p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800">{ngo.organizationName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ngo.location.address}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex-1">
                      <div className="progress-bar" style={{ height: '4px' }}>
                        <div className="progress-fill" style={{ width: `${utilization}%`, background: utilization > 80 ? 'linear-gradient(90deg,#f97316,#dc2626)' : 'linear-gradient(90deg,#10B981,#059669)' }} />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-600 shrink-0">{utilization}% full</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">{ngo.beneficiariesServed.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">beneficiaries</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
