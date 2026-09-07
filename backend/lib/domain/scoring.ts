// FoodRescue AI — Hybrid Food Suitability Scoring
//
// SAFETY NOTICE: This score is a logistics and quality routing indicator.
// It does NOT certify food as safe to eat. A high score does not mean
// the food is free of pathogens, allergens, or contamination.
// Final food safety responsibility rests with the receiving organization.

import type { ScoreBreakdown } from './models';
import { MINIMUM_SUITABILITY_SCORE } from './models';
import type { ScreeningResult, StorageCondition, PackagingCondition, FoodCategory } from './models';

export interface ScoringInput {
  // Visual screening
  screeningResult: ScreeningResult;

  // Time
  preparedAt: Date;
  usableDuration: number;   // minutes
  expiryTime: Date;
  now?: Date;

  // Food properties
  category: FoodCategory;
  storageCondition: StorageCondition;
  temperature?: number;
  temperatureTime?: Date;
  packagingCondition: PackagingCondition;

  // Delivery context (optional — if not supplied, delivery time score = 0)
  estimatedDeliveryMinutes?: number;

  // Completeness
  hasPhoto: boolean;
  hasAllergens: boolean; // allergen field was filled out
  hasHandlingNotes: boolean;
  hasTemperature: boolean;
}

export function computeRedistributionDeadline(
  preparedAt: Date,
  usableDurationMinutes: number,
  expiryTime: Date
): Date {
  const usableEnd = new Date(preparedAt.getTime() + usableDurationMinutes * 60_000);
  return usableEnd < expiryTime ? usableEnd : expiryTime;
}

export function computeRemainingWindowMs(
  preparedAt: Date,
  usableDurationMinutes: number,
  expiryTime: Date,
  now: Date = new Date()
): number {
  const deadline = computeRedistributionDeadline(preparedAt, usableDurationMinutes, expiryTime);
  return deadline.getTime() - now.getTime();
}

/**
 * Compute the hybrid suitability score (0–100) and block/warning reasons.
 *
 * Component weights:
 *   Visual condition     20 pts
 *   Time remaining       20 pts
 *   Food type            10 pts
 *   Storage condition    15 pts
 *   Temperature          10 pts
 *   Packaging            10 pts
 *   Delivery time fit    10 pts
 *   Window fit           10 pts
 *   Completeness          0 pts (only adds blockers/warnings if fields missing)
 *   ─────────────────────────
 *   Total               105 pts → normalised to 100
 */
