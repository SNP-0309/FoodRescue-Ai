export type UserRole = 'donor' | 'ngo' | 'volunteer' | 'admin';

export type DonationStatus = 'pending' | 'matched' | 'picked_up' | 'delivered' | 'expired';
export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';
export type DeliveryStatus = 'available' | 'accepted' | 'picked_up' | 'delivered';
export type FoodCategory =
  | 'cooked_meals'
  | 'bakery'
  | 'fresh_produce'
  | 'dairy'
  | 'packaged_goods'
  | 'beverages'
  | 'snacks'
  | 'other';

export type StorageCondition = 'refrigerated' | 'frozen' | 'ambient' | 'heated';

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface DonorProfile {
  userId: string;
  organizationName: string;
  organizationType: 'restaurant' | 'hotel' | 'supermarket' | 'household' | 'bakery' | 'other';
  location: Location;
  phone: string;
  totalDonations: number;
  totalMeals: number;
  totalKg: number;
}

export interface NgoProfile {
  userId: string;
  organizationName: string;
  location: Location;
  phone: string;
  capacity: number; // max meals/day
  currentLoad: number;
  beneficiariesServed: number;
  acceptedCategories: FoodCategory[];
  requirementsActive: number;
}

export interface VolunteerProfile {
  userId: string;
  name: string;
  location: Location;
  phone: string;
  vehicleType: 'bike' | 'car' | 'van' | 'walk';
  deliveriesCompleted: number;
  rating: number;
  isAvailable: boolean;
}

export interface AIAnalysisResult {
  predictedCategory: FoodCategory;
  urgencyLevel: UrgencyLevel;
  estimatedShelfLifeHours: number;
  storageRecommendation: string;
  confidenceScore: number;
  explanation: string;
  safetyWarnings: string[];
}

export interface FoodDonation {
  id: string;
  donorId: string;
  donorName: string;
  donorOrgName: string;
  foodName: string;
  category: FoodCategory;
  quantity: number; // meals count
  quantityKg: number;
  preparationTime: string; // ISO string
  expiryTime: string; // ISO string
  storageCondition: StorageCondition;
  pickupAddress: string;
  location: Location;
  imageUrl?: string;
  notes?: string;
  status: DonationStatus;
  aiAnalysis?: AIAnalysisResult;
  urgencyLevel: UrgencyLevel;
  createdAt: string;
  updatedAt: string;
}

export interface FoodRequirement {
  id: string;
  ngoId: string;
  ngoName: string;
  location: Location;
  category: FoodCategory;
  quantityNeeded: number;
  urgency: UrgencyLevel;
  beneficiariesCount: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface MatchScore {
  total: number;
  urgencyScore: number;
  distanceScore: number;
  demandScore: number;
  compatibilityScore: number;
  capacityScore: number;
  distanceKm: number;
  explanation: string;
}

export interface MatchResult {
  donationId: string;
  ngoId: string;
  ngoName: string;
  ngoLocation: Location;
  score: MatchScore;
  rank: number;
  recommendedAt: string;
}

export interface DeliveryTask {
  id: string;
  donationId: string;
  donationName: string;
  matchId: string;
  volunteerId?: string;
  volunteerName?: string;
  donorName: string;
  donorOrgName: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  ngoName: string;
  status: DeliveryStatus;
  distanceKm: number;
  estimatedMinutes: number;
  quantity: number;
  quantityKg: number;
  category: FoodCategory;
  urgencyLevel: UrgencyLevel;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'match' | 'accepted' | 'volunteer' | 'pickup' | 'delivered' | 'expiry' | 'info';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface ImpactMetrics {
  totalMeals: number;
  totalKgRescued: number;
  co2SavedKg: number;
  landfillDivertedKg: number;
  totalDeliveries: number;
  beneficiariesServed: number;
  activeDonations: number;
  expiredDonations: number;
}

export interface DemandForecast {
  date: string;
  predicted: number;
  actual: number;
  category: FoodCategory;
}

export interface CategoryStat {
  category: FoodCategory;
  count: number;
  kgTotal: number;
  mealsTotal: number;
}
