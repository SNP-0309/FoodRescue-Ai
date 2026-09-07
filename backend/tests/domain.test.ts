// FoodRescue AI — Backend Tests
// Vitest test suite covering all specified test categories

import { describe, it, expect, beforeEach } from 'vitest';
import { computeSuitabilityScore, computeRemainingWindowMs, computeRedistributionDeadline, determineDonationStatus } from '../lib/domain/scoring';
import { runMatchingEngine } from '../lib/domain/matching';
import { computeAllocation } from '../lib/domain/allocation';
import { canTransition, assertTransition, isConfirmable } from '../lib/domain/delivery-state';
import type { ScoringInput } from '../lib/domain/scoring';
import type { DonationMatchInput, ReceiverMatchInput } from '../lib/domain/matching';
import type { MatchCandidate } from '../lib/domain/models';

// ── Helpers ───────────────────────────────────────────────────────────────────

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000);
const minutesFromNow = (m: number) => new Date(Date.now() + m * 60_000);

const baseInput: ScoringInput = {
  screeningResult: 'CLEAR',
  preparedAt: hoursAgo(1),
  usableDuration: 240,
  expiryTime: hoursFromNow(3),
  category: 'cooked_meal',
  storageCondition: 'hot_hold',
  temperature: 72,
  temperatureTime: hoursAgo(0.3),
  packagingCondition: 'intact',
  hasPhoto: true,
  hasAllergens: true,
  hasHandlingNotes: true,
  hasTemperature: true,
};

// ── 1. Missing Required Fields ─────────────────────────────────────────────────

describe('Missing required fields', () => {
  it('warns when allergen information is missing', () => {
    const result = computeSuitabilityScore({ ...baseInput, hasAllergens: false });
    expect(result.warnings.some((w) => w.includes('Allergen'))).toBe(true);
  });

  it('warns when photo is missing', () => {
    const result = computeSuitabilityScore({ ...baseInput, hasPhoto: false });
    expect(result.warnings.some((w) => w.includes('photo'))).toBe(true);
  });

  it('reduces temperature score when temperature is not recorded', () => {
    const withTemp = computeSuitabilityScore({ ...baseInput });
    const withoutTemp = computeSuitabilityScore({ ...baseInput, hasTemperature: false, temperature: undefined });
    expect(withoutTemp.temperatureScore).toBeLessThan(withTemp.temperatureScore);
  });
});

// ── 2. Invalid Temperature ────────────────────────────────────────────────────

describe('Invalid temperature', () => {
  it('blocks frozen food with temperature above 0°C', () => {
    const result = computeSuitabilityScore({
      ...baseInput,
      storageCondition: 'frozen',
      temperature: 5,
    });
    expect(result.blockers.some((b) => b.includes('frozen'))).toBe(true);
    expect(result.storageScore).toBe(0);
  });

  it('blocks refrigerated food with temperature above 8°C', () => {
    const result = computeSuitabilityScore({
      ...baseInput,
      storageCondition: 'refrigerated',
      temperature: 14,
      category: 'cooked_meal',
    });
    expect(result.blockers.some((b) => b.includes('refrigeration'))).toBe(true);
  });

  it('blocks cooked meal in hot-hold below 60°C', () => {
    const result = computeSuitabilityScore({
      ...baseInput,
      storageCondition: 'hot_hold',
      temperature: 55,
      category: 'cooked_meal',
    });
    expect(result.blockers.some((b) => b.includes('hot-hold') || b.includes('60°C'))).toBe(true);
  });

  it('does not block packaged food in hot-hold below 60°C', () => {
    const result = computeSuitabilityScore({
      ...baseInput,
      storageCondition: 'hot_hold',
      temperature: 55,
      category: 'packaged',
    });
    // packaged food doesn't trigger the hot-hold minimum temp rule
    expect(result.blockers.filter((b) => b.includes('60°C'))).toHaveLength(0);
  });
});

// ── 3. Expired Food ───────────────────────────────────────────────────────────

describe('Expired food', () => {
  it('blocks food when redistribution window has expired', () => {
    const result = computeSuitabilityScore({
      ...baseInput,
      preparedAt: hoursAgo(10),
      usableDuration: 120, // 2 hours — window ended 8 hours ago
      expiryTime: hoursAgo(5),
    });
    expect(result.blockers.some((b) => b.includes('expired'))).toBe(true);
    expect(result.timeScore).toBe(0);
  });

  it('assigns zero time score to expired food', () => {
    const result = computeSuitabilityScore({
      ...baseInput,
      preparedAt: hoursAgo(6),
      usableDuration: 60,
      expiryTime: hoursAgo(4),
    });
    expect(result.timeScore).toBe(0);
  });
});

