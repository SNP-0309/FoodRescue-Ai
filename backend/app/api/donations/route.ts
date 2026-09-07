// FoodRescue AI — Donations API
// GET  /api/donations — list donations (with optional filters)
// POST /api/donations — create a new donation

import { NextResponse } from 'next/server';
import prisma from '@/lib/server/database';
import { CreateDonationSchema } from '@/lib/domain/validation';
import { computeSuitabilityScore, computeRemainingWindowMs } from '@/lib/domain/scoring';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const donorId = searchParams.get('donorId');
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')));

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (donorId) where.donorId = donorId;

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        include: {
          donor: { select: { id: true, name: true, email: true } },
          allocations: {
            include: { receiver: { select: { orgName: true, address: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.donation.count({ where }),
    ]);

    const enriched = donations.map((d: any) => ({
      ...d,
      allergens: safeParseJson(d.allergens, []),
      scoreBreakdown: safeParseJson(d.scoreBreakdown, null),
      remainingWindowMinutes: Math.max(
        0,
        Math.round(
          computeRemainingWindowMs(d.preparedAt, d.usableDuration, d.expiryTime) / 60_000
        )
      ),
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[donations GET]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreateDonationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // Validate donor exists
    const donor = await prisma.user.findFirst({
      where: { id: input.donorId, role: 'donor' },
    });
    if (!donor) {
      return NextResponse.json(
        { success: false, error: 'Donor not found' },
        { status: 404 }
      );
    }

    // Compute initial suitability score (no screening yet)
    const scoreBreakdown = computeSuitabilityScore({
      screeningResult: 'UNAVAILABLE',
      preparedAt: new Date(input.preparedAt),
      usableDuration: input.usableDuration,
      expiryTime: new Date(input.expiryTime),
      category: input.category,
      storageCondition: input.storageCondition,
      temperature: input.temperature,
      temperatureTime: input.temperatureTime ? new Date(input.temperatureTime) : undefined,
      packagingCondition: input.packagingCondition,
      hasPhoto: !!input.photoUrl,
      hasAllergens: input.allergens.length > 0,
      hasHandlingNotes: !!input.handlingNotes,
      hasTemperature: input.temperature !== undefined,
    });

    const donation = await prisma.donation.create({
      data: {
        donorId: input.donorId,
        foodName: input.foodName,
        category: input.category,
        quantity: input.quantity,
        weightKg: input.weightKg,
        description: input.description,
        allergens: JSON.stringify(input.allergens),
        handlingNotes: input.handlingNotes,
        preparedAt: new Date(input.preparedAt),
        packagingTime: new Date(input.packagingTime),
        usableDuration: input.usableDuration,
        expiryTime: new Date(input.expiryTime),
        storageCondition: input.storageCondition,
        temperature: input.temperature,
        temperatureTime: input.temperatureTime ? new Date(input.temperatureTime) : undefined,
        packagingCondition: input.packagingCondition,
        pickupLat: input.pickupLat,
        pickupLng: input.pickupLng,
        pickupAddress: input.pickupAddress,
        photoUrl: input.photoUrl,
        screeningResult: 'UNAVAILABLE',
        suitabilityScore: scoreBreakdown.total,
        scoreBreakdown: JSON.stringify(scoreBreakdown),
        status: 'posted',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...donation,
          allergens: input.allergens,
          scoreBreakdown,
          remainingWindowMinutes: Math.max(
            0,
            Math.round(
              computeRemainingWindowMs(
                new Date(input.preparedAt), input.usableDuration, new Date(input.expiryTime)
              ) / 60_000
            )
          ),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[donations POST]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}
