'use client';

import { useApp } from '@/lib/store';
import { Play, Zap, PlusCircle, Users, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import ScenarioModal from '@/components/demo/ScenarioModal';

const ROLE_ICONS: Record<string, string> = {
  donor: '🍽️',
  ngo: '🏠',
  volunteer: '🚴',
  admin: '⚙️',
};

export default function DemoBar() {
  const { switchRole, currentUser, runMatchingDemo, simulateNewDonation } = useApp();
  const [showScenario, setShowScenario] = useState(false);
  const [matchingRunning, setMatchingRunning] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRunMatching = async () => {
    setMatchingRunning(true);
    await runMatchingDemo();
    setMatchingRunning(false);
    showToast('✅ AI Matching complete! A critical donation has been matched.');
  };

  const handleSimulate = async () => {
    setSimulating(true);
    const donation = simulateNewDonation();
    setTimeout(() => {
      setSimulating(false);
      showToast(`🎉 New donation simulated: "${donation.foodName}"`);
    }, 600);
  };

  return (
    <>
      <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 border-b border-emerald-500/40 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          {/* Demo label */}
          <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 shrink-0">
            <Play className="w-3 h-3 text-white" />
            <span className="text-white text-xs font-bold">DEMO MODE</span>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2 py-1 shrink-0">
            <Users className="w-3 h-3 text-white/70" />
            {(['donor', 'ngo', 'volunteer', 'admin'] as const).map(role => (
              <button
                key={role}
                onClick={() => switchRole(role)}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all capitalize ${
                  currentUser?.role === role
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-white/80 hover:bg-white/20'
                }`}
              >
                <span>{ROLE_ICONS[role]}</span>
                <span className="hidden sm:inline">{role === 'ngo' ? 'NGO' : role.charAt(0).toUpperCase() + role.slice(1)}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-0" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-70 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {simulating ? 'Creating...' : 'Simulate Donation'}
            </button>

            <button
              onClick={handleRunMatching}
              disabled={matchingRunning}
              className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-70 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-full transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              {matchingRunning ? 'Matching...' : 'Run AI Matching'}
            </button>

            <button
              onClick={() => setShowScenario(true)}
              className="flex items-center gap-1.5 bg-white text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-all shadow-sm hover:bg-emerald-50"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              Demo Scenario
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[100] bg-emerald-800 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* Scenario Modal */}
      {showScenario && <ScenarioModal onClose={() => setShowScenario(false)} />}
    </>
  );
}
