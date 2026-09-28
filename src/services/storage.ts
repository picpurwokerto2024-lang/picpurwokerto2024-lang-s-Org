import { AppState, ClassConfig, Student, Transaction, JimpitanRecord, SavingsGoal } from '../types';

const STORAGE_KEY = 'JIMPITAN_KAS_SEKOLAH_V1';

export const DEFAULT_CONFIG: ClassConfig = {
  className: 'Kelas',
  schoolName: 'Sekolah',
  academicYear: '2026/2027',
  treasurerName: 'Bendahara Kelas',
  homeroomTeacher: 'Wali Kelas',
  frequency: 'monthly',
  defaultAmount: 10000,
  activeDays: [1, 2, 3, 4, 5], // Senin - Jumat
  currency: 'Rp',
  adminPin: '1234',
  enabledTabs: ['dashboard', 'jimpitan', 'kas', 'siswa', 'celengan', 'laporan'],
  customNavBars: [],
  customExpenseCategories: [],
};

// No demo data: all lists start empty and are only populated by the treasurer/admin.
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_GOALS: SavingsGoal[] = [];

export function getInitialAppState(): AppState {
  return {
    classConfig: DEFAULT_CONFIG,
    students: [],
    jimpitanRecords: [],
    transactions: [],
    savingsGoals: [],
    lastBackupDate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function loadAppState(): AppState {
  if (typeof window === 'undefined') return getInitialAppState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialAppState();
      saveAppState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    const classConfig = { ...DEFAULT_CONFIG, ...(parsed.classConfig || {}) };
    const jimpitanRecords = Array.isArray(parsed.jimpitanRecords) ? parsed.jimpitanRecords : [];
    const students = Array.isArray(parsed.students) ? parsed.students : [];
    const transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
    const savingsGoals = Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : [];

    // Check if the cached state contains legacy demo data (only if exact legacy student 'std-1' named 'Ahmad Fauzi Pratama' and phone '6281234567801')
    const isLegacyDemo = students.some((s) => s.id === 'std-1' && s.name === 'Ahmad Fauzi Pratama' && s.phone === '6281234567801');
    if (isLegacyDemo) {
      const cleanState = getInitialAppState();
      saveAppState(cleanState);
      return cleanState;
    }

    return {
      classConfig,
      students,
      jimpitanRecords,
      transactions,
      savingsGoals,
      lastBackupDate: parsed.lastBackupDate || new Date().toISOString(),
      updatedAt: parsed.updatedAt || undefined,
    };
  } catch (err) {
    console.error('Error loading app state from localStorage:', err);
    return getInitialAppState();
  }
}

export function saveAppState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving app state to localStorage:', err);
  }
}

