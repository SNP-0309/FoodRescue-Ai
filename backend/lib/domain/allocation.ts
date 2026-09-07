// FoodRescue AI — Multi-Destination Allocation
//
// Allocates donation quantity across multiple eligible receivers.
// Never exceeds receiver demand, capacity, or volunteer capacity.
// Never allocates after the redistribution deadline.

import type { AllocationPlan, AllocationItem } from './models';
import type { MatchCandidate } from './models';

export interface AllocationInput {
  donationId: string;
  totalQuantity: number;
  totalWeightKg: number;
  eligibleReceivers: MatchCandidate[]; // already sorted by matchScore desc
  volunteerMaxCapacity?: number;
  alreadyAllocated?: number; // from previous confirmed allocations
  now?: Date;
  deadlineMs?: number; // redistribution window remaining in ms
}

/**
 * Greedy multi-destination allocation.
 * Iterates eligible receivers in score order, allocating up to each receiver's need.
 * Stops when all quantity is allocated or no eligible receivers remain.
 *
 * IMPORTANT: All constraint checks (storage, category, window) were already
 * enforced by the matching engine before this function is called.
 */
export function computeAllocation(input: AllocationInput): AllocationPlan {
  const { donationId, totalQuantity, totalWeightKg, eligibleReceivers } = input;

  let remaining = totalQuantity - (input.alreadyAllocated ?? 0);
  let volunteerRemaining = input.volunteerMaxCapacity ?? Infinity;
  const items: AllocationItem[] = [];

  // Redistribution deadline check
  if (input.deadlineMs !== undefined && input.deadlineMs <= 0) {
    return {
      donationId,
      totalQuantity,
      totalAllocated: 0,
      items: [],
      unallocated: totalQuantity,
    };
  }

  const weightPerUnit = totalWeightKg / totalQuantity;

  for (const receiver of eligibleReceivers) {
    if (remaining <= 0) break;
    if (volunteerRemaining <= 0) break;
    if (!receiver.canFulfill) continue;

    const canAllocate = Math.min(
      remaining,
      receiver.quantityToAllocate,
      volunteerRemaining
    );

    if (canAllocate <= 0) continue;

    items.push({
      receiverId: receiver.receiverId,
      receiverName: receiver.receiverName,
      quantityAllocated: canAllocate,
      weightAllocated: Math.round(canAllocate * weightPerUnit * 100) / 100,
    });

    remaining -= canAllocate;
    volunteerRemaining -= canAllocate;
  }

  const totalAllocated = totalQuantity - remaining;

  return {
    donationId,
    totalQuantity,
    totalAllocated,
    items,
    unallocated: remaining,
  };
}
