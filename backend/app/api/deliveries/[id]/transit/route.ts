// FoodRescue AI — Delivery Transit
// POST /api/deliveries/:id/transit

import { NextResponse } from 'next/server';
import prisma from '@/lib/server/database';
import { TransitSchema } from '@/lib/domain/validation';
import { assertTransition } from '@/lib/domain/delivery-state';
import type { DeliveryStatus } from '@/lib/domain/models';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = TransitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (!delivery) return NextResponse.json({ success: false, error: 'Delivery not found' }, { status: 404 });

    assertTransition(delivery.status as DeliveryStatus, 'in_transit');

    if (delivery.volunteerId !== parsed.data.volunteerId) {
      return NextResponse.json({ success: false, error: 'Only the assigned volunteer can update transit' }, { status: 403 });
    }

    const updated = await prisma.delivery.update({
      where: { id },
      data: { status: 'in_transit' },
    });

    await prisma.donation.update({
      where: { id: delivery.donationId },
      data: { status: 'in_transit' },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid delivery state')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    console.error('[deliveries/:id/transit]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
