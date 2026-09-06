import { FoodDonation, AIAnalysisResult, FoodCategory, UrgencyLevel, StorageCondition } from '@/types';

const CATEGORY_KEYWORDS: Record<FoodCategory, string[]> = {
  cooked_meals: ['biryani', 'curry', 'rice', 'dal', 'sabzi', 'chicken', 'mutton', 'paneer', 'roti', 'naan', 'meal', 'lunch', 'dinner', 'breakfast', 'stew', 'soup', 'pasta', 'pizza', 'burger'],
  bakery: ['bread', 'croissant', 'muffin', 'cake', 'pastry', 'biscuit', 'cookie', 'sourdough', 'bun', 'roll', 'donut', 'bagel', 'loaf'],
  fresh_produce: ['vegetable', 'fruit', 'salad', 'tomato', 'carrot', 'spinach', 'lettuce', 'apple', 'banana', 'mango', 'potato', 'onion', 'broccoli', 'pepper'],
  dairy: ['milk', 'yogurt', 'cheese', 'butter', 'paneer', 'cream', 'lassi', 'curd', 'ghee'],
  packaged_goods: ['canned', 'tin', 'packet', 'sealed', 'packaged', 'dry', 'lentil', 'chickpea', 'flour', 'sugar', 'oil', 'rice', 'wheat'],
  beverages: ['juice', 'drink', 'water', 'soda', 'tea', 'coffee', 'smoothie', 'shake', 'beverage'],
  snacks: ['chips', 'snack', 'nuts', 'popcorn', 'cracker', 'namkeen', 'biscuit', 'bar'],
  other: [],
};

const PERISHABILITY_INDEX: Record<FoodCategory, number> = {
  cooked_meals: 0.95,
  dairy: 0.85,
  fresh_produce: 0.75,
  bakery: 0.60,
  beverages: 0.50,
  snacks: 0.30,
  packaged_goods: 0.10,
  other: 0.50,
};

const STORAGE_HOURS_MULTIPLIER: Record<StorageCondition, number> = {
  heated: 1.0,
  refrigerated: 3.0,
  frozen: 30.0,
  ambient: 1.5,
};

const BASE_SHELF_HOURS: Record<FoodCategory, number> = {
  cooked_meals: 6,
  dairy: 12,
  fresh_produce: 48,
  bakery: 24,
  beverages: 72,
  snacks: 168,
  packaged_goods: 720,
  other: 24,
};

function detectCategory(foodName: string): { category: FoodCategory; confidence: number } {
  const name = foodName.toLowerCase();
  let bestMatch: FoodCategory = 'other';
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = keywords.filter(kw => name.includes(kw)).length;
    const score = matches / keywords.length;
    if (matches > 0 && score > bestScore) {
      bestScore = score;
      bestMatch = cat as FoodCategory;
    }
  }

  const confidence = bestScore > 0 ? Math.min(75 + bestScore * 200, 99) : 65;
  return { category: bestMatch, confidence };
}

function calculateUrgency(
  shelfLifeHours: number,
  preparationTime: string,
  expiryTime: string,
): UrgencyLevel {
  const now = Date.now();
  const expiry = new Date(expiryTime).getTime();
  const hoursUntilExpiry = (expiry - now) / 3600000;

  if (hoursUntilExpiry < 0) return 'critical';
  if (hoursUntilExpiry < 4) return 'critical';
  if (hoursUntilExpiry < 12) return 'high';
  if (hoursUntilExpiry < 36) return 'medium';
  return 'low';
}

function getStorageRecommendation(category: FoodCategory, condition: StorageCondition, urgency: UrgencyLevel): string {
  const recs: Record<FoodCategory, string> = {
    cooked_meals: condition === 'heated'
      ? 'Keep at 60°C or above. Transfer to refrigerator within 2 hours if not distributed. Do not leave at room temperature.'
      : 'Refrigerate at 4°C. Reheat to 75°C before serving. Consume within 24 hours of refrigeration.',
    dairy: 'Keep refrigerated between 1-4°C. Do not leave unrefrigerated for more than 1 hour.',
    fresh_produce: 'Store in cool, ventilated area. Refrigerate leafy greens. Keep fruits separate from vegetables.',
    bakery: 'Store in cool, dry place. Avoid plastic bags to prevent sogginess. Bread can be frozen for extended storage.',
    beverages: 'Refrigerate opened containers. Keep sealed containers at room temperature away from direct sunlight.',
    snacks: 'Store in a cool, dry place away from moisture. Seal opened packets tightly.',
    packaged_goods: 'Store in dry, cool place. Check for damage to packaging before distribution.',
    other: 'Follow package instructions. When in doubt, refrigerate.',
  };
  return recs[category] || recs.other;
}