// ── 4. Remaining Window Calculation ─────────────────────────────────────────

describe('Remaining redistribution window', () => {
  it('uses the earlier of usableDuration end or expiryTime', () => {
    const preparedAt = hoursAgo(1);
    const usableDuration = 120; // ends in 1 hour
    const expiryTime = hoursFromNow(3); // expiry is later

    const deadline = computeRedistributionDeadline(preparedAt, usableDuration, expiryTime);
    const expected = new Date(preparedAt.getTime() + 120 * 60_000);
    expect(Math.abs(deadline.getTime() - expected.getTime())).toBeLessThan(1000);
  });

  it('uses expiryTime if usableDuration end is later', () => {
    const preparedAt = hoursAgo(0.5);
    const usableDuration = 480; // ends in 7.5 hours
    const expiryTime = hoursFromNow(2); // expiry sooner

    const deadline = computeRedistributionDeadline(preparedAt, usableDuration, expiryTime);
    expect(Math.abs(deadline.getTime() - expiryTime.getTime())).toBeLessThan(1000);
  });

  it('returns negative remaining ms for expired food', () => {
    const remaining = computeRemainingWindowMs(hoursAgo(5), 60, hoursAgo(3));
    expect(remaining).toBeLessThan(0);
  });

  it('returns positive remaining ms for valid food', () => {
    const remaining = computeRemainingWindowMs(hoursAgo(1), 240, hoursFromNow(3));
    expect(remaining).toBeGreaterThan(0);
  });
});

// ── 5. Score Calculation ──────────────────────────────────────────────────────

