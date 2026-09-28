import React, { useState, useMemo } from 'react';
import { AppState, Student, PaymentMethod } from '../types';
import { formatRupiah, formatDateIndo, formatDateShort, getTodayDateStr } from '../services/utils';
import { createStudentReminderMessage, openWhatsAppDirect } from '../services/whatsapp';
import { MonthlyKasCard } from './MonthlyKasCard';
import {
  Coins,
  Calendar,
  CheckCircle2,
  XCircle,
  Search,
  CheckCheck,
  RotateCcw,
  MessageCircle,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Sparkles,
  Edit3,
  CalendarDays,
} from 'lucide-react';

interface JimpitanViewProps {
  state: AppState;
  studentMetrics: Map<
    string,
    { totalPaid: number; paidCount: number; unpaidCount: number; unpaidTotal: number; lastPaidDate?: string }
  >;
  onToggleStatus: (studentId: string, date: string, customAmount?: number, paymentMethod?: PaymentMethod) => void;
  onToggleMonthlyStatus?: (studentId: string, month: string, customAmount?: number, paymentMethod?: PaymentMethod) => void;
  onSetRecord: (record: any) => void;
  onMarkAllPaid: (date: string, paymentMethod?: PaymentMethod) => void;
  onMarkAllPaidMonth?: (month: string, paymentMethod?: PaymentMethod) => void;
  onResetDate: (date: string) => void;
  onResetMonth?: (month: string) => void;
}

