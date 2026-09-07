# FoodRescue AI

> Connecting food donors with receivers to rescue surplus food and feed communities.

> ⚠️ **This is a prototype with sample data only. Not for real food redistribution decisions.**

## Quick Start

### Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | 20+ |
| npm | 10+ |
| Flutter | 3.44+ |
| Dart | 3.12+ |

---

## Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY (optional — falls back to UNAVAILABLE mode)

# 3. Create database and run migrations
npx prisma db push

# 4. Generate Prisma client
npx prisma generate

# 5. Seed demo data
npm run db:seed

# 6. Start development server
npm run dev
```

The backend starts at **http://localhost:3000**

### Environment Variables (`backend/.env`)

```env
DATABASE_URL=file:./dev.db
GEMINI_API_KEY=your_key_here     # Optional — omit to use UNAVAILABLE fallback
GEMINI_MODEL=gemini-2.0-flash    # Optional — defaults to gemini-2.0-flash
```

> If `GEMINI_API_KEY` is missing, AI screening returns `UNAVAILABLE` and food is held for manual review. No fake results are generated.

---

## Mobile Setup

```bash
cd mobile

# 1. Get dependencies
flutter pub get

# 2. Run on Android emulator
flutter run

# For iOS simulator, edit lib/core/constants/app_constants.dart:
# change baseUrl to 'http://localhost:3000/api'
```

> The Android emulator uses `10.0.2.2` to reach `localhost` on the host machine.

---

## Running Tests

### Backend Tests
```bash
cd backend
npm test
```

Tests cover: validation, scoring, matching, allocation, state machine, analytics.

### Flutter Analysis
```bash
cd mobile
flutter analyze
flutter test
```

---

## Demo Accounts

All accounts are pre-seeded. Use the **Demo Login** button in the app.

| Role | Name | Description |
|------|------|-------------|
| Donor | Green Leaf Restaurant | Has eligible donations |
| Donor | Sunrise Bakery | Has a donation needing review |
| Donor | Grand Meridian Hotel | Has a multi-destination donation |
| Receiver | CityCare NGO | High urgency, 150 meals needed |
| Receiver | Sunrise Shelter | Critical urgency, can arrange pickup |
| Receiver | Community Kitchen Central | Medium urgency |
| Receiver | West End Food Bank | Large capacity food bank |
| Volunteer | Amir Hassan | Van, 100 meal capacity |
| Volunteer | Priya Nair | Motorcycle, 20 meal capacity |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/demo-login` | Demo login (role: donor/receiver/volunteer) |
| GET | `/api/donations` | List donations (filter by donorId, status) |
| POST | `/api/donations` | Create donation |
| GET | `/api/donations/:id` | Get donation details |
| POST | `/api/donations/:id/screen` | Run AI visual screening |
| POST | `/api/donations/:id/match` | Run matching engine |
| GET | `/api/receivers` | List receivers |
| PATCH | `/api/receivers/:id` | Update receiver profile |
| GET | `/api/volunteers/tasks` | List delivery tasks |
| POST | `/api/deliveries/:id/accept` | Volunteer accepts task |
| POST | `/api/deliveries/:id/pickup` | Confirm pickup |
| POST | `/api/deliveries/:id/transit` | Start transit |
| POST | `/api/deliveries/:id/confirm` | Confirm delivery |
| POST | `/api/deliveries/:id/incident` | Report incident |
| GET | `/api/analytics` | Get impact analytics |

---

## Features

### Donor
- Post surplus food with full condition details
- Upload food photos for AI screening
- View suitability score and redistribution window
- See matched receivers and allocation plan
- Track pickup and delivery progress

### Receiver
- Update demand, capacity, accepted categories
- View nearby eligible donations
- Edit profile (org type, storage, location, urgency)

### Volunteer
- View available pickup tasks
- Accept tasks
- View route on OpenStreetMap
- Confirm pickup (with packaging check)
- Start transit
- Confirm delivery (with recipient name)
- Report incidents (puts entire batch on hold)

### AI Safety
- Visual screening returns: CLEAR | CONCERN | UNCERTAIN | UNAVAILABLE
- **AI does NOT certify food safety**
- Gemini unavailable → UNAVAILABLE → manual review hold
- Safety notice displayed throughout the app

### Maps
- flutter_map + OpenStreetMap (no Google API key required)
- Travel times are straight-line Haversine estimates
- Always labeled as non-live traffic estimates

---

## Safety Notices

> ⚠️ **AI does not certify food as safe to eat.**
>
> The AI screening feature provides a preliminary visual screening signal only.
> It cannot detect pathogens, allergens, or contamination.
> Final food safety responsibility rests with the receiving organisation.

See [docs/SAFETY.md](docs/SAFETY.md) for the full safety policy.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | Flutter 3.44 + Dart 3.12 |
| State | Riverpod |
| Navigation | GoRouter |
| HTTP | Dio |
| Maps | flutter_map + OpenStreetMap |
| Backend | Next.js 15 (TypeScript) |
| ORM | Prisma |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Validation | Zod |
| AI | Gemini Vision API |
| Tests | Vitest |

---

## Project Structure

```
FoodRescue-Ai/
├── backend/           Next.js API + domain logic
├── mobile/            Flutter app
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── SAFETY.md
└── README.md
```

---

## ⚠️ Disclaimer

All data in this prototype is **sample data for demonstration purposes only**.
Do not use this application for real food redistribution decisions without proper food safety protocols and regulatory compliance in your jurisdiction.
