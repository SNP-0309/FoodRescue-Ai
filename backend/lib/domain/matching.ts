// FoodRescue AI — Matching Engine
//
// Scores and ranks eligible receivers for a given donation.
// All safety decisions (blocking) happen in scoring.ts before matching.
// Matching only runs on eligible donations.

import type {
  MatchResult, MatchCandidate, UrgencyLevel,
  FoodCategory, StorageCondition, OrgType,
} from './models';
import { haversineDistanceKm, estimateTravelMinutes, addMinutes } from './geo';
import { computeRedistributionDeadline } from './scoring';

export interface DonationMatchInput {
  donationId: string;
  pickupLat: number;
  pickupLng: number;
  category: FoodCategory;
  storageCondition: StorageCondition;
  quantity: number;
  weightKg: number;
  preparedAt: Date;
  usableDurationMinutes: number;
  expiryTime: Date;
  now?: Date;
}

export interface ReceiverMatchInput {
  receiverId: string;
  orgName: string;
  orgType: OrgType;
  lat: number;
  lng: number;
  address: string;
  currentDemand: number;
  maxCapacity: number;
  acceptedCategories: string[];
  availableStorage: string[];
  urgency: UrgencyLevel;
  canArrangePickup: boolean;
  isActive: boolean;
}

export interface VolunteerMatchInput {
  maxMealCapacity: number;
  storageTypes: string[];
  currentLat?: number;
  currentLng?: number;
}

const URGENCY_WEIGHT: Record<UrgencyLevel, number> = {
  critical: 25,
  high: 18,
  medium: 10,
  low: 5,
};

/**
 * Run the matching engine for a donation against a list of receivers.
 * Returns eligible and ineligible candidates with scores and reasons.
 *
 * IMPORTANT: This function runs entirely on the backend. Flutter only displays results.
 */
