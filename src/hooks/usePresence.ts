import { useState, useEffect, useCallback, useRef } from 'react';
import {
  sendPresencePing,
  sendOfflinePing,
  subscribeToVisitorPresence,
  getOrCreateVisitorId,
} from '../services/presence';
import { VisitorStats, VisitorPresence } from '../types';

export function usePresence(isAdminUnlocked: boolean, activeTabName: string = 'dashboard') {
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({
    onlineWaliMuridCount: 0,
    onlinePengurusCount: 0,
    onlineTotalCount: 0,
    todayVisitCount: 0,
    lastWaliMuridOpenedAt: null,
    activeVisitors: [],
    recentVisitors: [],
  });

  const [arrivalToast, setArrivalToast] = useState<{
    id: string;
    visitor: VisitorPresence;
    timestamp: Date;
  } | null>(null);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const role = isAdminUnlocked ? 'pengurus' : 'wali_murid';

  // Handle new visitor arrival notification
  const handleNewWaliMurid = useCallback((visitor: VisitorPresence) => {
    // Show toast for 5 seconds
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setArrivalToast({
      id: `${visitor.visitorId}_${Date.now()}`,
      visitor,
      timestamp: new Date(),
    });
    toastTimerRef.current = setTimeout(() => {
      setArrivalToast(null);
    }, 5000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setArrivalToast(null);
  }, []);

  useEffect(() => {
    // 1. Send initial heartbeat ping
    sendPresencePing(role, true, activeTabName);

    // 2. Heartbeat interval every 25 seconds
    const pingInterval = setInterval(() => {
      sendPresencePing(role, true, activeTabName);
    }, 25000);

    // 3. Subscribe to real-time presence collection
    const unsubscribe = subscribeToVisitorPresence(
      undefined,
      (newStats) => {
        setVisitorStats(newStats);
      },
      handleNewWaliMurid
    );

    // 4. Handle visibility changes and tab unload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendPresencePing(role, true, activeTabName);
      } else {
        // Tab hidden / minimized
        sendPresencePing(role, true, activeTabName);
      }
    };

    const handleBeforeUnload = () => {
      sendOfflinePing(role);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(pingInterval);
      unsubscribe();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      sendOfflinePing(role);
    };
  }, [role, activeTabName, handleNewWaliMurid]);

  return {
    visitorStats,
    arrivalToast,
    dismissToast,
    myVisitorId: getOrCreateVisitorId(),
  };
}
