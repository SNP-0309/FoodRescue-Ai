'use client';

import { useApp } from '@/lib/store';
import { useState } from 'react';
import { ChevronRight, CheckCircle, Circle, X, Loader2 } from 'lucide-react';

const STEPS = [
  {
    title: '🍽️ Restaurant Adds 50 Meals',
    description: 'The Taj Mahal Hotel adds 50 Gala Dinner meal portions as a surplus food donation. Fields: food name, quantity, preparation time, expiry, storage condition, and pickup address.',
    role: 'donor',
    action: 'Donor creates donation',
  },
  {
    title: '🤖 AI Detects Critical Urgency',
    description: 'The AI Food Analysis module classifies the food as "Cooked Meals" with CRITICAL urgency (4-hour window). Confidence: 96%. Generates storage recommendations and safety warnings.',
    role: 'donor',
    action: 'AI analyzes food',
  },
  {
    title: '🎯 System Matches Nearest NGO',
    description: 'The AI Matching Engine scores all 5 NGOs using: Urgency (30%), Distance (25%), Demand (25%), Compatibility (10%), Capacity (10%). Hope Food Bank scores 87/100 — top recommendation.',
    role: 'ngo',
    action: 'AI matches receiver',
  },
  {
    title: '🚴 Volunteer Accepts Delivery',
    description: 'Volunteer Arjun Singh sees the available task (4.8 km, 18 min ETA). He accepts and views the optimized route on the OpenStreetMap view showing pickup and dropoff pins.',
    role: 'volunteer',
    action: 'Volunteer accepts task',
  },
  {
    title: '📦 Donation Marked Delivered',
    description: 'Arjun picks up the food and marks it as delivered at Hope Food Bank. The delivery status updates to "Delivered" with timestamp.',
    role: 'volunteer',
    action: 'Mark as delivered',
  },
  {
    title: '📊 Impact Dashboard Updates',
    description: 'Live impact metrics update: +50 meals rescued, +25 kg food saved, +40 beneficiaries served, +62.5 kg CO₂ reduction. Admin dashboard charts refresh in real time.',
    role: 'admin',
    action: 'View impact',
  },
];

interface Props {
  onClose: () => void;
}

export default function ScenarioModal({ onClose }: Props) {
  const { runScenario, switchRole } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [running, setRunning] = useState(false);

  const executeStep = async (stepIndex: number) => {
    if (running) return;
    setRunning(true);
    switchRole(STEPS[stepIndex].role as any);
    await runScenario(stepIndex + 1);
    setCompletedSteps(prev => [...prev, stepIndex]);
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    setRunning(false);
  };

  const isCompleted = (i: number) => completedSteps.includes(i);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-xl glass-card rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="gradient-hero p-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">🎬 Live Demo Scenario</h2>
            <p className="text-emerald-200 text-sm mt-1">6-step end-to-end food rescue workflow</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-emerald-900/20">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
            style={{ width: `${(completedSteps.length / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className={`rounded-xl border-2 transition-all ${
                isCompleted(i)
                  ? 'border-emerald-300 bg-emerald-50'
                  : currentStep === i
                  ? 'border-emerald-500 bg-white shadow-md'
                  : 'border-gray-100 bg-gray-50 opacity-60'
              }`}
            >
              <div className="p-3 flex items-start gap-3">
                <div className="mt-0.5">
                  {isCompleted(i) ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : currentStep === i ? (
                    <Circle className="w-5 h-5 text-emerald-500 fill-emerald-100" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm text-gray-800">{step.title}</h4>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium shrink-0">
                      {step.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.description}</p>
                  {currentStep === i && !isCompleted(i) && (
                    <button
                      onClick={() => executeStep(i)}
                      disabled={running}
                      className="mt-2.5 flex items-center gap-1.5 btn-primary text-xs py-1.5 px-3"
                    >
                      {running ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Running...</>
                      ) : (
                        <><ChevronRight className="w-3 h-3" /> {step.action}</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">Step {Math.min(currentStep + 1, STEPS.length)} of {STEPS.length}</span>
          {completedSteps.length === STEPS.length ? (
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <CheckCircle className="w-4 h-4" />
              Demo Complete! 🎉
            </div>
          ) : (
            <button onClick={onClose} className="btn-outline text-xs py-1.5 px-3">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
