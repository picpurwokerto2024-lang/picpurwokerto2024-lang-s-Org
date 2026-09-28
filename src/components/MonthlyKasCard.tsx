import React, { useState, useMemo } from 'react';
import { AppState, Student, PaymentMethod } from '../types';
import { formatRupiah, formatDateIndo } from '../services/utils';
import {
  getCurrentMonthKey,
  getAcademicMonthsList,
  getMonthlyStatusSummary,
  getStudentMonthlyHistory,
  generateMonthlyUnpaidWhatsAppMessage,
  generateSingleStudentMonthlyReminder,
} from '../services/monthlyKas';
import { openWhatsAppDirect } from '../services/whatsapp';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Share2,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  Wallet,
  MessageCircle,
  HelpCircle,
  SlidersHorizontal,
  ChevronDown,
  UserCheck,
  UserX,
} from 'lucide-react';

interface MonthlyKasCardProps {
  state: AppState;
  isAdmin?: boolean;
  onToggleStatus?: (studentId: string, monthKey: string, customAmount?: number, paymentMethod?: PaymentMethod) => void;
  onMarkAllPaid?: (monthKey: string, paymentMethod?: PaymentMethod) => void;
  onResetMonth?: (monthKey: string) => void;
  title?: string;
  subtitle?: string;
  selectedMonthKey?: string;
  onSelectMonthKey?: (monthKey: string) => void;
}

