'use client';

import { useApp } from '@/lib/store';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Leaf, ArrowRight } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'donor', email: 'donor@demo.com', label: '🍽️ Food Donor', desc: 'Grand Hyatt Restaurant', color: 'from-emerald-500 to-emerald-700' },
  { role: 'ngo', email: 'ngo@demo.com', label: '🏠 NGO / Food Bank', desc: 'Hope Food Bank', color: 'from-blue-500 to-blue-700' },
  { role: 'volunteer', email: 'volunteer@demo.com', label: '🚴 Volunteer', desc: 'Arjun Singh - Van Delivery', color: 'from-purple-500 to-purple-700' },
  { role: 'admin', email: 'admin@demo.com', label: '⚙️ Administrator', desc: 'Platform Manager', color: 'from-rose-500 to-rose-700' },
];

export default function LoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (!success) {
      setError('Invalid credentials. Use one of the demo accounts below.');
    }
  };

  const quickLogin = async (demoEmail: string) => {
    setLoading(true);
    await login(demoEmail, 'demo');
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Hero text */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-6 py-16">
        {/* Left: Brand */}
        <div className="text-center lg:text-left max-w-lg">
          <div className="flex items-center gap-3 justify-center lg:justify-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white leading-none">FoodRescue AI</h1>
              <p className="text-emerald-300 text-sm font-medium">Powered by Intelligence</p>
            </div>
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
            Rescue Food.<br />
            <span className="text-emerald-300">Feed Communities.</span>
          </h2>
          <p className="text-emerald-200 text-lg leading-relaxed mb-8">
            AI-powered platform connecting restaurants, NGOs, and volunteers to eliminate food waste and feed those in need.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '3,640+', label: 'Meals Rescued' },
              { value: '1,820 kg', label: 'Food Saved' },
              { value: '2,180+', label: 'Beneficiaries' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-xl font-extrabold text-white">{s.value}</p>
                <p className="text-emerald-300 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login card */}
        <div className="w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-gray-800 mb-1">Welcome Back</h3>
          <p className="text-gray-500 text-sm mb-5">Sign in to your dashboard</p>

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="form-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className="form-input pl-9"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input pl-9 pr-9"
                  placeholder="Any password works in demo"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-red-500 text-xs bg-red-50 p-2.5 rounded-lg">{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 text-sm">
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Accounts */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">Quick Demo Login</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.role}
                  onClick={() => quickLogin(acc.email)}
                  disabled={loading}
                  className={`bg-gradient-to-br ${acc.color} text-white rounded-xl p-3 text-left hover:opacity-90 transition-opacity shadow-sm`}
                >
                  <p className="font-semibold text-sm">{acc.label}</p>
                  <p className="text-white/75 text-xs mt-0.5">{acc.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
