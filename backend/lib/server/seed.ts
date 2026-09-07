// FoodRescue AI — Seed Data
// NOTE: This file creates SAMPLE / DEMO data only.
// All data is clearly marked as demo in the database.
// Do not use this data for real food redistribution decisions.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FoodRescue AI demo data...');
  console.log('ℹ️  All data below is SAMPLE DATA for demonstration purposes only.');

  // ── Clean existing data ────────────────────────────────────────────────────
  await prisma.analyticsEvent.deleteMany();
  await prisma.donationAllocation.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.volunteer.deleteMany();
  await prisma.receiver.deleteMany();
  await prisma.user.deleteMany();

  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3_600_000);
  const minutesFromNow = (m: number) => new Date(now.getTime() + m * 60_000);

  // ── Users (Donors) ────────────────────────────────────────────────────────
  const donor1 = await prisma.user.create({
    data: {
      id: 'demo-donor-1',
      email: 'restaurant.green@demo.foodrescue',
      name: 'Green Leaf Restaurant [DEMO]',
      role: 'donor',
    },
  });
  const donor2 = await prisma.user.create({
    data: {
      id: 'demo-donor-2',
      email: 'bakery.sunrise@demo.foodrescue',
      name: 'Sunrise Bakery [DEMO]',
      role: 'donor',
    },
  });
  const donor3 = await prisma.user.create({
    data: {
      id: 'demo-donor-3',
      email: 'hotel.grand@demo.foodrescue',
      name: 'Grand Meridian Hotel [DEMO]',
      role: 'donor',
    },
  });

  // ── Users (Receivers) ────────────────────────────────────────────────────
  const recv1User = await prisma.user.create({
    data: { id: 'demo-recv-1', email: 'citycare@demo.foodrescue', name: 'CityCare NGO [DEMO]', role: 'receiver' },
  });
  const recv2User = await prisma.user.create({
    data: { id: 'demo-recv-2', email: 'sunrise.shelter@demo.foodrescue', name: 'Sunrise Shelter [DEMO]', role: 'receiver' },
  });
  const recv3User = await prisma.user.create({
    data: { id: 'demo-recv-3', email: 'community.kitchen@demo.foodrescue', name: 'Community Kitchen Central [DEMO]', role: 'receiver' },
  });
  const recv4User = await prisma.user.create({
    data: { id: 'demo-recv-4', email: 'foodbank.west@demo.foodrescue', name: 'West End Food Bank [DEMO]', role: 'receiver' },
  });

  // ── Users (Volunteers) ───────────────────────────────────────────────────
  const vol1User = await prisma.user.create({
    data: { id: 'demo-vol-1', email: 'amir.volunteer@demo.foodrescue', name: 'Amir Hassan [DEMO]', role: 'volunteer' },
  });
  const vol2User = await prisma.user.create({
    data: { id: 'demo-vol-2', email: 'priya.volunteer@demo.foodrescue', name: 'Priya Nair [DEMO]', role: 'volunteer' },
  });

  // ── Receivers ────────────────────────────────────────────────────────────
  const recv1 = await prisma.receiver.create({
    data: {
      id: 'demo-receiver-1',
      userId: recv1User.id,
      orgName: 'CityCare NGO [DEMO]',
      orgType: 'ngo',
      contactName: 'Meera Sharma',
      contactPhone: '+91-9876543210',
      currentDemand: 150,
      maxCapacity: 200,
      acceptedCategories: JSON.stringify(['cooked_meal', 'raw_produce', 'packaged', 'bakery']),
      availableStorage: JSON.stringify(['room_temp', 'refrigerated']),
      lat: 12.9716,
      lng: 77.5946,
      address: '14 MG Road, Bengaluru [DEMO]',
      urgency: 'high',
      canArrangePickup: false,
      isActive: true,
    },
  });

  const recv2 = await prisma.receiver.create({
    data: {
      id: 'demo-receiver-2',
      userId: recv2User.id,
      orgName: 'Sunrise Shelter [DEMO]',
      orgType: 'shelter',
      contactName: 'David Raj',
      contactPhone: '+91-9123456789',
      currentDemand: 60,
      maxCapacity: 80,
      acceptedCategories: JSON.stringify(['cooked_meal', 'packaged', 'beverages']),
      availableStorage: JSON.stringify(['room_temp', 'hot_hold']),
      lat: 12.9352,
      lng: 77.6245,
      address: '7 Koramangala 4th Block, Bengaluru [DEMO]',
      urgency: 'critical',
      canArrangePickup: true,
      isActive: true,
    },
  });

  const recv3 = await prisma.receiver.create({
    data: {
      id: 'demo-receiver-3',
      userId: recv3User.id,
      orgName: 'Community Kitchen Central [DEMO]',
      orgType: 'community_kitchen',
      contactName: 'Fatima Khan',
      currentDemand: 80,
      maxCapacity: 120,
      acceptedCategories: JSON.stringify(['cooked_meal', 'raw_produce', 'dairy', 'bakery']),
      availableStorage: JSON.stringify(['room_temp', 'refrigerated', 'frozen']),
      lat: 12.9822,
      lng: 77.5750,
      address: '22 Sadashivanagar, Bengaluru [DEMO]',
      urgency: 'medium',
      canArrangePickup: false,
      isActive: true,
    },
  });

  const recv4 = await prisma.receiver.create({
    data: {
      id: 'demo-receiver-4',
      userId: recv4User.id,
      orgName: 'West End Food Bank [DEMO]',
      orgType: 'food_bank',
      contactName: 'Samuel Kurian',
      currentDemand: 200,
      maxCapacity: 500,
      acceptedCategories: JSON.stringify(['packaged', 'beverages', 'raw_produce', 'dairy']),
      availableStorage: JSON.stringify(['room_temp', 'refrigerated', 'frozen']),
      lat: 12.9611,
      lng: 77.5553,
      address: '8 Rajajinagar, Bengaluru [DEMO]',
      urgency: 'low',
      canArrangePickup: true,
      isActive: true,
    },
  });

  // ── Volunteers ───────────────────────────────────────────────────────────
  const vol1 = await prisma.volunteer.create({
    data: {
      id: 'demo-volunteer-1',
      userId: vol1User.id,
      vehicleType: 'van',
      maxMealCapacity: 100,
      storageTypes: JSON.stringify(['room_temp', 'refrigerated', 'hot_hold']),
      isAvailable: true,
      currentLat: 12.9716,
      currentLng: 77.5946,
    },
  });

  const vol2 = await prisma.volunteer.create({
    data: {
      id: 'demo-volunteer-2',
      userId: vol2User.id,
      vehicleType: 'motorcycle',
      maxMealCapacity: 20,
      storageTypes: JSON.stringify(['room_temp']),
      isAvailable: true,
      currentLat: 12.9352,
      currentLng: 77.6245,
    },
  });

  // ── Donation 1: Eligible cooked meal ─────────────────────────────────────
  const donation1 = await prisma.donation.create({
    data: {
      id: 'demo-donation-1',
      donorId: donor1.id,
      foodName: 'Vegetable Biryani [DEMO]',
      category: 'cooked_meal',
      quantity: 100,
      weightKg: 25,
      description: 'Freshly cooked vegetable biryani, no onion/garlic [DEMO]',
      allergens: JSON.stringify(['gluten']),
      handlingNotes: 'Keep covered. Serve within 4 hours of pickup.',
      preparedAt: hoursAgo(1),
      packagingTime: hoursAgo(0.5),
      usableDuration: 240,
      expiryTime: hoursFromNow(3),
      storageCondition: 'hot_hold',
      temperature: 72,
      temperatureTime: hoursAgo(0.3),
      packagingCondition: 'intact',
      pickupLat: 12.9716,
      pickupLng: 77.5946,
      pickupAddress: 'Green Leaf Restaurant, 14 MG Road, Bengaluru [DEMO]',
      screeningResult: 'CLEAR',
      screeningNotes: 'Visual screening shows fresh, properly packaged biryani.',
      screeningAt: hoursAgo(0.4),
      suitabilityScore: 78,
      scoreBreakdown: JSON.stringify({ total: 78, blockers: [], warnings: [] }),
      status: 'eligible',
    },
  });

  // ── Donation 2: Needs manual review (UNCERTAIN screening) ────────────────
  const donation2 = await prisma.donation.create({
    data: {
      id: 'demo-donation-2',
      donorId: donor2.id,
      foodName: 'Assorted Pastries [DEMO]',
      category: 'bakery',
      quantity: 40,
      weightKg: 8,
      description: 'Mixed pastries from morning batch [DEMO]',
      allergens: JSON.stringify(['gluten', 'dairy', 'eggs']),
      preparedAt: hoursAgo(4),
      packagingTime: hoursAgo(3.5),
      usableDuration: 480,
      expiryTime: hoursFromNow(4),
      storageCondition: 'room_temp',
      packagingCondition: 'minor_damage',
      pickupLat: 12.9450,
      pickupLng: 77.6100,
      pickupAddress: 'Sunrise Bakery, Indiranagar, Bengaluru [DEMO]',
      screeningResult: 'UNCERTAIN',
      screeningNotes: 'Image quality poor — cannot confirm freshness visually.',
      screeningAt: hoursAgo(3),
      suitabilityScore: 45,
      scoreBreakdown: JSON.stringify({
        total: 45,
        blockers: ['Manual review required before food can be redistributed (AI result was UNCERTAIN)'],
        warnings: ['Minor packaging damage noted'],
      }),
      status: 'needs_review',
    },
  });

  // ── Donation 3: Blocked (damaged packaging + spoilage concern) ───────────
  const donation3 = await prisma.donation.create({
    data: {
      id: 'demo-donation-3',
      donorId: donor3.id,
      foodName: 'Mixed Salad [DEMO]',
      category: 'raw_produce',
      quantity: 30,
      weightKg: 6,
      description: 'Caesar salad from lunch service [DEMO]',
      allergens: JSON.stringify(['dairy', 'gluten']),
      preparedAt: hoursAgo(6),
      packagingTime: hoursAgo(5.5),
      usableDuration: 180,
      expiryTime: hoursAgo(2), // EXPIRED
      storageCondition: 'refrigerated',
      temperature: 14,
      temperatureTime: hoursAgo(1),
      packagingCondition: 'damaged',
      pickupLat: 12.9700,
      pickupLng: 77.6000,
      pickupAddress: 'Grand Meridian Hotel, UB City, Bengaluru [DEMO]',
      screeningResult: 'CONCERN',
      screeningNotes: 'Visible wilting and discolouration detected.',
      screeningAt: hoursAgo(1),
      suitabilityScore: 8,
      scoreBreakdown: JSON.stringify({
        total: 8,
        blockers: [
          'Redistribution window has expired — food must not be redistributed',
          'Packaging is damaged — food must not be redistributed',
          'AI visual screening flagged a CONCERN',
          'Temperature (14°C) exceeds safe refrigeration range',
        ],
        warnings: [],
      }),
      status: 'blocked',
    },
  });

  // ── Donation 4: Multi-destination (100 meals) ────────────────────────────
  const donation4 = await prisma.donation.create({
    data: {
      id: 'demo-donation-4',
      donorId: donor3.id,
      foodName: 'Hotel Buffet Surplus [DEMO]',
      category: 'cooked_meal',
      quantity: 100,
      weightKg: 30,
      description: 'Variety of dishes from hotel buffet — packaged in individual containers [DEMO]',
      allergens: JSON.stringify(['gluten', 'dairy', 'nuts']),
      handlingNotes: 'Contains multiple items. Check each container.',
      preparedAt: hoursAgo(0.5),
      packagingTime: minutesFromNow(-20),
      usableDuration: 360,
      expiryTime: hoursFromNow(5),
      storageCondition: 'hot_hold',
      temperature: 68,
      temperatureTime: minutesFromNow(-15),
      packagingCondition: 'intact',
      pickupLat: 12.9700,
      pickupLng: 77.6000,
      pickupAddress: 'Grand Meridian Hotel, UB City, Bengaluru [DEMO]',
      screeningResult: 'CLEAR',
      screeningNotes: 'Food appears fresh and well-packaged.',
      screeningAt: minutesFromNow(-10),
      suitabilityScore: 82,
      scoreBreakdown: JSON.stringify({ total: 82, blockers: [], warnings: [] }),
      status: 'matched',
      totalAllocated: 100,
    },
  });

  // Allocations for donation4
  await prisma.donationAllocation.create({
    data: {
      id: 'demo-alloc-1',
      donationId: donation4.id,
      receiverId: recv1.id,
      quantityAllocated: 60,
      weightAllocated: 18,
      status: 'pending',
    },
  });
  await prisma.donationAllocation.create({
    data: {
      id: 'demo-alloc-2',
      donationId: donation4.id,
      receiverId: recv2.id,
      quantityAllocated: 40,
      weightAllocated: 12,
      status: 'pending',
    },
  });

  // ── Completed delivery (donation 1 historical equivalent) ────────────────
  const donationCompleted = await prisma.donation.create({
    data: {
      id: 'demo-donation-5',
      donorId: donor1.id,
      foodName: 'Paneer Curry [DEMO]',
      category: 'cooked_meal',
      quantity: 50,
      weightKg: 12,
      allergens: JSON.stringify(['dairy']),
      preparedAt: hoursAgo(8),
      packagingTime: hoursAgo(7.5),
      usableDuration: 300,
      expiryTime: hoursAgo(3),
      storageCondition: 'hot_hold',
      temperature: 70,
      temperatureTime: hoursAgo(7),
      packagingCondition: 'intact',
      pickupLat: 12.9716,
      pickupLng: 77.5946,
      pickupAddress: 'Green Leaf Restaurant, 14 MG Road, Bengaluru [DEMO]',
      screeningResult: 'CLEAR',
      suitabilityScore: 80,
      scoreBreakdown: JSON.stringify({ total: 80, blockers: [], warnings: [] }),
      status: 'delivered',
      totalAllocated: 50,
    },
  });

  const deliveryCompleted = await prisma.delivery.create({
    data: {
      id: 'demo-delivery-1',
      donationId: donationCompleted.id,
      volunteerId: vol1.id,
      status: 'delivered',
      pickedUpAt: hoursAgo(6.5),
      pickupTemperature: 70,
      pickupPackagingOk: true,
      pickupNotes: 'Food verified hot and sealed. [DEMO]',
      deliveredAt: hoursAgo(5.5),
      deliveryTemperature: 65,
      receiverAccepted: true,
      recipientName: 'Meera Sharma',
      deliveryNotes: 'Delivered to CityCare NGO. All 50 meals accepted. [DEMO]',
      estimatedPickupAt: hoursAgo(6.5),
      estimatedDeliveryAt: hoursAgo(5.5),
      actualDeliveryMinutes: 60,
    },
  });

  await prisma.donationAllocation.create({
    data: {
      donationId: donationCompleted.id,
      receiverId: recv1.id,
      deliveryId: deliveryCompleted.id,
      quantityAllocated: 50,
      weightAllocated: 12,
      status: 'delivered',
      confirmedAt: hoursAgo(5.5),
      confirmedBy: 'Meera Sharma',
    },
  });

  // Analytics event for completed delivery
  await prisma.analyticsEvent.create({
    data: {
      eventType: 'delivery_confirmed',
      donationId: donationCompleted.id,
      deliveryId: deliveryCompleted.id,
      weightKg: 12,
      meals: 50,
      category: 'cooked_meal',
      metadata: JSON.stringify({ receiverId: recv1.id, volunteerId: vol1.id }),
      occurredAt: hoursAgo(5.5),
    },
  });

  // ── Active delivery (donation4) ───────────────────────────────────────────
  await prisma.delivery.create({
    data: {
      id: 'demo-delivery-2',
      donationId: donation4.id,
      volunteerId: vol1.id,
      status: 'in_transit',
      pickedUpAt: minutesFromNow(-15),
      pickupTemperature: 68,
      pickupPackagingOk: true,
      estimatedDeliveryAt: minutesFromNow(25),
    },
  });

  console.log('✅ Seed complete. Demo data summary:');
  console.log('  Donors: 3  | Receivers: 4  | Volunteers: 2');
  console.log('  Donations: 5 (1 eligible, 1 needs_review, 1 blocked, 1 matched, 1 delivered)');
  console.log('  Deliveries: 2 (1 completed, 1 in transit)');
  console.log('  ⚠️  All data is SAMPLE DATA — do not use for real food decisions.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
