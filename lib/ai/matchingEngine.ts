import { FoodDonation, FoodRequirement, NgoProfile, MatchResult, MatchScore, FoodCategory, UrgencyLevel } from '@/types';

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function urgencyToScore(urgency: UrgencyLevel): number {
  const scores: Record<UrgencyLevel, number> = {
    critical: 1.0,
    high: 0.75,
    medium: 0.5,
    low: 0.25,
  };
  return scores[urgency];
}

function proximityScore(distanceKm: number): number {
  // Score decreases with distance: 100% at 0km, ~0% at 30km
  if (distanceKm <= 0) return 1.0;
  if (distanceKm >= 30) return 0.0;
  return Math.max(0, 1 - distanceKm / 30);
}

function capacityScore(ngo: NgoProfile, donationQty: number): number {
  const available = ngo.capacity - ngo.currentLoad;
  if (available <= 0) return 0;
  if (available >= donationQty) return 1.0;
  return available / donationQty;
}

function demandScore(requirements: FoodRequirement[], ngoId: string, category: FoodCategory): number {
  const activeReqs = requirements.filter(r => r.ngoId === ngoId && r.isActive);
  if (activeReqs.length === 0) return 0.2;

  const matchingReq = activeReqs.find(r => r.category === category);
  if (matchingReq) {
    const urgencyMap: Record<UrgencyLevel, number> = { critical: 1.0, high: 0.8, medium: 0.6, low: 0.4 };
    return urgencyMap[matchingReq.urgency] || 0.5;
  }
  // Some demand even if category doesn't match exactly
  return 0.3;
}

function compatibilityScore(ngo: NgoProfile, category: FoodCategory): number {
  if (ngo.acceptedCategories.includes(category)) return 1.0;
  // Partially compatible categories
  const partialGroups = [
    ['cooked_meals', 'fresh_produce', 'dairy'],
    ['bakery', 'snacks'],
    ['packaged_goods', 'beverages'],
  ];
  for (const group of partialGroups) {
    if (group.includes(category)) {
      const hasAny = group.some(c => ngo.acceptedCategories.includes(c as FoodCategory));
      if (hasAny) return 0.5;
    }
  }
  return 0.1;
}

function buildExplanation(
  ngo: NgoProfile,
  scores: { urgency: number; distance: number; demand: number; compatibility: number; capacity: number },
  distanceKm: number,
  donation: FoodDonation,
): string {
  const parts: string[] = [];

  if (scores.urgency >= 0.75) {
    parts.push(`High urgency (${donation.urgencyLevel}) makes this NGO's quick response capacity critical`);
  }
  if (scores.distance >= 0.7) {
    parts.push(`Excellent proximity at only ${distanceKm.toFixed(1)} km away — minimizing transit time`);
  } else if (scores.distance >= 0.4) {
    parts.push(`Moderate distance of ${distanceKm.toFixed(1)} km — manageable for timely delivery`);
  } else {
    parts.push(`Distance of ${distanceKm.toFixed(1)} km requires efficient volunteer routing`);
  }
  if (scores.demand >= 0.7) {
    parts.push(`${ngo.organizationName} has active requirements matching this food category`);
  }
  if (scores.compatibility >= 0.8) {
    parts.push(`${ngo.organizationName} explicitly accepts ${donation.category.replace('_', ' ')} donations`);
  }
  const available = ngo.capacity - ngo.currentLoad;
  if (scores.capacity >= 0.8) {
    parts.push(`Good available capacity: ${available} meals/day remaining`);
  }

  return parts.join('. ') + '.';
}

export function rankNGOs(
  donation: FoodDonation,
  ngos: NgoProfile[],
  requirements: FoodRequirement[],
): MatchResult[] {
  const results: MatchResult[] = ngos.map((ngo, i) => {
    const distanceKm = haversineDistance(
      donation.location.lat,
      donation.location.lng,
      ngo.location.lat,
      ngo.location.lng,
    );

    const urgScore = urgencyToScore(donation.urgencyLevel);
    const distScore = proximityScore(distanceKm);
    const demScore = demandScore(requirements, ngo.userId, donation.category);
    const compatScore = compatibilityScore(ngo, donation.category);
    const capScore = capacityScore(ngo, donation.quantity);

    // Weighted formula: Urgency 30%, Distance 25%, Demand 25%, Compatibility 10%, Capacity 10%
    const totalScore =
      urgScore * 0.30 +
      distScore * 0.25 +
      demScore * 0.25 +
      compatScore * 0.10 +
      capScore * 0.10;

    const scoreObj: MatchScore = {
      total: Math.round(totalScore * 100),
      urgencyScore: Math.round(urgScore * 100),
      distanceScore: Math.round(distScore * 100),
      demandScore: Math.round(demScore * 100),
      compatibilityScore: Math.round(compatScore * 100),
      capacityScore: Math.round(capScore * 100),
      distanceKm: Math.round(distanceKm * 10) / 10,
      explanation: buildExplanation(
        ngo,
        { urgency: urgScore, distance: distScore, demand: demScore, compatibility: compatScore, capacity: capScore },
        distanceKm,
        donation,
      ),
    };

    return {
      donationId: donation.id,
      ngoId: ngo.userId,
      ngoName: ngo.organizationName,
      ngoLocation: ngo.location,
      score: scoreObj,
      rank: 0,
      recommendedAt: new Date().toISOString(),
    };
  });

  // Sort by total score descending
  results.sort((a, b) => b.score.total - a.score.total);

  // Assign ranks
  results.forEach((r, i) => {
    r.rank = i + 1;
  });

  return results;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-700 bg-green-100';
  if (score >= 60) return 'text-blue-700 bg-blue-100';
  if (score >= 40) return 'text-yellow-700 bg-yellow-100';
  return 'text-red-700 bg-red-100';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Fair Match';
  return 'Poor Match';
}
