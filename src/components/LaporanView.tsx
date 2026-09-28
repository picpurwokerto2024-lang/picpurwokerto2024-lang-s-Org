import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { formatRupiah, formatDateIndo, formatDateShort, exportToCSV } from '../services/utils';
import { createWeeklyKasReportMessage, openWhatsAppDirect } from '../services/whatsapp';
import { getAcademicMonthsList } from '../services/monthlyKas';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Share2,
  Calendar,
  Layers,
  BookOpen,
  Users,
} from 'lucide-react';

interface LaporanViewProps {
  state: AppState;
  totals: {
    directIncome: number;
    jimpitanTotal: number;
    totalIncome: number;
    totalExpense: number;
    balance: number;
    allocatedSavings: number;
    unallocatedCash: number;
  };
  studentMetrics: Map<
    string,
    { totalPaid: number; paidCount: number; unpaidCount: number; unpaidTotal: number; lastPaidDate?: string }
  >;
}

export const LaporanView: React.FC<LaporanViewProps> = ({ state, totals, studentMetrics }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [reportType, setReportType] = useState<'all' | 'buku_kas' | 'rekap_siswa'>('all');

  const defaultAmt = state.classConfig.defaultAmount || 10000;
  const academicMonths = useMemo(() => {
    return getAcademicMonthsList(state.classConfig?.academicYear);
  }, [state.classConfig?.academicYear]);

  // Build combined chronological accounting entries
  const ledgerEntries = useMemo(() => {
    type LedgerRow = {
      id: string;
      date: string;
      title: string;
      category: string;
      income: number;
      expense: number;
      type: 'jimpitan' | 'income' | 'expense';
      sourceOrRecipient?: string;
    };

    const rows: LedgerRow[] = [];

    // Group jimpitan by date
    const jimpitanByDate = new Map<string, number>();
    state.jimpitanRecords
      .filter((r) => r.status === 'paid')
      .forEach((r) => {
        jimpitanByDate.set(r.date, (jimpitanByDate.get(r.date) || 0) + (r.amount || defaultAmt));
      });

    jimpitanByDate.forEach((amount, date) => {
      rows.push({
        id: `jimpitan-${date}`,
        date,
        title: `Penerimaan Iuran Kas Kelas (${state.classConfig.className})`,
        category: 'jimpitan',
        income: amount,
        expense: 0,
        type: 'jimpitan',
        sourceOrRecipient: 'Iuran Siswa',
      });
    });

    // Add general transactions
    state.transactions.forEach((tx) => {
      rows.push({
        id: tx.id,
        date: tx.date,
        title: tx.title,
        category: tx.category,
        income: tx.type === 'income' ? tx.amount : 0,
        expense: tx.type === 'expense' ? tx.amount : 0,
        type: tx.type,
        sourceOrRecipient: tx.recipientOrSource,
      });
    });

    // Sort ascending by date for cumulative balance calculation
    rows.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate cumulative balance
    let runningBalance = 0;
    return rows.map((r) => {
      runningBalance += r.income - r.expense;
      return {
        ...r,
        runningBalance,
      };
    });
  }, [state.jimpitanRecords, state.transactions, state.classConfig.className, defaultAmt]);

  // Filtered ledger entries
  const filteredLedger = useMemo(() => {
    if (selectedMonth === 'all') return ledgerEntries;
    return ledgerEntries.filter((r) => r.date.startsWith(selectedMonth));
  }, [ledgerEntries, selectedMonth]);

  // Summary for filtered view
  const filteredTotals = useMemo(() => {
    if (selectedMonth === 'all') return totals;
    const totalIncome = filteredLedger.reduce((acc, curr) => acc + curr.income, 0);
    const totalExpense = filteredLedger.reduce((acc, curr) => acc + curr.expense, 0);
    const balance = totalIncome - totalExpense;
    return {
      ...totals,
      totalIncome,
      totalExpense,
      balance,
    };
  }, [selectedMonth, filteredLedger, totals]);

  // Export to Excel CSV
  const handleExportCSV = () => {
    if (reportType === 'buku_kas' || reportType === 'all') {
      const headers = ['No', 'Tanggal', 'Uraian Transaksi', 'Kategori', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Saldo Kas (Rp)'];
      const rows = filteredLedger.map((r, idx) => [
        String(idx + 1),
        r.date,
        r.title,
        r.category,
        String(r.income),
        String(r.expense),
        String(r.runningBalance),
      ]);
      exportToCSV(`Buku_Kas_${state.classConfig.className.replace(/\s+/g, '_')}.csv`, [headers, ...rows]);
    } else {
      const headers = ['No Absen', 'Nama Siswa', 'Jenis Kelamin', 'Total Iuran Disetor (Rp)', 'Jumlah Bayar', 'Status'];
      const rows = state.students.map((s) => {
        const metric = studentMetrics.get(s.id);
        return [
          s.studentNumber,
          s.name,
          s.gender,
          String(metric?.totalPaid || 0),
          String(metric?.paidCount || 0),
          s.isActive ? 'Aktif' : 'Non-Aktif',
        ];
      });
      exportToCSV(`Rekap_Siswa_${state.classConfig.className.replace(/\s+/g, '_')}.csv`, [headers, ...rows]);
    }
  };

  // Trigger Print Friendly PDF
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Message
  const handleShareWA = () => {
    const msg = createWeeklyKasReportMessage(state);
    openWhatsAppDirect('', msg);
  };

  const todayFormatted = formatDateIndo(new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-4 pb-20 md:pb-6 print:pb-0 print:space-y-0">
      {/* 1. Header Toolbar (Hidden in print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-700" />
            <span>Laporan Keuangan & Cetak PDF Resmi</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kop surat resmi, buku kas arus kas, rekapitulasi siswa, ekspor Excel, dan cetak PDF
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleShareWA}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition active:scale-95 shadow-xs"
            title="Kirim Format Laporan WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            <span>Kirim WA</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition border border-slate-200"
            title="Unduh File CSV / Excel"
          >
            <Download className="w-4 h-4 text-teal-700" />
            <span>Unduh Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-md transition active:scale-95"
            title="Cetak Laporan / Simpan PDF"
          >
            <Printer className="w-4 h-4 text-teal-200" />
            <span>Cetak PDF Resmi</span>
          </button>
        </div>
      </div>

      {/* 2. Switcher Tab: Semua vs Buku Kas vs Rekap Siswa (Hidden in print) */}
      <div className="print:hidden flex items-center justify-between gap-3 flex-wrap bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
          <button
            onClick={() => setReportType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              reportType === 'all'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua (Buku Kas & Rekap)</span>
          </button>
          <button
            onClick={() => setReportType('buku_kas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              reportType === 'buku_kas'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Buku Kas Arus Keuangan</span>
          </button>
          <button
            onClick={() => setReportType('rekap_siswa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              reportType === 'rekap_siswa'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Rekap Iuran per Siswa</span>
          </button>
        </div>

        {/* Dynamic Academic Month Filter */}
        {(reportType === 'buku_kas' || reportType === 'all') && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter Periode:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
            >
              <option value="all">Semua Periode (Keseluruhan)</option>
              {academicMonths.map((m) => (
                <option key={m.monthKey} value={m.monthKey}>
                  {m.monthLabel}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3. Printable Report Document Section (Pure Official Document) */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
        
        {/* Printable Official School Kop Surat (Satu Kop Surat Resmi) */}
        <div className="text-center pb-3 mb-5 border-b-2 border-slate-900">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-wider font-serif">
            {state.classConfig.schoolName || 'SMP MUHAMKA'}
          </h3>
          <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide mt-0.5">
            PAGUYUBAN ORANG TUA / WALI MURID {state.classConfig.className.toUpperCase()}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Tahun Ajaran {state.classConfig.academicYear}
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-600 mt-1">
            <span>
              Periode:{' '}
              <strong className="text-slate-800 font-semibold">
                {selectedMonth === 'all'
                  ? 'Semua Transaksi'
                  : academicMonths.find((m) => m.monthKey === selectedMonth)?.monthLabel || selectedMonth}
              </strong>
            </span>
            <span>•</span>
            <span>
              Dicetak pada:{' '}
              <strong className="text-slate-800 font-semibold">{todayFormatted}</strong>
            </span>
          </div>
        </div>

        {/* Judul Dokumen Laporan (Di Luar Kop Surat) */}
        <div className="text-center mb-5">
          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
            LAPORAN PERTANGGUNGJAWABAN KEUANGAN KAS & IURAN KELAS
          </h4>
        </div>

        {/* Financial Summary Highlight Box */}
        <div className="grid grid-cols-3 gap-3 mb-6 p-3 rounded-lg bg-slate-50 border border-slate-300 print:bg-white print:border-slate-800 text-xs text-center avoid-page-break">
          <div className="p-2 border-r border-slate-200 print:border-slate-800">
            <span className="text-[10px] sm:text-xs text-slate-600 uppercase font-semibold block">Total Pemasukan</span>
            <div className="font-bold text-emerald-800 text-xs sm:text-base mt-0.5 font-mono">
              {formatRupiah(filteredTotals.totalIncome)}
            </div>
          </div>
          <div className="p-2 border-r border-slate-200 print:border-slate-800">
            <span className="text-[10px] sm:text-xs text-slate-600 uppercase font-semibold block">Total Pengeluaran</span>
            <div className="font-bold text-rose-800 text-xs sm:text-base mt-0.5 font-mono">
              {formatRupiah(filteredTotals.totalExpense)}
            </div>
          </div>
          <div className="p-2">
            <span className="text-[10px] sm:text-xs text-slate-600 uppercase font-semibold block">Sisa Saldo Kas Akhir</span>
            <div className="font-black text-slate-900 text-xs sm:text-base mt-0.5 font-mono">
              {formatRupiah(filteredTotals.balance)}
            </div>
          </div>
        </div>

        {/* Section A: Buku Kas Arus Transaksi */}
        {(reportType === 'buku_kas' || reportType === 'all') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                I. Buku Kas Arus Transaksi Keuangan
              </h5>
              <span className="text-[10px] text-slate-500 print:hidden font-mono">
                {filteredLedger.length} Transaksi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-400 print:border-slate-800 border-collapse">
                <thead>
                  <tr className="bg-slate-200 print:bg-slate-200 text-slate-900 border-b border-slate-400 print:border-slate-800 font-bold">
                    <th className="p-2 text-center w-10 border border-slate-300 print:border-slate-700">No</th>
                    <th className="p-2 min-w-[85px] border border-slate-300 print:border-slate-700">Tanggal</th>
                    <th className="p-2 min-w-[200px] border border-slate-300 print:border-slate-700">Uraian Keterangan Transaksi</th>
                    <th className="p-2 text-right min-w-[95px] border border-slate-300 print:border-slate-700">Pemasukan</th>
                    <th className="p-2 text-right min-w-[95px] border border-slate-300 print:border-slate-700">Pengeluaran</th>
                    <th className="p-2 text-right min-w-[100px] border border-slate-300 print:border-slate-700">Saldo Kas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 print:divide-slate-700">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 italic border border-slate-300">
                        Tidak ada catatan transaksi pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((row, idx) => (
                      <tr key={row.id} className="odd:bg-white even:bg-slate-50 print:even:bg-slate-100">
                        <td className="p-2 text-center font-mono text-slate-600 border border-slate-300 print:border-slate-700">{idx + 1}</td>
                        <td className="p-2 text-slate-800 whitespace-nowrap border border-slate-300 print:border-slate-700">
                          {formatDateShort(row.date)}
                        </td>
                        <td className="p-2 font-medium text-slate-900 border border-slate-300 print:border-slate-700">
                          <div>{row.title}</div>
                          {row.sourceOrRecipient && (
                            <div className="text-[10px] text-slate-600">{row.sourceOrRecipient}</div>
                          )}
                        </td>
                        <td className="p-2 text-right font-semibold text-emerald-800 font-mono border border-slate-300 print:border-slate-700">
                          {row.income > 0 ? formatRupiah(row.income) : '-'}
                        </td>
                        <td className="p-2 text-right font-semibold text-rose-800 font-mono border border-slate-300 print:border-slate-700">
                          {row.expense > 0 ? formatRupiah(row.expense) : '-'}
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900 font-mono border border-slate-300 print:border-slate-700">
                          {formatRupiah(row.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-200 print:bg-slate-200 font-bold border-t-2 border-slate-400 print:border-slate-800 text-slate-900">
                    <td colSpan={3} className="p-2 text-right border border-slate-300 print:border-slate-700">
                      TOTAL KAS:
                    </td>
                    <td className="p-2 text-right text-emerald-800 font-extrabold font-mono border border-slate-300 print:border-slate-700">
                      {formatRupiah(filteredTotals.totalIncome)}
                    </td>
                    <td className="p-2 text-right text-rose-800 font-extrabold font-mono border border-slate-300 print:border-slate-700">
                      {formatRupiah(filteredTotals.totalExpense)}
                    </td>
                    <td className="p-2 text-right text-slate-900 font-black font-mono border border-slate-300 print:border-slate-700">
                      {formatRupiah(filteredTotals.balance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Section B: Rekap Iuran per Siswa */}
        {(reportType === 'rekap_siswa' || reportType === 'all') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                {reportType === 'all' ? 'II. ' : ''}Rekapitulasi Iuran Kas Siswa
              </h5>
              <span className="text-[10px] text-slate-500 print:hidden font-mono">
                {state.students.length} Siswa
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-400 print:border-slate-800 border-collapse">
                <thead>
                  <tr className="bg-slate-200 print:bg-slate-200 text-slate-900 border-b border-slate-400 print:border-slate-800 font-bold">
                    <th className="p-2 text-center w-12 border border-slate-300 print:border-slate-700">Absen</th>
                    <th className="p-2 min-w-[180px] border border-slate-300 print:border-slate-700">Nama Siswa</th>
                    <th className="p-2 text-center w-12 border border-slate-300 print:border-slate-700">L/P</th>
                    <th className="p-2 text-center min-w-[95px] border border-slate-300 print:border-slate-700">Frekuensi Setor</th>
                    <th className="p-2 text-right min-w-[120px] border border-slate-300 print:border-slate-700">Total Iuran Masuk</th>
                    <th className="p-2 text-center min-w-[95px] border border-slate-300 print:border-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 print:divide-slate-700">
                  {state.students.map((student) => {
                    const metric = studentMetrics.get(student.id);
                    const totalPaid = metric?.totalPaid || 0;
                    const paidCount = metric?.paidCount || 0;
                    const isDisciplined = paidCount >= 2;

                    return (
                      <tr key={student.id} className="odd:bg-white even:bg-slate-50 print:even:bg-slate-100">
                        <td className="p-2 text-center font-mono font-bold text-slate-600 border border-slate-300 print:border-slate-700">
                          {student.studentNumber}
                        </td>
                        <td className="p-2 font-semibold text-slate-900 border border-slate-300 print:border-slate-700">
                          {student.name}
                        </td>
                        <td className="p-2 text-center font-bold text-slate-600 border border-slate-300 print:border-slate-700">
                          {student.gender}
                        </td>
                        <td className="p-2 text-center font-medium text-slate-800 border border-slate-300 print:border-slate-700">
                          {paidCount} Kali Setor
                        </td>
                        <td className="p-2 text-right font-bold text-emerald-800 font-mono border border-slate-300 print:border-slate-700">
                          {formatRupiah(totalPaid)}
                        </td>
                        <td className="p-2 text-center border border-slate-300 print:border-slate-700">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isDisciplined
                                ? 'bg-emerald-100 text-emerald-900 print:bg-transparent print:text-slate-900'
                                : 'bg-amber-100 text-amber-900 print:bg-transparent print:text-slate-600'
                            }`}
                          >
                            {isDisciplined ? 'Disiplin' : 'Perlu Diingatkan'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Printable Official Signatures Footer */}
        <div className="mt-8 pt-4 border-t border-slate-300 print:border-slate-800 grid grid-cols-2 text-center text-xs avoid-page-break">
          <div>
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-bold text-slate-900 mt-0.5">Wali Kelas {state.classConfig.className}</p>
            <div className="h-20 flex items-center justify-center">
              {/* Space for signature & stamp */}
            </div>
            <p className="font-bold text-slate-900 underline text-sm">{state.classConfig.homeroomTeacher || 'Wali Kelas'}</p>
            <p className="text-[10px] text-slate-500">NIP / Identitas Wali Kelas</p>
          </div>

          <div>
            <p className="text-slate-600">Purwokerto, {todayFormatted}</p>
            <p className="font-bold text-slate-900 mt-0.5">Bendahara Kelas {state.classConfig.className}</p>
            <div className="h-20 flex items-center justify-center">
              {/* Space for signature & stamp */}
            </div>
            <p className="font-bold text-slate-900 underline text-sm">{state.classConfig.treasurerName || 'Bendahara Kelas'}</p>
            <p className="text-[10px] text-slate-500">Pengurus Kas & Iuran Kelas</p>
          </div>
        </div>

      </div>
    </div>
  );
};