export function runMatchingEngine(
  donation: DonationMatchInput,
  receivers: ReceiverMatchInput[],
  volunteer?: VolunteerMatchInput,
  maxDistanceKm = 50
): MatchResult {
  const now = donation.now ?? new Date();
  const deadline = computeRedistributionDeadline(
    donation.preparedAt, donation.usableDurationMinutes, donation.expiryTime
  );
  const remainingMs = deadline.getTime() - now.getTime();

  const eligible: MatchCandidate[] = [];
  const ineligible: MatchCandidate[] = [];

  for (const receiver of receivers) {
    const reasons: string[] = [];
    let canFulfill = true;

    // 1. Active check
    if (!receiver.isActive) {
      ineligible.push(buildCandidate(donation, receiver, 0, false, ['Receiver is inactive']));
      continue;
    }

    // 2. Category compatibility
    const categoryAccepted = receiver.acceptedCategories.includes(donation.category);
    if (!categoryAccepted) {
      reasons.push(`Receiver does not accept category: ${donation.category}`);
      canFulfill = false;
    }

    // 3. Storage compatibility
    const storageCompatible = receiver.availableStorage.includes(donation.storageCondition);
    if (!storageCompatible) {
      reasons.push(`Receiver lacks ${donation.storageCondition} storage`);
      canFulfill = false;
    }

    // 4. Demand & capacity
    if (receiver.currentDemand <= 0) {
      reasons.push('Receiver has no current demand');
      canFulfill = false;
    }
    if (receiver.maxCapacity <= 0) {
      reasons.push('Receiver has no available capacity');
      canFulfill = false;
    }

    // 5. Distance
    const distanceKm = haversineDistanceKm(
      donation.pickupLat, donation.pickupLng,
      receiver.lat, receiver.lng
    );
    if (distanceKm > maxDistanceKm) {
      reasons.push(`Distance (${distanceKm.toFixed(1)} km) exceeds maximum (${maxDistanceKm} km)`);
      canFulfill = false;
    }

    // 6. Volunteer capacity (if volunteer provided)
    if (volunteer) {
      if (!volunteer.storageTypes.includes(donation.storageCondition)) {
        reasons.push(`Volunteer vehicle lacks ${donation.storageCondition} storage`);
        canFulfill = false;
      }
      if (donation.quantity > volunteer.maxMealCapacity) {
        reasons.push(`Donation quantity (${donation.quantity}) exceeds volunteer capacity (${volunteer.maxMealCapacity})`);
        canFulfill = false;
      }
    }

    // 7. Redistribution window check
    const travelMinutes = estimateTravelMinutes(distanceKm);
    const estimatedArrivalTime = addMinutes(now, travelMinutes);
    const bufferMs = 15 * 60_000; // 15 min handoff buffer
    const withinWindow = remainingMs > 0 &&
      (estimatedArrivalTime.getTime() + bufferMs) <= deadline.getTime();

    if (remainingMs <= 0) {
      reasons.push('Redistribution window has expired');
      canFulfill = false;
    } else if (!withinWindow) {
      reasons.push('Estimated arrival time exceeds remaining redistribution window');
      canFulfill = false;
    }

    if (!canFulfill) {
      ineligible.push(buildCandidate(
        donation, receiver, distanceKm, false, reasons,
        travelMinutes, estimatedArrivalTime, storageCompatible, categoryAccepted, withinWindow
      ));
      continue;
    }

    // ── Score eligible candidates ─────────────────────────────────────────
    let score = 0;

    // Distance score (0–30): closer = higher
    const distanceScore = Math.max(0, 30 - (distanceKm / maxDistanceKm) * 30);
    score += distanceScore;

    // Travel time score (0–20): faster = higher
    const timeScore = Math.max(0, 20 - (travelMinutes / 120) * 20);
    score += timeScore;

    // Urgency score (0–25)
    score += URGENCY_WEIGHT[receiver.urgency];

    // Demand fill ratio score (0–15): how much of demand we can fill
    const fillRatio = Math.min(1, donation.quantity / receiver.currentDemand);
    score += fillRatio * 15;

    // Pickup availability (0–10)
    if (receiver.canArrangePickup) score += 10;

    const matchScore = Math.round(Math.min(100, score));
    const quantityToAllocate = Math.min(donation.quantity, receiver.currentDemand, receiver.maxCapacity);

    eligible.push(buildCandidate(
      donation, receiver, distanceKm, true, reasons,
      travelMinutes, estimatedArrivalTime, storageCompatible, categoryAccepted,
      withinWindow, matchScore, quantityToAllocate
    ));
  }

  // Sort eligible by score descending
  eligible.sort((a, b) => b.matchScore - a.matchScore);

  // Recommended route: top eligible receivers by score
  const recommendedRoute = eligible.map(r => r.receiverId);

  return {
    donationId: donation.donationId,
    eligible,
    ineligible,
    recommendedRoute,
    totalAllocatable: eligible.reduce((sum, r) => sum + r.quantityToAllocate, 0),
    calculatedAt: now.toISOString(),
  };
}

function buildCandidate(
  donation: DonationMatchInput,
  receiver: ReceiverMatchInput,
  distanceKm: number,
  canFulfill: boolean,
  reasons: string[],
  travelMinutes = 0,
  estimatedArrivalTime = new Date(),
  storageCompatible = false,
  categoryAccepted = false,
  withinWindow = false,
  matchScore = 0,
  quantityToAllocate = 0
): MatchCandidate {
  return {
    receiverId: receiver.receiverId,
    receiverName: receiver.orgName,
    orgType: receiver.orgType,
    lat: receiver.lat,
    lng: receiver.lng,
    address: receiver.address,
    distanceKm: Math.round(distanceKm * 100) / 100,
    estimatedTravelMinutes: travelMinutes,
    estimatedArrivalTime,
    matchScore,
    canFulfill,
    quantityNeeded: receiver.currentDemand,
    quantityToAllocate,
    reasons,
    storageCompatible,
    categoryAccepted,
    withinWindow,
    urgency: receiver.urgency,
  };
}
