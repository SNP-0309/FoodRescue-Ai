// FoodRescue AI — Single Donation API
// GET /api/donations/:id

import { NextResponse } from 'next/server';
import prisma from '@/lib/server/database';
import { computeRemainingWindowMs } from '@/lib/domain/scoring';

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const donation = await prisma.donation.findUnique({
      where: { id },
      include: {
        donor: { select: { id: true, name: true, email: true } },
        allocations: {
          include: {
            receiver: { select: { id: true, orgName: true, address: true, lat: true, lng: true } },
          },
        },
        deliveries: {
          include: {
            volunteer: {
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!donation) {
      return NextResponse.json({ success: false, error: 'Donation not found' }, { status: 404 });
    }

    const remainingMs = computeRemainingWindowMs(
      donation.preparedAt, donation.usableDuration, donation.expiryTime
    );

    return NextResponse.json({
      success: true,
      data: {
        ...donation,
        allergens: safeParseJson(donation.allergens, []),
        scoreBreakdown: safeParseJson(donation.scoreBreakdown, null),
        remainingWindowMs: Math.max(0, remainingMs),
        remainingWindowMinutes: Math.max(0, Math.round(remainingMs / 60_000)),
        remainingWindowHours: Math.max(0, Math.round(remainingMs / 3_600_000 * 10) / 10),
        isExpired: remainingMs <= 0,
      },
    });
  } catch (error) {
    console.error('[donations/:id GET]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
