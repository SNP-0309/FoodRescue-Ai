'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  User,
  FoodDonation,
  FoodRequirement,
  DeliveryTask,
  NotificationItem,
  ImpactMetrics,
  NgoProfile,
  VolunteerProfile,
  DonorProfile,
} from '@/types';
import {
  DEMO_USERS,
  DEMO_DONATIONS,
  DEMO_REQUIREMENTS,
  DEMO_DELIVERIES,
  DEMO_NOTIFICATIONS,
  DEMO_IMPACT,
  DEMO_NGO_PROFILES,
  DEMO_VOLUNTEER_PROFILES,
  DEMO_DONOR_PROFILES,
} from './mockData';

interface AppState {
  currentUser: User | null;
  donations: FoodDonation[];
  requirements: FoodRequirement[];
  deliveries: DeliveryTask[];
  notifications: NotificationItem[];
  impact: ImpactMetrics;
  ngoProfiles: NgoProfile[];
  volunteerProfiles: VolunteerProfile[];
  donorProfiles: DonorProfile[];
  isDemoMode: boolean;
}

interface AppActions {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: User['role']) => void;
  addDonation: (donation: Omit<FoodDonation, 'id' | 'createdAt' | 'updatedAt'>) => FoodDonation;
  updateDonation: (id: string, updates: Partial<FoodDonation>) => void;
  addRequirement: (req: Omit<FoodRequirement, 'id' | 'createdAt'>) => FoodRequirement;
  acceptDelivery: (deliveryId: string, volunteerId: string, volunteerName: string) => void;
  updateDeliveryStatus: (deliveryId: string, status: DeliveryTask['status']) => void;
  markNotificationRead: (id: string) => void;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'createdAt'>) => void;
  runMatchingDemo: () => Promise<void>;
  simulateNewDonation: () => FoodDonation;
  runScenario: (step: number) => Promise<void>;
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    donations: DEMO_DONATIONS,
    requirements: DEMO_REQUIREMENTS,
    deliveries: DEMO_DELIVERIES,
    notifications: DEMO_NOTIFICATIONS,
    impact: DEMO_IMPACT,
    ngoProfiles: DEMO_NGO_PROFILES,
    volunteerProfiles: DEMO_VOLUNTEER_PROFILES,
    donorProfiles: DEMO_DONOR_PROFILES,
    isDemoMode: true,
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const demoUser = DEMO_USERS.find(u => u.email === email);
    if (demoUser) {
      setState(prev => ({ ...prev, currentUser: demoUser }));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setState(prev => ({ ...prev, currentUser: null }));
  }, []);

  const switchRole = useCallback((role: User['role']) => {
    const roleUser = DEMO_USERS.find(u => u.role === role);
    if (roleUser) {
      setState(prev => ({ ...prev, currentUser: roleUser }));
    }
  }, []);

  const addDonation = useCallback((donation: Omit<FoodDonation, 'id' | 'createdAt' | 'updatedAt'>): FoodDonation => {
    const newDonation: FoodDonation = {
      ...donation,
      id: `donation-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      donations: [newDonation, ...prev.donations],
    }));
    return newDonation;
  }, []);

  const updateDonation = useCallback((id: string, updates: Partial<FoodDonation>) => {
    setState(prev => ({
      ...prev,
      donations: prev.donations.map(d =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d,
      ),
    }));
  }, []);

  const addRequirement = useCallback((req: Omit<FoodRequirement, 'id' | 'createdAt'>): FoodRequirement => {
    const newReq: FoodRequirement = {
      ...req,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      requirements: [newReq, ...prev.requirements],
    }));
    return newReq;
  }, []);

  const acceptDelivery = useCallback((deliveryId: string, volunteerId: string, volunteerName: string) => {
    setState(prev => ({
      ...prev,
      deliveries: prev.deliveries.map(d =>
        d.id === deliveryId
          ? { ...d, volunteerId, volunteerName, status: 'accepted' as const, acceptedAt: new Date().toISOString() }
          : d,
      ),
    }));
  }, []);

  const updateDeliveryStatus = useCallback((deliveryId: string, status: DeliveryTask['status']) => {
    setState(prev => {
      const updates: Partial<DeliveryTask> = { status };
      if (status === 'picked_up') updates.pickedUpAt = new Date().toISOString();
      if (status === 'delivered') {
        updates.deliveredAt = new Date().toISOString();
        // Update impact metrics when delivered
        const delivery = prev.deliveries.find(d => d.id === deliveryId);
        if (delivery) {
          const mealsAdded = delivery.quantity;
          const kgAdded = delivery.quantityKg;
          return {
            ...prev,
            deliveries: prev.deliveries.map(d =>
              d.id === deliveryId ? { ...d, ...updates } : d,
            ),
            donations: prev.donations.map(d =>
              d.id === delivery.donationId ? { ...d, status: 'delivered' as const, updatedAt: new Date().toISOString() } : d,
            ),
            impact: {
              ...prev.impact,
              totalMeals: prev.impact.totalMeals + mealsAdded,
              totalKgRescued: prev.impact.totalKgRescued + kgAdded,
              co2SavedKg: prev.impact.co2SavedKg + kgAdded * 2.5,
              landfillDivertedKg: prev.impact.landfillDivertedKg + kgAdded,
              totalDeliveries: prev.impact.totalDeliveries + 1,
              beneficiariesServed: prev.impact.beneficiariesServed + Math.round(mealsAdded * 0.8),
            },
          };
        }
      }
      return {
        ...prev,
        deliveries: prev.deliveries.map(d =>
          d.id === deliveryId ? { ...d, ...updates } : d,
        ),
      };
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
    }));
  }, []);

  const addNotification = useCallback((notif: Omit<NotificationItem, 'id' | 'createdAt'>) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications],
    }));
  }, []);

  const runMatchingDemo = useCallback(async () => {
    // Find a pending critical donation and match it with best NGO
    const criticalDonation = state.donations.find(d => d.status === 'pending' && d.urgencyLevel === 'critical');
    if (!criticalDonation) return;

    await new Promise(r => setTimeout(r, 1000));

    // Create a new delivery task
    const bestNgo = state.ngoProfiles[0];
    const newDelivery: DeliveryTask = {
      id: `delivery-demo-${Date.now()}`,
      donationId: criticalDonation.id,
      donationName: criticalDonation.foodName,
      matchId: `match-demo-${Date.now()}`,
      donorName: criticalDonation.donorName,
      donorOrgName: criticalDonation.donorOrgName,
      pickupLocation: criticalDonation.location,
      dropoffLocation: bestNgo.location,
      ngoName: bestNgo.organizationName,
      status: 'available',
      distanceKm: 3.2,
      estimatedMinutes: 15,
      quantity: criticalDonation.quantity,
      quantityKg: criticalDonation.quantityKg,
      category: criticalDonation.category,
      urgencyLevel: criticalDonation.urgencyLevel,
      createdAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      donations: prev.donations.map(d =>
        d.id === criticalDonation.id ? { ...d, status: 'matched' as const } : d,
      ),
      deliveries: [newDelivery, ...prev.deliveries],
    }));
  }, [state.donations, state.ngoProfiles]);

  const simulateNewDonation = useCallback((): FoodDonation => {
    const foods = [
      { name: 'Vegetable Biryani (50 Meals)', category: 'cooked_meals' as const, qty: 50, kg: 25 },
      { name: 'Sourdough Bread Loaves', category: 'bakery' as const, qty: 40, kg: 20 },
      { name: 'Mixed Salad Box', category: 'fresh_produce' as const, qty: 30, kg: 15 },
    ];
    const food = foods[Math.floor(Math.random() * foods.length)];
    const donor = DEMO_DONOR_PROFILES[Math.floor(Math.random() * DEMO_DONOR_PROFILES.length)];

    const newDonation: FoodDonation = {
      id: `donation-sim-${Date.now()}`,
      donorId: donor.userId,
      donorName: 'Demo Donor',
      donorOrgName: donor.organizationName,
      foodName: food.name,
      category: food.category,
      quantity: food.qty,
      quantityKg: food.kg,
      preparationTime: new Date().toISOString(),
      expiryTime: new Date(Date.now() + 6 * 3600000).toISOString(),
      storageCondition: 'heated',
      pickupAddress: donor.location.address,
      location: donor.location,
      status: 'pending',
      urgencyLevel: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      donations: [newDonation, ...prev.donations],
    }));

    return newDonation;
  }, []);

  const runScenario = useCallback(async (step: number) => {
    // Step-by-step hackathon scenario simulation
    await new Promise(r => setTimeout(r, 500));

    if (step === 1) {
      // Restaurant adds 50 meals
      const scenarioDonation: FoodDonation = {
        id: 'scenario-donation',
        donorId: 'user-donor-4',
        donorName: 'Chef Ramesh',
        donorOrgName: 'The Taj Mahal Hotel',
        foodName: 'Gala Dinner Meals (50 portions)',
        category: 'cooked_meals',
        quantity: 50,
        quantityKg: 25,
        preparationTime: new Date().toISOString(),
        expiryTime: new Date(Date.now() + 4 * 3600000).toISOString(),
        storageCondition: 'heated',
        pickupAddress: 'Diplomatic Enclave, New Delhi',
        location: { lat: 28.6448, lng: 77.1074, address: 'Diplomatic Enclave, New Delhi' },
        notes: 'Gala event surplus - 50 full meals',
        status: 'pending',
        urgencyLevel: 'high',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setState(prev => ({ ...prev, donations: [scenarioDonation, ...prev.donations.filter(d => d.id !== 'scenario-donation')] }));
    }

    if (step === 2) {
      // AI detects high urgency
      setState(prev => ({
        ...prev,
        donations: prev.donations.map(d =>
          d.id === 'scenario-donation'
            ? {
                ...d,
                urgencyLevel: 'critical' as const,
                aiAnalysis: {
                  predictedCategory: 'cooked_meals',
                  urgencyLevel: 'critical',
                  estimatedShelfLifeHours: 4,
                  storageRecommendation: 'Keep heated above 60°C. Distribute immediately.',
                  confidenceScore: 96,
                  explanation: 'Freshly prepared cooked meals with 4-hour window. CRITICAL urgency detected.',
                  safetyWarnings: ['Must be distributed within 4 hours', 'Reheat to 75°C before serving'],
                },
              }
            : d,
        ),
      }));
    }

    if (step === 3) {
      // System matches NGO
      setState(prev => ({
        ...prev,
        donations: prev.donations.map(d =>
          d.id === 'scenario-donation' ? { ...d, status: 'matched' as const } : d,
        ),
        deliveries: [
          {
            id: 'scenario-delivery',
            donationId: 'scenario-donation',
            donationName: 'Gala Dinner Meals (50 portions)',
            matchId: 'scenario-match',
            donorName: 'Chef Ramesh',
            donorOrgName: 'The Taj Mahal Hotel',
            pickupLocation: { lat: 28.6448, lng: 77.1074, address: 'Diplomatic Enclave, New Delhi' },
            dropoffLocation: { lat: 28.6304, lng: 77.2177, address: 'Paharganj, New Delhi' },
            ngoName: 'Hope Food Bank',
            status: 'available',
            distanceKm: 4.8,
            estimatedMinutes: 18,
            quantity: 50,
            quantityKg: 25,
            category: 'cooked_meals',
            urgencyLevel: 'critical',
            createdAt: new Date().toISOString(),
          },
          ...prev.deliveries.filter(d => d.id !== 'scenario-delivery'),
        ],
      }));
    }

    if (step === 4) {
      // Volunteer accepts
      setState(prev => ({
        ...prev,
        deliveries: prev.deliveries.map(d =>
          d.id === 'scenario-delivery'
            ? { ...d, status: 'accepted' as const, volunteerId: 'user-volunteer-1', volunteerName: 'Arjun Singh', acceptedAt: new Date().toISOString() }
            : d,
        ),
      }));
    }

    if (step === 5) {
      // Marked as picked up then delivered
      setState(prev => ({
        ...prev,
        deliveries: prev.deliveries.map(d =>
          d.id === 'scenario-delivery'
            ? { ...d, status: 'delivered' as const, pickedUpAt: new Date(Date.now() - 900000).toISOString(), deliveredAt: new Date().toISOString() }
            : d,
        ),
        donations: prev.donations.map(d =>
          d.id === 'scenario-donation' ? { ...d, status: 'delivered' as const } : d,
        ),
      }));
    }

    if (step === 6) {
      // Impact updated
      setState(prev => ({
        ...prev,
        impact: {
          ...prev.impact,
          totalMeals: prev.impact.totalMeals + 50,
          totalKgRescued: prev.impact.totalKgRescued + 25,
          co2SavedKg: prev.impact.co2SavedKg + 62.5,
          landfillDivertedKg: prev.impact.landfillDivertedKg + 25,
          totalDeliveries: prev.impact.totalDeliveries + 1,
          beneficiariesServed: prev.impact.beneficiariesServed + 40,
        },
      }));
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        switchRole,
        addDonation,
        updateDonation,
        addRequirement,
        acceptDelivery,
        updateDeliveryStatus,
        markNotificationRead,
        addNotification,
        runMatchingDemo,
        simulateNewDonation,
        runScenario,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
