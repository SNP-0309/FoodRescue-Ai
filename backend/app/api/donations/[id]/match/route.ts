// FoodRescue AI — Match Endpoint
// POST /api/donations/:id/match

import { NextResponse } from 'next/server';
import prisma from '@/lib/server/database';
import { runMatchingEngine } from '@/lib/domain/matching';
import { computeAllocation } from '@/lib/domain/allocation';
import { MatchRequestSchema } from '@/lib/domain/validation';
import { computeRemainingWindowMs } from '@/lib/domain/scoring';
import type { FoodCategory, StorageCondition, OrgType, UrgencyLevel } from '@/lib/domain/models';

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = MatchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { maxDistanceKm } = parsed.data;

    const donation = await prisma.donation.findUnique({ where: { id } });

    if (!donation) {
      return NextResponse.json({ success: false, error: 'Donation not found' }, { status: 404 });
    }

    if (!['eligible', 'needs_review', 'matched'].includes(donation.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot match donation in status: ${donation.status}. Only eligible donations can be matched.`,
        },
        { status: 409 }
      );
    }

    // Check redistribution window
    const remainingMs = computeRemainingWindowMs(
      donation.preparedAt, donation.usableDuration, donation.expiryTime
    );
    if (remainingMs <= 0) {
      await prisma.donation.update({ where: { id }, data: { status: 'blocked' } });
      return NextResponse.json(
        { success: false, error: 'Redistribution window has expired — donation blocked' },
        { status: 409 }
      );
    }

    // Load all active receivers
    const receivers = await prisma.receiver.findMany({
      where: { isActive: true },
      include: { user: { select: { name: true } } },
    });

    const receiverInputs = receivers.map((r: any) => ({
      receiverId: r.id,
      orgName: r.orgName,
      orgType: r.orgType as OrgType,
      lat: r.lat,
      lng: r.lng,
      address: r.address,
      currentDemand: r.currentDemand,
      maxCapacity: r.maxCapacity,
      acceptedCategories: safeParseJson<string[]>(r.acceptedCategories, []),
      availableStorage: safeParseJson<string[]>(r.availableStorage, []),
      urgency: r.urgency as UrgencyLevel,
      canArrangePickup: r.canArrangePickup,
      isActive: r.isActive,
    }));

    const matchResult = runMatchingEngine(
      {
        donationId: donation.id,
        pickupLat: donation.pickupLat,
        pickupLng: donation.pickupLng,
        category: donation.category as FoodCategory,
        storageCondition: donation.storageCondition as StorageCondition,
        quantity: donation.quantity,
        weightKg: donation.weightKg,
        preparedAt: donation.preparedAt,
        usableDurationMinutes: donation.usableDuration,
        expiryTime: donation.expiryTime,
      },
      receiverInputs,
      undefined,
      maxDistanceKm
    );

    // Compute allocation plan
    const allocationPlan = computeAllocation({
      donationId: donation.id,
      totalQuantity: donation.quantity,
      totalWeightKg: donation.weightKg,
      eligibleReceivers: matchResult.eligible,
      deadlineMs: remainingMs,
    });

    // Update donation status
    if (matchResult.eligible.length > 0) {
      await prisma.donation.update({ where: { id }, data: { status: 'matched' } });
    }

    return NextResponse.json({
      success: true,
      data: {
        match: matchResult,
        allocation: allocationPlan,
        remainingWindowMinutes: Math.round(remainingMs / 60_000),
        travelTimeDisclaimer:
          'Travel times are conservative estimates based on straight-line distance. ' +
          'They are NOT based on live traffic data or actual road routes.',
      },
    });
  } catch (error) {
    console.error('[donations/:id/match]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
