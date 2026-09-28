import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Coins,
  ChevronLeft,
  ChevronRight,
  Share2,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { TotalsInfo, ClassConfig, AppState } from '../types';
import { formatRupiah } from '../services/utils';

interface DashboardSlideProps {
  totals: TotalsInfo;
  classConfig: ClassConfig;
  state: AppState;
  lastSyncedAt: Date | null;
  onOpenShareModal: () => void;
  onSelectSubTab?: (subTab: 'bulanan' | 'rincian' | 'grafik') => void;
}

export const DashboardSlideHero: React.FC<DashboardSlideProps> = ({
  totals,
  classConfig,
  state,
  lastSyncedAt,
  onOpenShareModal,
  onSelectSubTab,
}) => {
  const [currentSlide, setCurrentSlide] = useState<0 | 1>(0);

  const activeStudentsCount = totals.activeStudentsCount || state.students.filter((s) => s.isActive).length;
  const currentMonthLabel = totals.currentMonthLabel || 'Bulan Ini';
  const defaultKasAmount = classConfig.defaultAmount || 10000;

  // Monthly statistics
  const monthTarget = activeStudentsCount * defaultKasAmount;
  const monthCollected = totals.jimpitanThisMonth ?? totals.jimpitanTotal;
  const monthProgress = totals.thisMonthProgress ?? (monthTarget > 0 ? Math.min(100, Math.round((monthCollected / monthTarget) * 100)) : 0);

  return (
    <div className="space-y-2.5">
      {/* Slide Navigation Header / Indicator Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentSlide(0)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              currentSlide === 0
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/80'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Slide 1: Dashboard Total</span>
          </button>

          <button
            onClick={() => setCurrentSlide(1)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              currentSlide === 1
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/80'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Slide 2: Dashboard Iuran</span>
            {totals.thisMonthUnpaidCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  currentSlide === 1 ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {totals.thisMonthUnpaidCount}
              </span>
            )}
          </button>
        </div>

        {/* Prev / Next Arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentSlide(0)}
            disabled={currentSlide === 0}
            className={`p-1.5 rounded-lg border transition ${
              currentSlide === 0
                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-2xs'
            }`}
            title="Slide Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentSlide(1)}
            disabled={currentSlide === 1}
            className={`p-1.5 rounded-lg border transition ${
              currentSlide === 1
                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-2xs'
            }`}
            title="Slide Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SLIDE 1: DASHBOARD TOTAL KAS UMUM & SALDO */}
      {/* ========================================================================= */}
      {currentSlide === 0 && (
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white p-4 sm:p-6 shadow-md border border-teal-700/40 relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between text-teal-200 text-xs mb-1">
              <span className="font-semibold flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-teal-300" />
                Total Saldo Kas Tersedia
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-xs">
                {lastSyncedAt
                  ? `Update ${lastSyncedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Live Real-Time'}
              </span>
            </div>

            <div className="text-2xl sm:text-4xl font-black tracking-tight text-white mt-1">
              {formatRupiah(totals.balance)}
            </div>

            {/* Quick 3-Column Summary Cards for Overall Finance */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 pt-3 border-t border-teal-700/50">
              <div className="bg-white/10 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-white/10">
                <div className="flex items-center gap-1 text-teal-200 text-[10px] sm:text-[11px] font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span className="truncate">Total Pemasukan</span>
                </div>
                <div className="text-xs sm:text-base font-bold text-emerald-300 mt-0.5 truncate">
                  +{formatRupiah(totals.totalIncome)}
                </div>
                <div className="text-[10px] text-teal-300/80 mt-0.5 truncate">
                  Iuran: {formatRupiah(totals.jimpitanTotal)}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-white/10">
                <div className="flex items-center gap-1 text-rose-200 text-[10px] sm:text-[11px] font-medium">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                  <span className="truncate">Pengeluaran</span>
                </div>
                <div className="text-xs sm:text-base font-bold text-rose-300 mt-0.5 truncate">
                  -{formatRupiah(totals.totalExpense)}
                </div>
                <div className="text-[10px] text-rose-300/80 mt-0.5 truncate">
                  {state.transactions.filter((t) => t.type === 'expense').length} Transaksi
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-white/10">
                <div className="flex items-center gap-1 text-teal-200 text-[10px] sm:text-[11px] font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                  <span className="truncate">Kas Bersih</span>
                </div>
                <div className="text-xs sm:text-base font-bold text-white mt-0.5 truncate">
                  {formatRupiah(totals.unallocatedCash)}
                </div>
                <div className="text-[10px] text-teal-300/80 mt-0.5 truncate">
                  Dana Bebas Pakai
                </div>
              </div>
            </div>

            {/* Action Buttons inside Slide 1 */}
            <div className="mt-3.5 flex items-center gap-2">
              <button
                onClick={onOpenShareModal}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan Laporan Kas ke WhatsApp</span>
              </button>

              <button
                onClick={() => setCurrentSlide(1)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-xs transition active:scale-95 shrink-0"
              >
                <span>Lihat Iuran</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE 2: DASHBOARD IURAN SISWA & PROGRESS BULAN INI */}
      {/* ========================================================================= */}
      {currentSlide === 1 && (
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-950 via-amber-900 to-slate-950 text-white p-4 sm:p-6 shadow-md border border-amber-700/40 relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between text-amber-200 text-xs mb-1">
              <span className="font-semibold flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-300" />
                Dashboard Iuran Kas ({currentMonthLabel})
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded-full font-medium">
                Tarif: {formatRupiah(defaultKasAmount)} / siswa
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-4xl font-black tracking-tight text-amber-300">
                {formatRupiah(monthCollected)}
              </span>
              <span className="text-xs sm:text-sm text-amber-200/80 font-medium">
                terkumpul bulan ini
              </span>
            </div>

            {/* Visual Progress Bar of Monthly Collection */}
            <div className="mt-3 bg-black/25 p-2.5 sm:p-3 rounded-xl border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-200 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Capaian Iuran: {totals.thisMonthPaidCount ?? 0} dari {activeStudentsCount} Siswa
                </span>
                <span className="font-bold text-amber-300">{monthProgress}% Lunas</span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-700 rounded-full"
                  style={{ width: `${monthProgress}%` }}
                />
              </div>
            </div>

            {/* 3-Column Specific Breakdown for Iuran */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3">
              <div className="bg-white/10 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-white/10">
                <div className="flex items-center gap-1 text-emerald-200 text-[10px] sm:text-[11px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span className="truncate">Sudah Lunas</span>
                </div>
                <div className="text-xs sm:text-base font-bold text-emerald-300 mt-0.5 truncate">
                  {totals.thisMonthPaidCount ?? 0} Siswa
                </div>
                <div className="text-[10px] text-emerald-200/80 mt-0.5 truncate">
                  {formatRupiah((totals.thisMonthPaidCount ?? 0) * defaultKasAmount)}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-white/10">
                <div className="flex items-center gap-1 text-rose-200 text-[10px] sm:text-[11px] font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                  <span className="truncate">Belum Setor</span>
                </div>
                <div className="text-xs sm:text-base font-bold text-rose-300 mt-0.5 truncate">
                  {totals.thisMonthUnpaidCount ?? 0} Siswa
                </div>
                <div className="text-[10px] text-rose-200/80 mt-0.5 truncate">
                  Sisa: {formatRupiah((totals.thisMonthUnpaidCount ?? 0) * defaultKasAmount)}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-white/10">
                <div className="flex items-center gap-1 text-amber-200 text-[10px] sm:text-[11px] font-medium">
                  <Users className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="truncate">Total Siswa</span>
                </div>
                <div className="text-xs sm:text-base font-bold text-white mt-0.5 truncate">
                  {activeStudentsCount} Orang
                </div>
                <div className="text-[10px] text-amber-300/80 mt-0.5 truncate">
                  Kelas Aktif
                </div>
              </div>
            </div>

            {/* Action buttons in Slide 2 */}
            <div className="mt-3.5 flex items-center gap-2">
              {onSelectSubTab && (
                <button
                  onClick={() => onSelectSubTab('bulanan')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition active:scale-95"
                >
                  <CalendarDays className="w-4 h-4 text-slate-950" />
                  <span>Lihat Rincian Nama Siswa Belum Setor</span>
                </button>
              )}

              <button
                onClick={() => setCurrentSlide(0)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-xs transition active:scale-95 shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Total</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dots Indicator */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <button
          onClick={() => setCurrentSlide(0)}
          className={`h-2 rounded-full transition-all duration-300 ${
            currentSlide === 0 ? 'w-6 bg-teal-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
          }`}
          aria-label="Buka Slide 1: Total Kas"
        />
        <button
          onClick={() => setCurrentSlide(1)}
          className={`h-2 rounded-full transition-all duration-300 ${
            currentSlide === 1 ? 'w-6 bg-amber-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
          }`}
          aria-label="Buka Slide 2: Dashboard Iuran"
        />
      </div>
    </div>
  );
};