function getSafetyWarnings(category: FoodCategory, urgency: UrgencyLevel, condition: StorageCondition): string[] {
  const warnings: string[] = [];

  if (urgency === 'critical') {
    warnings.push('⚠️ URGENT: This food must be distributed immediately');
    warnings.push('Do not redistribute if any signs of spoilage are present');
  }

  if (category === 'cooked_meals') {
    warnings.push('Reheat to 75°C (165°F) before serving');
    if (condition === 'ambient' || condition === 'heated') {
      warnings.push('Do not leave at room temperature for more than 2 hours total');
    }
  }

  if (category === 'dairy') {
    warnings.push('Check for off-smell or unusual texture before distribution');
    warnings.push('Keep refrigerated at all times during transport');
  }

  if (category === 'fresh_produce') {
    warnings.push('Wash all produce thoroughly before consumption');
    warnings.push('Remove any damaged or moldy items before distribution');
  }

  warnings.push('🔔 AI recommendations are guidelines only. Always use food-safety best practices.');

  return warnings;
}

export async function analyzeFoodItem(
  foodName: string,
  preparationTime: string,
  expiryTime: string,
  storageCondition: StorageCondition,
  providedCategory?: string,
): Promise<AIAnalysisResult> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const { category: detectedCategory, confidence: detectionConfidence } = detectCategory(foodName);
  const category = (providedCategory as FoodCategory) || detectedCategory;

  const baseHours = BASE_SHELF_HOURS[category];
  const multiplier = STORAGE_HOURS_MULTIPLIER[storageCondition];
  const shelfLifeHours = Math.round(baseHours * multiplier);

  const urgency = calculateUrgency(shelfLifeHours, preparationTime, expiryTime);
  const hoursUntilExpiry = Math.max(0, (new Date(expiryTime).getTime() - Date.now()) / 3600000);

  const storageRec = getStorageRecommendation(category, storageCondition, urgency);
  const warnings = getSafetyWarnings(category, urgency, storageCondition);

  const confidenceScore = Math.round(detectionConfidence + (providedCategory ? 10 : 0));

  const urgencyExplanations: Record<UrgencyLevel, string> = {
    critical: `This food item requires IMMEDIATE action. ${hoursUntilExpiry < 1 ? 'It is already past or very close to its safety window.' : `Only ${hoursUntilExpiry.toFixed(1)} hours remain before it expires.`} The ${category.replace('_', ' ')} category combined with ${storageCondition} storage makes this highly time-sensitive.`,
    high: `This food has HIGH urgency with approximately ${hoursUntilExpiry.toFixed(1)} hours remaining. The combination of ${category.replace('_', ' ')} food type and current storage conditions (${storageCondition}) creates significant time pressure for distribution.`,
    medium: `MEDIUM urgency - approximately ${hoursUntilExpiry.toFixed(1)} hours until expiry. This ${category.replace('_', ' ')} can be safely redistributed within the next few hours with proper handling.`,
    low: `LOW urgency - this ${category.replace('_', ' ')} has good shelf stability with approximately ${hoursUntilExpiry.toFixed(1)} hours remaining. ${storageCondition === 'frozen' ? 'Frozen storage significantly extends safe life.' : ''} Plan distribution within standard operating hours.`,
  };

  return {
    predictedCategory: category,
    urgencyLevel: urgency,
    estimatedShelfLifeHours: Math.round(hoursUntilExpiry),
    storageRecommendation: storageRec,
    confidenceScore: Math.min(confidenceScore, 98),
    explanation: urgencyExplanations[urgency],
    safetyWarnings: warnings,
  };
}

export function getCategoryLabel(category: FoodCategory): string {
  const labels: Record<FoodCategory, string> = {
    cooked_meals: 'Cooked Meals',
    bakery: 'Bakery & Bread',
    fresh_produce: 'Fresh Produce',
    dairy: 'Dairy Products',
    packaged_goods: 'Packaged Goods',
    beverages: 'Beverages',
    snacks: 'Snacks',
    other: 'Other',
  };
  return labels[category];
}

export function getUrgencyColor(urgency: UrgencyLevel): string {
  const colors: Record<UrgencyLevel, string> = {
    critical: 'text-red-600 bg-red-100',
    high: 'text-orange-600 bg-orange-100',
    medium: 'text-yellow-600 bg-yellow-100',
    low: 'text-green-600 bg-green-100',
  };
  return colors[urgency];
}
