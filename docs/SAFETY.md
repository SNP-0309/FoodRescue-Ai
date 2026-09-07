# FoodRescue AI — Food Safety Policy

## Core Safety Principle

**AI does not certify food as safe to eat.**

This principle is non-negotiable and must be displayed to all users at every relevant touchpoint.

## AI Visual Screening Limitations

The AI visual screening feature (`/api/donations/:id/screen`) uses Gemini Vision to analyze food photos. It provides a **preliminary visual screening signal only**.

### What it can do
- Assess visible appearance of food
- Identify obvious visual signs of spoilage, mould, or damage
- Return a confidence-weighted result

### What it CANNOT do
- Detect pathogenic bacteria (Salmonella, E. coli, Listeria, etc.)
- Identify allergen cross-contamination
- Assess chemical contamination
- Measure actual food temperature
- Replace trained food safety professionals

## Screening Results

| Result | Meaning | System Action |
|--------|---------|---------------|
| `CLEAR` | No visible concerns detected | Contributes positively to score |
| `CONCERN` | Visible spoilage/damage detected | Adds to blockers → blocked status |
| `UNCERTAIN` | Insufficient image quality | Held for manual review |
| `UNAVAILABLE` | API unavailable or no key | Held for manual review |

**A `CLEAR` result does NOT certify food as safe.** It is a single input to the logistics scoring system.

## When AI is Unavailable

When `GEMINI_API_KEY` is not set or the API call fails:
1. `screeningResult` is set to `UNAVAILABLE`
2. A blocker is added: "Food held for manual review — AI screening was unavailable"
3. Donation status becomes `needs_review` or `blocked`
4. **No fabricated AI result is generated under any circumstances**

## Suitability Score Safety Notice

The suitability score (0–100) is a **logistics and quality routing indicator** only. It:
- Helps prioritise which food to redistribute first
- Integrates multiple signals including visual screening, time, temperature, packaging
- Is NOT a food safety certification
- Must NEVER be presented as a safety guarantee

## Temperature Safety Checks

The system enforces these temperature compatibility rules:

| Storage | Temperature Rule |
|---------|----------------|
| Frozen | Must be ≤ 0°C |
| Refrigerated | Must be ≤ 8°C and ≥ -2°C |
| Hot-hold (cooked meal) | Must be ≥ 60°C |
| Room temp (perishable) | Must be ≤ 30°C |

Violations result in a blocker and `blocked` status.

## Redistribution Window Safety

Food cannot be redistributed after its deadline:

```
deadline = min(preparedAt + usableDuration, expiryTime)
```

The window is rechecked at:
1. Match time
2. Pickup confirmation
3. Delivery confirmation

A 15-minute buffer is applied to ensure food arrives before the deadline.

## Manual Review Process

Food with `needs_review` status requires human review before redistribution. Reviewers should:
1. Physically inspect the food
2. Verify temperature records
3. Check packaging integrity
4. Consult local food safety regulations
5. Make an independent safety decision

## Incident Reporting

Volunteers can report incidents at any stage. Supported types:
- `spoilage` — visible food spoilage
- `accident` — transport accident
- `temperature_breach` — cold chain failure
- `packaging_damage` — container damage
- `other` — any other safety concern

Reporting an incident with `putOnHold: true` immediately:
1. Places the delivery on hold
2. Updates donation status to `on_hold`
3. Prevents further distribution until reviewed

## Responsibility

Final food safety responsibility rests with:
- **Donors**: Accurate information about preparation, storage, and condition
- **Volunteers**: Physical inspection at pickup and safe transport
- **Receivers**: Final inspection and compliance with local food safety laws
- **FoodRescue AI**: Provides logistics support tools only, not food safety certification
