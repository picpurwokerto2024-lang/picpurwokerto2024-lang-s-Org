export type TabType = 'dashboard' | 'jimpitan' | 'kas' | 'siswa' | 'laporan' | 'celengan' | 'settings';

export type Gender = 'L' | 'P';

export type PaymentMethod = 'cash' | 'transfer' | 'qris';

export type FrequencyType = 'monthly' | 'weekly' | 'daily';

export interface Student {
  id: string;
  studentNumber: string; // NIS atau No. Absen
  name: string;
  gender: Gender;
  phone?: string; // No WhatsApp siswa / wali murid
  parentName?: string;
  isActive: boolean;
  avatarColor: string;
  notes?: string;
}

export interface JimpitanRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD atau YYYY-MM-01
  month?: string; // e.g. "2026-09"
  amount: number;
  status: 'paid' | 'unpaid' | 'excused' | 'advance';
  paymentMethod: PaymentMethod;
  paidAt?: string;
  note?: string;
}

export type ExpenseCategory =
  | 'perlengkapan'
  | 'fotokopi_tugas'
  | 'sosial_jenguk'
  | 'kegiatan_lomba'
  | 'kebersihan'
  | 'konsumsi'
  | 'lainnya';

export type IncomeCategory =
  | 'jimpitan'
  | 'donasi'
  | 'saldo_awal'
  | 'penjualan_bazar'
  | 'lainnya';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: ExpenseCategory | IncomeCategory;
  title: string;
  description?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  recipientOrSource?: string;
  receiptImage?: string; // Base64 data URL
  recordedBy?: string;
  relatedStudentId?: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAllocatedAmount: number;
  deadline?: string;
  icon: string;
  isCompleted: boolean;
  notes?: string;
  createdAt: string;
}

export interface CustomNavBarItem {
  id: string;
  label: string;
  url?: string;
  tabKey?: TabType;
  icon?: string;
  isActive: boolean;
  isCustomLink?: boolean;
}

export interface ClassConfig {
  className: string;
  schoolName: string;
  academicYear: string;
  treasurerName: string;
  homeroomTeacher: string;
  frequency: FrequencyType;
  defaultAmount: number;
  activeDays: number[]; // 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
  currency: string;
  adminPin?: string; // PIN Keamanan Pengurus (Default: '1234')
  enabledTabs?: TabType[]; // Daftar bar tab aktif yang diinginkan pengurus
  customNavBars?: CustomNavBarItem[]; // Bar menu kustom tambahan
  customExpenseCategories?: string[]; // Kategori bar pengeluaran tambahan
  themeId?: string; // ID Tema Latar Belakang (Foto Alam, Sakura Asli, dsb.)
  themeOverlay?: 'light' | 'medium' | 'subtle'; // Tingkat transparansi overlay
}

export interface AppState {
  classConfig: ClassConfig;
  students: Student[];
  jimpitanRecords: JimpitanRecord[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  lastBackupDate?: string;
  updatedAt?: string;
}

export interface TotalsInfo {
  directIncome: number;
  jimpitanTotal: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  allocatedSavings: number;
  unallocatedCash: number;
  jimpitanToday: number;
  activeStudentsCount: number;
  todayPaidCount: number;
  todayUnpaidCount: number;
  todayProgress: number;
  // Monthly metrics
  jimpitanThisMonth?: number;
  thisMonthPaidCount?: number;
  thisMonthUnpaidCount?: number;
  thisMonthProgress?: number;
  currentMonthStr?: string;
  currentMonthLabel?: string;
}

export interface StudentSummaryMetric {
  totalPaid: number;
  paidCount: number;
  unpaidCount: number;
  unpaidTotal: number;
  lastPaidDate?: string;
}

export interface MonthlyStudentPayment {
  student: Student;
  isPaid: boolean;
  record?: JimpitanRecord;
  amount: number;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  note?: string;
}

export interface MonthlyStatusSummary {
  monthKey: string; // "2026-09"
  monthLabel: string; // "September 2026"
  academicYear: string;
  totalActiveStudents: number;
  paidCount: number;
  unpaidCount: number;
  paidPercentage: number;
  totalPaidAmount: number;
  totalExpectedAmount: number;
  totalUnpaidAmount: number;
  paidStudents: MonthlyStudentPayment[];
  unpaidStudents: MonthlyStudentPayment[];
  allStudents: MonthlyStudentPayment[];
}

export interface VisitorPresence {
  visitorId: string;
  role: 'wali_murid' | 'pengurus';
  device: string;
  openedAt: string;
  lastSeen: string;
  isOnline: boolean;
  dateKey: string;
  label?: string;
  page?: string;
}

export interface VisitorStats {
  onlineWaliMuridCount: number;
  onlinePengurusCount: number;
  onlineTotalCount: number;
  todayVisitCount: number;
  lastWaliMuridOpenedAt: string | null;
  activeVisitors: VisitorPresence[];
  recentVisitors: VisitorPresence[];
}


