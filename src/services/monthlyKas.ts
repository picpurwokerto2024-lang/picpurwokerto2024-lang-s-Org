import { AppState, ClassConfig, Student, JimpitanRecord, MonthlyStatusSummary, MonthlyStudentPayment } from '../types';
import { formatRupiah, formatDateIndo } from './utils';

const INDO_MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Returns current month key in "YYYY-MM" format, e.g. "2026-09"
 */
export function getCurrentMonthKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Formats "2026-09" into "September 2026"
 */
export function formatMonthLabel(monthKey: string): string {
  if (!monthKey) return '-';
  const parts = monthKey.split('-');
  if (parts.length < 2) return monthKey;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = INDO_MONTH_NAMES[monthIdx] || parts[1];
  return `${monthName} ${year}`;
}

/**
 * Generates the list of months for the academic year (e.g. Juli 2026 - Juni 2027)
 */
export function getAcademicMonthsList(academicYear: string = '2026/2027'): {
  monthKey: string;
  monthLabel: string;
  isCurrent: boolean;
}[] {
  const currentKey = getCurrentMonthKey();
  
  // Try to parse academic year like "2026/2027"
  const match = academicYear.match(/(\d{4})\/(\d{4})/);
  let startYear = new Date().getFullYear();
  let endYear = startYear + 1;
  if (match) {
    startYear = parseInt(match[1], 10);
    endYear = parseInt(match[2], 10);
  }

  // Academic months: July to Dec of startYear, Jan to June of endYear
  const monthsSequence: { year: number; monthNum: number }[] = [
    { year: startYear, monthNum: 7 },  // Juli
    { year: startYear, monthNum: 8 },  // Agustus
    { year: startYear, monthNum: 9 },  // September
    { year: startYear, monthNum: 10 }, // Oktober
    { year: startYear, monthNum: 11 }, // November
    { year: startYear, monthNum: 12 }, // Desember
    { year: endYear, monthNum: 1 },    // Januari
    { year: endYear, monthNum: 2 },    // Februari
    { year: endYear, monthNum: 3 },    // Maret
    { year: endYear, monthNum: 4 },    // April
    { year: endYear, monthNum: 5 },    // Mei
    { year: endYear, monthNum: 6 },    // Juni
  ];

  return monthsSequence.map(({ year, monthNum }) => {
    const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
    return {
      monthKey,
      monthLabel: `${INDO_MONTH_NAMES[monthNum - 1]} ${year}`,
      isCurrent: monthKey === currentKey,
    };
  });
}

/**
 * Computes complete status summary for a specific month (e.g. "2026-09")
 */
export function getMonthlyStatusSummary(
  state: AppState,
  monthKey: string = getCurrentMonthKey()
): MonthlyStatusSummary {
  const activeStudents = (state.students || []).filter((s) => s.isActive);
  const defaultAmount = state.classConfig?.defaultAmount ?? 10000;
  const records = state.jimpitanRecords || [];

  // Filter records that match this month
  const monthRecordsMap = new Map<string, JimpitanRecord>();
  records.forEach((r) => {
    const recMonth = r.month || (r.date ? r.date.substring(0, 7) : '');
    if (recMonth === monthKey) {
      monthRecordsMap.set(r.studentId, r);
    }
  });

  const paidStudents: MonthlyStudentPayment[] = [];
  const unpaidStudents: MonthlyStudentPayment[] = [];
  const allStudents: MonthlyStudentPayment[] = [];

  let totalPaidAmount = 0;

  activeStudents.forEach((student) => {
    const record = monthRecordsMap.get(student.id);
    const isPaid = record ? record.status === 'paid' : false;
    const amount = record ? (record.amount || defaultAmount) : defaultAmount;

    const paymentInfo: MonthlyStudentPayment = {
      student,
      isPaid,
      record,
      amount,
      paidAt: record?.paidAt || (isPaid && record?.date ? record.date : undefined),
      paymentMethod: record?.paymentMethod || 'cash',
      note: record?.note,
    };

    allStudents.push(paymentInfo);

    if (isPaid) {
      paidStudents.push(paymentInfo);
      totalPaidAmount += amount;
    } else {
      unpaidStudents.push(paymentInfo);
    }
  });

  const totalActiveStudents = activeStudents.length;
  const paidCount = paidStudents.length;
  const unpaidCount = unpaidStudents.length;
  const totalExpectedAmount = totalActiveStudents * defaultAmount;
  const totalUnpaidAmount = unpaidCount * defaultAmount;
  const paidPercentage = totalActiveStudents > 0 ? Math.round((paidCount / totalActiveStudents) * 100) : 0;

  return {
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    academicYear: state.classConfig?.academicYear || '2026/2027',
    totalActiveStudents,
    paidCount,
    unpaidCount,
    paidPercentage,
    totalPaidAmount,
    totalExpectedAmount,
    totalUnpaidAmount,
    paidStudents,
    unpaidStudents,
    allStudents,
  };
}

/**
 * Gets overview of all 12 academic months with summary counts
 */
