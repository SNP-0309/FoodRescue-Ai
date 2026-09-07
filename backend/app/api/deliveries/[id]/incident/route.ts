// FoodRescue AI — Incident Reporting
// POST /api/deliveries/:id/incident
// Reports an incident and optionally puts the entire batch on hold.

import { NextResponse } from 'next/server';
import prisma from '@/lib/server/database';
import { IncidentSchema } from '@/lib/domain/validation';
import type { DeliveryStatus } from '@/lib/domain/models';

const INCIDENT_HOLDABLE_STATUSES: DeliveryStatus[] = ['accepted', 'picked_up', 'in_transit'];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = IncidentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { volunteerId, incidentType, incidentNotes, putOnHold } = parsed.data;
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { donation: true },
    });

    if (!delivery) {
      return NextResponse.json({ success: false, error: 'Delivery not found' }, { status: 404 });
    }

    if (delivery.volunteerId !== volunteerId) {
      return NextResponse.json(
        { success: false, error: 'Only the assigned volunteer can report an incident' },
        { status: 403 }
      );
    }

    if (['delivered', 'cancelled'].includes(delivery.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot report incident on a ${delivery.status} delivery` },
        { status: 409 }
      );
    }

    const now = new Date();
    const canHold = INCIDENT_HOLDABLE_STATUSES.includes(delivery.status as DeliveryStatus);
    const newStatus = putOnHold && canHold ? 'on_hold' : delivery.status;

    const updates: Record<string, unknown> = {
      incidentAt: now,
      incidentType,
      incidentNotes,
    };

    if (putOnHold && canHold) {
      updates.status = 'on_hold';
      updates.onHoldAt = now;
    }

    const updated = await prisma.delivery.update({ where: { id }, data: updates });

    // If put on hold, also update donation status
    if (putOnHold && canHold) {
      await prisma.donation.update({
        where: { id: delivery.donationId },
        data: { status: 'on_hold' },
      });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      held: putOnHold && canHold,
      message: putOnHold && canHold
        ? 'Incident reported. Delivery and donation placed on hold.'
        : 'Incident recorded.',
    });
  } catch (error) {
    console.error('[deliveries/:id/incident]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
