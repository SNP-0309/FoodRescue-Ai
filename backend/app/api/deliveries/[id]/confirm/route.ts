// FoodRescue AI — Delivery Confirmation
// POST /api/deliveries/:id/confirm
// Requires physical confirmation at delivery point.
// Prevents duplicate confirmation.

import { NextResponse } from 'next/server';
import prisma from '@/lib/server/database';
import { DeliveryConfirmSchema } from '@/lib/domain/validation';
import { assertTransition, isConfirmable } from '@/lib/domain/delivery-state';
import { computeRemainingWindowMs } from '@/lib/domain/scoring';
import type { DeliveryStatus } from '@/lib/domain/models';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = DeliveryConfirmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { volunteerId, deliveryTemperature, receiverAccepted, recipientName, deliveryNotes } = parsed.data;
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { donation: true, allocations: true },
    });

    if (!delivery) {
      return NextResponse.json({ success: false, error: 'Delivery not found' }, { status: 404 });
    }

    // Prevent duplicate confirmation
    if (!isConfirmable(delivery.status as DeliveryStatus)) {
      if (delivery.status === 'delivered') {
        return NextResponse.json(
          { success: false, error: 'Delivery has already been confirmed — duplicate confirmation rejected' },
          { status: 409 }
        );
      }
      assertTransition(delivery.status as DeliveryStatus, 'delivered');
    }

    if (delivery.volunteerId !== volunteerId) {
      return NextResponse.json(
        { success: false, error: 'Only the assigned volunteer can confirm delivery' },
        { status: 403 }
      );
    }

    if (!receiverAccepted) {
      return NextResponse.json(
        { success: false, error: 'Receiver did not accept the delivery — cannot confirm' },
        { status: 409 }
      );
    }

    // SAFETY: Final window check at delivery
    const remainingMs = computeRemainingWindowMs(
      delivery.donation.preparedAt,
      delivery.donation.usableDuration,
      delivery.donation.expiryTime
    );

    if (remainingMs <= 0) {
      await prisma.delivery.update({ where: { id }, data: { status: 'on_hold' } });
      return NextResponse.json(
        { success: false, error: 'Redistribution window expired at delivery — delivery placed on hold' },
        { status: 409 }
      );
    }

    const deliveredAt = new Date();
    const actualMinutes = delivery.pickedUpAt
      ? Math.round((deliveredAt.getTime() - delivery.pickedUpAt.getTime()) / 60_000)
      : null;

    // Update delivery, donation, allocations, and create analytics event in transaction
    const [updatedDelivery] = await prisma.$transaction([
      prisma.delivery.update({
        where: { id },
        data: {
          status: 'delivered',
          deliveredAt,
          deliveryTemperature,
          receiverAccepted: true,
          recipientName,
          deliveryNotes,
          actualDeliveryMinutes: actualMinutes,
        },
      }),
      prisma.donation.update({
        where: { id: delivery.donationId },
        data: { status: 'delivered' },
      }),
      prisma.donationAllocation.updateMany({
        where: { deliveryId: id },
        data: { status: 'delivered', confirmedAt: deliveredAt, confirmedBy: recipientName },
      }),
      prisma.analyticsEvent.create({
        data: {
          eventType: 'delivery_confirmed',
          donationId: delivery.donationId,
          deliveryId: id,
          weightKg: delivery.donation.weightKg,
          meals: delivery.donation.quantity,
          category: delivery.donation.category,
          metadata: JSON.stringify({ volunteerId, recipientName }),
          occurredAt: deliveredAt,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: updatedDelivery,
      message: 'Delivery confirmed successfully. Analytics updated.',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid delivery state')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    console.error('[deliveries/:id/confirm]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