export function getAllAcademicMonthsSummaries(state: AppState): MonthlyStatusSummary[] {
  const months = getAcademicMonthsList(state.classConfig?.academicYear);
  return months.map((m) => getMonthlyStatusSummary(state, m.monthKey));
}

/**
 * Gets student's payment history across all academic months
 */
export function getStudentMonthlyHistory(
  state: AppState,
  studentId: string
): {
  monthKey: string;
  monthLabel: string;
  isPaid: boolean;
  amount: number;
  paidAt?: string;
  paymentMethod?: string;
}[] {
  const months = getAcademicMonthsList(state.classConfig?.academicYear);
  const defaultAmount = state.classConfig?.defaultAmount ?? 10000;
  const records = state.jimpitanRecords || [];

  return months.map(({ monthKey, monthLabel }) => {
    const record = records.find(
      (r) =>
        r.studentId === studentId &&
        (r.month === monthKey || (r.date && r.date.substring(0, 7) === monthKey))
    );

    const isPaid = record ? record.status === 'paid' : false;
    const amount = record ? (record.amount || defaultAmount) : defaultAmount;

    return {
      monthKey,
      monthLabel,
      isPaid,
      amount,
      paidAt: record?.paidAt || (isPaid ? record?.date : undefined),
      paymentMethod: record?.paymentMethod,
    };
  });
}

/**
 * Generates formatted WhatsApp text for monthly unpaid students reminder
 */
export function generateMonthlyUnpaidWhatsAppMessage(
  summary: MonthlyStatusSummary,
  config: ClassConfig
): string {
  const lines: string[] = [
    `📢 *REKAP STATUS IURAN KAS KELAS BULANAN*`,
    `🏫 *${config.className}* - ${config.schoolName}`,
    `📅 *Periode Iuran:* ${summary.monthLabel} (TA ${config.academicYear})`,
    `💵 *Tarif Iuran:* ${formatRupiah(config.defaultAmount)} / bulan`,
    `-----------------------------------------`,
    `📊 *Progres Iuran ${summary.monthLabel}:*`,
    `   ✅ Sudah Lunas: *${summary.paidCount} dari ${summary.totalActiveStudents} Siswa* (${summary.paidPercentage}%)`,
    `   💰 Dana Terkumpul: *${formatRupiah(summary.totalPaidAmount)}*`,
    `   ⚠️ Belum Setor: *${summary.unpaidCount} Siswa* (Tunggakan: ${formatRupiah(summary.totalUnpaidAmount)})`,
    `-----------------------------------------`,
  ];

  if (summary.unpaidStudents.length > 0) {
    lines.push(
      ``,
      `📋 *Daftar Siswa Belum Setor (${summary.monthLabel}):*`
    );
    summary.unpaidStudents.forEach((item, idx) => {
      lines.push(`${idx + 1}. No. ${item.student.studentNumber} - ${item.student.name} (${formatRupiah(item.amount)})`);
    });
    lines.push(
      ``,
      `Bagi Bapak/Ibu Wali Murid atau siswa yang belum menyetor iuran kas bulan ini, dapat menyerahkan langsung ke Bendahara Kelas (*${config.treasurerName}*).`
    );
  } else {
    lines.push(
      ``,
      `🎉 *ALHAMDULILLAH, SELURUH SISWA SUDAH LUNAS IURAN BULAN INI!* ✨`,
      `Terima kasih atas kedisiplinan dan kerjasamanya.`
    );
  }

  lines.push(
    ``,
    `🔗 *Cek Laporan Transparansi Lengkap:*`,
    window.location.href,
    ``,
    `_Pesan otomatis dari Sistem Pembukuan Kas Sekolah._`
  );

  return lines.join('\n');
}

/**
 * Individual WhatsApp reminder for single student unpaid for specific month
 */
export function generateSingleStudentMonthlyReminder(
  student: Student,
  monthLabel: string,
  amount: number,
  config: ClassConfig
): string {
  const recipient = student.parentName ? `Bapak/Ibu Wali dari *${student.name}*` : `*${student.name}*`;

  return [
    `Assalamu'alaikum Wr. Wb. / Salam Sejahtera,`,
    ``,
    `Halo ${recipient},`,
    `Mohon izin kami dari Pengurus Kas *${config.className} - ${config.schoolName}* menyampaikan pengingat iuran kas kelas:`,
    ``,
    `👤 *Nama Siswa:* ${student.name} (No. Absen ${student.studentNumber})`,
    `📅 *Periode Iuran:* ${monthLabel}`,
    `💵 *Nominal Iuran:* *${formatRupiah(amount)}*`,
    `📌 *Status:* Belum Setoran`,
    ``,
    `Iuran kas bulanan ini digunakan untuk kebutuhan belajar bersama (perlengkapan kelas, fotokopi, kebersihan, sosial jenguk teman, & tabungan kegiatan).`,
    ``,
    `Pembayaran dapat diserahkan kepada Bendahara Kelas (*${config.treasurerName}*).`,
    ``,
    `Terima kasih banyak atas perhatian dan kerjasamanya. 🙏✨`,
  ].join('\n');
}
