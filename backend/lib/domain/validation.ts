// FoodRescue AI — Zod Validation Schemas
import { z } from 'zod';

// ─── Shared ───────────────────────────────────────────────────────────────────

export const LatLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const DemoLoginSchema = z.object({
  role: z.enum(['donor', 'receiver', 'volunteer']),
  userId: z.string().optional(), // optional: pick a specific seed user
});

// ─── Donation ─────────────────────────────────────────────────────────────────

export const CreateDonationSchema = z.object({
  donorId: z.string().min(1),
  foodName: z.string().min(1).max(200),
  category: z.enum(['cooked_meal', 'raw_produce', 'packaged', 'bakery', 'dairy', 'beverages', 'other']),
  quantity: z.number().int().min(1),
  weightKg: z.number().positive(),
  description: z.string().max(1000).optional(),
  allergens: z.array(z.string()).default([]),
  handlingNotes: z.string().max(500).optional(),

  // Time fields (ISO strings)
  preparedAt: z.string().datetime(),
  packagingTime: z.string().datetime(),
  usableDuration: z.number().int().min(1), // minutes
  expiryTime: z.string().datetime(),

  // Condition
  storageCondition: z.enum(['room_temp', 'refrigerated', 'frozen', 'hot_hold']),
  temperature: z.number().optional(),
  temperatureTime: z.string().datetime().optional(),
  packagingCondition: z.enum(['intact', 'minor_damage', 'damaged']),

  // Location
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  pickupAddress: z.string().min(1).max(500),

  photoUrl: z.string().url().optional(),
});

export type CreateDonationInput = z.infer<typeof CreateDonationSchema>;

// ─── Receiver ─────────────────────────────────────────────────────────────────

export const UpsertReceiverSchema = z.object({
  orgName: z.string().min(1).max(200),
  orgType: z.enum(['ngo', 'shelter', 'community_kitchen', 'food_bank']),
  contactName: z.string().min(1).max(200),
  contactPhone: z.string().max(20).optional(),
  currentDemand: z.number().int().min(0),
  maxCapacity: z.number().int().min(1),
  acceptedCategories: z.array(z.enum(['cooked_meal', 'raw_produce', 'packaged', 'bakery', 'dairy', 'beverages', 'other'])).min(1),
  availableStorage: z.array(z.enum(['room_temp', 'refrigerated', 'frozen', 'hot_hold'])).min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().min(1).max(500),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  canArrangePickup: z.boolean().default(false),
});

export type UpsertReceiverInput = z.infer<typeof UpsertReceiverSchema>;

// ─── Delivery Actions ─────────────────────────────────────────────────────────

export const AcceptDeliverySchema = z.object({
  volunteerId: z.string().min(1),
  currentLat: z.number().min(-90).max(90),
  currentLng: z.number().min(-180).max(180),
});

export const PickupConfirmSchema = z.object({
  volunteerId: z.string().min(1),
  pickupTemperature: z.number().optional(),
  pickupPackagingOk: z.boolean(),
  pickupNotes: z.string().max(500).optional(),
});

export const TransitSchema = z.object({
  volunteerId: z.string().min(1),
});

export const DeliveryConfirmSchema = z.object({
  volunteerId: z.string().min(1),
  deliveryTemperature: z.number().optional(),
  receiverAccepted: z.boolean(),
  recipientName: z.string().min(1).max(200),
  deliveryNotes: z.string().max(500).optional(),
});

export const IncidentSchema = z.object({
  volunteerId: z.string().min(1),
  incidentType: z.enum(['spoilage', 'accident', 'temperature_breach', 'packaging_damage', 'other']),
  incidentNotes: z.string().min(1).max(1000),
  putOnHold: z.boolean().default(true),
});

// ─── Matching ─────────────────────────────────────────────────────────────────

export const MatchRequestSchema = z.object({
  volunteerLat: z.number().min(-90).max(90).optional(),
  volunteerLng: z.number().min(-180).max(180).optional(),
  maxDistanceKm: z.number().positive().default(50),
});
