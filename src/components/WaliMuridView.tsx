import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Coins,
  Receipt,
  Search,
  CheckCircle2,
  AlertCircle,
  Share2,
  Calendar,
  Sparkles,
  ImageIcon,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { AppState, TotalsInfo, StudentSummaryMetric, ExpenseCategory, IncomeCategory, VisitorStats } from '../types';
import { formatRupiah, formatDateIndo, getCategoryLabel, getTodayDateStr } from '../services/utils';
import { getCurrentMonthKey, getMonthlyStatusSummary, getAcademicMonthsList } from '../services/monthlyKas';
import { MonthlyKasCard } from './MonthlyKasCard';
import { MonthlyFinanceChart } from './MonthlyFinanceChart';
import { SakuraFallingCanvas } from './SakuraFallingCanvas';

interface WaliMuridViewProps {
  state: AppState;
  totals: TotalsInfo;
  studentMetrics: Map<string, StudentSummaryMetric>;
  onRequestAdminLogin: () => void;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedAt: Date | null;
  visitorStats?: VisitorStats;
  onOpenThemeModal?: () => void;
}

export const WaliMuridView: React.FC<WaliMuridViewProps> = ({
  state,
  totals,
  studentMetrics,
  onRequestAdminLogin,
  syncStatus,
  lastSyncedAt,
  visitorStats,
  onOpenThemeModal,
}) => {
  // Slide Switcher: 0 = Dashboard Total (Kas Umum, Transaksi, Grafik), 1 = Dashboard Iuran (Progress & Status Per Bulan sampai bawah)
  const [activeSlide, setActiveSlide] = useState<0 | 1>(0);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [totalSubTab, setTotalSubTab] = useState<'rincian' | 'grafik'>('rincian');

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
  const defaultKasAmount = state.classConfig.defaultAmount || 10000;
  const monthCollected = selectedMonthSummary.totalPaidAmount;
  const monthProgress = selectedMonthSummary.paidPercentage;
  const monthPaidCount = selectedMonthSummary.paidCount;
  const monthUnpaidCount = selectedMonthSummary.unpaidCount;
  const monthUnpaidAmount = selectedMonthSummary.totalUnpaidAmount;
  const activeStudentsCount = selectedMonthSummary.totalActiveStudents || totals.activeStudentsCount || state.students.filter((s) => s.isActive).length;

  // Breakdown by expense category
  const expenseByCategory = useMemo(() => {
    const map = new Map<ExpenseCategory | IncomeCategory, number>();
    state.transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const current = map.get(t.category) || 0;
        map.set(t.category, current + t.amount);
      });

    return Array.from(map.entries())
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        meta: getCategoryLabel(cat),
        percentage: totals.totalExpense > 0 ? Math.round((amount / totals.totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [state.transactions, totals.totalExpense]);

  // Income vs Expense Percentages for the main progress bar
  const totalFlow = totals.totalIncome + totals.totalExpense;
  const incomePercent = totalFlow > 0 ? Math.round((totals.totalIncome / totalFlow) * 100) : 50;
  const expensePercent = totalFlow > 0 ? 100 - incomePercent : 50;

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return state.transactions.filter((t) => {
      if (filterType === 'income') return t.type === 'income';
      if (filterType === 'expense') return t.type === 'expense';
      return true;
    });
  }, [state.transactions, filterType]);

  // WhatsApp report message generator
  const reportMessage = useMemo(() => {
    const today = getTodayDateStr();
    const lines: string[] = [
      `📢 *LAPORAN TRANSPARANSI KAS KELAS*`,
      `🏫 *${state.classConfig.className}* - ${state.classConfig.schoolName}`,
      `📅 *Per Tanggal:* ${formatDateIndo(today)}`,
      `👤 *Bendahara:* ${state.classConfig.treasurerName}`,
      `-----------------------------------------`,
      `💰 *TOTAL SALDO KAS SAAT INI:* *${formatRupiah(totals.balance)}*`,
      `-----------------------------------------`,
      `📊 *Ringkasan Keuangan:*`,
      `   • Total Pemasukan: ${formatRupiah(totals.totalIncome)}`,
      `     - Iuran Kas Siswa: ${formatRupiah(totals.jimpitanTotal)}`,
      `     - Pemasukan Lain: ${formatRupiah(totals.directIncome)}`,
      `   • Total Pengeluaran: ${formatRupiah(totals.totalExpense)}`,
      `   • Status Bulan Ini (${currentMonthLabel}): ${totals.thisMonthPaidCount ?? 0}/${activeStudentsCount} Siswa Lunas (${monthProgress}%)`,
      `-----------------------------------------`,
      `🧾 *5 Transaksi Terakhir:*`,
    ];

    state.transactions.slice(0, 5).forEach((t, idx) => {
      const sign = t.type === 'income' ? '(+)' : '(-)';
      lines.push(`${idx + 1}. ${sign} ${t.title}: ${formatRupiah(t.amount)} [${formatDateIndo(t.date)}]`);
    });

    lines.push(
      `-----------------------------------------`,
      `🔗 *Cek Laporan Lengkap & Status Iuran Siswa:*`,
      window.location.href,
      ``,
      `_Laporan ini dibuat otomatis oleh Sistem Pembukuan Kas Sekolah_`
    );

    return lines.join('\n');
  }, [state, totals, currentMonthLabel, activeStudentsCount, monthProgress]);

  const handleShareWA = () => {
    const encoded = encodeURIComponent(reportMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reportMessage);
    alert('Teks laporan berhasil disalin ke clipboard!');
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-8 max-w-4xl mx-auto">
      {/* Live Presence / Wali Murid Active Notification Banner */}
      {visitorStats && (
        <div className="bg-gradient-to-r from-emerald-50/95 via-teal-50/95 to-emerald-50/95 backdrop-blur-md border border-emerald-200/90 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 text-xs text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="truncate">
              <strong>Transparansi Real-Time:</strong>{' '}
              {visitorStats.onlineWaliMuridCount > 1
                ? `Ada ${visitorStats.onlineWaliMuridCount} wali murid yang sedang membuka kas bersama Anda`
                : `Aplikasi kas kelas ini sedang aktif dibuka`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenThemeModal && (
              <button
                type="button"
                onClick={onOpenThemeModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-pink-100/90 hover:bg-pink-200 text-pink-900 border border-pink-300/80 font-bold text-[11px] transition shadow-2xs active:scale-95"
                title="Pilih Gambar Latar Sakura / Alam"
              >
                <span>🌸</span>
                <span className="hidden sm:inline">Ganti Tema Foto</span>
                <span className="sm:hidden">Tema</span>
              </button>
            )}

            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-white/90 px-2 py-0.5 rounded-lg border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online</span>
            </span>
          </div>
        </div>
      )}

      {/* 2. Main Slide Switcher Tabs (Slide 1 vs Slide 2) */}
      <div className="bg-slate-200/90 p-1 rounded-2xl flex items-center justify-between gap-1 shadow-xs border border-slate-300/60">
        <button
          onClick={() => setActiveSlide(0)}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeSlide === 0
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Wallet className="w-4 h-4 text-teal-300" />
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
      {/* SLIDE 1: HANYA MENAMPILKAN DASHBOARD TOTAL, TRANSAKSI, & GRAFIK           */}
      {/* ========================================================================= */}
      {activeSlide === 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Main Financial Summary Hero Card with Japanese Sakura Falling Screensaver Theme */}
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-rose-950/80 to-slate-900 text-white p-4 sm:p-6 shadow-xl border border-rose-500/30 relative overflow-hidden">
            {/* Japanese Sakura Screensaver Falling Petals & Fuji Silhouette */}
            <SakuraFallingCanvas />

            <div className="relative z-10">
              <div className="flex items-center justify-between text-rose-200 text-xs mb-1">
                <span className="font-semibold flex items-center gap-1.5 bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-500/30 backdrop-blur-xs">
                  <span className="text-sm">🌸</span>
                  <Wallet className="w-3.5 h-3.5 text-rose-300" />
                  <span>Total Saldo Kas Kelas</span>
                  <span className="text-[10px] text-rose-300/80 font-normal">桜 • Sakura Theme</span>
                </span>
                <span className="text-[10px] bg-rose-900/50 border border-rose-400/30 px-2 py-0.5 rounded-full backdrop-blur-xs font-medium text-rose-200">
                  {lastSyncedAt
                    ? `Update ${lastSyncedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                    : 'Real-Time'}
                </span>
              </div>

              <div className="text-2xl sm:text-4xl font-black tracking-tight text-white mt-1.5 drop-shadow-[0_2px_8px_rgba(244,63,94,0.35)]">
                {formatRupiah(totals.balance)}
              </div>

              {/* Quick 3-Column Summary Cards with Glassmorphism Sakura Touch */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 pt-3 border-t border-rose-500/20">
                <div className="bg-slate-900/60 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-rose-500/20 shadow-xs">
                  <div className="flex items-center gap-1 text-emerald-200 text-[10px] sm:text-[11px] font-medium">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Total Masuk</span>
                  </div>
                  <div className="text-xs sm:text-base font-bold text-emerald-300 mt-0.5 truncate">
                    +{formatRupiah(totals.totalIncome)}
                  </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-rose-500/20 shadow-xs">
                  <div className="flex items-center gap-1 text-rose-200 text-[10px] sm:text-[11px] font-medium">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">Pengeluaran</span>
                  </div>
                  <div className="text-xs sm:text-base font-bold text-rose-300 mt-0.5 truncate">
                    -{formatRupiah(totals.totalExpense)}
                  </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-rose-500/20 shadow-xs">
                  <div className="flex items-center gap-1 text-amber-200 text-[10px] sm:text-[11px] font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span className="truncate">Kas Bebas</span>
                  </div>
                  <div className="text-xs sm:text-base font-bold text-white mt-0.5 truncate">
                    {formatRupiah(totals.unallocatedCash)}
                  </div>
                </div>
              </div>

              {/* Share to WA Button & Slide 2 Quick Link */}
              <div className="mt-3.5 flex items-center gap-2">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition active:scale-95 border border-emerald-400/30"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Bagikan Laporan Kas ke WhatsApp</span>
                </button>

                <button
                  onClick={() => setActiveSlide(1)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 font-bold text-xs backdrop-blur-md transition active:scale-95 shrink-0 border border-rose-400/30"
                >
                  <span>Cek Iuran</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Sub-tabs for Dashboard Total (Rincian Transaksi Kas & Grafik Arus Kas) */}
          <div className="grid grid-cols-2 bg-slate-200/80 p-1 rounded-xl gap-1">
            <button
              onClick={() => setTotalSubTab('rincian')}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                totalSubTab === 'rincian'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4 text-teal-700" />
              <span>Daftar Transaksi Kas ({filteredTransactions.length})</span>
            </button>

            <button
              onClick={() => setTotalSubTab('grafik')}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                totalSubTab === 'grafik'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Grafik Arus & Kategori</span>
            </button>
          </div>

          {/* TAB: Rincian Transaksi */}
          {totalSubTab === 'rincian' && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Daftar Transaksi Kas Masuk & Keluar</span>
                  <span className="text-xs text-slate-400 font-normal">({filteredTransactions.length})</span>
                </h3>

                {/* Filter Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg shrink-0">
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
                  {filteredTransactions.map((tx) => {
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

          {/* TAB: Grafik & Kategori */}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE 2: STATUS IURAN KAS PER BULAN & DAFTAR BELUM SETOR SAMPAI KEBAWAH   */}
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

          {/* Full Monthly Jimpitan & Belum Setoran Component (Sampai Kebawah) */}
          <MonthlyKasCard
            state={state}
            isAdmin={false}
            selectedMonthKey={selectedMonthKey}
            onSelectMonthKey={setSelectedMonthKey}
            title="Status Iuran Kas Per Bulan & Daftar Belum Setoran"
            subtitle="Pilih bulan untuk melihat siapa saja yang sudah lunas atau belum menyetor kas"
          />
        </div>
      )}

      {/* 4. Footer Notice */}
      <div className="text-center py-4 text-xs text-slate-400">
        <p>Aplikasi Pembukuan & Transparansi Kas Kelas</p>
        <p className="text-[11px] mt-0.5">
          Ingin mencatat kas atau mengubah data? Silakan masuk dengan PIN Pengurus.
        </p>
      </div>

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
                  <p className="text-[11px] text-slate-500">Format rapi untuk grup kelas / wali murid</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="my-3 flex-1 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs whitespace-pre-wrap text-slate-800">
              {reportMessage}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={copyToClipboard}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition text-center"
              >
                📋 Salin Teks
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
              <h4 className="text-sm font-bold text-slate-900">Bukti Nota / Kwitansi</h4>
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
