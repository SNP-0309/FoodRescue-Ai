'use client';

import { useEffect, useRef } from 'react';
import { FoodDonation, NgoProfile, VolunteerProfile, DeliveryTask } from '@/types';

interface Props {
  donations: FoodDonation[];
  ngos: NgoProfile[];
  volunteers: VolunteerProfile[];
  deliveries: DeliveryTask[];
}

const URGENCY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a',
};

export default function LeafletMapInner({ donations, ngos, volunteers, deliveries }: Props) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let map: any;
    let L: any;

    const initMap = async () => {
      L = (await import('leaflet')).default;

      if (!containerRef.current || mapRef.current) return;

      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      map = L.map(containerRef.current, {
        center: [28.6139, 77.2090],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // Create custom colored circle markers
      const createMarker = (lat: number, lng: number, color: string, emoji: string, popupContent: string) => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width: 36px; height: 36px; border-radius: 50% 50% 50% 0;
            background: ${color}; border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; transform: rotate(-45deg);
            cursor: pointer;
          "><span style="transform: rotate(45deg); display: block;">${emoji}</span></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        });
        return L.marker([lat, lng], { icon }).bindPopup(popupContent, { maxWidth: 220 });
      };

      // Add donation markers (green)
      donations.forEach(d => {
        const color = URGENCY_COLORS[d.urgencyLevel] || '#10B981';
        const popup = `
          <div style="font-family: sans-serif; min-width: 180px;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">${d.foodName}</div>
            <div style="font-size: 11px; color: #6b7280;">${d.donorOrgName}</div>
            <div style="margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap;">
              <span style="background:${color}20;color:${color};padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;">${d.urgencyLevel.toUpperCase()}</span>
              <span style="background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:12px;font-size:10px;">${d.quantity} meals</span>
            </div>
            <div style="font-size:11px;color:#9ca3af;margin-top:4px;">${d.location.address}</div>
          </div>
        `;
        createMarker(d.location.lat, d.location.lng, color, '🍽️', popup).addTo(map);
      });

      // Add NGO markers (blue)
      ngos.forEach(n => {
        const available = n.capacity - n.currentLoad;
        const popup = `
          <div style="font-family: sans-serif; min-width: 180px;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">${n.organizationName}</div>
            <div style="font-size: 11px; color: #6b7280;">${n.location.address}</div>
            <div style="margin-top:6px;font-size:11px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                <span style="color:#6b7280;">Capacity</span><span style="font-weight:600;">${available}/${n.capacity} available</span>
              </div>
              <div style="background:#e2e8f0;height:4px;border-radius:2px;overflow:hidden;">
                <div style="background:#3b82f6;height:100%;width:${(n.currentLoad/n.capacity)*100}%"></div>
              </div>
            </div>
          </div>
        `;
        createMarker(n.location.lat, n.location.lng, '#2563eb', '🏠', popup).addTo(map);
      });

      // Add volunteer markers (purple)
      volunteers.forEach(v => {
        const popup = `
          <div style="font-family: sans-serif; min-width: 160px;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">${v.name}</div>
            <div style="font-size: 11px; color: #6b7280;">Vehicle: ${v.vehicleType} · ⭐ ${v.rating}</div>
            <div style="margin-top:4px;font-size:11px;">
              <span style="background:${v.isAvailable ? '#d1fae5' : '#fee2e2'};color:${v.isAvailable ? '#059669' : '#dc2626'};padding:2px 8px;border-radius:12px;font-weight:600;">
                ${v.isAvailable ? '✅ Available' : '🔴 Busy'}
              </span>
            </div>
          </div>
        `;
        createMarker(v.location.lat, v.location.lng, v.isAvailable ? '#7c3aed' : '#9ca3af', '🚴', popup).addTo(map);
      });

      // Draw delivery routes
      deliveries.forEach(d => {
        const routeColor = d.status === 'picked_up' ? '#f97316' : '#3b82f6';
        L.polyline(
          [
            [d.pickupLocation.lat, d.pickupLocation.lng],
            [d.dropoffLocation.lat, d.dropoffLocation.lng],
          ],
          {
            color: routeColor,
            weight: 3,
            opacity: 0.7,
            dashArray: '8, 6',
          }
        ).addTo(map);

        // Route popup at midpoint
        const midLat = (d.pickupLocation.lat + d.dropoffLocation.lat) / 2;
        const midLng = (d.pickupLocation.lng + d.dropoffLocation.lng) / 2;
        L.marker([midLat, midLng], {
          icon: L.divIcon({
            className: '',
            html: `<div style="background:#f97316;color:white;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.2);">${d.distanceKm} km · ${d.estimatedMinutes} min</div>`,
            iconSize: [80, 20],
            iconAnchor: [40, 10],
          }),
        }).addTo(map);
      });
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [donations, ngos, volunteers, deliveries]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
