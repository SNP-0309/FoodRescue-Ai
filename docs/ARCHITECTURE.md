# FoodRescue AI — Architecture

## System Overview

FoodRescue AI connects food donors, receivers, and volunteers to reduce food waste and feed communities.

```
┌─────────────────────────────────────────────────────────────┐
│                    Flutter Mobile App                        │
│  Donor │ Receiver │ Volunteer                               │
│  ─────────────────────────────────────────────────────────  │
│  Riverpod (state) │ GoRouter (nav) │ Dio (API) │ flutter_map │
└─────────────────────────────────┬───────────────────────────┘
                                  │ HTTP/REST
┌─────────────────────────────────▼───────────────────────────┐
│                   Next.js 15 Backend                        │
│  Route Handlers (App Router)                               │
│  ─────────────────────────────────────────────────────────  │
│  Domain Logic:                                              │
│    scoring.ts   │ matching.ts │ allocation.ts              │
│    delivery-state.ts │ geo.ts                              │
│  ─────────────────────────────────────────────────────────  │
│  AI:  visual-screening.ts (Gemini Vision API)               │
│  DB:  Prisma ORM ──► SQLite (dev) / PostgreSQL (prod)       │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Donation Lifecycle
```
POST /api/donations
  → Initial suitability score computed (screeningResult=UNAVAILABLE)
  → status=posted

POST /api/donations/:id/screen
  → AI visual screening (or UNAVAILABLE if no API key)
  → Suitability score recomputed with screening result
  → status=eligible|needs_review|blocked

POST /api/donations/:id/match
  → Matching engine runs (distance, time, capacity, storage, window)
  → Allocation plan computed (multi-destination)
  → status=matched

POST /api/deliveries/:id/accept  → status=accepted
POST /api/deliveries/:id/pickup  → status=picked_up (window recheck)
POST /api/deliveries/:id/transit → status=in_transit
POST /api/deliveries/:id/confirm → status=delivered + analytics event
```

### Safety Decision Chain
All safety decisions are made on the backend:
1. Temperature compatibility check in `scoring.ts`
2. Redistribution window expiry in `scoring.ts` and at each delivery action
3. Packaging damage block in `scoring.ts` and at pickup confirmation
4. AI screening CONCERN → block in `scoring.ts`
5. Suitability score below threshold → block in `scoring.ts`

## Folder Structure

```
FoodRescue-Ai/
├── backend/           Next.js 15 TypeScript API
│   ├── app/api/       Route handlers
│   ├── lib/
│   │   ├── domain/    Core business logic (no UI dependencies)
│   │   ├── ai/        Gemini Vision integration
│   │   └── server/    Database client, seed
│   ├── prisma/        Schema
│   └── tests/         Vitest tests
├── mobile/            Flutter app
│   └── lib/
│       ├── core/      Constants, theme, router, networking
│       ├── models/    Domain models (Dart)
│       ├── providers/ Riverpod state providers
│       └── features/  Feature screens
└── docs/
```

## Key Design Decisions

- **Backend-only safety logic**: Flutter never computes suitability scores or matching — it only displays results from the API.
- **AI fallback**: Gemini unavailable → UNAVAILABLE result → food held for manual review. Never fabricated.
- **Multi-destination allocation**: Greedy allocation respects receiver demand, capacity, volunteer capacity, and redistribution deadline.
- **State machine enforcement**: `delivery-state.ts` enforces valid transitions and prevents duplicate confirmations.
- **SQLite + PostgreSQL-compatible schema**: Switch by changing `provider` and `DATABASE_URL` in `.env`.

## Security Notes (Prototype)

- Demo login uses base64-encoded mock tokens — NOT suitable for production.
- For production: replace with proper OAuth2 / JWT with refresh tokens.
- All inputs are validated with Zod on the backend before processing.
