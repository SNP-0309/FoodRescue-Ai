// FoodRescue AI — Visual Screening Endpoint
// POST /api/donations/:id/screen
//
// SAFETY NOTICE: AI visual screening is a PRELIMINARY signal only.
// It does NOT certify food as safe to eat.
// See lib/ai/visual-screening.ts for full disclaimer.

import { NextResponse } from 'next/server';
import prisma from '@/lib/server/database';
import { runVisualScreening } from '@/lib/ai/visual-screening';
import { computeSuitabilityScore, determineDonationStatus } from '@/lib/domain/scoring';
import type { ScreeningOutput } from '@/lib/domain/models';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const donation = await prisma.donation.findUnique({ where: { id } });

    if (!donation) {
      return NextResponse.json({ success: false, error: 'Donation not found' }, { status: 404 });
    }

    if (['blocked', 'delivered', 'rejected'].includes(donation.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot screen donation in status: ${donation.status}` },
        { status: 409 }
      );
    }

    let screeningOutput: ScreeningOutput = {
      result: 'UNAVAILABLE',
      notes: 'No image available for screening.',
      timestamp: new Date().toISOString(),
    };

    // Run AI screening if photo is available
    if (donation.photoUrl) {
      // For production: fetch the image and convert to base64
      // For prototype: the photoUrl may be a data URI (base64) or remote URL
      try {
        if (donation.photoUrl.startsWith('data:')) {
          // Already a base64 data URI
          const [header, base64] = donation.photoUrl.split(',');
          const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
          screeningOutput = await runVisualScreening(base64, mimeType);
        } else {
          // Remote URL — fetch and convert
          const response = await fetch(donation.photoUrl);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const mimeType = response.headers.get('content-type') ?? 'image/jpeg';
            screeningOutput = await runVisualScreening(base64, mimeType);
          } else {
            screeningOutput = {
              result: 'UNAVAILABLE',
              notes: 'Could not fetch image for screening.',
              timestamp: new Date().toISOString(),
            };
          }
        }
      } catch (fetchErr) {
        console.error('[screen] Image fetch error:', fetchErr);
        screeningOutput = {
          result: 'UNAVAILABLE',
          notes: 'Image processing failed — food requires manual review.',
          timestamp: new Date().toISOString(),
        };
      }
    }

    // Recompute suitability score with new screening result
    const scoreBreakdown = computeSuitabilityScore({
      screeningResult: screeningOutput.result,
      preparedAt: donation.preparedAt,
      usableDuration: donation.usableDuration,
      expiryTime: donation.expiryTime,
      category: donation.category as never,
      storageCondition: donation.storageCondition as never,
      temperature: donation.temperature ?? undefined,
      temperatureTime: donation.temperatureTime ?? undefined,
      packagingCondition: donation.packagingCondition as never,
      hasPhoto: !!donation.photoUrl,
      hasAllergens: (() => { try { return JSON.parse(donation.allergens).length > 0; } catch { return false; } })(),
      hasHandlingNotes: !!donation.handlingNotes,
      hasTemperature: donation.temperature !== null,
    });

    const newStatus = determineDonationStatus(scoreBreakdown, screeningOutput.result);

    const updated = await prisma.donation.update({
      where: { id },
      data: {
        screeningResult: screeningOutput.result,
        screeningNotes: screeningOutput.notes,
        screeningAt: new Date(screeningOutput.timestamp),
        suitabilityScore: scoreBreakdown.total,
        scoreBreakdown: JSON.stringify(scoreBreakdown),
        status: newStatus === 'eligible' ? 'eligible'
              : newStatus === 'needs_review' ? 'needs_review'
              : 'blocked',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        screeningResult: screeningOutput.result,
        screeningNotes: screeningOutput.notes,
        screeningAt: screeningOutput.timestamp,
        modelUsed: screeningOutput.modelUsed,
        suitabilityScore: scoreBreakdown.total,
        scoreBreakdown,
        status: updated.status,
        // SAFETY NOTICE displayed to caller
        safetyNotice: 'AI does not certify food as safe to eat. This is a preliminary visual screening signal only.',
      },
    });
  } catch (error) {
    console.error('[donations/:id/screen]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