export function computeSuitabilityScore(input: ScoringInput): ScoreBreakdown {
  const now = input.now ?? new Date();
  const blockers: string[] = [];
  const warnings: string[] = [];

  // ── 1. Visual condition (0–20) ────────────────────────────────────────────
  let visualCondition: number;
  switch (input.screeningResult) {
    case 'CLEAR':       visualCondition = 20; break;
    case 'UNCERTAIN':
      visualCondition = 8;
      warnings.push('AI screening was UNCERTAIN — manual review required before redistribution');
      break;
    case 'CONCERN':
      visualCondition = 0;
      blockers.push('AI visual screening flagged a CONCERN — food must not be redistributed without manual inspection');
      break;
    case 'UNAVAILABLE':
      visualCondition = 5;
      warnings.push('AI screening unavailable — food held for manual review');
      break;
  }

  // ── 2. Time remaining (0–20) ──────────────────────────────────────────────
  const remainingMs = computeRemainingWindowMs(
    input.preparedAt, input.usableDuration, input.expiryTime, now
  );
  const remainingHours = remainingMs / 3_600_000;

  let timeScore: number;
  if (remainingMs <= 0) {
    timeScore = 0;
    blockers.push('Redistribution window has expired — food must not be redistributed');
  } else if (remainingHours >= 6) {
    timeScore = 20;
  } else if (remainingHours >= 3) {
    timeScore = 15;
  } else if (remainingHours >= 1) {
    timeScore = 8;
    warnings.push('Less than 1–3 hours remaining in redistribution window — expedite pickup');
  } else {
    timeScore = 3;
    warnings.push('Fewer than 60 minutes remaining — high urgency');
  }

  // ── 3. Food type (0–10) ───────────────────────────────────────────────────
  // Cooked/dairy/raw are higher-risk; packaged goods are lower-risk
  const foodTypeScores: Record<FoodCategory, number> = {
    packaged: 10,
    beverages: 9,
    raw_produce: 7,
    bakery: 8,
    cooked_meal: 6,
    dairy: 5,
    other: 5,
  };
  const foodTypeScore = foodTypeScores[input.category];

  // ── 4. Storage condition (0–15) ───────────────────────────────────────────
  let storageScore: number;
  // SAFETY: check if temperature (when provided) matches storage condition
  const tempViolation = checkTemperatureViolation(
    input.storageCondition, input.temperature, input.category
  );
  if (tempViolation) {
    storageScore = 0;
    blockers.push(tempViolation);
  } else {
    // Perishables need appropriate storage
    switch (input.storageCondition) {
      case 'room_temp':
        storageScore = input.category === 'packaged' || input.category === 'beverages' ? 15 : 8;
        if (input.category === 'cooked_meal' || input.category === 'dairy') {
          warnings.push('Cooked/dairy food stored at room temperature — time-sensitive');
        }
        break;
      case 'refrigerated': storageScore = 13; break;
      case 'frozen':        storageScore = 15; break;
      case 'hot_hold':
        storageScore = input.category === 'cooked_meal' ? 14 : 10;
        break;
    }
  }

  // ── 5. Temperature (0–10) ─────────────────────────────────────────────────
  let temperatureScore: number;
  if (!input.hasTemperature || input.temperature === undefined) {
    temperatureScore = 3;
    warnings.push('Temperature not recorded — confidence reduced');
  } else {
    // Check if temperature reading is stale (> 2 hours old)
    if (input.temperatureTime) {
      const ageMinutes = (now.getTime() - input.temperatureTime.getTime()) / 60_000;
      if (ageMinutes > 120) {
        temperatureScore = 5;
        warnings.push('Temperature reading is more than 2 hours old');
      } else {
        temperatureScore = 10;
      }
    } else {
      temperatureScore = 7;
    }
  }

  // ── 6. Packaging condition (0–10) ─────────────────────────────────────────
  let packagingScore: number;
  switch (input.packagingCondition) {
    case 'intact':       packagingScore = 10; break;
    case 'minor_damage':
      packagingScore = 5;
      warnings.push('Minor packaging damage noted');
      break;
    case 'damaged':
      packagingScore = 0;
      blockers.push('Packaging is damaged — food must not be redistributed');
      break;
  }

  // ── 7. Delivery time fit (0–10) ───────────────────────────────────────────
  let deliveryTimeScore: number;
  if (input.estimatedDeliveryMinutes === undefined) {
    deliveryTimeScore = 0; // unknown — cannot evaluate
  } else if (remainingMs <= 0) {
    deliveryTimeScore = 0; // already expired
  } else {
    const bufferMinutes = 15; // handoff buffer
    const timeNeededMs = (input.estimatedDeliveryMinutes + bufferMinutes) * 60_000;
    if (timeNeededMs < remainingMs * 0.5) {
      deliveryTimeScore = 10;
    } else if (timeNeededMs < remainingMs * 0.8) {
      deliveryTimeScore = 7;
    } else if (timeNeededMs < remainingMs) {
      deliveryTimeScore = 3;
      warnings.push('Estimated delivery time is close to the redistribution deadline');
    } else {
      deliveryTimeScore = 0;
      blockers.push('Estimated delivery time exceeds the remaining redistribution window');
    }
  }

  // ── 8. Window fit (0–10) ──────────────────────────────────────────────────
  let windowScore: number;
  if (remainingMs <= 0) {
    windowScore = 0;
  } else if (remainingHours >= 12) {
    windowScore = 10;
  } else if (remainingHours >= 6) {
    windowScore = 8;
  } else if (remainingHours >= 2) {
    windowScore = 5;
  } else {
    windowScore = 2;
  }

  // ── 9. Completeness (no direct score points, only blockers/warnings) ──────
  const completenessScore = 0;
  if (!input.hasAllergens) {
    warnings.push('Allergen information not provided');
  }
  if (!input.hasPhoto) {
    warnings.push('No food photo — AI screening skipped');
  }

  // ── Final score ───────────────────────────────────────────────────────────
  const rawTotal =
    visualCondition + timeScore + foodTypeScore + storageScore +
    temperatureScore + packagingScore + deliveryTimeScore + windowScore;

  // Normalise from max 105 → 100
  const total = Math.min(100, Math.round((rawTotal / 105) * 100));

  // Additional block: UNCERTAIN screening with no manual review
  if (input.screeningResult === 'UNCERTAIN') {
    blockers.push('Manual review required before food can be redistributed (AI result was UNCERTAIN)');
  }
  if (input.screeningResult === 'UNAVAILABLE') {
    blockers.push('Food held for manual review — AI screening was unavailable');
  }

  // Block if total below minimum
  if (total < MINIMUM_SUITABILITY_SCORE && blockers.length === 0) {
    blockers.push(`Overall suitability score (${total}) is below the minimum threshold (${MINIMUM_SUITABILITY_SCORE})`);
  }

  return {
    visualCondition,
    timeScore,
    foodTypeScore,
    storageScore,
    temperatureScore,
    packagingScore,
    deliveryTimeScore,
    windowScore,
    completenessScore,
    total,
    blockers,
    warnings,
  };
}

/**
 * SAFETY: Checks whether the reported temperature is incompatible with the stated
 * storage condition. Returns a blocker message string if violated, null if OK.
 */
function checkTemperatureViolation(
  storage: StorageCondition,
  temperature: number | undefined,
  category: FoodCategory
): string | null {
  if (temperature === undefined) return null;

  switch (storage) {
    case 'frozen':
      if (temperature > 0) {
        return `Temperature (${temperature}°C) is above 0°C but storage is declared as frozen — incompatible`;
      }
      break;
    case 'refrigerated':
      if (temperature > 8) {
        return `Temperature (${temperature}°C) exceeds safe refrigeration range (≤8°C) — possible cold chain break`;
      }
      if (temperature < -2) {
        return `Temperature (${temperature}°C) is below -2°C but storage is declared as refrigerated (not frozen)`;
      }
      break;
    case 'hot_hold':
      if (temperature < 60 && (category === 'cooked_meal')) {
        return `Hot-hold temperature (${temperature}°C) is below the safe hot-hold threshold (60°C) for cooked food`;
      }
      break;
    case 'room_temp':
      if (temperature > 30) {
        return `Room temperature storage at ${temperature}°C is above safe ambient threshold for perishable food`;
      }
      break;
  }
  return null;
}

/**
 * Determine the status label from the score and blockers.
 * Returns: "eligible" | "needs_review" | "blocked"
 */
export function determineDonationStatus(
  breakdown: ScoreBreakdown,
  screeningResult: ScreeningResult
): 'eligible' | 'needs_review' | 'blocked' {
  if (breakdown.blockers.length > 0) return 'blocked';
  if (
    screeningResult === 'UNCERTAIN' ||
    screeningResult === 'UNAVAILABLE' ||
    breakdown.total < 55
  ) return 'needs_review';
  return 'eligible';
}
