// FoodRescue AI — Domain Models (Dart)
// Using simple Dart classes with fromJson/toJson for prototype
// (Replace with Freezed generated code in production)

import 'package:flutter/foundation.dart';

// ── User / Auth ───────────────────────────────────────────────────────────────

class AppUser {
  final String id;
  final String name;
  final String email;
  final String role;

  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        name: json['name'] as String,
        email: json['email'] as String,
        role: json['role'] as String,
      );

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'email': email, 'role': role};
}

// ── Screening ─────────────────────────────────────────────────────────────────

class ScreeningResult {
  static const clear = 'CLEAR';
  static const concern = 'CONCERN';
  static const uncertain = 'UNCERTAIN';
  static const unavailable = 'UNAVAILABLE';

  static String label(String result) {
    switch (result) {
      case clear: return 'Clear';
      case concern: return 'Concern';
      case uncertain: return 'Uncertain';
      case unavailable: return 'Unavailable';
      default: return result;
    }
  }
}

// ── Score Breakdown ───────────────────────────────────────────────────────────

class ScoreBreakdown {
  final double visualCondition;
  final double timeScore;
  final double foodTypeScore;
  final double storageScore;
  final double temperatureScore;
  final double packagingScore;
  final double deliveryTimeScore;
  final double windowScore;
  final double total;
  final List<String> blockers;
  final List<String> warnings;

  const ScoreBreakdown({
    required this.visualCondition,
    required this.timeScore,
    required this.foodTypeScore,
    required this.storageScore,
    required this.temperatureScore,
    required this.packagingScore,
    required this.deliveryTimeScore,
    required this.windowScore,
    required this.total,
    required this.blockers,
    required this.warnings,
  });

  factory ScoreBreakdown.fromJson(Map<String, dynamic> json) => ScoreBreakdown(
        visualCondition: (json['visualCondition'] as num?)?.toDouble() ?? 0,
        timeScore: (json['timeScore'] as num?)?.toDouble() ?? 0,
        foodTypeScore: (json['foodTypeScore'] as num?)?.toDouble() ?? 0,
        storageScore: (json['storageScore'] as num?)?.toDouble() ?? 0,
        temperatureScore: (json['temperatureScore'] as num?)?.toDouble() ?? 0,
        packagingScore: (json['packagingScore'] as num?)?.toDouble() ?? 0,
        deliveryTimeScore: (json['deliveryTimeScore'] as num?)?.toDouble() ?? 0,
        windowScore: (json['windowScore'] as num?)?.toDouble() ?? 0,
        total: (json['total'] as num?)?.toDouble() ?? 0,
        blockers: List<String>.from(json['blockers'] as List? ?? []),
        warnings: List<String>.from(json['warnings'] as List? ?? []),
      );
}

// ── Donation ──────────────────────────────────────────────────────────────────

class Donation {
  final String id;
  final String donorId;
  final String foodName;
  final String category;
  final int quantity;
  final double weightKg;
  final String? description;
  final List<String> allergens;
  final String? handlingNotes;
  final DateTime preparedAt;
  final int usableDuration;
  final DateTime expiryTime;
  final String storageCondition;
  final double? temperature;
  final String packagingCondition;
  final String pickupLat;
  final String pickupLng;
  final String pickupAddress;
  final String? photoUrl;
  final String screeningResult;
  final String? screeningNotes;
  final double suitabilityScore;
  final ScoreBreakdown? scoreBreakdown;
  final String status;
  final int remainingWindowMinutes;
  final DateTime createdAt;

  const Donation({
    required this.id,
    required this.donorId,
    required this.foodName,
    required this.category,
    required this.quantity,
    required this.weightKg,
    this.description,
    required this.allergens,
    this.handlingNotes,
    required this.preparedAt,
    required this.usableDuration,
    required this.expiryTime,
    required this.storageCondition,
    this.temperature,
    required this.packagingCondition,
    required this.pickupLat,
    required this.pickupLng,
    required this.pickupAddress,
    this.photoUrl,
    required this.screeningResult,
    this.screeningNotes,
    required this.suitabilityScore,
    this.scoreBreakdown,
    required this.status,
    required this.remainingWindowMinutes,
    required this.createdAt,
  });

