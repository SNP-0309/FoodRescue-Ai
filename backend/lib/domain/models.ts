// FoodRescue AI — Domain Models
// Canonical TypeScript types for all domain entities

// ─── Enumerations ─────────────────────────────────────────────────────────────

export type UserRole = 'donor' | 'receiver' | 'volunteer';

export type FoodCategory =
  | 'cooked_meal'
  | 'raw_produce'
  | 'packaged'
  | 'bakery'
  | 'dairy'
  | 'beverages'
  | 'other';

export type StorageCondition =
  | 'room_temp'
  | 'refrigerated'
  | 'frozen'
  | 'hot_hold';

export type PackagingCondition = 'intact' | 'minor_damage' | 'damaged';

export type OrgType =
  | 'ngo'
  | 'shelter'
  | 'community_kitchen'
  | 'food_bank';

export type VehicleType =
  | 'bicycle'
  | 'motorcycle'
  | 'car'
  | 'van'
  | 'truck';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

// ─── Screening ────────────────────────────────────────────────────────────────

/**
 * SAFETY NOTE: ScreeningResult is a VISUAL screening signal only.
 * It does NOT certify food as safe to eat.
 * CLEAR does not mean pathogen-free.
 * UNAVAILABLE means no AI result was produced — food must wait for manual review.
 */
export type ScreeningResult = 'CLEAR' | 'CONCERN' | 'UNCERTAIN' | 'UNAVAILABLE';

export interface ScreeningOutput {
  result: ScreeningResult;
  confidence?: number; // 0-1, only when result !== UNAVAILABLE
  notes?: string;
  timestamp: string; // ISO
  modelUsed?: string;
}

// ─── Donation Status ──────────────────────────────────────────────────────────

export type DonationStatus =
  | 'posted'
  | 'screening'
  | 'needs_review'
  | 'eligible'
  | 'matched'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'blocked'
  | 'on_hold'
  | 'rejected';

// ─── Delivery Status ──────────────────────────────────────────────────────────

export type DeliveryStatus =
  | 'pending'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'on_hold'
  | 'cancelled';

// ─── Suitability Score ────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  visualCondition: number;    // 0-20
  timeScore: number;          // 0-20
  foodTypeScore: number;      // 0-10
  storageScore: number;       // 0-15
  temperatureScore: number;   // 0-10
  packagingScore: number;     // 0-10
  deliveryTimeScore: number;  // 0-10
  windowScore: number;        // 0-10  (remaining redistribution window fit)
  completenessScore: number;  // 0-10  (required info completeness)
  total: number;              // 0-100
  blockers: string[];         // reasons the donation is blocked
  warnings: string[];         // non-blocking warnings
}

export const MINIMUM_SUITABILITY_SCORE = 40; // below this → blocked

// ─── Redistribution Window ───────────────────────────────────────────────────

export interface RedistributionWindow {
  deadline: Date;             // min(preparedAt + usableDuration, expiryTime)
  remainingMs: number;        // milliseconds remaining from now
  remainingMinutes: number;
  remainingHours: number;
  isExpired: boolean;
}

// ─── Match Result ─────────────────────────────────────────────────────────────

export interface MatchCandidate {
  receiverId: string;
  receiverName: string;
  orgType: OrgType;
  lat: number;
  lng: number;
  address: string;
  distanceKm: number;
  // IMPORTANT: travel time is a conservative straight-line estimate.
  // It is NOT based on live traffic data.
  estimatedTravelMinutes: number;
  estimatedArrivalTime: Date;
  matchScore: number;   // 0-100
  canFulfill: boolean;
  quantityNeeded: number;
  quantityToAllocate: number;
  reasons: string[];     // why eligible or ineligible
  storageCompatible: boolean;
  categoryAccepted: boolean;
  withinWindow: boolean;
  urgency: UrgencyLevel;
}

export interface MatchResult {
  donationId: string;
  eligible: MatchCandidate[];
  ineligible: MatchCandidate[];
  recommendedRoute: string[]; // receiverIds in suggested pickup order
  totalAllocatable: number;
  calculatedAt: string; // ISO
}

// ─── Allocation ───────────────────────────────────────────────────────────────

export interface AllocationItem {
  receiverId: string;
  receiverName: string;
  quantityAllocated: number;
  weightAllocated: number;
}

export interface AllocationPlan {
  donationId: string;
  totalQuantity: number;
  totalAllocated: number;
  items: AllocationItem[];
  unallocated: number;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalWeightRescuedKg: number;
  totalMealsRedistributed: number;
  estimatedWastePreventedKg: number;
  activeDonors: number;
  activeReceivers: number;
  successfulDeliveries: number;
  averageDeliveryMinutes: number;
  highRiskFoodRejected: number;
  mealsByCategory: Record<FoodCategory | string, number>;
  sevenDayChart: DayChartEntry[];
}

export interface DayChartEntry {
  date: string;          // YYYY-MM-DD
  mealsDelivered: number;
  weightKg: number;
}
