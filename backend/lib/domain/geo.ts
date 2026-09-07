// FoodRescue AI — Haversine distance + travel time utilities

/**
 * Haversine formula — straight-line distance between two lat/lng points in km.
 * IMPORTANT: This is NOT routing distance. It does NOT account for roads, traffic, or obstacles.
 */
export function haversineDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Conservative estimated travel time in minutes.
 *
 * DISCLAIMER: This estimate is based on straight-line (Haversine) distance
 * with a conservative average speed assumption. It is NOT based on live traffic
 * data, actual road routes, or real-time conditions.
 *
 * A 1.5x route-factor is applied to account for indirect roads.
 * An extra 10-minute buffer is added for loading/unloading handoffs.
 *
 * Always display this as an estimate to end users.
 */
export function estimateTravelMinutes(distanceKm: number): number {
  const routeFactor = 1.5;          // straight-line → road route multiplier
  const avgSpeedKmh = 30;           // conservative urban speed
  const handoffBufferMinutes = 10;  // pickup + delivery handoff buffer

  const routeDistanceKm = distanceKm * routeFactor;
  const travelMinutes = (routeDistanceKm / avgSpeedKmh) * 60;
  return Math.ceil(travelMinutes + handoffBufferMinutes);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}
