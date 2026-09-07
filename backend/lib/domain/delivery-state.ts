// FoodRescue AI — Delivery State Machine
//
// Enforces valid state transitions for Delivery records.

import type { DeliveryStatus } from './models';

// Valid state transitions
const VALID_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending:    ['accepted', 'cancelled'],
  accepted:   ['picked_up', 'cancelled', 'on_hold'],
  picked_up:  ['in_transit', 'on_hold', 'cancelled'],
  in_transit: ['delivered', 'on_hold', 'cancelled'],
  delivered:  [], // terminal state — no further transitions
  on_hold:    ['accepted', 'cancelled'], // can resume or cancel
  cancelled:  [], // terminal state
};

export function canTransition(
  current: DeliveryStatus,
  next: DeliveryStatus
): boolean {
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
}

export function assertTransition(
  current: DeliveryStatus,
  next: DeliveryStatus
): void {
  if (!canTransition(current, next)) {
    throw new Error(
      `Invalid delivery state transition: ${current} → ${next}. ` +
      `Allowed from ${current}: [${VALID_TRANSITIONS[current]?.join(', ') ?? 'none'}]`
    );
  }
}

/**
 * Returns whether a delivery in this status can still be confirmed.
 * Prevents duplicate confirmation.
 */
export function isConfirmable(status: DeliveryStatus): boolean {
  return status === 'in_transit';
}

export function isTerminal(status: DeliveryStatus): boolean {
  return status === 'delivered' || status === 'cancelled';
}
