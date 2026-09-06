import { DemandForecast, FoodCategory, FoodDonation, FoodRequirement } from '@/types';

const CATEGORY_LABELS: Record<FoodCategory, string> = {
  cooked_meals: 'Cooked Meals',
  bakery: 'Bakery',
  fresh_produce: 'Fresh Produce',
  dairy: 'Dairy',
  packaged_goods: 'Packaged Goods',
  beverages: 'Beverages',
  snacks: 'Snacks',
  other: 'Other',
};

// Generate realistic base demand values
const BASE_DEMAND: Record<FoodCategory, number> = {
  cooked_meals: 280,
  bakery: 140,
  fresh_produce: 95,
  dairy: 80,
  packaged_goods: 60,
  beverages: 45,
  snacks: 35,
  other: 20,
};

function movingAverage(data: number[], window: number): number[] {
  return data.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

function addNoise(value: number, factor: number = 0.15): number {
  return Math.round(value * (1 + (Math.random() - 0.5) * factor));
}

function addTrend(value: number, dayIndex: number, trendFactor: number = 0.02): number {
  return Math.round(value * (1 + dayIndex * trendFactor));
}

export function generateDemandForecast(
  donations: FoodDonation[] = [],
  requirements: FoodRequirement[] = [],
  daysBack: number = 7,
  daysForward: number = 7,
): { historical: DemandForecast[][]; forecast: DemandForecast[][] } {
  const categories: FoodCategory[] = ['cooked_meals', 'bakery', 'fresh_produce', 'dairy', 'packaged_goods'];

  const historical: DemandForecast[][] = categories.map(category => {
    const base = BASE_DEMAND[category];
    return Array.from({ length: daysBack }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (daysBack - i));
      const actual = addNoise(addTrend(base, i, 0.01));
      const predicted = addNoise(addTrend(base, i, 0.01), 0.08);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        predicted,
        actual,
        category,
      };
    });
  });

  const forecast: DemandForecast[][] = categories.map((category, ci) => {
    const histData = historical[ci];
    const actuals = histData.map(d => d.actual);
    const smoothed = movingAverage(actuals, 3);
    const lastSmooth = smoothed[smoothed.length - 1];

    return Array.from({ length: daysForward }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      const predicted = addNoise(addTrend(lastSmooth, i + 1, 0.02));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        predicted,
        actual: 0,
        category,
      };
    });
  });

  return { historical, forecast };
}

export function getCombinedChartData(
  donations: FoodDonation[] = [],
  requirements: FoodRequirement[] = [],
) {
  const { historical, forecast } = generateDemandForecast(donations, requirements);

  // Combine all categories into per-day totals
  const days = 14;
  const result: { date: string; predicted: number; actual: number; type: string }[] = [];

  for (let d = 0; d < 7; d++) {
    let totalPredicted = 0;
    let totalActual = 0;
    let date = '';
    historical.forEach(catData => {
      if (catData[d]) {
        totalPredicted += catData[d].predicted;
        totalActual += catData[d].actual;
        date = catData[d].date;
      }
    });
    result.push({ date, predicted: totalPredicted, actual: totalActual, type: 'historical' });
  }

  for (let d = 0; d < 7; d++) {
    let totalPredicted = 0;
    let date = '';
    forecast.forEach(catData => {
      if (catData[d]) {
        totalPredicted += catData[d].predicted;
        date = catData[d].date;
      }
    });
    result.push({ date, predicted: totalPredicted, actual: 0, type: 'forecast' });
  }

  return result;
}

export function getCategoryChartData() {
  const categories: FoodCategory[] = ['cooked_meals', 'bakery', 'fresh_produce', 'dairy', 'packaged_goods'];
  return categories.map(cat => ({
    name: CATEGORY_LABELS[cat],
    demand: addNoise(BASE_DEMAND[cat]),
    supply: addNoise(BASE_DEMAND[cat] * 0.7),
    category: cat,
  }));
}
