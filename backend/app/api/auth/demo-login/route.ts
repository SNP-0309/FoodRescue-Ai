// FoodRescue AI — Demo Login API
// POST /api/auth/demo-login
// Returns a mock session token for prototype use.
// This is NOT production authentication.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/server/database';

const DemoLoginSchema = z.object({
  role: z.enum(['donor', 'receiver', 'volunteer']),
  userId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = DemoLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { role, userId } = parsed.data;

    // Find a demo user with this role
    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { role },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: `No demo user found for role: ${role}` },
        { status: 404 }
      );
    }

    // For the prototype, return a simple mock token
    // In production, replace with proper JWT / OAuth
    const mockToken = Buffer.from(
      JSON.stringify({ userId: user.id, role: user.role, demo: true, iat: Date.now() })
    ).toString('base64');

    // Get role-specific profile
    let profile = null;
    if (role === 'receiver') {
      profile = await prisma.receiver.findUnique({ where: { userId: user.id } });
    } else if (role === 'volunteer') {
      profile = await prisma.volunteer.findUnique({ where: { userId: user.id } });
    }

    return NextResponse.json({
      success: true,
      data: {
        token: mockToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        profile,
        demo: true,
        notice: 'This is a demo session. Data is sample data only.',
      },
    });
  } catch (error) {
    console.error('[demo-login]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
