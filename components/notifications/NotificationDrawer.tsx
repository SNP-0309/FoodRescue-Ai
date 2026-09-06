'use client';

import { useApp } from '@/lib/store';
import { Bell, X, Check } from 'lucide-react';

const TYPE_ICONS: Record<string, string> = {
  match: '🎯',
  accepted: '✅',
  volunteer: '🚴',
  pickup: '📦',
  delivered: '🎉',
  expiry: '⚠️',
  info: 'ℹ️',
};

const TYPE_COLORS: Record<string, string> = {
  match: 'border-l-blue-400 bg-blue-50',
  accepted: 'border-l-green-400 bg-green-50',
  volunteer: 'border-l-purple-400 bg-purple-50',
  pickup: 'border-l-orange-400 bg-orange-50',
  delivered: 'border-l-emerald-400 bg-emerald-50',
  expiry: 'border-l-red-400 bg-red-50',
  info: 'border-l-gray-400 bg-gray-50',
};

interface Props {
  onClose: () => void;
}

export default function NotificationDrawer({ onClose }: Props) {
  const { notifications, currentUser, markNotificationRead } = useApp();

  const myNotifications = notifications.filter(n =>
    !currentUser || n.userId === currentUser.id || true // Show all in demo
  ).slice(0, 10);

  const formatTime = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 60000;
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${Math.round(diff)}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return `${Math.round(diff / 1440)}d ago`;
  };

  return (
    <div className="fixed top-16 right-4 z-50 w-80 max-h-[calc(100vh-100px)] flex flex-col glass-card rounded-2xl shadow-2xl border border-white/60 animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-600" />
          <h3 className="font-semibold text-gray-800">Notifications</h3>
          <span className="badge badge-critical text-[10px]">
            {myNotifications.filter(n => !n.isRead).length} new
          </span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {myNotifications.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>
        ) : (
          myNotifications.map(notif => (
            <div
              key={notif.id}
              className={`relative border-l-4 px-4 py-3 border-b border-gray-50 transition-colors hover:bg-gray-50/50 ${TYPE_COLORS[notif.type] || TYPE_COLORS.info} ${notif.isRead ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-base mt-0.5">{TYPE_ICONS[notif.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{notif.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{formatTime(notif.createdAt)}</p>
                </div>
                {!notif.isRead && (
                  <button
                    onClick={() => markNotificationRead(notif.id)}
                    className="w-5 h-5 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center mt-0.5 shrink-0"
                  >
                    <Check className="w-3 h-3 text-emerald-600" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
