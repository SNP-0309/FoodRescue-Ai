// FoodRescue AI — Volunteer Tasks API
// GET /api/volunteers/tasks

import { NextResponse } from 'next/server';
import prisma from '@/lib/server/database';

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const volunteerId = searchParams.get('volunteerId');
    const status = searchParams.get('status'); // filter by delivery status

    const where: Record<string, unknown> = {};
    if (volunteerId) where.volunteerId = volunteerId;
    if (status) where.status = status;
    // If no volunteer filter, show pending tasks available for pickup
    if (!volunteerId && !status) {
      where.status = 'pending';
      where.volunteerId = null;
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        donation: {
          include: {
            donor: { select: { id: true, name: true } },
            allocations: {
              include: {
                receiver: {
                  select: {
                    id: true, orgName: true, address: true, lat: true, lng: true,
                    contactName: true, contactPhone: true,
                  },
                },
              },
            },
          },
        },
        volunteer: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: deliveries.map((d: any) => ({
        ...d,
        donation: {
          ...d.donation,
          allergens: safeParseJson(d.donation.allergens, []),
          scoreBreakdown: safeParseJson(d.donation.scoreBreakdown, null),
        },
      })),
    });
  } catch (error) {
    console.error('[volunteers/tasks GET]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