  factory Donation.fromJson(Map<String, dynamic> json) => Donation(
        id: json['id'] as String,
        donorId: json['donorId'] as String,
        foodName: json['foodName'] as String,
        category: json['category'] as String,
        quantity: (json['quantity'] as num).toInt(),
        weightKg: (json['weightKg'] as num).toDouble(),
        description: json['description'] as String?,
        allergens: List<String>.from(json['allergens'] as List? ?? []),
        handlingNotes: json['handlingNotes'] as String?,
        preparedAt: DateTime.parse(json['preparedAt'] as String),
        usableDuration: (json['usableDuration'] as num).toInt(),
        expiryTime: DateTime.parse(json['expiryTime'] as String),
        storageCondition: json['storageCondition'] as String,
        temperature: (json['temperature'] as num?)?.toDouble(),
        packagingCondition: json['packagingCondition'] as String,
        pickupLat: json['pickupLat'].toString(),
        pickupLng: json['pickupLng'].toString(),
        pickupAddress: json['pickupAddress'] as String,
        photoUrl: json['photoUrl'] as String?,
        screeningResult: json['screeningResult'] as String? ?? 'UNAVAILABLE',
        screeningNotes: json['screeningNotes'] as String?,
        suitabilityScore: (json['suitabilityScore'] as num?)?.toDouble() ?? 0,
        scoreBreakdown: json['scoreBreakdown'] is Map
            ? ScoreBreakdown.fromJson(json['scoreBreakdown'] as Map<String, dynamic>)
            : null,
        status: json['status'] as String? ?? 'posted',
        remainingWindowMinutes:
            (json['remainingWindowMinutes'] as num?)?.toInt() ?? 0,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  bool get isExpired => remainingWindowMinutes <= 0;
  bool get isBlocked => status == 'blocked';
  bool get needsReview => status == 'needs_review';
  bool get isEligible => status == 'eligible';
}

// ── Receiver ──────────────────────────────────────────────────────────────────

class Receiver {
  final String id;
  final String userId;
  final String orgName;
  final String orgType;
  final String contactName;
  final String? contactPhone;
  final int currentDemand;
  final int maxCapacity;
  final List<String> acceptedCategories;
  final List<String> availableStorage;
  final double lat;
  final double lng;
  final String address;
  final String urgency;
  final bool canArrangePickup;
  final bool isActive;

  const Receiver({
    required this.id,
    required this.userId,
    required this.orgName,
    required this.orgType,
    required this.contactName,
    this.contactPhone,
    required this.currentDemand,
    required this.maxCapacity,
    required this.acceptedCategories,
    required this.availableStorage,
    required this.lat,
    required this.lng,
    required this.address,
    required this.urgency,
    required this.canArrangePickup,
    required this.isActive,
  });

  factory Receiver.fromJson(Map<String, dynamic> json) => Receiver(
        id: json['id'] as String,
        userId: json['userId'] as String,
        orgName: json['orgName'] as String,
        orgType: json['orgType'] as String,
        contactName: json['contactName'] as String,
        contactPhone: json['contactPhone'] as String?,
        currentDemand: (json['currentDemand'] as num).toInt(),
        maxCapacity: (json['maxCapacity'] as num).toInt(),
        acceptedCategories: List<String>.from(json['acceptedCategories'] as List? ?? []),
        availableStorage: List<String>.from(json['availableStorage'] as List? ?? []),
        lat: (json['lat'] as num).toDouble(),
        lng: (json['lng'] as num).toDouble(),
        address: json['address'] as String,
        urgency: json['urgency'] as String? ?? 'medium',
        canArrangePickup: json['canArrangePickup'] as bool? ?? false,
        isActive: json['isActive'] as bool? ?? true,
      );
}

// ── Volunteer ─────────────────────────────────────────────────────────────────

class Volunteer {
  final String id;
  final String userId;
  final String vehicleType;
  final int maxMealCapacity;
  final List<String> storageTypes;
  final bool isAvailable;
  final double? currentLat;
  final double? currentLng;

  const Volunteer({
    required this.id,
    required this.userId,
    required this.vehicleType,
    required this.maxMealCapacity,
    required this.storageTypes,
    required this.isAvailable,
    this.currentLat,
    this.currentLng,
  });

  factory Volunteer.fromJson(Map<String, dynamic> json) => Volunteer(
        id: json['id'] as String,
        userId: json['userId'] as String,
        vehicleType: json['vehicleType'] as String,
        maxMealCapacity: (json['maxMealCapacity'] as num).toInt(),
        storageTypes: List<String>.from(json['storageTypes'] as List? ?? []),
        isAvailable: json['isAvailable'] as bool? ?? false,
        currentLat: (json['currentLat'] as num?)?.toDouble(),
        currentLng: (json['currentLng'] as num?)?.toDouble(),
      );
}

// ── Match Candidate ───────────────────────────────────────────────────────────

class MatchCandidate {
  final String receiverId;
  final String receiverName;
  final String orgType;
  final double lat;
  final double lng;
  final String address;
  final double distanceKm;
  final int estimatedTravelMinutes;
  final int matchScore;
  final bool canFulfill;
  final int quantityNeeded;
  final int quantityToAllocate;
  final List<String> reasons;
  final bool storageCompatible;
  final bool categoryAccepted;
  final bool withinWindow;
  final String urgency;

  const MatchCandidate({
    required this.receiverId,
    required this.receiverName,
    required this.orgType,
    required this.lat,
    required this.lng,
    required this.address,
    required this.distanceKm,
    required this.estimatedTravelMinutes,
    required this.matchScore,
    required this.canFulfill,
    required this.quantityNeeded,
    required this.quantityToAllocate,
    required this.reasons,
    required this.storageCompatible,
    required this.categoryAccepted,
    required this.withinWindow,
    required this.urgency,
  });

