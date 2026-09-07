// FoodRescue AI — Receiver Profile Update
// PATCH /api/receivers/:id

import { NextResponse } from 'next/server';
import prisma from '@/lib/server/database';
import { UpsertReceiverSchema } from '@/lib/domain/validation';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpsertReceiverSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const receiver = await prisma.receiver.findUnique({ where: { id } });

    if (!receiver) {
      return NextResponse.json({ success: false, error: 'Receiver not found' }, { status: 404 });
    }

    const updated = await prisma.receiver.update({
      where: { id },
      data: {
        orgName: input.orgName,
        orgType: input.orgType,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        currentDemand: input.currentDemand,
        maxCapacity: input.maxCapacity,
        acceptedCategories: JSON.stringify(input.acceptedCategories),
        availableStorage: JSON.stringify(input.availableStorage),
        lat: input.lat,
        lng: input.lng,
        address: input.address,
        urgency: input.urgency,
        canArrangePickup: input.canArrangePickup,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        acceptedCategories: input.acceptedCategories,
        availableStorage: input.availableStorage,
      },
    });
  } catch (error) {
    console.error('[receivers/:id PATCH]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
