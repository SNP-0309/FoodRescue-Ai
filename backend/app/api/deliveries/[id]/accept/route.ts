// FoodRescue AI — Delivery Actions: Accept
// POST /api/deliveries/:id/accept

import { NextResponse } from 'next/server';
import prisma from '@/lib/server/database';
import { AcceptDeliverySchema } from '@/lib/domain/validation';
import { assertTransition } from '@/lib/domain/delivery-state';
import type { DeliveryStatus } from '@/lib/domain/models';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = AcceptDeliverySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { volunteerId, currentLat, currentLng } = parsed.data;
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { donation: true },
    });

    if (!delivery) {
      return NextResponse.json({ success: false, error: 'Delivery not found' }, { status: 404 });
    }

    assertTransition(delivery.status as DeliveryStatus, 'accepted');

    // Validate volunteer
    const volunteer = await prisma.volunteer.findUnique({ where: { id: volunteerId } });
    if (!volunteer) {
      return NextResponse.json({ success: false, error: 'Volunteer not found' }, { status: 404 });
    }
    if (!volunteer.isAvailable) {
      return NextResponse.json({ success: false, error: 'Volunteer is not available' }, { status: 409 });
    }

    const [updated] = await prisma.$transaction([
      prisma.delivery.update({
        where: { id },
        data: {
          status: 'accepted',
          volunteerId,
        },
      }),
      prisma.volunteer.update({
        where: { id: volunteerId },
        data: { currentLat, currentLng },
      }),
    ]);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid delivery state')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    console.error('[deliveries/:id/accept]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