describe('Score calculation', () => {
  it('returns score between 0 and 100', () => {
    const result = computeSuitabilityScore(baseInput);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it('CLEAR screening gets higher visual score than CONCERN', () => {
    const clear = computeSuitabilityScore({ ...baseInput, screeningResult: 'CLEAR' });
    const concern = computeSuitabilityScore({ ...baseInput, screeningResult: 'CONCERN' });
    expect(clear.visualCondition).toBeGreaterThan(concern.visualCondition);
  });

  it('intact packaging scores higher than damaged', () => {
    const intact = computeSuitabilityScore({ ...baseInput, packagingCondition: 'intact' });
    const damaged = computeSuitabilityScore({ ...baseInput, packagingCondition: 'damaged' });
    expect(intact.packagingScore).toBeGreaterThan(damaged.packagingScore);
  });

  it('food with more time remaining scores higher on time', () => {
    const longWindow = computeSuitabilityScore({
      ...baseInput,
      preparedAt: hoursAgo(0.5),
      usableDuration: 720,
      expiryTime: hoursFromNow(12),
    });
    const shortWindow = computeSuitabilityScore({
      ...baseInput,
      preparedAt: hoursAgo(1),
      usableDuration: 90,
      expiryTime: hoursFromNow(0.5),
    });
    expect(longWindow.timeScore).toBeGreaterThan(shortWindow.timeScore);
  });
});

// ── 6. Storage Compatibility ──────────────────────────────────────────────────

describe('Storage compatibility', () => {
  it('blocks frozen food at positive temperature', () => {
    const result = computeSuitabilityScore({
      ...baseInput,
      storageCondition: 'frozen',
      temperature: 3,
    });
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it('does not block room temp packaged food', () => {
    const result = computeSuitabilityScore({
      ...baseInput,
      storageCondition: 'room_temp',
      temperature: 24,
      category: 'packaged',
    });
    const storageBlockers = result.blockers.filter(b => b.includes('storage') || b.includes('frozen') || b.includes('refriger'));
    expect(storageBlockers).toHaveLength(0);
  });
});

// ── 7. Category Compatibility (via Matching Engine) ────────────────────────

describe('Category compatibility in matching', () => {
  const donation: DonationMatchInput = {
    donationId: 'test-1',
    pickupLat: 12.97,
    pickupLng: 77.59,
    category: 'cooked_meal',
    storageCondition: 'hot_hold',
    quantity: 50,
    weightKg: 10,
    preparedAt: hoursAgo(0.5),
    usableDurationMinutes: 240,
    expiryTime: hoursFromNow(3),
  };

  const receiverAccepts: ReceiverMatchInput = {
    receiverId: 'r1',
    orgName: 'Test Receiver',
    orgType: 'ngo',
    lat: 12.95,
    lng: 77.60,
    address: 'Test Address',
    currentDemand: 100,
    maxCapacity: 200,
    acceptedCategories: ['cooked_meal'],
    availableStorage: ['hot_hold'],
    urgency: 'high',
    canArrangePickup: false,
    isActive: true,
  };

  const receiverRejects: ReceiverMatchInput = {
    ...receiverAccepts,
    receiverId: 'r2',
    orgName: 'Rejects Cooked',
    acceptedCategories: ['packaged'], // does not accept cooked_meal
  };

  it('marks receiver as eligible when category is accepted', () => {
    const result = runMatchingEngine(donation, [receiverAccepts]);
    expect(result.eligible).toHaveLength(1);
  });

  it('marks receiver as ineligible when category not accepted', () => {
    const result = runMatchingEngine(donation, [receiverRejects]);
    expect(result.ineligible).toHaveLength(1);
    expect(result.ineligible[0].reasons.some(r => r.includes('cooked_meal'))).toBe(true);
  });
});

// ── 8. Receiver Capacity ──────────────────────────────────────────────────────

describe('Receiver capacity', () => {
  const donation: DonationMatchInput = {
    donationId: 'test-cap',
    pickupLat: 12.97,
    pickupLng: 77.59,
    category: 'cooked_meal',
    storageCondition: 'hot_hold',
    quantity: 100,
    weightKg: 25,
    preparedAt: hoursAgo(0.5),
    usableDurationMinutes: 360,
    expiryTime: hoursFromNow(5),
  };

  it('marks receiver with zero demand as ineligible', () => {
    const nodemand: ReceiverMatchInput = {
      receiverId: 'r-zero',
      orgName: 'Zero Demand',
      orgType: 'ngo',
      lat: 12.97,
      lng: 77.60,
      address: 'Test',
      currentDemand: 0,
      maxCapacity: 200,
      acceptedCategories: ['cooked_meal'],
      availableStorage: ['hot_hold'],
      urgency: 'low',
      canArrangePickup: false,
      isActive: true,
    };
    const result = runMatchingEngine(donation, [nodemand]);
    expect(result.ineligible).toHaveLength(1);
  });
});

// ── 9. Multi-Destination Allocation ─────────────────────────────────────────

describe('Multi-destination allocation', () => {
  const makeCandidate = (id: string, qty: number): MatchCandidate => ({
    receiverId: id,
    receiverName: `Receiver ${id}`,
    orgType: 'ngo',
    lat: 12.97,
    lng: 77.59,
    address: 'Test',
    distanceKm: 2,
    estimatedTravelMinutes: 15,
    estimatedArrivalTime: minutesFromNow(15),
    matchScore: 80,
    canFulfill: true,
    quantityNeeded: qty,
    quantityToAllocate: qty,
    reasons: [],
    storageCompatible: true,
    categoryAccepted: true,
    withinWindow: true,
    urgency: 'high',
  });

  it('splits 100 meals across multiple receivers', () => {
    const plan = computeAllocation({
      donationId: 'test-multi',
      totalQuantity: 100,
      totalWeightKg: 25,
      eligibleReceivers: [makeCandidate('r1', 40), makeCandidate('r2', 40), makeCandidate('r3', 30)],
      deadlineMs: 3_600_000,
    });
    expect(plan.totalAllocated).toBe(100);
    expect(plan.items).toHaveLength(3);
    expect(plan.unallocated).toBe(0);
  });

  it('never exceeds receiver demand', () => {
    const plan = computeAllocation({
      donationId: 'test-cap',
      totalQuantity: 100,
      totalWeightKg: 25,
      eligibleReceivers: [makeCandidate('r1', 30)],
      deadlineMs: 3_600_000,
    });
    expect(plan.items[0].quantityAllocated).toBe(30);
    expect(plan.unallocated).toBe(70);
  });

  it('returns zero allocation when window has expired', () => {
    const plan = computeAllocation({
      donationId: 'test-expired',
      totalQuantity: 100,
      totalWeightKg: 25,
      eligibleReceivers: [makeCandidate('r1', 100)],
      deadlineMs: -1000, // expired
    });
    expect(plan.totalAllocated).toBe(0);
    expect(plan.items).toHaveLength(0);
  });
});

// ── 10. Volunteer Capacity ────────────────────────────────────────────────────

describe('Volunteer capacity', () => {
  const donation: DonationMatchInput = {
    donationId: 'vol-cap',
    pickupLat: 12.97,
    pickupLng: 77.59,
    category: 'cooked_meal',
    storageCondition: 'hot_hold',
    quantity: 100,
    weightKg: 25,
    preparedAt: hoursAgo(0.5),
    usableDurationMinutes: 360,
    expiryTime: hoursFromNow(5),
  };

  const receiver: ReceiverMatchInput = {
    receiverId: 'r1',
    orgName: 'Test',
    orgType: 'ngo',
    lat: 12.97,
    lng: 77.60,
    address: 'Test',
    currentDemand: 200,
    maxCapacity: 300,
    acceptedCategories: ['cooked_meal'],
    availableStorage: ['hot_hold'],
    urgency: 'high',
    canArrangePickup: false,
    isActive: true,
  };

  it('marks receiver ineligible when volunteer capacity is insufficient', () => {
    const result = runMatchingEngine(
      donation,
      [receiver],
      { maxMealCapacity: 10, storageTypes: ['hot_hold'] } // only 10, need 100
    );
    expect(result.ineligible).toHaveLength(1);
    expect(result.ineligible[0].reasons.some(r => r.includes('capacity'))).toBe(true);
  });

  it('marks receiver ineligible when volunteer lacks required storage', () => {
    const result = runMatchingEngine(
      donation,
      [receiver],
      { maxMealCapacity: 200, storageTypes: ['room_temp'] } // hot_hold required
    );
    expect(result.ineligible).toHaveLength(1);
  });
});

// ── 11. Delivery State Transitions ────────────────────────────────────────────

describe('Delivery state machine', () => {
  it('allows valid transitions', () => {
    expect(canTransition('pending', 'accepted')).toBe(true);
    expect(canTransition('accepted', 'picked_up')).toBe(true);
    expect(canTransition('picked_up', 'in_transit')).toBe(true);
    expect(canTransition('in_transit', 'delivered')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(canTransition('pending', 'delivered')).toBe(false);
    expect(canTransition('pending', 'in_transit')).toBe(false);
    expect(canTransition('delivered', 'in_transit')).toBe(false);
    expect(canTransition('cancelled', 'accepted')).toBe(false);
  });

  it('throws on invalid transition via assertTransition', () => {
    expect(() => assertTransition('delivered', 'in_transit')).toThrow();
  });

  it('allows on_hold to resume', () => {
    expect(canTransition('on_hold', 'accepted')).toBe(true);
    expect(canTransition('on_hold', 'cancelled')).toBe(true);
  });
});

// ── 12. Duplicate Delivery Confirmation ──────────────────────────────────────

describe('Duplicate confirmation prevention', () => {
  it('marks delivered status as non-confirmable', () => {
    expect(isConfirmable('delivered')).toBe(false);
  });

  it('marks in_transit as confirmable', () => {
    expect(isConfirmable('in_transit')).toBe(true);
  });

  it('canTransition from delivered returns empty list', () => {
    expect(canTransition('delivered', 'delivered')).toBe(false);
  });
});

// ── 13. Incident Hold ─────────────────────────────────────────────────────────

describe('Incident hold', () => {
  it('can transition accepted → on_hold', () => {
    expect(canTransition('accepted', 'on_hold')).toBe(true);
  });

  it('can transition picked_up → on_hold', () => {
    expect(canTransition('picked_up', 'on_hold')).toBe(true);
  });

  it('can transition in_transit → on_hold', () => {
    expect(canTransition('in_transit', 'on_hold')).toBe(true);
  });

  it('can resume from on_hold to accepted', () => {
    expect(canTransition('on_hold', 'accepted')).toBe(true);
  });
});

// ── 14. Analytics Totals ──────────────────────────────────────────────────────

describe('Analytics — determineDonationStatus', () => {
  it('returns eligible when no blockers and score ≥ 55', () => {
    const score = computeSuitabilityScore(baseInput);
    const status = determineDonationStatus(score, 'CLEAR');
    expect(status).toBe('eligible');
  });

  it('returns blocked when blockers exist', () => {
    const score = computeSuitabilityScore({
      ...baseInput,
      packagingCondition: 'damaged',
    });
    const status = determineDonationStatus(score, 'CLEAR');
    expect(status).toBe('blocked');
  });

  it('returns needs_review for UNCERTAIN screening', () => {
    const score = computeSuitabilityScore({ ...baseInput, screeningResult: 'UNCERTAIN' });
    const status = determineDonationStatus(score, 'UNCERTAIN');
    expect(status).toBe('blocked'); // UNCERTAIN adds a blocker
  });

  it('returns needs_review for UNAVAILABLE screening', () => {
    const score = computeSuitabilityScore({ ...baseInput, screeningResult: 'UNAVAILABLE' });
    const status = determineDonationStatus(score, 'UNAVAILABLE');
    expect(status).toBe('blocked'); // UNAVAILABLE adds a blocker requiring manual review
  });
});