export const JimpitanView: React.FC<JimpitanViewProps> = ({
  state,
  studentMetrics,
  onToggleStatus,
  onToggleMonthlyStatus,
  onSetRecord,
  onMarkAllPaid,
  onMarkAllPaidMonth,
  onResetDate,
  onResetMonth,
}) => {
  // Mode selection: 'monthly' is default for modern classroom kas management
  const [activeTrackingMode, setActiveTrackingMode] = useState<'monthly' | 'daily'>('monthly');

  // Daily Mode States
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [viewMode, setViewMode] = useState<'grid' | 'matrix'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom payment modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(state.classConfig.defaultAmount);
  const [customMethod, setCustomMethod] = useState<PaymentMethod>('cash');
  const [customNote, setCustomNote] = useState('');

  const defaultAmt = state.classConfig.defaultAmount || 10000;
  const activeStudents = useMemo(() => state.students.filter((s) => s.isActive), [state.students]);

  // Date navigation helpers
  const changeDateByDays = (delta: number) => {
    const curr = new Date(selectedDate + 'T00:00:00');
    curr.setDate(curr.getDate() + delta);
    setSelectedDate(curr.toISOString().split('T')[0]);
  };

  // Records for current selected date
  const recordsMap = useMemo(() => {
    const map = new Map<string, (typeof state.jimpitanRecords)[0]>();
    state.jimpitanRecords
      .filter((r) => r.date === selectedDate)
      .forEach((r) => map.set(r.studentId, r));
    return map;
  }, [state.jimpitanRecords, selectedDate]);

  // Stats for the selected date
  const dateStats = useMemo(() => {
    let paidCount = 0;
    let totalCollected = 0;

    activeStudents.forEach((student) => {
      const rec = recordsMap.get(student.id);
      if (rec && rec.status === 'paid') {
        paidCount++;
        totalCollected += rec.amount || defaultAmt;
      }
    });

    const unpaidCount = Math.max(0, activeStudents.length - paidCount);
    const pct = activeStudents.length > 0 ? Math.round((paidCount / activeStudents.length) * 100) : 0;

    return { paidCount, unpaidCount, totalCollected, pct };
  }, [activeStudents, recordsMap, defaultAmt]);

  // Filtered students for grid view
  const filteredStudents = useMemo(() => {
    return activeStudents.filter((student) => {
      const rec = recordsMap.get(student.id);
      const isPaid = rec?.status === 'paid';

      // Status filter
      if (filterStatus === 'paid' && !isPaid) return false;
      if (filterStatus === 'unpaid' && isPaid) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = student.name.toLowerCase().includes(query);
        const matchNo = student.studentNumber.includes(query);
        return matchName || matchNo;
      }

      return true;
    });
  }, [activeStudents, recordsMap, filterStatus, searchQuery]);

  // Matrix dates: 7 days up to selected date
  const matrixDates = useMemo(() => {
    const dates: string[] = [];
    const base = new Date(selectedDate + 'T00:00:00');
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [selectedDate]);

  const openCustomModal = (student: Student) => {
    const rec = recordsMap.get(student.id);
    setEditingStudent(student);
    setCustomAmount(rec?.amount ?? defaultAmt);
    setCustomMethod(rec?.paymentMethod ?? 'cash');
    setCustomNote(rec?.note ?? '');
  };

  const handleSaveCustomPayment = () => {
    if (!editingStudent) return;
    onSetRecord({
      studentId: editingStudent.id,
      date: selectedDate,
      amount: Number(customAmount) || defaultAmt,
      paymentMethod: customMethod,
      status: 'paid',
      note: customNote,
    });
    setEditingStudent(null);
  };

  const handleSendReminder = (student: Student) => {
    const metric = studentMetrics.get(student.id);
    const unpaidCount = (metric?.unpaidCount || 0) + (recordsMap.get(student.id)?.status === 'paid' ? 0 : 1);
    const unpaidTotal = unpaidCount * defaultAmt;
    const msg = createStudentReminderMessage(student, Math.max(1, unpaidCount), Math.max(defaultAmt, unpaidTotal), state);
    openWhatsAppDirect(student.phone, msg);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* 1. Mode Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Pencatatan Iuran Kas Siswa</h2>
            <p className="text-[11px] text-slate-500">
              Kelola setoran kas siswa, pantau siapa yang belum bayar, & kirim pengingat WA
            </p>
          </div>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTrackingMode('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTrackingMode === 'monthly'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Mode Per Bulan</span>
          </button>

          <button
            onClick={() => setActiveTrackingMode('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTrackingMode === 'daily'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Mode Per Tanggal</span>
          </button>
        </div>
      </div>

      {/* 2A. MODE PER BULAN (PRIMARY) */}
      {activeTrackingMode === 'monthly' && (
        <MonthlyKasCard
          state={state}
          isAdmin={true}
          onToggleStatus={onToggleMonthlyStatus}
          onMarkAllPaid={onMarkAllPaidMonth}
          onResetMonth={onResetMonth}
          title="Rekap & Input Iuran Kas Per Bulan"
          subtitle="Klik nama siswa untuk ubah status Lunas / Belum Setor. Filter untuk melihat siapa yang belum bayar."
        />
      )}

      {/* 2B. MODE PER TANGGAL (DAILY/WEEKLY) */}
      {activeTrackingMode === 'daily' && (
        <div className="space-y-4">
          {/* Date Selector Bar & Stats Summary */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* Date Picker Control */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeDateByDays(-1)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  title="Hari Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => changeDateByDays(1)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  title="Hari Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setSelectedDate(getTodayDateStr())}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedDate === getTodayDateStr()
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Hari Ini
                </button>
              </div>

              {/* Action Buttons for Selected Date */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onMarkAllPaid(selectedDate, 'cash')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Semua Lunas</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Reset status setor untuk tanggal ${formatDateIndo(selectedDate)}?`)) {
                      onResetDate(selectedDate);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-medium border border-slate-200 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Tanggal Ini</span>
                </button>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === 'grid' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-500'
                    }`}
                    title="Tampilan Kotak Siswa"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('matrix')}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === 'matrix' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-500'
                    }`}
                    title="Tampilan Matriks 7 Hari"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar for Selected Date */}
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100">
                <span className="text-[11px] text-teal-700 font-medium">Terkumpul Tanggal Ini</span>
                <p className="text-sm font-bold text-teal-900 mt-0.5">{formatRupiah(dateStats.totalCollected)}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-[11px] text-emerald-700 font-medium">Sudah Setor</span>
                <p className="text-sm font-bold text-emerald-900 mt-0.5">
                  {dateStats.paidCount} / {activeStudents.length} Siswa ({dateStats.pct}%)
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                <span className="text-[11px] text-rose-700 font-medium">Belum Setor</span>
                <p className="text-sm font-bold text-rose-900 mt-0.5">{dateStats.unpaidCount} Siswa</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-center">
                <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                  <span>Progres</span>
                  <span className="font-bold">{dateStats.pct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-300"
                    style={{ width: `${dateStats.pct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari siswa atau no absen..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-hidden focus:border-teal-600 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterStatus === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                Semua ({activeStudents.length})
              </button>
              <button
                onClick={() => setFilterStatus('unpaid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterStatus === 'unpaid'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-rose-700 border border-rose-200'
                }`}
              >
                Belum ({dateStats.unpaidCount})
              </button>
              <button
                onClick={() => setFilterStatus('paid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterStatus === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-emerald-700 border border-emerald-200'
                }`}
              >
                Lunas ({dateStats.paidCount})
              </button>
            </div>
          </div>

          {/* Grid View of Students */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredStudents.map((student) => {
                const rec = recordsMap.get(student.id);
                const isPaid = rec?.status === 'paid';
                const metric = studentMetrics.get(student.id);
                const unpaidCount = metric?.unpaidCount || 0;

                return (
                  <div
                    key={student.id}
                    className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                      isPaid
                        ? 'bg-white border-emerald-200/80 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    {/* Student Info & Quick Toggle */}
                    <div
                      onClick={() => onToggleStatus(student.id, selectedDate)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
                    >
                      <span className="w-6 text-[11px] font-bold text-slate-400 text-center shrink-0">
                        {student.studentNumber}
                      </span>

                      <div
                        className={`w-9 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ${student.avatarColor}`}
                      >
                        {student.name.charAt(0)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{student.name}</h4>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                          <span>{isPaid ? formatRupiah(rec.amount || defaultAmt) : 'Belum setor'}</span>
                          {rec?.paymentMethod === 'transfer' && (
                            <span className="px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold">TF</span>
                          )}
                          {rec?.paymentMethod === 'qris' && (
                            <span className="px-1 py-0.2 rounded bg-amber-50 text-amber-700 font-semibold">QRIS</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Status Toggle Button & Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onToggleStatus(student.id, selectedDate)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs ${
                          isPaid
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Lunas</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span>Belum</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => openCustomModal(student)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="Ubah Nominal / Metode Bayar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {student.phone && !isPaid && (
                        <button
                          onClick={() => handleSendReminder(student)}
                          className="p-1.5 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          title="Kirim Pengingat WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Matrix View (7-Day Table) */}
          {viewMode === 'matrix' && (
            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="py-2.5 px-3 font-bold w-12 text-center">No</th>
                      <th className="py-2.5 px-3 font-bold min-w-40">Nama Siswa</th>
                      {matrixDates.map((date) => (
                        <th key={date} className="py-2.5 px-2 font-bold text-center min-w-16">
                          <div className={date === selectedDate ? 'text-teal-800 font-extrabold' : ''}>
                            {formatDateShort(date)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-3 text-center text-slate-400 font-bold">{student.studentNumber}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{student.name}</td>
                        {matrixDates.map((date) => {
                          const rec = state.jimpitanRecords.find(
                            (r) => r.studentId === student.id && r.date === date
                          );
                          const isPaid = rec?.status === 'paid';

                          return (
                            <td key={date} className="py-2 px-2 text-center">
                              <button
                                onClick={() => onToggleStatus(student.id, date)}
                                className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition font-bold text-[11px] ${
                                  isPaid
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                                }`}
                                title={`${student.name} - ${date}: ${isPaid ? 'Lunas' : 'Belum'}`}
                              >
                                {isPaid ? '✓' : '✗'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Payment Modal (Daily Mode) */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Ubah Rincian Setoran Siswa</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900">{editingStudent.name}</p>
              <p className="text-[11px] text-slate-500">Tanggal: {formatDateIndo(selectedDate)}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nominal Iuran (Rp)</label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['cash', 'transfer', 'qris'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCustomMethod(m)}
                      className={`py-1.5 rounded-lg font-bold text-[11px] uppercase transition ${
                        customMethod === m
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Titip teman / bayar dobel"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCustomPayment}
                className="flex-1 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition"
              >
                Simpan Setoran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