export const MonthlyKasCard: React.FC<MonthlyKasCardProps> = ({
  state,
  isAdmin = false,
  onToggleStatus,
  onMarkAllPaid,
  onResetMonth,
  title = 'Riwayat & Rekap Iuran Kas Per Bulan',
  subtitle = 'Daftar transparansi siswa yang sudah dan belum setoran kas bulanan',
  selectedMonthKey: controlledMonthKey,
  onSelectMonthKey,
}) => {
  const [internalMonthKey, setInternalMonthKey] = useState<string>(() => getCurrentMonthKey());
  const selectedMonthKey = controlledMonthKey !== undefined ? controlledMonthKey : internalMonthKey;

  const handleSelectMonth = (monthKey: string) => {
    if (onSelectMonthKey) {
      onSelectMonthKey(monthKey);
    } else {
      setInternalMonthKey(monthKey);
    }
  };

  const [statusFilter, setStatusFilter] = useState<'unpaid' | 'paid' | 'all'>('unpaid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentHistory, setSelectedStudentHistory] = useState<Student | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // List of academic months (Juli 2026 s/d Juni 2027)
  const academicMonths = useMemo(() => {
    return getAcademicMonthsList(state.classConfig?.academicYear);
  }, [state.classConfig?.academicYear]);

  // Current selected month summary
  const summary = useMemo(() => {
    return getMonthlyStatusSummary(state, selectedMonthKey);
  }, [state, selectedMonthKey]);

  // Month navigation
  const currentMonthIdx = academicMonths.findIndex((m) => m.monthKey === selectedMonthKey);

  const goToPrevMonth = () => {
    if (currentMonthIdx > 0) {
      handleSelectMonth(academicMonths[currentMonthIdx - 1].monthKey);
    }
  };

  const goToNextMonth = () => {
    if (currentMonthIdx < academicMonths.length - 1) {
      handleSelectMonth(academicMonths[currentMonthIdx + 1].monthKey);
    }
  };

  // Filtered students for display
  const filteredList = useMemo(() => {
    let list = summary.allStudents;
    if (statusFilter === 'unpaid') {
      list = summary.unpaidStudents;
    } else if (statusFilter === 'paid') {
      list = summary.paidStudents;
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.student.name.toLowerCase().includes(q) ||
        item.student.studentNumber.includes(q) ||
        (item.student.parentName && item.student.parentName.toLowerCase().includes(q))
    );
  }, [summary, statusFilter, searchQuery]);

  // Student history detail for modal
  const studentYearHistory = useMemo(() => {
    if (!selectedStudentHistory) return [];
    return getStudentMonthlyHistory(state, selectedStudentHistory.id);
  }, [state, selectedStudentHistory]);

  // WhatsApp broadcast message for current selected month
  const broadcastMessage = useMemo(() => {
    return generateMonthlyUnpaidWhatsAppMessage(summary, state.classConfig);
  }, [summary, state.classConfig]);

  const handleSendBroadcastWA = () => {
    openWhatsAppDirect('', broadcastMessage);
  };

  const handleSendSingleReminder = (student: Student, amount: number) => {
    const msg = generateSingleStudentMonthlyReminder(
      student,
      summary.monthLabel,
      amount,
      state.classConfig
    );
    openWhatsAppDirect(student.phone, msg);
  };

  const copyBroadcastText = () => {
    navigator.clipboard.writeText(broadcastMessage);
    alert('Teks rekap bulanan berhasil disalin ke clipboard!');
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* 1. Card Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 shadow-2xs transition active:scale-95"
              title="Kirim daftar belum setor ke WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Bagikan Rekap WA</span>
            </button>

            {isAdmin && onMarkAllPaid && summary.unpaidCount > 0 && (
              <button
                onClick={() => onMarkAllPaid(selectedMonthKey)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition active:scale-95"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Semua Lunas</span>
                <span>Bulan Ini</span>
              </button>
            )}
          </div>
        </div>

        {/* Month Selector Horizontal Scroll / Carousel */}
        <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
          <button
            onClick={goToPrevMonth}
            disabled={currentMonthIdx <= 0}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 transition shrink-0"
            title="Bulan sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-0.5">
            {academicMonths.map((m) => {
              const isSelected = m.monthKey === selectedMonthKey;
              // Check how many unpaid in this month
              const mSummary = getMonthlyStatusSummary(state, m.monthKey);
              const isAllPaid = mSummary.totalActiveStudents > 0 && mSummary.unpaidCount === 0;

              return (
                <button
                  key={m.monthKey}
                  onClick={() => handleSelectMonth(m.monthKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{m.monthLabel}</span>
                  {m.isCurrent && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                        isSelected ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Bulan Ini
                    </span>
                  )}
                  {isAllPaid ? (
                    <span className="text-[10px] text-emerald-400">✓</span>
                  ) : mSummary.unpaidCount > 0 ? (
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-rose-500/80 text-white' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {mSummary.unpaidCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <button
            onClick={goToNextMonth}
            disabled={currentMonthIdx >= academicMonths.length - 1}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 transition shrink-0"
            title="Bulan berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Search Bar & Status Filter Tabs */}
      <div className="p-4 border-b border-slate-100 bg-white space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari siswa untuk bulan ${summary.monthLabel}...`}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-teal-600 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              statusFilter === 'unpaid'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Belum Setor</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'unpaid' ? 'bg-white text-rose-800' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {summary.unpaidCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('paid')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              statusFilter === 'paid'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Sudah Setor</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'paid' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {summary.paidCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Semua</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'all' ? 'bg-white text-slate-800' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {summary.totalActiveStudents}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Student List for the Selected Month */}
      <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
        {summary.totalActiveStudents === 0 ? (
          <div className="text-center py-10 px-4 text-slate-500">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xl mb-2">
              👥
            </div>
            <p className="text-xs font-bold text-slate-800">
              Belum Ada Siswa Terdaftar
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pengurus dapat menambahkan nama siswa di menu <strong>Data Siswa</strong>.
            </p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-500">
            {statusFilter === 'unpaid' && summary.unpaidCount === 0 ? (
              <div className="space-y-1">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                  ✨
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Luar biasa! Seluruh siswa telah melunasi iuran kas bulan {summary.monthLabel}.
                </p>
                <p className="text-[11px] text-slate-400">Tidak ada tunggakan iuran pada bulan ini.</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-600">Tidak ada data siswa yang cocok.</p>
                <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau filter status.</p>
              </div>
            )}
          </div>
        ) : (
          filteredList.map((item) => {
            const { student, isPaid, amount, paidAt, paymentMethod, note } = item;

            return (
              <div
                key={student.id}
                className={`p-3 sm:p-4 flex items-center justify-between gap-3 transition ${
                  !isPaid ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'hover:bg-slate-50'
                }`}
              >
                {/* Student Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-[11px] font-bold text-slate-400 text-center shrink-0">
                    {student.studentNumber}
                  </span>

                  <div
                    className={`w-9 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs ${student.avatarColor}`}
                  >
                    {student.name.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setSelectedStudentHistory(student)}
                        className="text-xs sm:text-sm font-bold text-slate-900 hover:text-teal-700 truncate text-left underline-offset-2 hover:underline"
                        title="Klik untuk melihat riwayat setoran anak sepanjang tahun ajaran"
                      >
                        {student.name}
                      </button>
                      {student.parentName && (
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          ({student.parentName})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                      {isPaid ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Lunas ({formatRupiah(amount)})</span>
                          {paidAt && (
                            <span className="text-slate-400 font-normal">
                              • {formatDateIndo(paidAt.split('T')[0])}
                            </span>
                          )}
                          {paymentMethod && (
                            <span className="uppercase text-[9px] px-1 py-0.2 bg-slate-100 rounded text-slate-600">
                              {paymentMethod}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-rose-700 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Belum Setor Bulan Ini</span>
                          <span className="text-slate-500 font-normal">
                            (Tagihan: {formatRupiah(amount)})
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions & Status Badge */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* WhatsApp Reminder Button (Available for Unpaid students) */}
                  {!isPaid && (
                    <button
                      onClick={() => handleSendSingleReminder(student, amount)}
                      className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
                      title={`Kirim pesan pengingat WA ke wali ${student.name}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="hidden sm:inline">Ingatkan WA</span>
                    </button>
                  )}

                  {/* Toggle Button for Admin or Status Pill for Parents */}
                  {isAdmin && onToggleStatus ? (
                    <button
                      onClick={() => onToggleStatus(student.id, selectedMonthKey)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 shadow-2xs flex items-center gap-1.5 ${
                        isPaid
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                          : 'bg-teal-700 hover:bg-teal-800 text-white'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Lunas</span>
                        </>
                      ) : (
                        <>
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Tandai Lunas</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Lunas</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Belum</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Card Footer */}
      <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>ℹ️ Klik nama siswa untuk mengecek riwayat 1 tahun penuh.</span>
        </div>
        <div className="font-semibold text-slate-700">
          Total Kas Masuk {summary.monthLabel}: <strong className="text-teal-900">{formatRupiah(summary.totalPaidAmount)}</strong>
        </div>
      </div>

      {/* Modal: Student Yearly History */}
      {selectedStudentHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setSelectedStudentHistory(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center ${selectedStudentHistory.avatarColor}`}
                >
                  {selectedStudentHistory.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {selectedStudentHistory.name} (No. {selectedStudentHistory.studentNumber})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Riwayat Iuran Kas Bulanan TA {state.classConfig.academicYear}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentHistory(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="my-3 flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
              {studentYearHistory.map((m) => (
                <div key={m.monthKey} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{m.monthLabel}</p>
                    <span className="text-[11px] text-slate-400">
                      {m.isPaid && m.paidAt ? `Disetor ${formatDateIndo(m.paidAt.split('T')[0])}` : 'Iuran Kas Rutin Bulanan'}
                    </span>
                  </div>

                  <div className="text-right">
                    {m.isPaid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Lunas ({formatRupiah(m.amount)})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        <span>Belum Setor</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => setSelectedStudentHistory(null)}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: WhatsApp Broadcast Preview */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  WA
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Rekap Iuran Kas {summary.monthLabel}
                  </h4>
                  <p className="text-[11px] text-slate-500">Format pesan rapi siap kirim ke grup WhatsApp</p>
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
              {broadcastMessage}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={copyBroadcastText}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition text-center"
              >
                📋 Salin Teks
              </button>
              <button
                onClick={handleSendBroadcastWA}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>Buka WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
