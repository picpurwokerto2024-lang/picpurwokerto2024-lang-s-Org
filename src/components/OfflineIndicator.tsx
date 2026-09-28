import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-banner"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center justify-between gap-3 rounded-xl bg-amber-900 text-amber-50 px-4 py-2.5 text-xs font-medium shadow-xl border border-amber-700 animate-bounce"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-amber-300 shrink-0" />
        <span>Mode Offline — Semua data kas tetap tersimpan aman di perangkat.</span>
      </div>
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
    </div>
  );
};