  factory MatchCandidate.fromJson(Map<String, dynamic> json) => MatchCandidate(
        receiverId: json['receiverId'] as String,
        receiverName: json['receiverName'] as String,
        orgType: json['orgType'] as String? ?? 'ngo',
        lat: (json['lat'] as num).toDouble(),
        lng: (json['lng'] as num).toDouble(),
        address: json['address'] as String? ?? '',
        distanceKm: (json['distanceKm'] as num).toDouble(),
        estimatedTravelMinutes: (json['estimatedTravelMinutes'] as num).toInt(),
        matchScore: (json['matchScore'] as num).toInt(),
        canFulfill: json['canFulfill'] as bool? ?? false,
        quantityNeeded: (json['quantityNeeded'] as num).toInt(),
        quantityToAllocate: (json['quantityToAllocate'] as num? ?? 0).toInt(),
        reasons: List<String>.from(json['reasons'] as List? ?? []),
        storageCompatible: json['storageCompatible'] as bool? ?? false,
        categoryAccepted: json['categoryAccepted'] as bool? ?? false,
        withinWindow: json['withinWindow'] as bool? ?? false,
        urgency: json['urgency'] as String? ?? 'medium',
      );
}

// ── Delivery ──────────────────────────────────────────────────────────────────

class Delivery {
  final String id;
  final String donationId;
  final String? volunteerId;
  final String status;
  final Donation? donation;
  final DateTime? pickedUpAt;
  final DateTime? deliveredAt;
  final String? recipientName;
  final String? incidentType;
  final DateTime? createdAt;

  const Delivery({
    required this.id,
    required this.donationId,
    this.volunteerId,
    required this.status,
    this.donation,
    this.pickedUpAt,
    this.deliveredAt,
    this.recipientName,
    this.incidentType,
    this.createdAt,
  });

  factory Delivery.fromJson(Map<String, dynamic> json) => Delivery(
        id: json['id'] as String,
        donationId: json['donationId'] as String,
        volunteerId: json['volunteerId'] as String?,
        status: json['status'] as String? ?? 'pending',
        donation: json['donation'] is Map
            ? Donation.fromJson(json['donation'] as Map<String, dynamic>)
            : null,
        pickedUpAt: json['pickedUpAt'] != null
            ? DateTime.parse(json['pickedUpAt'] as String)
            : null,
        deliveredAt: json['deliveredAt'] != null
            ? DateTime.parse(json['deliveredAt'] as String)
            : null,
        recipientName: json['recipientName'] as String?,
        incidentType: json['incidentType'] as String?,
        createdAt: json['createdAt'] != null
            ? DateTime.parse(json['createdAt'] as String)
            : null,
      );
}

// ── Analytics ─────────────────────────────────────────────────────────────────

class AnalyticsSummary {
  final double totalWeightRescuedKg;
  final int totalMealsRedistributed;
  final double estimatedWastePreventedKg;
  final int activeDonors;
  final int activeReceivers;
  final int successfulDeliveries;
  final int averageDeliveryMinutes;
  final int highRiskFoodRejected;
  final Map<String, int> mealsByCategory;
  final List<DayChartEntry> sevenDayChart;

  const AnalyticsSummary({
    required this.totalWeightRescuedKg,
    required this.totalMealsRedistributed,
    required this.estimatedWastePreventedKg,
    required this.activeDonors,
    required this.activeReceivers,
    required this.successfulDeliveries,
    required this.averageDeliveryMinutes,
    required this.highRiskFoodRejected,
    required this.mealsByCategory,
    required this.sevenDayChart,
  });

  factory AnalyticsSummary.fromJson(Map<String, dynamic> json) => AnalyticsSummary(
        totalWeightRescuedKg: (json['totalWeightRescuedKg'] as num?)?.toDouble() ?? 0,
        totalMealsRedistributed: (json['totalMealsRedistributed'] as num?)?.toInt() ?? 0,
        estimatedWastePreventedKg: (json['estimatedWastePreventedKg'] as num?)?.toDouble() ?? 0,
        activeDonors: (json['activeDonors'] as num?)?.toInt() ?? 0,
        activeReceivers: (json['activeReceivers'] as num?)?.toInt() ?? 0,
        successfulDeliveries: (json['successfulDeliveries'] as num?)?.toInt() ?? 0,
        averageDeliveryMinutes: (json['averageDeliveryMinutes'] as num?)?.toInt() ?? 0,
        highRiskFoodRejected: (json['highRiskFoodRejected'] as num?)?.toInt() ?? 0,
        mealsByCategory: Map<String, int>.from(
          (json['mealsByCategory'] as Map? ?? {}).map(
            (k, v) => MapEntry(k.toString(), (v as num).toInt()),
          ),
        ),
        sevenDayChart: (json['sevenDayChart'] as List? ?? [])
            .map((e) => DayChartEntry.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class DayChartEntry {
  final String date;
  final int mealsDelivered;
  final double weightKg;

  const DayChartEntry({
    required this.date,
    required this.mealsDelivered,
    required this.weightKg,
  });

  factory DayChartEntry.fromJson(Map<String, dynamic> json) => DayChartEntry(
        date: json['date'] as String,
        mealsDelivered: (json['mealsDelivered'] as num?)?.toInt() ?? 0,
        weightKg: (json['weightKg'] as num?)?.toDouble() ?? 0,
      );
}
