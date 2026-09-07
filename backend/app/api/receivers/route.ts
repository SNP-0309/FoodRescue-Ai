// FoodRescue AI — Receivers API
// GET /api/receivers

import { NextResponse } from 'next/server';
import prisma from '@/lib/server/database';

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const urgency = searchParams.get('urgency');
    const orgType = searchParams.get('orgType');
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};
    if (urgency) where.urgency = urgency;
    if (orgType) where.orgType = orgType;
    if (isActive !== null) where.isActive = isActive === 'true';

    const receivers = await prisma.receiver.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: [{ urgency: 'desc' }, { currentDemand: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      data: receivers.map((r: any) => ({
        ...r,
        acceptedCategories: safeParseJson(r.acceptedCategories, []),
        availableStorage: safeParseJson(r.availableStorage, []),
      })),
      meta: { total: receivers.length },
    });
  } catch (error) {
    console.error('[receivers GET]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
