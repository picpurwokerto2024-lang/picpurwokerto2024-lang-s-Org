import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppState, ClassConfig, Student, Transaction, JimpitanRecord, SavingsGoal, PaymentMethod } from '../types';
import { loadAppState, saveAppState, getInitialAppState, DEFAULT_CONFIG } from '../services/storage';
import { getTodayDateStr } from '../services/utils';
import { getCurrentMonthKey, formatMonthLabel } from '../services/monthlyKas';
import { subscribeToClassData, syncClassStateToFirestore, testConnection, DEFAULT_CLASS_ID } from '../services/firebase';
import confetti from 'canvas-confetti';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export function useKasStore() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const latestStateRef = useRef<AppState>(state);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRemoteUpdateRef = useRef(false);

  // Keep latestStateRef always in sync with state
  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  // Helper function to push changes to cloud with low debounce
  const pushToCloud = useCallback((stateToSync: AppState) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    setSyncStatus('syncing');
    syncTimeoutRef.current = setTimeout(() => {
      syncClassStateToFirestore(stateToSync, DEFAULT_CLASS_ID)
        .then(() => {
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
        })
        .catch((err) => {
          console.warn('Cloud sync offline/fallback notice:', err);
          setSyncStatus('offline');
        });
    }, 200);
  }, []);

  // Flush sync on beforeunload or tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (latestStateRef.current) {
        saveAppState(latestStateRef.current);
        syncClassStateToFirestore(latestStateRef.current, DEFAULT_CLASS_ID).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  // 1. Initial test & Realtime Listener with Conflict-Free Merging
  useEffect(() => {
    testConnection();

    const unsubscribe = subscribeToClassData(
      DEFAULT_CLASS_ID,
      (remoteData) => {
        if (!remoteData || !remoteData.classConfig) {
          // Document does not exist in cloud yet, push our current local state
          pushToCloud(latestStateRef.current);
          return;
        }

        let students = Array.isArray(remoteData.students) ? remoteData.students : [];
        let jimpitanRecords = Array.isArray(remoteData.jimpitanRecords) ? remoteData.jimpitanRecords : [];
        let transactions = Array.isArray(remoteData.transactions) ? remoteData.transactions : [];
        let savingsGoals = Array.isArray(remoteData.savingsGoals) ? remoteData.savingsGoals : [];

        // Purge legacy demo data if exact legacy student is detected
        const hasLegacyDemo = students.some((s) => s.id === 'std-1' && s.name === 'Ahmad Fauzi Pratama' && s.phone === '6281234567801');
        if (hasLegacyDemo) {
          students = [];
          jimpitanRecords = [];
          transactions = [];
          savingsGoals = [];
        }

        const local = latestStateRef.current;
        const localUpdatedAt = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
        const remoteUpdatedAt = remoteData.updatedAt ? new Date(remoteData.updatedAt).getTime() : 0;

        const hasLocalData = (local.students && local.students.length > 0) ||
                             (local.transactions && local.transactions.length > 0) ||
                             (local.jimpitanRecords && local.jimpitanRecords.length > 0);

        const hasRemoteData = (students && students.length > 0) ||
                              (transactions && transactions.length > 0) ||
                              (jimpitanRecords && jimpitanRecords.length > 0);

        // CRITICAL PROTECTION: If local has real data entered by user but remote is empty or outdated,
        // do NOT wipe local data! Instead, sync local data to remote!
        if (hasLocalData && !hasRemoteData && localUpdatedAt >= remoteUpdatedAt) {
          pushToCloud(local);
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
          return;
        }

        // If local is strictly newer by more than 1 second, keep local and push to cloud
        if (localUpdatedAt > remoteUpdatedAt && (localUpdatedAt - remoteUpdatedAt > 1000) && hasLocalData) {
          pushToCloud(local);
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
          return;
        }

        // Remote is newer or equal: apply remote data safely
        isRemoteUpdateRef.current = true;
        const nextState: AppState = {
          classConfig: { ...local.classConfig, ...remoteData.classConfig },
          students,
          jimpitanRecords,
          transactions,
          savingsGoals,
          lastBackupDate: remoteData.lastBackupDate || local.lastBackupDate,
          updatedAt: remoteData.updatedAt || local.updatedAt || new Date().toISOString(),
        };

        latestStateRef.current = nextState;
        setState(nextState);
        saveAppState(nextState);
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
      },
      (err) => {
        console.warn('Firestore subscription status:', err);
        setSyncStatus('offline');
      }
    );

    return () => unsubscribe();
  }, [pushToCloud]);

  // Central state update function that guarantees instant LocalStorage save & Cloud sync
  const updateStore = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      const nextWithTimestamp: AppState = {
        ...next,
        updatedAt: new Date().toISOString(),
      };
      latestStateRef.current = nextWithTimestamp;
      saveAppState(nextWithTimestamp);
      pushToCloud(nextWithTimestamp);
      return nextWithTimestamp;
    });
  }, [pushToCloud]);

  // Manual trigger sync
  const triggerManualSync = useCallback(() => {
    setSyncStatus('syncing');
    const currentState = latestStateRef.current;
    return syncClassStateToFirestore(currentState, DEFAULT_CLASS_ID)
      .then(() => {
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
        return true;
      })
      .catch((err) => {
        console.warn('Manual sync failed:', err);
        setSyncStatus('offline');
        return false;
      });
  }, []);

  // -- COMPUTED TOTALS --
  const totals = useMemo(() => {
    const today = getTodayDateStr();
    const currentMonthKey = getCurrentMonthKey();
    const currentMonthLabel = formatMonthLabel(currentMonthKey);

    // 1. Direct Income Transactions
    const directIncome = state.transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // 2. Jimpitan / Iuran Collection
    const jimpitanTotal = state.jimpitanRecords
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);

    // 3. Jimpitan Today
    const jimpitanToday = state.jimpitanRecords
      .filter((r) => r.status === 'paid' && r.date === today)
      .reduce((sum, r) => sum + r.amount, 0);

    // 4. Jimpitan This Month
    const thisMonthPaidRecords = state.jimpitanRecords.filter(
      (r) => r.status === 'paid' && (r.month === currentMonthKey || (r.date && r.date.startsWith(currentMonthKey)))
    );
    const jimpitanThisMonth = thisMonthPaidRecords.reduce((sum, r) => sum + r.amount, 0);

    // 5. Total Expenses
    const totalExpense = state.transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // 6. Total Balance
    const totalIncome = directIncome + jimpitanTotal;
    const balance = totalIncome - totalExpense;

    // 7. Savings Allocated
    const allocatedSavings = state.savingsGoals.reduce((sum, g) => sum + g.currentAllocatedAmount, 0);
    const unallocatedCash = Math.max(0, balance - allocatedSavings);

    // 8. Active Students
    const activeStudents = state.students.filter((s) => s.isActive);
    const todayRecords = state.jimpitanRecords.filter((r) => r.date === today);
    const todayPaidCount = todayRecords.filter((r) => r.status === 'paid').length;
    const todayUnpaidCount = Math.max(0, activeStudents.length - todayPaidCount);
    const todayProgress = activeStudents.length > 0 ? Math.round((todayPaidCount / activeStudents.length) * 100) : 0;

    // 9. Monthly Progress
    const thisMonthPaidCount = thisMonthPaidRecords.length;
    const thisMonthUnpaidCount = Math.max(0, activeStudents.length - thisMonthPaidCount);
    const thisMonthProgress = activeStudents.length > 0 ? Math.round((thisMonthPaidCount / activeStudents.length) * 100) : 0;

    return {
      directIncome,
      jimpitanTotal,
      totalIncome,
      totalExpense,
      balance,
      allocatedSavings,
      unallocatedCash,
      jimpitanToday,
      activeStudentsCount: activeStudents.length,
      todayPaidCount,
      todayUnpaidCount,
      todayProgress,
      jimpitanThisMonth,
      thisMonthPaidCount,
      thisMonthUnpaidCount,
      thisMonthProgress,
      currentMonthStr: currentMonthKey,
      currentMonthLabel,
    };
  }, [state]);

  // Student summary metrics
  const studentMetrics = useMemo(() => {
    const map = new Map<
      string,
      { totalPaid: number; paidCount: number; unpaidCount: number; unpaidTotal: number; lastPaidDate?: string }
    >();

    const activeStudents = state.students.filter((s) => s.isActive);
    const defaultAmount = state?.classConfig?.defaultAmount ?? 2000;

    activeStudents.forEach((student) => {
      const records = state.jimpitanRecords.filter((r) => r.studentId === student.id);
      const paidRecords = records.filter((r) => r.status === 'paid');
      const unpaidRecords = records.filter((r) => r.status === 'unpaid');

      const totalPaid = paidRecords.reduce((sum, r) => sum + r.amount, 0);
      const paidCount = paidRecords.length;
      const unpaidCount = unpaidRecords.length;
      const unpaidTotal = unpaidRecords.reduce((sum, r) => sum + (r.amount || defaultAmount), 0);

      const sortedPaid = [...paidRecords].sort((a, b) => b.date.localeCompare(a.date));
      const lastPaidDate = sortedPaid[0]?.date;

      map.set(student.id, {
        totalPaid,
        paidCount,
        unpaidCount,
        unpaidTotal,
        lastPaidDate,
      });
    });

    return map;
  }, [state.students, state.jimpitanRecords, state?.classConfig?.defaultAmount]);

  // -- ACTIONS: JIMPITAN --
  const toggleJimpitanStatus = useCallback(
    (studentId: string, date: string, customAmount?: number, paymentMethod: PaymentMethod = 'cash') => {
      updateStore((prev) => {
        const existingIdx = prev.jimpitanRecords.findIndex(
          (r) => r.studentId === studentId && r.date === date
        );
        const amount = customAmount ?? prev.classConfig?.defaultAmount ?? 2000;

        let updated = [...prev.jimpitanRecords];
        let nowPaid = false;

        if (existingIdx >= 0) {
          const current = updated[existingIdx];
          if (current.status === 'paid') {
            updated[existingIdx] = {
              ...current,
              status: 'unpaid',
              paidAt: undefined,
            };
          } else {
            updated[existingIdx] = {
              ...current,
              status: 'paid',
              amount,
              paymentMethod,
              paidAt: new Date().toISOString(),
            };
            nowPaid = true;
          }
        } else {
          updated.push({
            id: `rec-${date}-${studentId}-${Date.now()}`,
            studentId,
            date,
            amount,
            status: 'paid',
            paymentMethod,
            paidAt: new Date().toISOString(),
          });
          nowPaid = true;
        }

        // Trigger confetti if all active students paid today
        if (nowPaid && date === getTodayDateStr()) {
          const activeStudents = prev.students.filter((s) => s.isActive);
          const paidToday = updated.filter((r) => r.date === date && r.status === 'paid').length;
          if (activeStudents.length > 0 && paidToday === activeStudents.length) {
            try {
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            } catch (e) {
              // ignore
            }
          }
        }

        return { ...prev, jimpitanRecords: updated };
      });
    },
    [updateStore]
  );

  const setJimpitanRecord = useCallback(
    (record: Partial<JimpitanRecord> & { studentId: string; date: string }) => {
      updateStore((prev) => {
        const existingIdx = prev.jimpitanRecords.findIndex(
          (r) => r.studentId === record.studentId && r.date === record.date
        );
        let updated = [...prev.jimpitanRecords];
        const defaultAmt = prev.classConfig?.defaultAmount ?? 2000;

        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            ...record,
            amount: record.amount ?? updated[existingIdx].amount ?? defaultAmt,
            paymentMethod: record.paymentMethod ?? updated[existingIdx].paymentMethod ?? 'cash',
          };
        } else {
          updated.push({
            id: `rec-${record.date}-${record.studentId}-${Date.now()}`,
            studentId: record.studentId,
            date: record.date,
            amount: record.amount ?? defaultAmt,
            status: record.status ?? 'paid',
            paymentMethod: record.paymentMethod ?? 'cash',
            paidAt: record.status === 'paid' ? new Date().toISOString() : undefined,
            note: record.note,
          });
        }
        return { ...prev, jimpitanRecords: updated };
      });
    },
    [updateStore]
  );

  const markAllPaidForDate = useCallback(
    (date: string, paymentMethod: PaymentMethod = 'cash') => {
      updateStore((prev) => {
        const activeStudents = prev.students.filter((s) => s.isActive);
        const defaultAmt = prev.classConfig?.defaultAmount ?? 2000;
        let updated = [...prev.jimpitanRecords];

        activeStudents.forEach((student) => {
          const idx = updated.findIndex((r) => r.studentId === student.id && r.date === date);
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              status: 'paid',
              amount: defaultAmt,
              paymentMethod,
              paidAt: updated[idx].paidAt || new Date().toISOString(),
            };
          } else {
            updated.push({
              id: `rec-${date}-${student.id}-${Date.now()}`,
              studentId: student.id,
              date,
              amount: defaultAmt,
              status: 'paid',
              paymentMethod,
              paidAt: new Date().toISOString(),
            });
          }
        });

        try {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        } catch (e) {
          // ignore
        }

        return { ...prev, jimpitanRecords: updated };
      });
    },
    [updateStore]
  );

  const resetRecordsForDate = useCallback((date: string) => {
    updateStore((prev) => ({
      ...prev,
      jimpitanRecords: prev.jimpitanRecords.filter((r) => r.date !== date),
    }));
  }, [updateStore]);

  // -- ACTIONS: MONTHLY IURAN --
  const toggleMonthlyJimpitanStatus = useCallback(
    (studentId: string, monthKey: string, customAmount?: number, paymentMethod: PaymentMethod = 'cash') => {
      updateStore((prev) => {
        const existingIdx = prev.jimpitanRecords.findIndex(
          (r) =>
            r.studentId === studentId &&
            (r.month === monthKey || (r.date && r.date.startsWith(monthKey)))
        );
        const defaultAmt = prev.classConfig?.defaultAmount ?? 10000;
        const amount = customAmount ?? defaultAmt;
        const fallbackDate = `${monthKey}-01`;

        let updated = [...prev.jimpitanRecords];
        let nowPaid = false;

        if (existingIdx >= 0) {
          const current = updated[existingIdx];
          if (current.status === 'paid') {
            updated[existingIdx] = {
              ...current,
              status: 'unpaid',
              paidAt: undefined,
            };
          } else {
            updated[existingIdx] = {
              ...current,
              month: monthKey,
              status: 'paid',
              amount,
              paymentMethod,
              paidAt: new Date().toISOString(),
              note: current.note || `Iuran Kas Bulan ${monthKey}`,
            };
            nowPaid = true;
          }
        } else {
          updated.push({
            id: `rec-${monthKey}-${studentId}-${Date.now()}`,
            studentId,
            date: fallbackDate,
            month: monthKey,
            amount,
            status: 'paid',
            paymentMethod,
            paidAt: new Date().toISOString(),
            note: `Iuran Kas Bulan ${monthKey}`,
          });
          nowPaid = true;
        }

        // Trigger celebratory confetti if all active students paid this month
        if (nowPaid) {
          const activeStudents = prev.students.filter((s) => s.isActive);
          const paidThisMonth = updated.filter(
            (r) =>
              (r.month === monthKey || (r.date && r.date.startsWith(monthKey))) &&
              r.status === 'paid'
          ).length;
          if (activeStudents.length > 0 && paidThisMonth === activeStudents.length) {
            try {
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
            } catch (e) {
              // ignore
            }
          }
        }

        return { ...prev, jimpitanRecords: updated };
      });
    },
    [updateStore]
  );

  const markAllPaidForMonth = useCallback(
    (monthKey: string, paymentMethod: PaymentMethod = 'cash') => {
      updateStore((prev) => {
        const activeStudents = prev.students.filter((s) => s.isActive);
        const defaultAmt = prev.classConfig?.defaultAmount ?? 10000;
        const fallbackDate = `${monthKey}-01`;
        let updated = [...prev.jimpitanRecords];

        activeStudents.forEach((student) => {
          const idx = updated.findIndex(
            (r) =>
              r.studentId === student.id &&
              (r.month === monthKey || (r.date && r.date.startsWith(monthKey)))
          );

          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              month: monthKey,
              status: 'paid',
              amount: defaultAmt,
              paymentMethod,
              paidAt: updated[idx].paidAt || new Date().toISOString(),
            };
          } else {
            updated.push({
              id: `rec-${monthKey}-${student.id}-${Date.now()}`,
              studentId: student.id,
              date: fallbackDate,
              month: monthKey,
              amount: defaultAmt,
              status: 'paid',
              paymentMethod,
              paidAt: new Date().toISOString(),
              note: `Iuran Kas Bulan ${monthKey}`,
            });
          }
        });

        try {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (e) {
          // ignore
        }

        return { ...prev, jimpitanRecords: updated };
      });
    },
    [updateStore]
  );

  const resetRecordsForMonth = useCallback((monthKey: string) => {
    updateStore((prev) => ({
      ...prev,
      jimpitanRecords: prev.jimpitanRecords.filter(
        (r) => !(r.month === monthKey || (r.date && r.date.startsWith(monthKey)))
      ),
    }));
  }, [updateStore]);

  // -- ACTIONS: STUDENTS --
  const addStudent = useCallback((student: Omit<Student, 'id' | 'avatarColor'>) => {
    const colors = [
      'bg-blue-500',
      'bg-emerald-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-purple-500',
      'bg-teal-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-cyan-500',
      'bg-violet-500',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newStudent: Student = {
      ...student,
      id: `std-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      avatarColor: randomColor,
    };
    updateStore((prev) => ({
      ...prev,
      students: [...prev.students, newStudent].sort((a, b) =>
        a.studentNumber.localeCompare(b.studentNumber, undefined, { numeric: true })
      ),
    }));
  }, [updateStore]);

  const updateStudent = useCallback((id: string, updates: Partial<Student>) => {
    updateStore((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  }, [updateStore]);

  const deleteStudent = useCallback((id: string) => {
    updateStore((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
      jimpitanRecords: prev.jimpitanRecords.filter((r) => r.studentId !== id),
    }));
  }, [updateStore]);

  const bulkImportStudents = useCallback((names: string[]) => {
    const colors = [
      'bg-blue-500',
      'bg-emerald-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-purple-500',
      'bg-teal-500',
      'bg-amber-500',
    ];

    updateStore((prev) => {
      let currentNumber = prev.students.length + 1;
      const newStudents: Student[] = names
        .map((name) => name.trim())
        .filter((name) => name.length > 0)
        .map((name, idx) => ({
          id: `std-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          studentNumber: String(currentNumber++).padStart(2, '0'),
          gender: 'L',
          isActive: true,
          avatarColor: colors[(idx + prev.students.length) % colors.length],
        }));

      return {
        ...prev,
        students: [...prev.students, ...newStudents],
      };
    });
  }, [updateStore]);

  // -- ACTIONS: TRANSACTIONS --
  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    updateStore((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions].sort((a, b) => b.date.localeCompare(a.date)),
    }));
  }, [updateStore]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    updateStore((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  }, [updateStore]);

  const deleteTransaction = useCallback((id: string) => {
    updateStore((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  }, [updateStore]);

  // -- ACTIONS: SAVINGS GOALS --
  const addSavingsGoal = useCallback((goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    updateStore((prev) => ({
      ...prev,
      savingsGoals: [...prev.savingsGoals, newGoal],
    }));
  }, [updateStore]);

  const updateSavingsGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    updateStore((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) => {
        if (g.id === id) {
          const updated = { ...g, ...updates };
          if (updated.currentAllocatedAmount >= updated.targetAmount && !g.isCompleted) {
            updated.isCompleted = true;
            try {
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
            } catch (e) {
              // ignore
            }
          }
          return updated;
        }
        return g;
      }),
    }));
  }, [updateStore]);

  const deleteSavingsGoal = useCallback((id: string) => {
    updateStore((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter((g) => g.id !== id),
    }));
  }, [updateStore]);

  // -- ACTIONS: CONFIG --
  const updateConfig = useCallback((updates: Partial<ClassConfig>) => {
    updateStore((prev) => ({
      ...prev,
      classConfig: { ...prev.classConfig, ...updates },
    }));
  }, [updateStore]);

  // -- ACTIONS: BACKUP & RESTORE --
  const exportBackupJSON = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(latestStateRef.current, null, 2));
    const downloadAnchor = document.createElement('a');
    const classNameSafe = (latestStateRef.current?.classConfig?.className || 'Kas_Sekolah').replace(/\s+/g, '_');
    const filename = `Backup_Kas_${classNameSafe}_${getTodayDateStr()}.json`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, []);

  const importBackupJSON = useCallback((jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.classConfig || !Array.isArray(parsed.students)) {
        throw new Error('Format file backup tidak valid.');
      }
      updateStore(() => ({
        classConfig: { ...DEFAULT_CONFIG, ...parsed.classConfig },
        students: parsed.students,
        jimpitanRecords: parsed.jimpitanRecords || [],
        transactions: parsed.transactions || [],
        savingsGoals: parsed.savingsGoals || [],
        lastBackupDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      return true;
    } catch (err) {
      console.error('Gagal import backup:', err);
      return false;
    }
  }, [updateStore]);

  const resetToSampleData = useCallback(() => {
    const initial = getInitialAppState();
    updateStore(() => initial);
  }, [updateStore]);

  const clearAllData = useCallback(() => {
    updateStore(() => ({
      classConfig: DEFAULT_CONFIG,
      students: [],
      jimpitanRecords: [],
      transactions: [],
      savingsGoals: [],
      lastBackupDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }, [updateStore]);

  return {
    state,
    totals,
    studentMetrics,
    toggleJimpitanStatus,
    toggleMonthlyJimpitanStatus,
    setJimpitanRecord,
    markAllPaidForDate,
    markAllPaidForMonth,
    resetRecordsForDate,
    resetRecordsForMonth,
    addStudent,
    updateStudent,
    deleteStudent,
    bulkImportStudents,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    updateConfig,
    exportBackupJSON,
    importBackupJSON,
    resetToSampleData,
    clearAllData,
    syncStatus,
    lastSyncedAt,
    triggerManualSync,
  };
}
