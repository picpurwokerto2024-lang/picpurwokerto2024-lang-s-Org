import { AppState, Student } from '../types';
import { formatRupiah, formatDateIndo } from './utils';

export function createWeeklyKasReportMessage(state: AppState): string {
  const { classConfig, students, transactions, jimpitanRecords } = state;

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const jimpitanTotal = jimpitanRecords
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const grandIncome = totalIncome + jimpitanTotal;
  const currentBalance = grandIncome - totalExpense;

  const todayStr = formatDateIndo(new Date().toISOString().split('T')[0]);

  // Recent 5 expenses
  const recentExpenses = transactions
    .filter(t => t.type === 'expense')
    .slice(-4)
    .map((t, idx) => `  ${idx + 1}. ${t.title} (${formatRupiah(t.amount)})`)
    .join('\n');

  let text = `📢 *LAPORAN KEUANGAN KAS & IURAN KELAS*\n`;
  text += `🏫 *${classConfig.schoolName}*\n`;
  text += `📚 *${classConfig.className}* (Tahun Ajaran ${classConfig.academicYear})\n`;
  text += `🗓️ Per Tanggal: ${todayStr}\n\n`;

  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 *RINGKASAN SALDO KAS*\n`;
  text += `➕ Total Pemasukan: *${formatRupiah(grandIncome)}*\n`;
  text += `   • Iuran Kas Siswa: ${formatRupiah(jimpitanTotal)}\n`;
  text += `   • Pemasukan Lainnya: ${formatRupiah(totalIncome)}\n`;
  text += `➖ Total Pengeluaran: *${formatRupiah(totalExpense)}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💵 *SISA SALDO KAS KELAS: ${formatRupiah(currentBalance)}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (recentExpenses) {
    text += `📋 *Pengeluaran Terakhir:*\n${recentExpenses}\n\n`;
  }

  text += `👥 Jumlah Siswa: ${students.length} Siswa\n`;
  text += `✍️ *Bendahara Kelas:* ${classConfig.treasurerName}\n`;
  text += `👨‍🏫 *Wali Kelas:* ${classConfig.homeroomTeacher}\n\n`;
  text += `_Terima kasih atas partisipasi dan kebersamaan seluruh teman-teman & Bapak/Ibu Wali Murid._ 🙏✨`;

  return text;
}

export function createStudentReminderMessage(
  student: Student,
  unpaidCount: number,
  unpaidTotal: number,
  state: AppState
): string {
  const { classConfig } = state;
  const recipient = student.parentName ? `Bapak/Ibu Wali dari *${student.name}*` : `*${student.name}*`;

  let text = `Assalamu'alaikum Wr. Wb. / Salam Sejahtera,\n\n`;
  text += `Halo ${recipient},\n`;
  text += `Mohon izin kami dari Pengurus Kas *${classConfig.className} - ${classConfig.schoolName}* menginformasikan catatan iuran kas kelas:\n\n`;
  text += `👤 *Nama Siswa:* ${student.name} (No. Absen ${student.studentNumber})\n`;
  text += `📌 *Status:* Belum lunas (${unpaidCount} pertemuan/hari)\n`;
  text += `💵 *Total Iuran:* *${formatRupiah(unpaidTotal)}*\n\n`;
  text += `Iuran kas ini digunakan untuk keperluan bersama kelas (kebersihan, fotokopi materi, sosial teman sakit, & tabungan kegiatan kelas).\n\n`;
  text += `Pembayaran dapat diserahkan langsung kepada Bendahara Kelas (*${classConfig.treasurerName}*).\n\n`;
  text += `Terima kasih banyak atas perhatian dan kerjasamanya. 🙏✨`;

  return text;
}

export function openWhatsAppDirect(phone: string | undefined, message: string): void {
  let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.substring(1);
  }
  
  const encoded = encodeURIComponent(message);
  const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
}
