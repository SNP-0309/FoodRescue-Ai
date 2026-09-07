// FoodRescue AI — Delivery Actions: Pickup Confirmation
// POST /api/deliveries/:id/pickup
// Requires physical confirmation at pickup point.

import { NextResponse } from 'next/server';
import prisma from '@/lib/server/database';
import { PickupConfirmSchema } from '@/lib/domain/validation';
import { assertTransition } from '@/lib/domain/delivery-state';
import { computeRemainingWindowMs } from '@/lib/domain/scoring';
import type { DeliveryStatus } from '@/lib/domain/models';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = PickupConfirmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { volunteerId, pickupTemperature, pickupPackagingOk, pickupNotes } = parsed.data;
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { donation: true },
    });

    if (!delivery) {
      return NextResponse.json({ success: false, error: 'Delivery not found' }, { status: 404 });
    }

    assertTransition(delivery.status as DeliveryStatus, 'picked_up');

    if (delivery.volunteerId !== volunteerId) {
      return NextResponse.json(
        { success: false, error: 'Only the assigned volunteer can confirm pickup' },
        { status: 403 }
      );
    }

    // SAFETY: Re-check redistribution window at pickup
    const remainingMs = computeRemainingWindowMs(
      delivery.donation.preparedAt,
      delivery.donation.usableDuration,
      delivery.donation.expiryTime
    );

    if (remainingMs <= 0) {
      await prisma.delivery.update({ where: { id }, data: { status: 'on_hold' } });
      await prisma.donation.update({ where: { id: delivery.donationId }, data: { status: 'blocked' } });
      return NextResponse.json(
        { success: false, error: 'Redistribution window expired at pickup — delivery placed on hold' },
        { status: 409 }
      );
    }

    // SAFETY: Block pickup if packaging is reported as not OK
    if (!pickupPackagingOk) {
      await prisma.delivery.update({ where: { id }, data: { status: 'on_hold' } });
      return NextResponse.json(
        { success: false, error: 'Packaging not OK — delivery placed on hold for manual review' },
        { status: 409 }
      );
    }

    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        status: 'picked_up',
        pickedUpAt: new Date(),
        pickupTemperature,
        pickupPackagingOk,
        pickupNotes,
      },
    });

    await prisma.donation.update({
      where: { id: delivery.donationId },
      data: { status: 'picked_up' },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      remainingWindowMinutes: Math.round(remainingMs / 60_000),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid delivery state')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    console.error('[deliveries/:id/pickup]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
