'use client';

import { useApp } from '@/lib/store';
import { Bell, LogOut, Leaf, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import NotificationDrawer from '@/components/notifications/NotificationDrawer';

const ROLE_COLORS: Record<string, string> = {
  donor: 'bg-emerald-100 text-emerald-700',
  ngo: 'bg-blue-100 text-blue-700',
  volunteer: 'bg-purple-100 text-purple-700',
  admin: 'bg-rose-100 text-rose-700',
};

const ROLE_LABELS: Record<string, string> = {
  donor: 'Food Donor',
  ngo: 'NGO / Food Bank',
  volunteer: 'Volunteer',
  admin: 'Administrator',
};

export default function Navbar() {
  const { currentUser, notifications, logout } = useApp();
  const [showNotif, setShowNotif] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead && n.userId === currentUser?.id).length;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 glass-card border-b border-white/40 px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-emerald-800 text-lg leading-none">FoodRescue</span>
            <span className="block text-[10px] font-semibold text-emerald-500 leading-none tracking-wider">AI</span>
          </div>
        </div>

        {/* Center - Food Safety Notice */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700 font-medium">
          <span>⚠️</span>
          <span>AI predictions are recommendations only — always apply food-safety standards</span>
        </div>

        {/* Right Actions */}
        {currentUser ? (
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative w-9 h-9 rounded-xl hover:bg-emerald-50 flex items-center justify-center transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-800 leading-none">{currentUser.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{ROLE_LABELS[currentUser.role]}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 glass-card rounded-xl shadow-xl border border-white/60 py-1 animate-fade-in z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <span className={`badge ${ROLE_COLORS[currentUser.role]} text-[10px]`}>
                      {ROLE_LABELS[currentUser.role]}
                    </span>
                  </div>
                  <button
                    onClick={() => { logout(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Demo Mode</span>
          </div>
        )}
      </nav>

      {/* Notification Drawer */}
      {showNotif && (
        <NotificationDrawer onClose={() => setShowNotif(false)} />
      )}
    </>
  );
}
