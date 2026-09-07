// FoodRescue AI — Analytics API
// GET /api/analytics
// Only counts confirmed deliveries in impact metrics.

import { NextResponse } from 'next/server';
import prisma from '@/lib/server/database';
import type { AnalyticsSummary, DayChartEntry } from '@/lib/domain/models';

export async function GET() {
  try {
    // ── Only count confirmed deliveries ──────────────────────────────────────
    const confirmedEvents = await prisma.analyticsEvent.findMany({
      where: { eventType: 'delivery_confirmed' },
      orderBy: { occurredAt: 'asc' },
    });

    const totalWeightRescuedKg = confirmedEvents.reduce((sum: number, e: any) => sum + (e.weightKg ?? 0), 0);
    const totalMealsRedistributed = confirmedEvents.reduce((sum: number, e: any) => sum + (e.meals ?? 0), 0);

    // Estimated waste prevented: every kg rescued = 1 kg waste prevented (conservative)
    const estimatedWastePreventedKg = totalWeightRescuedKg;

    // Active donors/receivers
    const [activeDonors, activeReceivers] = await Promise.all([
      prisma.user.count({ where: { role: 'donor' } }),
      prisma.receiver.count({ where: { isActive: true } }),
    ]);

    // Successful deliveries count
    const successfulDeliveries = await prisma.delivery.count({ where: { status: 'delivered' } });

    // Average actual delivery time (minutes)
    const deliveries = await prisma.delivery.findMany({
      where: { status: 'delivered', actualDeliveryMinutes: { not: null } },
      select: { actualDeliveryMinutes: true },
    });
    const averageDeliveryMinutes =
      deliveries.length > 0
        ? Math.round(
            deliveries.reduce((sum: number, d: any) => sum + (d.actualDeliveryMinutes ?? 0), 0) / deliveries.length
          )
        : 0;

    // High-risk food rejected
    const highRiskRejected = await prisma.donation.count({ where: { status: 'blocked' } });

    // Meals by category
    const categoryBreakdown = confirmedEvents.reduce<Record<string, number>>((acc: Record<string, number>, e: any) => {
      if (e.category) {
        acc[e.category] = (acc[e.category] ?? 0) + (e.meals ?? 0);
      }
      return acc;
    }, {});

    // 7-day chart
    const sevenDayChart: DayChartEntry[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayEvents = confirmedEvents.filter((e: any) => {
        const eventDate = new Date(e.occurredAt).toISOString().split('T')[0];
        return eventDate === dateStr;
      });

      sevenDayChart.push({
        date: dateStr,
        mealsDelivered: dayEvents.reduce((sum: number, e: any) => sum + (e.meals ?? 0), 0),
        weightKg: dayEvents.reduce((sum: number, e: any) => sum + (e.weightKg ?? 0), 0),
      });
    }

    const summary: AnalyticsSummary = {
      totalWeightRescuedKg: Math.round(totalWeightRescuedKg * 100) / 100,
      totalMealsRedistributed,
      estimatedWastePreventedKg: Math.round(estimatedWastePreventedKg * 100) / 100,
      activeDonors,
      activeReceivers,
      successfulDeliveries,
      averageDeliveryMinutes,
      highRiskFoodRejected: highRiskRejected,
      mealsByCategory: categoryBreakdown,
      sevenDayChart,
    };

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error('[analytics GET]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
