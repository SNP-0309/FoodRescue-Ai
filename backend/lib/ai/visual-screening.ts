// FoodRescue AI — Gemini Visual Screening
//
// SAFETY NOTICE: This module performs a PRELIMINARY visual screening of food
// photos. The result is NOT a food safety certification. It cannot detect
// pathogens, allergens, or contamination. A CLEAR result does NOT mean the
// food is safe to eat. Final food safety responsibility rests with the
// receiving organisation and food handlers.
//
// When Gemini is unavailable (no API key, quota exceeded, network error):
//   → result = UNAVAILABLE
//   → food is placed on manual review hold
//   → no fabricated AI result is generated
//
// The screening result is ONE input to the hybrid suitability score.
// It must never be presented as a standalone safety pass/fail.

import type { ScreeningOutput } from '../domain/models';

const SCREENING_PROMPT = `You are reviewing a food image for a food rescue logistics platform.

Your task is to provide a PRELIMINARY VISUAL SCREENING ONLY.

IMPORTANT DISCLAIMERS:
- You cannot detect pathogens, bacteria, allergens, or contamination.
- A positive result does NOT certify the food as safe to eat.
- This is a logistics triage tool only.

Analyse the image and return ONE of these results:
- CLEAR: The food appears visually fresh, appropriately packaged, with no visible spoilage, mould, discolouration, or damage.
- CONCERN: You can see clear visual signs of spoilage, mould, discolouration, unusual texture, damaged packaging, or contamination.
- UNCERTAIN: The image quality is poor, the food is partially obscured, or you cannot make a confident visual assessment.

Respond with ONLY a JSON object in this exact format:
{
  "result": "CLEAR" | "CONCERN" | "UNCERTAIN",
  "confidence": 0.0 to 1.0,
  "notes": "Brief description of what you observed (max 200 chars)"
}

Do not add any text outside the JSON object.`;

export async function runVisualScreening(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ScreeningOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

  // ── No API key → UNAVAILABLE (do NOT fabricate a result) ─────────────────
  if (!apiKey || apiKey.trim() === '') {
    return {
      result: 'UNAVAILABLE',
      notes: 'AI screening unavailable — no API key configured. Food requires manual review.',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent([
      SCREENING_PROMPT,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]);

    const text = result.response.text().trim();

    // Parse JSON response
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let parsed: { result: string; confidence: number; notes: string };

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Cannot parse → treat as UNCERTAIN, not CLEAR (fail-safe)
      return {
        result: 'UNCERTAIN',
        notes: 'AI returned an unparseable response — manual review required',
        timestamp: new Date().toISOString(),
        modelUsed: modelName,
      };
    }

    // Validate the result field
    const validResults = ['CLEAR', 'CONCERN', 'UNCERTAIN'];
    if (!validResults.includes(parsed.result)) {
      return {
        result: 'UNCERTAIN',
        notes: 'AI returned an unexpected result value — manual review required',
        timestamp: new Date().toISOString(),
        modelUsed: modelName,
      };
    }

    return {
      result: parsed.result as 'CLEAR' | 'CONCERN' | 'UNCERTAIN',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : undefined,
      notes: typeof parsed.notes === 'string' ? parsed.notes.slice(0, 200) : undefined,
      timestamp: new Date().toISOString(),
      modelUsed: modelName,
    };
  } catch (error) {
    // Network error, quota, etc. → UNAVAILABLE
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[visual-screening] Gemini API error:', message);

    return {
      result: 'UNAVAILABLE',
      notes: `AI screening failed (${message.slice(0, 100)}). Food requires manual review.`,
      timestamp: new Date().toISOString(),
      modelUsed: modelName,
    };
  }
}
