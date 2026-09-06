'use client';

import dynamic from 'next/dynamic';
import { useApp } from '@/lib/store';
import { useState } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';

// Dynamically import the actual Leaflet map to prevent SSR issues
const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-emerald-50 rounded-xl">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-emerald-600">Loading map...</p>
      </div>
    </div>
  ),
});

interface MapFilter {
  showDonors: boolean;
  showNgos: boolean;
  showVolunteers: boolean;
  showDeliveries: boolean;
}

export default function FoodRescueMap() {
  const { donations, ngoProfiles, volunteerProfiles, deliveries } = useApp();
  const [filters, setFilters] = useState<MapFilter>({
    showDonors: true,
    showNgos: true,
    showVolunteers: true,
    showDeliveries: true,
  });

  const toggleFilter = (key: keyof MapFilter) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeDonations = donations.filter(d => d.status === 'pending' || d.status === 'matched');
  const activeDeliveries = deliveries.filter(d => d.status === 'accepted' || d.status === 'picked_up');

  return (
    <div className="glass-card rounded-2xl overflow-hidden" style={{ height: '420px' }}>
      {/* Controls */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-100 bg-white/60 flex-wrap">
        <MapPin className="w-4 h-4 text-emerald-600" />
        <span className="font-semibold text-sm text-gray-700 mr-1">Live Map</span>
        {[
          { key: 'showDonors', label: 'Donors', color: 'bg-emerald-500' },
          { key: 'showNgos', label: 'NGOs', color: 'bg-blue-500' },
          { key: 'showVolunteers', label: 'Volunteers', color: 'bg-purple-500' },
          { key: 'showDeliveries', label: 'Deliveries', color: 'bg-orange-500' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => toggleFilter(f.key as keyof MapFilter)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              filters[f.key as keyof MapFilter]
                ? 'bg-white border-gray-200 text-gray-700 shadow-sm'
                : 'bg-gray-100 border-transparent text-gray-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${filters[f.key as keyof MapFilter] ? f.color : 'bg-gray-300'}`} />
            {f.label}
          </button>
        ))}
        <div className="ml-auto text-xs text-gray-400 flex items-center gap-1">
          <Navigation className="w-3 h-3" />
          OpenStreetMap
        </div>
      </div>

      {/* Map */}
      <div style={{ height: 'calc(100% - 52px)' }}>
        <LeafletMapInner
          donations={filters.showDonors ? activeDonations : []}
          ngos={filters.showNgos ? ngoProfiles : []}
          volunteers={filters.showVolunteers ? volunteerProfiles : []}
          deliveries={filters.showDeliveries ? activeDeliveries : []}
        />
      </div>
    </div>
  );
}
