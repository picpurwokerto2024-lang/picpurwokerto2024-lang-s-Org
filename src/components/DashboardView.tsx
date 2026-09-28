import React, { useState, useMemo } from 'react';
import { AppState, TotalsInfo, TabType, PaymentMethod, VisitorStats } from '../types';
import { formatRupiah, formatDateIndo, getCategoryLabel, timeAgoIndo } from '../services/utils';
import { createWeeklyKasReportMessage, openWhatsAppDirect } from '../services/whatsapp';
import { getCurrentMonthKey, getMonthlyStatusSummary, getAcademicMonthsList } from '../services/monthlyKas';
import { MonthlyFinanceChart } from './MonthlyFinanceChart';
import { MonthlyKasCard } from './MonthlyKasCard';
import { SakuraFallingCanvas } from './SakuraFallingCanvas';
import {
  TrendingUp,
  TrendingDown,
  Coins,
  Wallet,
  PlusCircle,
  Share2,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Target,
  Image as ImageIcon,
  CalendarDays,
  AlertCircle,
  Users,
  BarChart3,
  Calendar,
  Eye,
  Radio,
} from 'lucide-react';

interface DashboardViewProps {
  state: AppState;
  totals: TotalsInfo;
  onNavigateTab: (tab: TabType) => void;
  onOpenAddTransaction: (type: 'income' | 'expense') => void;
  onMarkAllPaidToday: () => void;
  onToggleMonthlyStatus?: (studentId: string, month: string, customAmt?: number, method?: PaymentMethod) => void;
  onMarkAllPaidMonth?: (month: string, method?: PaymentMethod) => void;
  onResetMonth?: (month: string) => void;
  visitorStats?: VisitorStats;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  totals,
  onNavigateTab,
  onOpenAddTransaction,
  onToggleMonthlyStatus,
  onMarkAllPaidMonth,
  onResetMonth,
  visitorStats,
}) => {
  // Slide Switcher for Admin Mode Dashboard: Slide 0 (Dashboard Total) vs Slide 1 (Dashboard Iuran)
  const [activeSlide, setActiveSlide] = useState<0 | 1>(0);
  const [totalSubTab, setTotalSubTab] = useState<'transaksi' | 'grafik'>('transaksi');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const reportMessage = createWeeklyKasReportMessage(state);

  const handleShareWA = () => {
    openWhatsAppDirect('', reportMessage);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reportMessage);
    alert('Format laporan WhatsApp berhasil disalin ke clipboard!');
  };

  // Dynamic Month Selection for Slide 2 (Iuran Kas) - updates all bars and cards reactively
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => getCurrentMonthKey());

  const academicMonths = useMemo(() => {
    return getAcademicMonthsList(state.classConfig?.academicYear);
  }, [state.classConfig?.academicYear]);

  const currentMonthIdx = academicMonths.findIndex((m) => m.monthKey === selectedMonthKey);

  const goToPrevMonth = () => {
    if (currentMonthIdx > 0) {
      setSelectedMonthKey(academicMonths[currentMonthIdx - 1].monthKey);
    }
  };

  const goToNextMonth = () => {
    if (currentMonthIdx < academicMonths.length - 1) {
      setSelectedMonthKey(academicMonths[currentMonthIdx + 1].monthKey);
    }
  };

  // Calculations for Slide 2 / Iuran - DYNAMICALLY updates whenever selectedMonthKey changes!
  const selectedMonthSummary = useMemo(() => {
    return getMonthlyStatusSummary(state, selectedMonthKey);
  }, [state, selectedMonthKey]);

  const currentMonthLabel = selectedMonthSummary.monthLabel;
  const monthCollected = selectedMonthSummary.totalPaidAmount;
  const monthProgress = selectedMonthSummary.paidPercentage;
  const monthPaidCount = selectedMonthSummary.paidCount;
  const monthUnpaidCount = selectedMonthSummary.unpaidCount;
  const monthUnpaidAmount = selectedMonthSummary.totalUnpaidAmount;
  const activeStudentsCount = selectedMonthSummary.totalActiveStudents || totals.activeStudentsCount;
  const defaultKasAmount = state.classConfig.defaultAmount || 10000;

  // Filtered transactions for Slide 1
  const filteredTransactions = state.transactions.filter((tx) => {
    if (filterType === 'income') return tx.type === 'income';
    if (filterType === 'expense') return tx.type === 'expense';
    return true;
  });

  // Category percentage calculation for Slide 1 Chart tab
  const totalVolume = totals.totalIncome + totals.totalExpense;
  const incomePercent = totalVolume > 0 ? Math.round((totals.totalIncome / totalVolume) * 100) : 0;
  const expensePercent = totalVolume > 0 ? Math.round((totals.totalExpense / totalVolume) * 100) : 0;

  const expenseByCategory = React.useMemo(() => {
    const expenses = state.transactions.filter((t) => t.type === 'expense');
    const map = new Map<string, number>();
    expenses.forEach((t) => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });

    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totals.totalExpense > 0 ? Math.round((amount / totals.totalExpense) * 100) : 0,
        meta: getCategoryLabel(category as any),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [state.transactions, totals.totalExpense]);

  return (
    <div className="space-y-4 sm:space-y-5 pb-20 md:pb-6">
      {/* Live Wali Murid Presence Monitor Banner in Admin Mode */}
      {visitorStats && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 text-xs text-emerald-100 shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
            <div className="min-w-0 truncate">
              <span className="font-bold text-white">Pantauan Wali Murid:</span>{' '}
              <span className="text-emerald-200">
                {visitorStats.onlineWaliMuridCount > 0
                  ? `Ada ${visitorStats.onlineWaliMuridCount} wali murid sedang aktif membuka aplikasi saat ini.`
                  : 'Belum ada wali murid yang sedang membuka aplikasi saat ini.'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-emerald-300/90 hidden sm:inline">
              {visitorStats.lastWaliMuridOpenedAt
                ? `Terakhir: ${timeAgoIndo(visitorStats.lastWaliMuridOpenedAt)}`
                : `Total hari ini: ${visitorStats.todayVisitCount} kunjungan`}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Live Monitor
            </span>
          </div>
        </div>
      )}

      {/* 1. Main Slide Switcher Tabs (Slide 1: Dashboard Total vs Slide 2: Dashboard Iuran) */}
      <div className="bg-slate-200/90 p-1 rounded-2xl flex items-center justify-between gap-1 shadow-xs border border-slate-300/60">
        <button
          onClick={() => setActiveSlide(0)}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeSlide === 0
              ? 'bg-rose-950 text-rose-100 shadow-sm border border-rose-500/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span className="text-sm">🌸</span>
          <Wallet className="w-4 h-4 text-rose-300" />
          <span>Slide 1: Dashboard Total</span>
        </button>

        <button
          onClick={() => setActiveSlide(1)}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeSlide === 1
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-200" />
          <span>Slide 2: Dashboard Iuran</span>
          {totals.thisMonthUnpaidCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                activeSlide === 1 ? 'bg-amber-900 text-amber-100' : 'bg-amber-200 text-amber-900'
              }`}
            >
              {totals.thisMonthUnpaidCount}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SLIDE 1: DASHBOARD TOTAL DENGAN TEMA SCREENSAVER SAKURA JEPANG & GRAFIK   */}
      {/* ========================================================================= */}
      {activeSlide === 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Main Financial Balance Hero Card with Japanese Sakura Falling Screensaver */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-rose-950/80 to-slate-900 text-white p-3.5 sm:p-6 shadow-xl border border-rose-500/30">
            {/* Japanese Sakura Screensaver Falling Petals & Fuji Silhouette */}
            <SakuraFallingCanvas />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                  <span className="text-[11px] sm:text-sm font-semibold text-rose-200 flex items-center gap-1 sm:gap-1.5 bg-rose-950/70 px-2.5 py-1 rounded-full border border-rose-500/30 backdrop-blur-xs">
                    <span className="text-xs sm:text-sm">🌸</span>
                    <Wallet className="w-3.5 h-3.5 text-rose-300" />
                    <span>Total Saldo Kas {state.classConfig.className || 'Paguyuban'}</span>
                    <span className="text-[9px] sm:text-[10px] text-rose-300/80 font-normal">桜 • Pengurus</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-900/60 text-rose-200 border border-rose-400/30">
                    Real-Time
                  </span>
                </div>

                <div className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_8px_rgba(244,63,94,0.35)] mt-1">
                  {formatRupiah(totals.balance)}
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs text-rose-200/85 mt-1">
                  <span>
                    Tersedia Bebas: <strong className="text-white">{formatRupiah(totals.unallocatedCash)}</strong>
                  </span>
                  {totals.allocatedSavings > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-200 border border-amber-500/30">
                      Target Celengan: {formatRupiah(totals.allocatedSavings)}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Action Buttons on Hero - Optimized 2x2 Grid for Mobile Android & Row on Desktop */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 mt-2 sm:mt-0">
                <button
                  id="hero-quick-jimpitan"
                  onClick={() => setActiveSlide(1)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs shadow-sm transition active:scale-95 border border-amber-300/50"
                >
                  <Coins className="w-4 h-4 shrink-0" />
                  <span className="truncate">Cek / Catat Iuran</span>
                </button>

                <button
                  id="hero-add-income"
                  onClick={() => onOpenAddTransaction('income')}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-100 font-semibold text-xs border border-emerald-400/40 backdrop-blur-xs transition active:scale-95 shadow-xs"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span className="truncate">+ Pemasukan</span>
                </button>

                <button
                  id="hero-add-expense"
                  onClick={() => onOpenAddTransaction('expense')}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-500/25 hover:bg-rose-500/35 text-rose-100 font-semibold text-xs border border-rose-400/40 backdrop-blur-xs transition active:scale-95 shadow-xs"
                >
                  <TrendingDown className="w-4 h-4 text-rose-300 shrink-0" />
                  <span className="truncate">- Pengeluaran</span>
                </button>

                <button
                  id="hero-share-wa"
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-teal-500/25 hover:bg-teal-500/35 text-teal-100 font-semibold text-xs border border-teal-400/40 backdrop-blur-xs transition active:scale-95 shadow-xs"
                  title="Kirim Laporan Kas ke WhatsApp"
                >
                  <Share2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span className="truncate">Bagikan WA</span>
                </button>
              </div>
            </div>

            {/* Quick 3-Column Summary Cards with Glassmorphism Sakura Touch */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mt-3.5 pt-3 border-t border-rose-500/20">
              <div className="bg-slate-900/70 backdrop-blur-md p-2 sm:p-3 rounded-xl border border-rose-500/20 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-1 text-emerald-200 text-[10px] sm:text-[11px] font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Total Masuk</span>
                </div>
                <div className="text-xs sm:text-base font-bold text-emerald-300 mt-1 truncate">
                  +{formatRupiah(totals.totalIncome)}
                </div>
                <span className="text-[9px] sm:text-[10px] text-emerald-300/70 truncate hidden xs:inline mt-0.5">
                  Iuran: {formatRupiah(totals.jimpitanTotal)}
                </span>
              </div>

              <div className="bg-slate-900/70 backdrop-blur-md p-2 sm:p-3 rounded-xl border border-rose-500/20 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-1 text-rose-200 text-[10px] sm:text-[11px] font-medium">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">Pengeluaran</span>
                </div>
                <div className="text-xs sm:text-base font-bold text-rose-300 mt-1 truncate">
                  -{formatRupiah(totals.totalExpense)}
                </div>
                <span className="text-[9px] sm:text-[10px] text-rose-300/70 truncate hidden xs:inline mt-0.5">
                  {state.transactions.filter((t) => t.type === 'expense').length} Transaksi
                </span>
              </div>

              <div className="bg-slate-900/70 backdrop-blur-md p-2 sm:p-3 rounded-xl border border-rose-500/20 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-1 text-amber-200 text-[10px] sm:text-[11px] font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="truncate">Kas Bebas</span>
                </div>
                <div className="text-xs sm:text-base font-bold text-white mt-1 truncate">
                  {formatRupiah(totals.unallocatedCash)}
                </div>
                <span className="text-[9px] sm:text-[10px] text-amber-200/70 truncate hidden xs:inline mt-0.5">
                  Siap dipakai
                </span>
              </div>
            </div>
          </div>

          {/* Quick Sub-Navigation: Riwayat Transaksi vs Grafik */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setTotalSubTab('transaksi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  totalSubTab === 'transaksi'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Riwayat Transaksi Kas
              </button>
              <button
                onClick={() => setTotalSubTab('grafik')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  totalSubTab === 'grafik'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grafik & Statistik Kas
              </button>
            </div>

            {/* Quick Action to Full Buku Kas */}
            <button
              onClick={() => onNavigateTab('kas')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <span>Buka Menu Buku Kas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TAB 1: Riwayat Transaksi */}
          {totalSubTab === 'transaksi' && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Arus Transaksi Kas Terkini</h3>
                  <p className="text-xs text-slate-500">Daftar keluar masuk uang kas kelas</p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setFilterType('income')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      filterType === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    + Masuk
                  </button>
                  <button
                    onClick={() => setFilterType('expense')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      filterType === 'expense' ? 'bg-rose-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    - Keluar
                  </button>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl">
                  Belum ada riwayat transaksi pada kategori ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredTransactions.slice(0, 10).map((tx) => {
                    const isIncome = tx.type === 'income';
                    const cat = getCategoryLabel(tx.category);

                    return (
                      <div key={tx.id} className="py-3 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 border mt-0.5 ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {cat.icon}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs sm:text-sm font-bold text-slate-900">{tx.title}</p>
                              {tx.receiptImage && (
                                <button
                                  onClick={() => setSelectedReceipt(tx.receiptImage!)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span>Nota Bukti</span>
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {formatDateIndo(tx.date)}
                              </span>
                              {tx.recipientOrSource && <span>• {tx.recipientOrSource}</span>}
                              {tx.note && <span className="text-slate-400 italic">"{tx.note}"</span>}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`text-xs sm:text-sm font-bold ${
                              isIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                          </div>
                          <span className="text-[10px] text-slate-400">{cat.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Grafik & Kategori */}
          {totalSubTab === 'grafik' && (
            <div className="space-y-4">
              <MonthlyFinanceChart state={state} />

              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">Perbandingan Arus Kas</h2>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Persentase</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-emerald-700 flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      Kas Masuk ({incomePercent}%)
                    </span>
                    <span className="text-rose-700 flex items-center gap-1">
                      Pengeluaran ({expensePercent}%)
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden border border-slate-200">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${incomePercent}%` }}
                      title={`Kas Masuk: ${formatRupiah(totals.totalIncome)}`}
                    />
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{ width: `${expensePercent}%` }}
                      title={`Pengeluaran: ${formatRupiah(totals.totalExpense)}`}
                    />
                  </div>
                </div>

                {expenseByCategory.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Rincian Kategori Pengeluaran</span>
                      <span className="text-slate-400 font-normal">Total {formatRupiah(totals.totalExpense)}</span>
                    </h3>

                    <div className="space-y-2">
                      {expenseByCategory.map((cat) => (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-700 font-medium flex items-center gap-1.5">
                              <span>{cat.meta.icon}</span>
                              <span>{cat.meta.label}</span>
                            </span>
                            <span className="font-bold text-slate-900">
                              {formatRupiah(cat.amount)} <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-slate-700"
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Savings Goals Preview */}
          {state.savingsGoals.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                    <Target className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Celengan & Target Tabungan Kelas</h3>
                </div>
                <button
                  onClick={() => onNavigateTab('celengan')}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                >
                  <span>Lihat Semua</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {state.savingsGoals.slice(0, 3).map((goal) => {
                  const pct = Math.min(100, Math.round((goal.currentAllocatedAmount / goal.targetAmount) * 100));
                  return (
                    <div
                      key={goal.id}
                      onClick={() => onNavigateTab('celengan')}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-teal-300 transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl shrink-0">{goal.icon || '🎯'}</span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate">{goal.title}</h4>
                            <span className="text-[10px] text-slate-500">
                              {formatRupiah(goal.currentAllocatedAmount)} / {formatRupiah(goal.targetAmount)}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                            pct >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 mt-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-teal-600'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE 2: STATUS IURAN KAS PER BULAN & DAFTAR BELUM SETOR (MODE PENGURUS)  */}
      {/* ========================================================================= */}
      {activeSlide === 1 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Dashboard Iuran Hero Card */}
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-950 via-amber-900 to-slate-950 text-white p-3.5 sm:p-6 shadow-md border border-amber-700/40 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between text-amber-200 text-xs mb-1.5 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold flex items-center gap-1.5 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/30">
                    <Coins className="w-4 h-4 text-amber-300" />
                    <span>Bar Iuran Kas: <strong className="text-amber-200">{currentMonthLabel}</strong></span>
                  </span>

                  {/* Quick Month Navigation Controls directly in Hero */}
                  <div className="inline-flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-amber-500/30">
                    <button
                      onClick={goToPrevMonth}
                      disabled={currentMonthIdx <= 0}
                      className="p-1 rounded text-amber-200 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Bulan sebelumnya"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-bold text-amber-300 px-1 font-mono">
                      {currentMonthIdx + 1}/{academicMonths.length}
                    </span>
                    <button
                      onClick={goToNextMonth}
                      disabled={currentMonthIdx >= academicMonths.length - 1}
                      className="p-1 rounded text-amber-200 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Bulan berikutnya"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <span className="text-[10px] bg-amber-500/20 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded-full font-medium">
                  Tarif: {formatRupiah(defaultKasAmount)} / siswa
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-4xl font-black tracking-tight text-amber-300">
                  {formatRupiah(monthCollected)}
                </span>
                <span className="text-xs sm:text-sm text-amber-200/80 font-medium">
                  terkumpul bulan {currentMonthLabel}
                </span>
              </div>

              {/* Visual Progress Bar of Monthly Collection */}
              <div className="mt-3 bg-black/30 p-2.5 sm:p-3 rounded-xl border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-200 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Capaian Iuran: {monthPaidCount} dari {activeStudentsCount} Siswa
                  </span>
                  <span className="font-bold text-amber-300">{monthProgress}% Lunas</span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 rounded-full"
                    style={{ width: `${monthProgress}%` }}
                  />
                </div>
              </div>

              {/* 3-Column Specific Breakdown for Iuran */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mt-3">
                <div className="bg-white/10 backdrop-blur-xs p-2 sm:p-3 rounded-xl border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center gap-1 text-emerald-200 text-[10px] sm:text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span className="truncate">Sudah Lunas</span>
                  </div>
                  <div className="text-xs sm:text-base font-bold text-emerald-300 mt-1 truncate">
                    {monthPaidCount} Siswa
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-emerald-200/80 truncate mt-0.5">
                    {formatRupiah(monthCollected)}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xs p-2 sm:p-3 rounded-xl border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center gap-1 text-rose-200 text-[10px] sm:text-[11px] font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                    <span className="truncate">Belum Setor</span>
                  </div>
                  <div className="text-xs sm:text-base font-bold text-rose-300 mt-1 truncate">
                    {monthUnpaidCount} Siswa
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-rose-200/80 truncate mt-0.5">
                    Sisa: {formatRupiah(monthUnpaidAmount)}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xs p-2 sm:p-3 rounded-xl border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center gap-1 text-amber-200 text-[10px] sm:text-[11px] font-medium">
                    <Users className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span className="truncate">Total Siswa</span>
                  </div>
                  <div className="text-xs sm:text-base font-bold text-white mt-1 truncate">
                    {activeStudentsCount} Orang
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-amber-300/80 truncate mt-0.5">
                    Kelas Aktif
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Monthly Jimpitan & Belum Setoran Component with Admin Management Access */}
          <MonthlyKasCard
            state={state}
            isAdmin={true}
            selectedMonthKey={selectedMonthKey}
            onSelectMonthKey={setSelectedMonthKey}
            onToggleStatus={onToggleMonthlyStatus}
            onMarkAllPaid={onMarkAllPaidMonth}
            onResetMonth={onResetMonth}
            title="Status Iuran Kas Per Bulan & Pencatatan Admin"
            subtitle="Pilih bulan untuk melihat rincian serta mengubah status setoran siswa"
          />
        </div>
      )}

      {/* Share to WhatsApp Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  WA
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kirim Laporan Kas WhatsApp</h3>
                  <p className="text-[11px] text-slate-500">Format pesan rapi ke grup kelas / wali murid</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="my-3 flex-1 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs whitespace-pre-wrap text-slate-800 selection:bg-teal-200">
              {reportMessage}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={copyToClipboard}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition text-center"
              >
                📋 Salin Teks Pesan
              </button>
              <button
                onClick={handleShareWA}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>Buka di WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Image Modal */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-2xl p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-slate-900">Bukti Nota / Kwitansi Pembelian</h4>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center max-h-[70vh]">
              <img
                src={selectedReceipt}
                alt="Bukti Nota"
                className="w-full h-auto object-contain max-h-[70vh]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
