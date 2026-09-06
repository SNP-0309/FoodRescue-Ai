'use client';

import { useApp } from '@/lib/store';
import { useState } from 'react';
import { Truck, MapPin, Clock, Star, CheckCircle, Package, Navigation, ChevronRight } from 'lucide-react';
import { DeliveryTask } from '@/types';
import { getCategoryLabel } from '@/lib/ai/foodAnalysis';
import dynamic from 'next/dynamic';

const LeafletMapInner = dynamic(() => import('@/components/map/LeafletMapInner'), {
  ssr: false,
  loading: () => <div className="w-full h-48 bg-emerald-50 rounded-xl flex items-center justify-center text-sm text-emerald-600">Loading route map...</div>,
});

const STATUS_LABELS: Record<DeliveryTask['status'], string> = {
  available: '📋 Available',
  accepted: '✅ Accepted',
  picked_up: '📦 Picked Up',
  delivered: '🎉 Delivered',
};

const STATUS_COLORS: Record<DeliveryTask['status'], string> = {
  available: 'badge-available',
  accepted: 'badge-accepted',
  picked_up: 'badge-picked_up',
  delivered: 'badge-delivered',
};

const NEXT_STATUS: Record<DeliveryTask['status'], DeliveryTask['status'] | null> = {
  available: 'accepted',
  accepted: 'picked_up',
  picked_up: 'delivered',
  delivered: null,
};

const NEXT_LABEL: Record<DeliveryTask['status'], string> = {
  available: 'Accept Task',
  accepted: 'Mark Picked Up',
  picked_up: 'Confirm Delivery',
  delivered: 'Completed',
};

export default function VolunteerDashboard() {
  const { deliveries, currentUser, acceptDelivery, updateDeliveryStatus } = useApp();
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [showMap, setShowMap] = useState<string | null>(null);

  const availableTasks = deliveries.filter(d => d.status === 'available');
  const myTasks = deliveries.filter(d =>
    d.volunteerId === currentUser?.id || d.volunteerId === 'user-volunteer-1'
  );
  const completedTasks = myTasks.filter(d => d.status === 'delivered');

  const handleAction = (task: DeliveryTask) => {
    if (task.status === 'available') {
      acceptDelivery(task.id, currentUser?.id || 'user-volunteer-1', currentUser?.name || 'Arjun Singh');
    } else if (task.status !== 'delivered') {
      const next = NEXT_STATUS[task.status];
      if (next) updateDeliveryStatus(task.id, next);
    }
  };

  const volunteerStats = {
    completed: completedTasks.length + 89,
    rating: 4.8,
    mealsDelivered: completedTasks.reduce((s, d) => s + d.quantity, 0) + 1240,
    kgDelivered: completedTasks.reduce((s, d) => s + d.quantityKg, 0) + 620,
  };

  const formatETA = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const URGENCY_COLORS: Record<string, string> = {
    critical: 'text-red-600 bg-red-100',
    high: 'text-orange-600 bg-orange-100',
    medium: 'text-yellow-600 bg-yellow-100',
    low: 'text-green-600 bg-green-100',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">Volunteer Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Hello, {currentUser?.name || 'Arjun Singh'} 👋</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Deliveries Done', value: volunteerStats.completed, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'My Rating', value: `⭐ ${volunteerStats.rating}`, icon: Star, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Meals Delivered', value: volunteerStats.mealsDelivered.toLocaleString(), icon: Package, color: 'text-blue-600 bg-blue-50' },
          { label: 'Kg Transported', value: `${volunteerStats.kgDelivered} kg`, icon: Truck, color: 'text-purple-600 bg-purple-50' },
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

      {/* Available Tasks */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Available Delivery Tasks</h3>
          <span className="badge badge-available">{availableTasks.length} tasks</span>
        </div>
        {availableTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No available tasks right now</p>
            <p className="text-xs mt-1">Check back soon or use the demo "Simulate Donation" button</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {availableTasks.map(task => (
              <div key={task.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-sm text-gray-800">{task.donationName}</h4>
                      <span className={`badge text-[10px] ${task.urgencyLevel === 'critical' ? 'badge-critical' : task.urgencyLevel === 'high' ? 'badge-high' : 'badge-medium'}`}>
                        {task.urgencyLevel}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-500" />{task.pickupLocation.address.split(',')[0]}</span>
                      <span className="flex items-center gap-1"><Navigation className="w-3 h-3 text-blue-500" />{task.dropoffLocation.address.split(',')[0]}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-orange-500" />{formatETA(task.estimatedMinutes)}</span>
                      <span>{task.distanceKm} km · {task.quantity} meals</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">To: {task.ngoName}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <button
                      onClick={() => handleAction(task)}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Accept Task
                    </button>
                    <button
                      onClick={() => setShowMap(showMap === task.id ? null : task.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      {showMap === task.id ? 'Hide' : 'View'} Route
                    </button>
                  </div>
                </div>
                {showMap === task.id && (
                  <div className="mt-3 h-48 rounded-xl overflow-hidden animate-fade-in">
                    <LeafletMapInner
                      donations={[]}
                      ngos={[]}
                      volunteers={[]}
                      deliveries={[task]}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Active Tasks */}
      {myTasks.filter(t => t.status !== 'delivered').length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">My Active Tasks</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {myTasks.filter(t => t.status !== 'delivered').map(task => (
              <div key={task.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-gray-800">{task.donationName}</h4>
                      <span className={`badge ${STATUS_COLORS[task.status]} text-[10px]`}>{STATUS_LABELS[task.status]}</span>
                    </div>
                    <div className="flex gap-2 text-xs text-gray-500 flex-wrap">
                      <span>📍 {task.pickupLocation.address.split(',')[0]}</span>
                      <span>→</span>
                      <span>🏠 {task.ngoName}</span>
                      <span>· {task.distanceKm} km</span>
                    </div>
                    {/* Progress stepper */}
                    <div className="flex items-center gap-1 mt-2">
                      {(['accepted', 'picked_up', 'delivered'] as const).map((s, i) => {
                        const isCurrentOrPast =
                          task.status === 'delivered' ||
                          (task.status === 'picked_up' && s !== 'delivered') ||
                          (task.status === 'accepted' && s === 'accepted');
                        return (
                          <div key={s} className="flex items-center gap-1">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${isCurrentOrPast ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                              {i + 1}
                            </div>
                            <span className={`text-[9px] ${isCurrentOrPast ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                              {s === 'accepted' ? 'Accepted' : s === 'picked_up' ? 'Picked Up' : 'Delivered'}
                            </span>
                            {i < 2 && <ChevronRight className="w-2.5 h-2.5 text-gray-300" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {task.status !== 'delivered' && (
                    <button onClick={() => handleAction(task)} className="btn-orange text-xs py-1.5 px-3">
                      {NEXT_LABEL[task.status]}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivery History */}
      {completedTasks.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Recent Deliveries</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {completedTasks.map(task => (
              <div key={task.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-800">{task.donationName}</p>
                  <p className="text-xs text-gray-400">{task.ngoName} · {task.quantity} meals · {task.distanceKm} km</p>
                </div>
                <span className="badge badge-delivered text-xs">✅ Delivered</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
